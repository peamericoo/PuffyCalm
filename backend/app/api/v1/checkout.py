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
            "max_quantity_exceeded": status.HTTP_409_CONFLICT,
            "purchase_limit_exceeded": status.HTTP_409_CONFLICT,
            "total_too_low": status.HTTP_400_BAD_REQUEST,
            "stripe_not_configured": status.HTTP_503_SERVICE_UNAVAILABLE,
            "stripe_error": status.HTTP_502_BAD_GATEWAY,
        }
        raise HTTPException(
            status_code=code_map.get(exc.code, status.HTTP_400_BAD_REQUEST),
            detail={"message": exc.message, "code": exc.code},
        ) from exc

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
