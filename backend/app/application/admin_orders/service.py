"""Admin order application service — list / get / patch with state machine."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.order_rules import (
    IllegalOrderTransition,
    assert_admin_status_transition,
)
from app.infrastructure.db.models import Order


class AdminOrderNotFoundError(Exception):
    def __init__(self, order_id: str) -> None:
        super().__init__(f"Order not found: {order_id}")
        self.order_id = order_id
        self.code = "not_found"


class AdminOrderUpdateError(Exception):
    def __init__(self, message: str, *, code: str = "update_error") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass(frozen=True)
class AdminOrderListResult:
    items: list[Order]
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


def _page_meta(total: int, page: int, page_size: int) -> dict[str, int | bool]:
    size = max(1, min(page_size, 100))
    total_pages = 0 if total == 0 else (total + size - 1) // size
    safe_page = 1 if total_pages == 0 else max(1, min(page, total_pages))
    return {
        "page": safe_page,
        "page_size": size,
        "total_items": total,
        "total_pages": total_pages,
        "has_next": total_pages > 0 and safe_page < total_pages,
        "has_prev": safe_page > 1,
        "offset": (safe_page - 1) * size,
    }


async def list_admin_orders(
    session: AsyncSession,
    *,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> AdminOrderListResult:
    """Paginated orders newest-first; optional exact status filter."""
    filters = []
    if status is not None and status.strip():
        filters.append(Order.status == status.strip())

    count_stmt = select(func.count()).select_from(Order)
    if filters:
        count_stmt = count_stmt.where(*filters)
    total = int((await session.scalar(count_stmt)) or 0)

    meta = _page_meta(total, page, page_size)
    offset = int(meta["offset"])
    size = int(meta["page_size"])

    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset(offset)
        .limit(size)
    )
    if filters:
        stmt = stmt.where(*filters)

    result = await session.execute(stmt)
    items = list(result.scalars().unique().all())

    return AdminOrderListResult(
        items=items,
        page=int(meta["page"]),
        page_size=size,
        total_items=total,
        total_pages=int(meta["total_pages"]),
        has_next=bool(meta["has_next"]),
        has_prev=bool(meta["has_prev"]),
    )


async def get_admin_order(session: AsyncSession, order_id: str) -> Order:
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise AdminOrderNotFoundError(order_id)
    return order


async def update_admin_order(
    session: AsyncSession,
    order_id: str,
    *,
    status: str | None = None,
    admin_notes: str | None = None,
    fields_set: frozenset[str] | set[str] | None = None,
) -> Order:
    """
    Patch order status (validated) and/or admin_notes.

    ``fields_set`` lists which keys were present on the request body
    (model_fields_set). If None, any non-None arg is applied.
    """
    if fields_set is not None:
        touching_status = "status" in fields_set
        touching_notes = "admin_notes" in fields_set
    else:
        touching_status = status is not None
        touching_notes = admin_notes is not None

    if not touching_status and not touching_notes:
        raise AdminOrderUpdateError(
            "Provide status and/or adminNotes",
            code="empty_patch",
        )

    order = await get_admin_order(session, order_id)

    if touching_status:
        if status is None:
            raise AdminOrderUpdateError(
                "status cannot be null",
                code="invalid_status",
            )
        new_status = status.strip()
        try:
            assert_admin_status_transition(order.status, new_status)
        except IllegalOrderTransition as exc:
            raise AdminOrderUpdateError(
                exc.message,
                code=exc.code,
            ) from exc
        order.status = new_status

    if touching_notes:
        # Explicit null clears notes; string sets (including empty).
        if admin_notes is None:
            order.admin_notes = None
        else:
            order.admin_notes = admin_notes

    await session.commit()
    # Reload with items for response
    return await get_admin_order(session, order_id)


def order_to_list_dict(order: Order) -> dict[str, Any]:
    """Helper for tests / mappers — raw dict before schema."""
    return {
        "id": order.id,
        "public_code": order.public_code,
        "email": order.email,
        "status": order.status,
        "currency": order.currency,
        "subtotal_cents": order.subtotal_cents,
        "shipping_cents": order.shipping_cents,
        "total_cents": order.total_cents,
        "item_count": len(order.items) if order.items is not None else 0,
        "paid_at": order.paid_at,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }
