"""Public checkout endpoints — guest friendly, server-priced."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.checkout import (
    CreateCheckoutSessionIn,
    CreateCheckoutSessionOut,
)
from app.application.checkout.service import (
    CheckoutError,
    CheckoutLineInput,
    ShippingInput,
    create_checkout_session,
)
from app.core.config import get_settings
from app.core.logging import email_domain, get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post(
    "/sessions",
    response_model=CreateCheckoutSessionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    body: CreateCheckoutSessionIn,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> CreateCheckoutSessionOut:
    """
    Create a pending order + Stripe Checkout Session (custom UI mode).

    Body lines carry **productId + quantity only** — unit prices come from the DB.
    """
    settings = get_settings()
    line_count = len(body.lines)
    product_ids = [ln.product_id for ln in body.lines]
    ship_country = (body.shipping.country or "").strip().upper() or "US"
    base_fields = {
        "email_domain": email_domain(str(body.email)),
        "line_count": line_count,
        "product_ids": product_ids[:20],  # cap list noise
        "ship_country": ship_country,
    }
    log.info("checkout_create_start", **base_fields)

    try:
        result = await create_checkout_session(
            session,
            email=str(body.email),
            lines=[
                CheckoutLineInput(product_id=ln.product_id, quantity=ln.quantity)
                for ln in body.lines
            ],
            shipping=ShippingInput(
                full_name=body.shipping.full_name,
                line1=body.shipping.line1,
                city=body.shipping.city,
                region=body.shipping.region,
                postal=body.shipping.postal,
                country=body.shipping.country,
            ),
            settings=settings,
        )
    except CheckoutError as exc:
        code_map = {
            "empty_cart": status.HTTP_400_BAD_REQUEST,
            "invalid_email": status.HTTP_400_BAD_REQUEST,
            "invalid_address": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "invalid_quantity": status.HTTP_400_BAD_REQUEST,
            "invalid_product": status.HTTP_400_BAD_REQUEST,
            "product_not_found": status.HTTP_404_NOT_FOUND,
            "product_not_available": status.HTTP_409_CONFLICT,
            "out_of_stock": status.HTTP_409_CONFLICT,
            "insufficient_stock": status.HTTP_409_CONFLICT,
            "max_quantity_exceeded": status.HTTP_409_CONFLICT,
            "purchase_limit_exceeded": status.HTTP_409_CONFLICT,
            "total_too_low": status.HTTP_400_BAD_REQUEST,
            "stripe_not_configured": status.HTTP_503_SERVICE_UNAVAILABLE,
            "stripe_error": status.HTTP_502_BAD_GATEWAY,
        }
        http_status = code_map.get(exc.code, status.HTTP_400_BAD_REQUEST)
        # Business rejection vs payment/infra failure
        if exc.code in {"stripe_error", "stripe_not_configured"}:
            log.error(
                "checkout_create_failed",
                code=exc.code,
                http_status=http_status,
                **base_fields,
            )
        else:
            log.warning(
                "checkout_create_failed",
                code=exc.code,
                http_status=http_status,
                **base_fields,
            )
        raise HTTPException(
            status_code=http_status,
            detail={"message": exc.message, "code": exc.code},
        ) from exc

    log.info(
        "checkout_create_ok",
        order_id=result.order_id,
        public_code=result.public_code,
        total_cents=result.total_cents,
        subtotal_cents=result.subtotal_cents,
        shipping_cents=result.shipping_cents,
        status=result.status,
        **base_fields,
    )

    return CreateCheckoutSessionOut(
        order_id=result.order_id,
        public_code=result.public_code,
        client_secret=result.client_secret,
        subtotal_cents=result.subtotal_cents,
        shipping_cents=result.shipping_cents,
        total_cents=result.total_cents,
        currency="USD",
        status=result.status,
    )
