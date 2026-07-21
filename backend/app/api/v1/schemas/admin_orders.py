"""Admin order API schemas — camelCase for FE (Phase F / G)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

# Mirror domain OrderStatus values (string column)
OrderStatusLiteral = Literal[
    "pending",
    "requires_payment",
    "paid",
    "failed",
    "cancelled",
    "processing",
    "shipped",
    "delivered",
]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class AdminOrderItemOut(CamelModel):
    id: str
    product_id: str = Field(serialization_alias="productId")
    product_slug: str = Field(serialization_alias="productSlug")
    product_name: str = Field(serialization_alias="productName")
    quantity: int
    unit_price_cents: int = Field(serialization_alias="unitPriceCents")
    line_total_cents: int = Field(serialization_alias="lineTotalCents")
    image_url: str = Field(serialization_alias="imageUrl")


class AdminOrderListItemOut(CamelModel):
    id: str
    public_code: str = Field(serialization_alias="publicCode")
    email: str
    status: str
    currency: str
    subtotal_cents: int = Field(serialization_alias="subtotalCents")
    shipping_cents: int = Field(serialization_alias="shippingCents")
    total_cents: int = Field(serialization_alias="totalCents")
    item_count: int = Field(serialization_alias="itemCount")
    paid_at: str | None = Field(default=None, serialization_alias="paidAt")
    created_at: str = Field(serialization_alias="createdAt")
    updated_at: str = Field(serialization_alias="updatedAt")


class AdminOrderListOut(CamelModel):
    items: list[AdminOrderListItemOut]
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    total_items: int = Field(serialization_alias="totalItems")
    total_pages: int = Field(serialization_alias="totalPages")
    has_next: bool = Field(serialization_alias="hasNext")
    has_prev: bool = Field(serialization_alias="hasPrev")


class AdminOrderDetailOut(CamelModel):
    id: str
    public_code: str = Field(serialization_alias="publicCode")
    email: str
    status: str
    currency: str
    subtotal_cents: int = Field(serialization_alias="subtotalCents")
    shipping_cents: int = Field(serialization_alias="shippingCents")
    total_cents: int = Field(serialization_alias="totalCents")
    shipping_address: dict[str, Any] = Field(serialization_alias="shippingAddress")
    admin_notes: str | None = Field(default=None, serialization_alias="adminNotes")
    stripe_checkout_session_id: str | None = Field(
        default=None,
        serialization_alias="stripeCheckoutSessionId",
    )
    stripe_payment_intent_id: str | None = Field(
        default=None,
        serialization_alias="stripePaymentIntentId",
    )
    items: list[AdminOrderItemOut]
    paid_at: str | None = Field(default=None, serialization_alias="paidAt")
    created_at: str = Field(serialization_alias="createdAt")
    updated_at: str = Field(serialization_alias="updatedAt")


class AdminOrderPatchIn(CamelModel):
    """Partial update. Omit fields to leave unchanged."""

    status: OrderStatusLiteral | None = None
    admin_notes: str | None = Field(
        default=None,
        validation_alias="adminNotes",
        serialization_alias="adminNotes",
        max_length=5000,
    )

    model_config = ConfigDict(populate_by_name=True)
