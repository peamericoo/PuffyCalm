"""Inventory helpers — stock_qty decrement on paid (idempotent at call site).

Rules (Phase L):
- ``stock_qty`` is the authoritative available count (≥ 0).
- ``in_stock`` is a catalog/ops flag kept in sync when qty hits 0 (or admin
  forces restock). Sellable requires both published + in_stock + stock_qty ≥ 1.
- Decrement happens only once per order, on the unpaid → paid transition
  (webhook / reconcile). Callers must gate with order-status FOR UPDATE.
- Double webhook delivery must not double-decrement (order already paid → no-op).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.domain.product_rules import OrderStatus
from app.infrastructure.db.models import Order, Product

log = get_logger(__name__)

# Statuses that mean inventory was already applied for this order.
INVENTORY_APPLIED_STATUSES: frozenset[str] = frozenset(
    {
        OrderStatus.paid.value,
        OrderStatus.processing.value,
        OrderStatus.shipped.value,
        OrderStatus.delivered.value,
    }
)

DEFAULT_STOCK_QTY = 100


def sync_in_stock_flag(product: Product) -> None:
    """When qty is exhausted, force out-of-stock for catalog/checkout."""
    qty = int(getattr(product, "stock_qty", 0) or 0)
    if qty < 1:
        product.in_stock = False
        product.stock_qty = 0


def available_stock(product: Product) -> int:
    return max(0, int(getattr(product, "stock_qty", 0) or 0))


async def deduct_inventory_for_order(
    session: AsyncSession,
    order: Order,
) -> dict[str, int]:
    """
    Decrement stock_qty for each order line.

    Assumes the caller already verified the order is transitioning into a paid
    status for the first time (idempotency). Locks product rows with FOR UPDATE.

    Returns map product_id → remaining stock_qty after decrement.
    """
    items = list(order.items or [])
    if not items:
        # Ensure relationship is loaded
        result = await session.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order.id)
        )
        loaded = result.scalar_one_or_none()
        items = list(loaded.items) if loaded else []

    # Aggregate qty per product (same product may appear once per line in practice)
    need: dict[str, int] = {}
    for item in items:
        pid = item.product_id
        need[pid] = need.get(pid, 0) + int(item.quantity)

    remaining: dict[str, int] = {}
    if not need:
        return remaining

    product_ids = list(need.keys())
    result = await session.execute(
        select(Product).where(Product.id.in_(product_ids)).with_for_update()
    )
    products = {p.id: p for p in result.scalars().all()}

    for pid, qty in need.items():
        product = products.get(pid)
        if product is None:
            # Product deleted after order — log and continue (order snapshot is source of truth)
            log.warning(
                "inventory_product_missing",
                order_id=order.id,
                product_id=pid,
                quantity=qty,
            )
            continue
        before = available_stock(product)
        after = max(0, before - qty)
        product.stock_qty = after
        sync_in_stock_flag(product)
        remaining[pid] = after
        log.info(
            "inventory_decremented",
            order_id=order.id,
            product_id=pid,
            quantity=qty,
            stock_before=before,
            stock_after=after,
            in_stock=product.in_stock,
        )

    return remaining
