"""Order read API — guest lookup (id or public_code + email) + list by email."""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.checkout import (
    CustomerOrderListItemOut,
    CustomerOrderListOut,
    OrderItemOut,
    OrderOut,
)
from app.application.checkout.service import (
    get_order_by_public_code,
    get_order_for_guest,
    list_orders_for_email,
    reconcile_order_with_stripe,
)
from app.core.config import get_settings
from app.infrastructure.db.models import Order

router = APIRouter(prefix="/orders", tags=["orders"])


def _items_out(order: Order) -> list[OrderItemOut]:
    return [
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
    ]


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
        items=_items_out(order),
        paid_at=order.paid_at.isoformat() if order.paid_at else None,
        created_at=order.created_at.isoformat() if order.created_at else "",
    )


def _list_item(order: Order) -> CustomerOrderListItemOut:
    return CustomerOrderListItemOut(
        id=order.id,
        public_code=order.public_code,
        email=order.email,
        status=order.status,
        currency="USD",
        subtotal_cents=order.subtotal_cents,
        shipping_cents=order.shipping_cents,
        total_cents=order.total_cents,
        item_count=sum(i.quantity for i in order.items),
        paid_at=order.paid_at.isoformat() if order.paid_at else None,
        created_at=order.created_at.isoformat() if order.created_at else "",
        items=_items_out(order),
    )


@router.get("/lookup", response_model=OrderOut)
async def lookup_order(
    session: Annotated[AsyncSession, Depends(db_session)],
    email: Annotated[
        str | None,
        Query(description="Email used at checkout (required)"),
    ] = None,
    code: Annotated[
        str | None,
        Query(description="Order public code, e.g. PC-A1B2C3D4"),
    ] = None,
) -> OrderOut:
    """
    Guest track order by **public code + email** (Phase K).

    Does not require login. Both params required for privacy.
    """
    if not email or not email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "email query param is required", "code": "email_required"},
        )
    if not code or not code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "code query param is required", "code": "code_required"},
        )

    order = await get_order_by_public_code(session, code, email=email)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Order not found", "code": "not_found"},
        )
    return _order_out(order)


@router.get("/by-email", response_model=CustomerOrderListOut)
async def list_orders_by_email(
    session: Annotated[AsyncSession, Depends(db_session)],
    email: Annotated[
        str | None,
        Query(description="Checkout email (Google session email for my-orders)"),
    ] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[
        int,
        Query(ge=1, le=50, alias="pageSize"),
    ] = 20,
) -> CustomerOrderListOut:
    """
    List orders for an email (Phase K Google-linked my-orders).

    Storefront should pass **only** the Auth.js session email from the server.
    Same email-as-proof model as GET /orders/{id}?email= (not a secret auth layer).
    """
    if not email or not email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "email query param is required", "code": "email_required"},
        )

    result = await list_orders_for_email(
        session,
        email=email,
        page=page,
        page_size=page_size,
    )
    total_pages = max(1, math.ceil(result.total_items / result.page_size)) if result.total_items else 0
    if result.total_items == 0:
        total_pages = 0
    return CustomerOrderListOut(
        items=[_list_item(o) for o in result.items],
        page=result.page,
        page_size=result.page_size,
        total_items=result.total_items,
        total_pages=total_pages,
        has_next=result.page < total_pages if total_pages else False,
        has_prev=result.page > 1 and result.total_items > 0,
    )


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    session: Annotated[AsyncSession, Depends(db_session)],
    email: Annotated[
        str | None,
        Query(description="Guest email used at checkout (required for privacy)"),
    ] = None,
    sync: Annotated[
        bool,
        Query(
            description=(
                "When true, reconcile unpaid orders with Stripe Checkout Session "
                "(webhook lag / missing secret fallback)."
            ),
        ),
    ] = False,
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
    if sync and order.status in {"pending", "requires_payment"}:
        order = await reconcile_order_with_stripe(
            session,
            order,
            settings=get_settings(),
        )
        # Re-load items if still needed for response shape
        order = await get_order_for_guest(session, order_id, email=email) or order
    return _order_out(order)
