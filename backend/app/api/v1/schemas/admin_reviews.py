"""Admin review schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class AdminReviewOut(CamelModel):
    id: str
    product_id: str = Field(serialization_alias="productId")
    author: str
    initials: str = ""
    rating: int
    title: str = ""
    body: str = ""
    date_label: str = Field(default="", serialization_alias="dateLabel")
    verified: bool = False
    helpful: int = 0
    tags: list[str] = Field(default_factory=list)
    featured: bool = False
    created_at: str = Field(default="", serialization_alias="createdAt")


class AdminReviewCreateIn(CamelModel):
    author: str = Field(min_length=1, max_length=128)
    initials: str | None = Field(default=None, max_length=8)
    rating: int = Field(ge=1, le=5)
    title: str = Field(default="", max_length=255)
    body: str = Field(min_length=1)
    date_label: str | None = Field(default=None, max_length=64, validation_alias="dateLabel")
    verified: bool = True
    helpful: int = 0
    tags: list[str] = Field(default_factory=list)
    featured: bool = False
