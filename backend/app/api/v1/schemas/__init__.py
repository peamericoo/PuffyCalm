"""Pydantic response/request schemas (camelCase JSON for FE contracts)."""

from app.api.v1.schemas.catalog import (
    CatalogFacetsOut,
    CatalogPageOut,
    CategoryOut,
    StockFacetOut,
    TypeFacetOut,
)
from app.api.v1.schemas.product import (
    ProductDetailOut,
    ProductOut,
    ProductSpecOut,
    SearchResponseOut,
)
from app.api.v1.schemas.review import (
    ProductReviewOut,
    RatingBreakdownOut,
    ReviewsPageOut,
    ReviewsQueryOut,
    ReviewsSummaryOut,
)

__all__ = [
    "CatalogFacetsOut",
    "CatalogPageOut",
    "CategoryOut",
    "ProductDetailOut",
    "ProductOut",
    "ProductReviewOut",
    "ProductSpecOut",
    "RatingBreakdownOut",
    "ReviewsPageOut",
    "ReviewsQueryOut",
    "ReviewsSummaryOut",
    "SearchResponseOut",
    "StockFacetOut",
    "TypeFacetOut",
]
