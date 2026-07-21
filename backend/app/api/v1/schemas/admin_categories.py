"""Admin category schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class AdminCategoryOut(CamelModel):
    id: str
    slug: str
    name: str
    description: str = ""
    tagline: str = ""
    image_url: str = Field(default="", serialization_alias="imageUrl")
    cta_label: str = Field(default="Shop", serialization_alias="ctaLabel")
    is_virtual: bool = Field(default=False, serialization_alias="isVirtual")
    sort_order: int = Field(default=0, serialization_alias="sortOrder")


class AdminCategoryUpdateIn(CamelModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    tagline: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=1024, validation_alias="imageUrl")
    cta_label: str | None = Field(
        default=None, max_length=128, validation_alias="ctaLabel"
    )
    sort_order: int | None = Field(default=None, validation_alias="sortOrder")


class AdminCategoryCreateIn(CamelModel):
    slug: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    tagline: str = Field(default="", max_length=255)
    image_url: str = Field(default="", max_length=1024, validation_alias="imageUrl")
    cta_label: str = Field(default="Shop", max_length=128, validation_alias="ctaLabel")
    is_virtual: bool = Field(default=False, validation_alias="isVirtual")
