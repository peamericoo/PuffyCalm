"""Admin product API schemas — camelCase for FE (Phase H)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ProductStatusLiteral = Literal["draft", "published", "archived"]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class AdminProductSpecIn(CamelModel):
    label: str = Field(min_length=1, max_length=128)
    value: str = Field(min_length=1, max_length=2000)

    @field_validator("label", "value")
    @classmethod
    def strip_text(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("must not be blank")
        return s


class AdminProductSpecOut(CamelModel):
    label: str
    value: str
    sort_order: int = Field(serialization_alias="sortOrder")


class AdminProductImageIn(CamelModel):
    url: str = Field(min_length=1, max_length=1024)

    @field_validator("url")
    @classmethod
    def strip_url(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("url must not be blank")
        return s


class AdminProductImageOut(CamelModel):
    url: str
    sort_order: int = Field(serialization_alias="sortOrder")


class AdminProductListItemOut(CamelModel):
    id: str
    slug: str
    name: str
    status: str
    price: float
    currency: str
    image_url: str = Field(serialization_alias="imageUrl")
    in_stock: bool = Field(serialization_alias="inStock")
    featured: bool
    category_slugs: list[str] = Field(serialization_alias="categorySlugs")
    published_at: str | None = Field(default=None, serialization_alias="publishedAt")
    updated_at: str = Field(serialization_alias="updatedAt")
    created_at: str = Field(serialization_alias="createdAt")


class AdminProductListOut(CamelModel):
    items: list[AdminProductListItemOut]
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    total_items: int = Field(serialization_alias="totalItems")
    total_pages: int = Field(serialization_alias="totalPages")
    has_next: bool = Field(serialization_alias="hasNext")
    has_prev: bool = Field(serialization_alias="hasPrev")


class AdminProductDetailOut(CamelModel):
    id: str
    slug: str
    name: str
    status: str
    short_description: str = Field(serialization_alias="shortDescription")
    description: str
    price: float
    compare_at_price: float | None = Field(
        default=None,
        serialization_alias="compareAtPrice",
    )
    currency: str
    image_url: str = Field(serialization_alias="imageUrl")
    image_alt: str = Field(serialization_alias="imageAlt")
    images: list[AdminProductImageOut]
    category_slugs: list[str] = Field(serialization_alias="categorySlugs")
    category_label: str | None = Field(default=None, serialization_alias="categoryLabel")
    badges: list[str]
    features: list[str]
    specs: list[AdminProductSpecOut]
    in_stock: bool = Field(serialization_alias="inStock")
    featured: bool
    max_quantity_per_order: int = Field(serialization_alias="maxQuantityPerOrder")
    purchase_limit_per_customer: int | None = Field(
        default=None,
        serialization_alias="purchaseLimitPerCustomer",
    )
    seo_title: str | None = Field(default=None, serialization_alias="seoTitle")
    seo_description: str | None = Field(default=None, serialization_alias="seoDescription")
    rating: float
    review_count: int = Field(serialization_alias="reviewCount")
    published_at: str | None = Field(default=None, serialization_alias="publishedAt")
    created_at: str = Field(serialization_alias="createdAt")
    updated_at: str = Field(serialization_alias="updatedAt")


class AdminProductCreateIn(CamelModel):
    """Create product. Default status = draft. Optional id acts as SKU-like primary key."""

    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(
        default=None,
        min_length=3,
        max_length=64,
        description="Optional stable product id (SKU-like). Auto-generated if omitted.",
    )
    slug: str = Field(min_length=2, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    short_description: str = Field(
        default="",
        max_length=2000,
        validation_alias="shortDescription",
    )
    description: str = Field(default="", max_length=20000)
    price: float = Field(gt=0, description="Unit price in major currency units (USD)")
    compare_at_price: float | None = Field(
        default=None,
        validation_alias="compareAtPrice",
        gt=0,
    )
    currency: str = Field(default="USD", min_length=3, max_length=3)
    image_url: str = Field(default="", max_length=1024, validation_alias="imageUrl")
    image_alt: str = Field(default="", max_length=512, validation_alias="imageAlt")
    images: list[AdminProductImageIn] = Field(default_factory=list)
    category_slugs: list[str] = Field(
        default_factory=list,
        validation_alias="categorySlugs",
    )
    category_label: str | None = Field(
        default=None,
        max_length=128,
        validation_alias="categoryLabel",
    )
    badges: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    specs: list[AdminProductSpecIn] = Field(default_factory=list)
    in_stock: bool = Field(default=True, validation_alias="inStock")
    featured: bool = False
    status: ProductStatusLiteral = "draft"
    max_quantity_per_order: int = Field(
        default=9,
        ge=1,
        le=99,
        validation_alias="maxQuantityPerOrder",
    )
    purchase_limit_per_customer: int | None = Field(
        default=None,
        ge=1,
        le=999,
        validation_alias="purchaseLimitPerCustomer",
    )
    seo_title: str | None = Field(default=None, max_length=255, validation_alias="seoTitle")
    seo_description: str | None = Field(
        default=None,
        max_length=2000,
        validation_alias="seoDescription",
    )

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, v: str) -> str:
        s = v.strip().lower()
        if not s:
            raise ValueError("slug must not be blank")
        return s

    @field_validator("id")
    @classmethod
    def normalize_id(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        return s or None

    @field_validator("currency")
    @classmethod
    def upper_currency(cls, v: str) -> str:
        return v.strip().upper() or "USD"

    @field_validator("category_slugs")
    @classmethod
    def clean_slugs(cls, v: list[str]) -> list[str]:
        out: list[str] = []
        seen: set[str] = set()
        for raw in v:
            s = raw.strip().lower()
            if not s or s in seen:
                continue
            seen.add(s)
            out.append(s)
        return out


class AdminProductUpdateIn(CamelModel):
    """Partial update. Omit fields to leave unchanged. Nested images/specs replace when set."""

    model_config = ConfigDict(populate_by_name=True)

    slug: str | None = Field(default=None, min_length=2, max_length=255)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    short_description: str | None = Field(
        default=None,
        max_length=2000,
        validation_alias="shortDescription",
    )
    description: str | None = Field(default=None, max_length=20000)
    price: float | None = Field(default=None, gt=0)
    compare_at_price: float | None = Field(
        default=None,
        validation_alias="compareAtPrice",
    )
    image_url: str | None = Field(default=None, max_length=1024, validation_alias="imageUrl")
    image_alt: str | None = Field(default=None, max_length=512, validation_alias="imageAlt")
    images: list[AdminProductImageIn] | None = None
    category_slugs: list[str] | None = Field(default=None, validation_alias="categorySlugs")
    category_label: str | None = Field(
        default=None,
        max_length=128,
        validation_alias="categoryLabel",
    )
    badges: list[str] | None = None
    features: list[str] | None = None
    specs: list[AdminProductSpecIn] | None = None
    in_stock: bool | None = Field(default=None, validation_alias="inStock")
    featured: bool | None = None
    status: ProductStatusLiteral | None = None
    max_quantity_per_order: int | None = Field(
        default=None,
        ge=1,
        le=99,
        validation_alias="maxQuantityPerOrder",
    )
    purchase_limit_per_customer: int | None = Field(
        default=None,
        validation_alias="purchaseLimitPerCustomer",
    )
    seo_title: str | None = Field(default=None, max_length=255, validation_alias="seoTitle")
    seo_description: str | None = Field(
        default=None,
        max_length=2000,
        validation_alias="seoDescription",
    )

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip().lower()
        if not s:
            raise ValueError("slug must not be blank")
        return s

    @field_validator("category_slugs")
    @classmethod
    def clean_slugs(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        out: list[str] = []
        seen: set[str] = set()
        for raw in v:
            s = raw.strip().lower()
            if not s or s in seen:
                continue
            seen.add(s)
            out.append(s)
        return out


class AdminProductStatusOut(CamelModel):
    """Publish / unpublish response (full detail for FE convenience)."""

    product: AdminProductDetailOut
