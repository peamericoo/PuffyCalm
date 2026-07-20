"""Purchase limit checks — isolated, unit-testable, no Stripe.

Used by checkout service before creating Order / Stripe session.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.product_rules import (
    DEFAULT_MAX_QUANTITY_PER_ORDER,
    PURCHASE_COUNT_STATUSES,
    ProductStatus,
)
from app.infrastructure.db.models import Order, OrderItem, Product


class PurchaseLimitError(Exception):
    def __init__(self, message: str, *, code: str = "purchase_limit") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass(frozen=True)
class LineQty:
    product_id: str
    quantity: int


def assert_quantity_allowed(product: Product, quantity: int) -> None:
    """Max units in a single order line (and cart aggregate for that product)."""
    max_q = getattr(product, "max_quantity_per_order", None)
    if max_q is None:
        max_q = DEFAULT_MAX_QUANTITY_PER_ORDER
    max_q = int(max_q)
    if max_q < 1:
        max_q = 1
    if quantity < 1:
        raise PurchaseLimitError("Quantity must be at least 1", code="invalid_quantity")
    if quantity > max_q:
        raise PurchaseLimitError(
            f"You can buy at most {max_q} of {product.name} per order",
            code="max_quantity_exceeded",
        )


def assert_product_sellable(product: Product) -> None:
    status = getattr(product, "status", ProductStatus.published.value)
    if status != ProductStatus.published.value:
        raise PurchaseLimitError(
            f"Product is not available: {product.name}",
            code="product_not_available",
        )
    if not product.in_stock:
        raise PurchaseLimitError(
            f"Product out of stock: {product.name}",
            code="out_of_stock",
        )


async def assert_purchase_limit_for_email(
    session: AsyncSession,
    *,
    email: str,
    product: Product,
    quantity: int,
) -> None:
    """
    If purchase_limit_per_customer is set (e.g. 1), block when prior paid
    (or fulfillment) orders for this email already include the product.

    Quantity in current cart counts toward the limit for this request.
    """
    limit = getattr(product, "purchase_limit_per_customer", None)
    if limit is None:
        return
    limit = int(limit)
    if limit < 1:
        return

    email_norm = email.strip().lower()
    # Sum quantities already purchased
    stmt = (
        select(func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.email == email_norm,
            Order.status.in_(list(PURCHASE_COUNT_STATUSES)),
            OrderItem.product_id == product.id,
        )
    )
    prior = int((await session.scalar(stmt)) or 0)
    if prior + quantity > limit:
        raise PurchaseLimitError(
            f"Limit reached: only {limit} purchase(s) of {product.name} per customer",
            code="purchase_limit_exceeded",
        )


async def validate_cart_lines(
    session: AsyncSession,
    *,
    email: str,
    qty_by_id: dict[str, int],
    products: dict[str, Product],
) -> None:
    """Run sellable + qty + per-customer limits for every line."""
    for pid, qty in qty_by_id.items():
        product = products[pid]
        assert_product_sellable(product)
        assert_quantity_allowed(product, qty)
        await assert_purchase_limit_for_email(
            session,
            email=email,
            product=product,
            quantity=qty,
        )
