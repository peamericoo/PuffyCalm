"""Order read API — guest lookup by id + email."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.checkout import OrderItemOut, OrderOut
from app.application.checkout.service import get_order_for_guest
from app.infrastructure.db.models import Order

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        public_code=order.public_code,
        email=order.email,
        status=order.status,
        currency="USD",
        subtotal_cents=order.subtotal_cents,
        shipping_cents=order.shipping_cents,
        total_cents=order.total_cents,
        shipping_address=order.shipping_address or {},
        items=[
            OrderItemOut(
                product_id=i.product_id,
                product_slug=i.product_slug,
                product_name=i.product_name,
                quantity=i.quantity,
                unit_price_cents=i.unit_price_cents,
                line_total_cents=i.line_total_cents,
                image_url=i.image_url,
            )
            for i in order.items
        ],
        paid_at=order.paid_at.isoformat() if order.paid_at else None,
        created_at=order.created_at.isoformat() if order.created_at else "",
    )


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    session: Annotated[AsyncSession, Depends(db_session)],
    email: Annotated[
        str | None,
        Query(description="Guest email used at checkout (required for privacy)"),
    ] = None,
) -> OrderOut:
    """
    Fetch order for success page / tracking.

    Requires matching ``email`` query param for guest privacy.
    """
    if not email or not email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "email query param is required", "code": "email_required"},
        )

    order = await get_order_for_guest(session, order_id, email=email)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Order not found", "code": "not_found"},
        )
    return _order_out(order)
