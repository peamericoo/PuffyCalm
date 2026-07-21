"""Checkout service — prices from DB, Stripe session server-side."""

from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from urllib.parse import quote

import stripe
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.checkout.address import (
    AddressValidationError,
    validate_and_normalize_shipping,
)
from app.application.checkout.purchase_limits import (
    PurchaseLimitError,
    validate_cart_lines,
)
from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.domain.product_rules import DEFAULT_MAX_QUANTITY_PER_ORDER
from app.infrastructure.db.models import Order, OrderItem, Product, StripeEvent

log = get_logger(__name__)


class CheckoutError(Exception):
    def __init__(self, message: str, *, code: str = "checkout_error") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass(frozen=True)
class CheckoutLineInput:
    product_id: str
    quantity: int


@dataclass(frozen=True)
class ShippingInput:
    full_name: str
    line1: str
    city: str
    region: str
    postal: str
    country: str = "US"


@dataclass
class CheckoutSessionResult:
    order_id: str
    public_code: str
    client_secret: str
    subtotal_cents: int
    shipping_cents: int
    total_cents: int
    currency: str
    status: str


def _money_to_cents(amount: Decimal | float | int) -> int:
    d = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int(d * 100)


def _new_id(prefix: str = "ord") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def _public_code() -> str:
    return f"PC-{secrets.token_hex(4).upper()}"


def compute_shipping_cents(subtotal_cents: int, settings: Settings) -> int:
    if subtotal_cents <= 0:
        return 0
    if subtotal_cents >= settings.free_shipping_threshold_cents:
        return 0
    return settings.flat_shipping_cents


