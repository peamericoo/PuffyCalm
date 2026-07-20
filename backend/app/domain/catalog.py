"""Domain types for catalog (framework-free).

ORM models live under infrastructure; these dataclasses document the
business shape and can back application services in Phase 3+.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(slots=True)
class ProductSpecEntity:
    label: str
    value: str


@dataclass(slots=True)
class CategoryEntity:
    id: str
    slug: str
    name: str
    description: str
    tagline: str
    image_url: str
    cta_label: str
    is_virtual: bool = False
    product_count: int = 0


@dataclass(slots=True)
class ProductEntity:
    id: str
    slug: str
    name: str
    short_description: str
    description: str
    price: Decimal
    currency: str
    image_url: str
    images: list[str]
    image_alt: str
    rating: Decimal
    review_count: int
    features: list[str]
    in_stock: bool
    compare_at_price: Decimal | None = None
    badges: list[str] = field(default_factory=list)
    specs: list[ProductSpecEntity] = field(default_factory=list)
    category_slugs: list[str] = field(default_factory=list)
    category_label: str | None = None
    featured: bool = False
