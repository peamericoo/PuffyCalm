"""Catalog page schemas — mirrors src/lib/catalog/types.ts."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.api.v1.schemas.product import ProductOut

CatalogSort = Literal["featured", "price-asc", "price-desc", "rating"]
StockFilter = Literal["all", "in", "out"]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class CategoryOut(CamelModel):
    id: str
    slug: str
    name: str
    description: str
    tagline: str
    image_url: str = Field(serialization_alias="imageUrl")
    cta_label: str = Field(serialization_alias="ctaLabel")
    product_count: int = Field(serialization_alias="productCount")


class StockFacetOut(CamelModel):
    in_: int = Field(serialization_alias="in", validation_alias="in")
    out: int

    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class TypeFacetOut(CamelModel):
    slug: str
    name: str
    count: int


class CatalogFacetsOut(CamelModel):
    stock: StockFacetOut
    types: list[TypeFacetOut]
    sale: int


class CatalogPageOut(CamelModel):
    category: CategoryOut
    products: list[ProductOut]
    siblings: list[CategoryOut]
    sort: CatalogSort
    stock: StockFilter
    types: list[str]
    sale: bool
    total: int
    pool_total: int = Field(serialization_alias="poolTotal")
    facets: CatalogFacetsOut