async def create_checkout_session(
    session: AsyncSession,
    *,
    email: str,
    lines: list[CheckoutLineInput],
    shipping: ShippingInput,
    settings: Settings | None = None,
) -> CheckoutSessionResult:
    """
    Validate cart against Postgres, create pending Order, create Stripe Checkout Session.

    Client must NOT send prices — unit prices are always loaded from products table.
    """
    settings = settings or get_settings()
    if not settings.stripe_configured:
        raise CheckoutError("Stripe is not configured on the server", code="stripe_not_configured")

    if not lines:
        raise CheckoutError("Cart is empty", code="empty_cart")

    email_norm = email.strip().lower()
    if not email_norm or "@" not in email_norm:
        raise CheckoutError("Valid email is required", code="invalid_email")

    try:
        shipping_norm = validate_and_normalize_shipping(
            full_name=shipping.full_name,
            line1=shipping.line1,
            city=shipping.city,
            region=shipping.region,
            postal=shipping.postal,
            country=shipping.country,
        )
    except AddressValidationError as exc:
        raise CheckoutError(exc.message, code="invalid_address") from exc

    # Aggregate quantities per product id
    qty_by_id: dict[str, int] = {}
    for line in lines:
        q = int(line.quantity)
        if q < 1 or q > DEFAULT_MAX_QUANTITY_PER_ORDER:
            raise CheckoutError(
                f"Quantity must be between 1 and {DEFAULT_MAX_QUANTITY_PER_ORDER}",
                code="invalid_quantity",
            )
        pid = line.product_id.strip()
        if not pid:
            raise CheckoutError("Invalid product id", code="invalid_product")
        qty_by_id[pid] = qty_by_id.get(pid, 0) + q

    product_ids = list(qty_by_id.keys())
    result = await session.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    missing = [pid for pid in product_ids if pid not in products]
    if missing:
        raise CheckoutError(
            f"Unknown product(s): {', '.join(missing)}",
            code="product_not_found",
        )

    try:
        await validate_cart_lines(
            session,
            email=email_norm,
            qty_by_id=qty_by_id,
            products=products,
        )
    except PurchaseLimitError as exc:
        raise CheckoutError(exc.message, code=exc.code) from exc

    order_items: list[OrderItem] = []
    subtotal = 0
    stripe_line_items: list[dict[str, Any]] = []

    for pid, qty in qty_by_id.items():
        product = products[pid]
        unit = _money_to_cents(product.price)
        line_total = unit * qty
        subtotal += line_total
        order_items.append(
            OrderItem(
                id=_new_id("oli"),
                product_id=product.id,
                product_slug=product.slug,
                product_name=product.name,
                quantity=qty,
                unit_price_cents=unit,
                line_total_cents=line_total,
                image_url=product.image_url or "",
            )
        )
        stripe_line_items.append(
            {
                "price_data": {
                    "currency": (product.currency or "USD").lower(),
                    "unit_amount": unit,
                    "product_data": {
                        "name": product.name,
                        "metadata": {"product_id": product.id},
                    },
                },
                "quantity": qty,
            }
        )

    shipping_cents = compute_shipping_cents(subtotal, settings)
    if shipping_cents > 0:
        stripe_line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "unit_amount": shipping_cents,
                    "product_data": {"name": "Shipping"},
                },
                "quantity": 1,
            }
        )

    total = subtotal + shipping_cents
    if total < 50:  # Stripe minimum for USD is typically $0.50
        raise CheckoutError("Order total too low", code="total_too_low")

    order = Order(
        id=_new_id("ord"),
        public_code=_public_code(),
        email=email_norm,
        status="pending",
        currency="USD",
        subtotal_cents=subtotal,
        shipping_cents=shipping_cents,
        total_cents=total,
        shipping_address={
            "fullName": shipping_norm.full_name,
            "line1": shipping_norm.line1,
            "city": shipping_norm.city,
            "region": shipping_norm.region,
            "postal": shipping_norm.postal,
            "country": shipping_norm.country,
        },
        items=order_items,
    )
    session.add(order)
    await session.flush()

    # Single source of truth for post-payment redirect (Custom Checkout).
    # FE must NOT pass returnUrl again to checkout.confirm() or Stripe rejects:
    # "You cannot provide returnUrl to confirm() when return_url was already provided".
    # Include email so /success can poll guest orders after 3DS / Link redirect.
    return_url = (
        f"{settings.storefront_url.rstrip('/')}/success"
        f"?order={order.id}"
        f"&email={quote(email_norm, safe='')}"
        f"&session_id={{CHECKOUT_SESSION_ID}}"
    )

    try:
        from app.infrastructure.stripe.client import configure_stripe

        configure_stripe(settings)

        # Custom Checkout (ui_mode=custom) + Payment Element on the storefront.
        # customer_email is the single source of truth for the buyer email —
        # the FE must NOT pass email to checkout.confirm() / updateEmail().
        # https://docs.stripe.com/checkout/custom/quickstart
        checkout_session = stripe.checkout.Session.create(
            mode="payment",
            ui_mode="custom",
            line_items=stripe_line_items,
            customer_email=email_norm,
            return_url=return_url,
            # Retry-safe if the client double-posts the same order id.
            idempotency_key=f"checkout_order_{order.id}",
            metadata={
                "order_id": order.id,
                "public_code": order.public_code,
                "buyer_email": email_norm,
            },
            payment_intent_data={
                "metadata": {
                    "order_id": order.id,
                    "public_code": order.public_code,
                    "buyer_email": email_norm,
                },
            },
            # Omit payment_method_types → dynamic payment methods
        )
    except stripe.StripeError as exc:
        # Surface a safe, actionable message (no secrets).
        user_msg = getattr(exc, "user_message", None) or str(exc) or "Stripe error"
        if len(user_msg) > 280:
            user_msg = user_msg[:277] + "…"
        log.exception(
            "stripe_session_create_failed",
            order_id=order.id,
            stripe_code=getattr(exc, "code", None),
            stripe_type=getattr(exc, "type", None),
        )
        raise CheckoutError(
            f"Could not start payment: {user_msg}",
            code="stripe_error",
        ) from exc

    client_secret = getattr(checkout_session, "client_secret", None)
    if not client_secret:
        raise CheckoutError(
            "Stripe session missing client_secret",
            code="stripe_error",
        )

    order.stripe_checkout_session_id = checkout_session.id
    pi = getattr(checkout_session, "payment_intent", None)
    if isinstance(pi, str):
        order.stripe_payment_intent_id = pi
    order.status = "requires_payment"
    await session.commit()
    await session.refresh(order)

    log.info(
        "checkout_session_created",
        order_id=order.id,
        public_code=order.public_code,
        total_cents=total,
        stripe_session=checkout_session.id,
    )

    return CheckoutSessionResult(
        order_id=order.id,
        public_code=order.public_code,
        client_secret=client_secret,
        subtotal_cents=subtotal,
        shipping_cents=shipping_cents,
        total_cents=total,
        currency="USD",
        status=order.status,
    )


