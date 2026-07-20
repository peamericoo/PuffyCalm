"""Review page schemas — mirrors src/types/review.ts."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ReviewSort = Literal["featured", "helpful", "recent"]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class ProductReviewOut(CamelModel):
    id: str
    author: str
    initials: str
    rating: int
    title: str
    body: str
    date_label: str = Field(serialization_alias="dateLabel")
    created_at: str = Field(serialization_alias="createdAt")
    verified: bool
    helpful: int
    tags: list[str] | None = None
    featured: bool | None = None


class RatingBreakdownOut(CamelModel):
    stars: Literal[1, 2, 3, 4, 5]
    percent: int
    count: int


class ReviewsQueryOut(CamelModel):
    product_id: str = Field(serialization_alias="productId")
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    sort: ReviewSort
    tag: str | None = None


class ReviewsSummaryOut(CamelModel):
    average: float
    count: int
    breakdown: list[RatingBreakdownOut]
    featured: ProductReviewOut | None
    tags: list[str]


class ReviewsPageOut(CamelModel):
    items: list[ProductReviewOut]
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    total_items: int = Field(serialization_alias="totalItems")
    total_pages: int = Field(serialization_alias="totalPages")
    has_next: bool = Field(serialization_alias="hasNext")
    has_prev: bool = Field(serialization_alias="hasPrev")
    summary: ReviewsSummaryOut
    query: ReviewsQueryOut
