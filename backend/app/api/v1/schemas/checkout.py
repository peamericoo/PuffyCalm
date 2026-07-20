"""Checkout / order API schemas — camelCase for FE."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class CheckoutLineIn(CamelModel):
    product_id: str = Field(alias="productId")
    quantity: int = Field(ge=1, le=9)


class ShippingIn(CamelModel):
    full_name: str = Field(alias="fullName", min_length=1, max_length=255)
    line1: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=128)
    # UK county optional — deep validation in application layer
    region: str = Field(default="", max_length=64)
    postal: str = Field(min_length=1, max_length=32)
    country: str = Field(default="US", min_length=2, max_length=2)


class CreateCheckoutSessionIn(CamelModel):
    email: EmailStr
    lines: list[CheckoutLineIn] = Field(min_length=1)
    shipping: ShippingIn


class CreateCheckoutSessionOut(CamelModel):
    order_id: str = Field(serialization_alias="orderId")
    public_code: str = Field(serialization_alias="publicCode")
    client_secret: str = Field(serialization_alias="clientSecret")
    total_cents: int = Field(serialization_alias="totalCents")
    currency: Literal["USD"] = "USD"
    status: str


class OrderItemOut(CamelModel):
    product_id: str = Field(serialization_alias="productId")
    product_slug: str = Field(serialization_alias="productSlug")
    product_name: str = Field(serialization_alias="productName")
    quantity: int
    unit_price_cents: int = Field(serialization_alias="unitPriceCents")
    line_total_cents: int = Field(serialization_alias="lineTotalCents")
    image_url: str = Field(serialization_alias="imageUrl")


class OrderOut(CamelModel):
    id: str
    public_code: str = Field(serialization_alias="publicCode")
    email: str
    status: str
    currency: Literal["USD"] = "USD"
    subtotal_cents: int = Field(serialization_alias="subtotalCents")
    shipping_cents: int = Field(serialization_alias="shippingCents")
    total_cents: int = Field(serialization_alias="totalCents")
    shipping_address: dict[str, Any] = Field(serialization_alias="shippingAddress")
    items: list[OrderItemOut]
    paid_at: str | None = Field(default=None, serialization_alias="paidAt")
    created_at: str = Field(serialization_alias="createdAt")
