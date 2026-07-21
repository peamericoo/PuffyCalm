"""Product / search schemas — mirrors src/types/product.ts."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class ProductSpecOut(CamelModel):
    label: str
    value: str


class ProductOut(CamelModel):
    id: str
    slug: str
    name: str
    short_description: str = Field(serialization_alias="shortDescription")
    description: str
    price: float
    compare_at_price: float | None = Field(default=None, serialization_alias="compareAtPrice")
    currency: Literal["USD"] = "USD"
    category_slugs: list[str] = Field(serialization_alias="categorySlugs")
    image_url: str = Field(serialization_alias="imageUrl")
    images: list[str]
    image_alt: str = Field(serialization_alias="imageAlt")
    rating: float
    review_count: int = Field(serialization_alias="reviewCount")
    badges: list[str] | None = None
    features: list[str]
    specs: list[ProductSpecOut] | None = None
    in_stock: bool = Field(serialization_alias="inStock")
    stock_qty: int | None = Field(default=None, serialization_alias="stockQty")
    featured: bool | None = None
    category_label: str | None = Field(default=None, serialization_alias="categoryLabel")


class ProductDetailOut(CamelModel):
    """PDP payload: product + optional related list."""

    product: ProductOut
    related: list[ProductOut] = Field(default_factory=list)


class SearchResponseOut(CamelModel):
    query: str
    items: list[ProductOut]
    total: int