async def get_order_for_guest(
    session: AsyncSession,
    order_id: str,
    *,
    email: str | None = None,
) -> Order | None:
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        return None
    if email is not None:
        if order.email.lower() != email.strip().lower():
            return None
    return order


def normalize_public_code(code: str) -> str:
    """Normalize guest-facing order codes (PC-XXXXXXXX)."""
    raw = (code or "").strip().upper().replace(" ", "")
    if not raw:
        return ""
    if raw.startswith("PC-"):
        return raw
    # Bare hex suffix from success email / support scripts
    if len(raw) == 8 and all(c in "0123456789ABCDEF" for c in raw):
        return f"PC-{raw}"
    return raw


async def get_order_by_public_code(
    session: AsyncSession,
    public_code: str,
    *,
    email: str,
) -> Order | None:
    """
    Guest track-order: public_code + checkout email (both required).
    Same privacy model as GET /orders/{id}?email=.
    """
    code = normalize_public_code(public_code)
    email_norm = email.strip().lower()
    if not code or not email_norm:
        return None
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(func.upper(Order.public_code) == code)
    )
    order = result.scalar_one_or_none()
    if order is None:
        return None
    if order.email.lower() != email_norm:
        return None
    return order


@dataclass(frozen=True)
class CustomerOrderListResult:
    items: list[Order]
    page: int
    page_size: int
    total_items: int


async def list_orders_for_email(
    session: AsyncSession,
    *,
    email: str,
    page: int = 1,
    page_size: int = 20,
) -> CustomerOrderListResult:
    """
    List orders for a storefront email (Google session linkage by email match).

    Privacy: caller must only pass an authenticated session email (Next RSC)
    or accept the same email-as-proof model as single-order guest GET.
    """
    email_norm = email.strip().lower()
    if not email_norm:
        return CustomerOrderListResult(
            items=[], page=page, page_size=page_size, total_items=0
        )

    page = max(1, page)
    page_size = min(max(1, page_size), 50)

    filters = [func.lower(Order.email) == email_norm]
    count_stmt = select(func.count()).select_from(Order).where(*filters)
    total = int(await session.scalar(count_stmt) or 0)

    offset = (page - 1) * page_size
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(*filters)
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = list(result.scalars().unique().all())
    return CustomerOrderListResult(
        items=items,
        page=page,
        page_size=page_size,
        total_items=total,
    )


async def mark_order_paid(
    session: AsyncSession,
    order: Order,
    *,
    payment_intent_id: str | None = None,
    session_id: str | None = None,
) -> Order:
    if order.status == "paid":
        return order
    order.status = "paid"
    order.paid_at = datetime.now(UTC)
    if payment_intent_id:
        order.stripe_payment_intent_id = payment_intent_id
    if session_id:
        order.stripe_checkout_session_id = session_id
    await session.commit()
    await session.refresh(order)
    log.info("order_paid", order_id=order.id, public_code=order.public_code)
    return order


async def reconcile_order_with_stripe(
    session: AsyncSession,
    order: Order,
    *,
    settings: Settings | None = None,
) -> Order:
    """
    If webhook is delayed/missing, pull Checkout Session status from Stripe.

    Idempotent: only promotes requires_payment → paid when payment_status is paid.
    """
    if order.status == "paid":
        return order
    if order.status not in {"pending", "requires_payment"}:
        return order

    settings = settings or get_settings()
    if not settings.stripe_configured:
        return order

    sid = (order.stripe_checkout_session_id or "").strip()
    if not sid:
        return order

    try:
        from app.infrastructure.stripe.client import configure_stripe

        configure_stripe(settings)
        checkout_session = stripe.checkout.Session.retrieve(sid)
    except stripe.StripeError as exc:
        log.warning(
            "stripe_reconcile_failed",
            order_id=order.id,
            stripe_session=sid,
            error=str(exc),
        )
        return order

    payment_status = getattr(checkout_session, "payment_status", None)
    if payment_status != "paid":
        return order

    pi = getattr(checkout_session, "payment_intent", None)
    pi_id = pi if isinstance(pi, str) else None
    return await mark_order_paid(
        session,
        order,
        payment_intent_id=pi_id,
        session_id=sid,
    )


async def process_stripe_event(
    session: AsyncSession,
    event: dict[str, Any],
) -> dict[str, str]:
    """
    Idempotent webhook handler. Returns status for logging.
    """
    event_id = str(event.get("id") or "")
    event_type = str(event.get("type") or "")
    if not event_id:
        raise CheckoutError("Invalid Stripe event", code="invalid_event")

    existing = await session.get(StripeEvent, event_id)
    if existing is not None:
        return {"status": "duplicate", "eventId": event_id, "type": event_type}

    data_object = (event.get("data") or {}).get("object") or {}

    if event_type in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    }:
        order = await _resolve_order_from_session(session, data_object)
        if order:
            pi = data_object.get("payment_intent")
            pi_id = pi if isinstance(pi, str) else None
            await mark_order_paid(
                session,
                order,
                payment_intent_id=pi_id,
                session_id=data_object.get("id") if isinstance(data_object.get("id"), str) else None,
            )
    elif event_type == "payment_intent.succeeded":
        order = await _resolve_order_from_payment_intent(session, data_object)
        if order:
            await mark_order_paid(
                session,
                order,
                payment_intent_id=data_object.get("id")
                if isinstance(data_object.get("id"), str)
                else None,
            )
    elif event_type in {
        "checkout.session.expired",
        "payment_intent.payment_failed",
    }:
        order = await _resolve_order_from_session(
            session, data_object
        ) or await _resolve_order_from_payment_intent(session, data_object)
        if order and order.status not in {"paid", "cancelled"}:
            order.status = "failed"
            await session.commit()

    session.add(StripeEvent(id=event_id, type=event_type))
    await session.commit()
    return {"status": "processed", "eventId": event_id, "type": event_type}


async def _resolve_order_from_session(
    session: AsyncSession,
    obj: dict[str, Any],
) -> Order | None:
    meta = obj.get("metadata") or {}
    order_id = meta.get("order_id")
    if order_id:
        order = await session.get(Order, order_id)
        if order:
            return order
    sid = obj.get("id")
    if isinstance(sid, str):
        result = await session.execute(
            select(Order).where(Order.stripe_checkout_session_id == sid)
        )
        return result.scalar_one_or_none()
    return None


async def _resolve_order_from_payment_intent(
    session: AsyncSession,
    obj: dict[str, Any],
) -> Order | None:
    meta = obj.get("metadata") or {}
    order_id = meta.get("order_id")
    if order_id:
        order = await session.get(Order, order_id)
        if order:
            return order
    pi = obj.get("id")
    if isinstance(pi, str):
        result = await session.execute(
            select(Order).where(Order.stripe_payment_intent_id == pi)
        )
        return result.scalar_one_or_none()
    return None
