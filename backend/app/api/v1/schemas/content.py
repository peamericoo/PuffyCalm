"""Home CMS-lite content schemas — camelCase for FE (Phase J)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class HeroSlideOut(CamelModel):
    id: str
    title_line1: str = Field(serialization_alias="titleLine1")
    title_line2: str = Field(serialization_alias="titleLine2")
    title_accent: str | None = Field(default=None, serialization_alias="titleAccent")
    subtitle: str
    cta_label: str = Field(serialization_alias="ctaLabel")
    cta_href: str = Field(serialization_alias="ctaHref")
    secondary_label: str | None = Field(default=None, serialization_alias="secondaryLabel")
    secondary_href: str | None = Field(default=None, serialization_alias="secondaryHref")
    image_url: str = Field(serialization_alias="imageUrl")
    image_alt: str = Field(serialization_alias="imageAlt")


class HomeContentOut(CamelModel):
    promo_messages: list[str] = Field(serialization_alias="promoMessages")
    hero_slides: list[HeroSlideOut] = Field(serialization_alias="heroSlides")
    updated_at: str | None = Field(default=None, serialization_alias="updatedAt")


class HeroSlideIn(CamelModel):
    id: str | None = None
    title_line1: str = Field(alias="titleLine1", min_length=1, max_length=120)
    title_line2: str = Field(alias="titleLine2", min_length=1, max_length=120)
    title_accent: str | None = Field(default=None, alias="titleAccent", max_length=80)
    subtitle: str = Field(min_length=1, max_length=500)
    cta_label: str = Field(alias="ctaLabel", min_length=1, max_length=80)
    cta_href: str = Field(alias="ctaHref", min_length=1, max_length=512)
    secondary_label: str | None = Field(default=None, alias="secondaryLabel", max_length=80)
    secondary_href: str | None = Field(default=None, alias="secondaryHref", max_length=512)
    image_url: str = Field(alias="imageUrl", min_length=1, max_length=1024)
    image_alt: str = Field(default="", alias="imageAlt", max_length=200)

    @field_validator(
        "title_line1",
        "title_line2",
        "subtitle",
        "cta_label",
        "cta_href",
        "image_url",
        mode="before",
    )
    @classmethod
    def strip_required(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v


class HomeContentIn(CamelModel):
    # Empty arrays allowed — clean storefront until admin adds CMS content.
    promo_messages: list[str] = Field(alias="promoMessages", min_length=0, max_length=20)
    hero_slides: list[HeroSlideIn] = Field(alias="heroSlides", min_length=0, max_length=8)

    @field_validator("promo_messages")
    @classmethod
    def clean_promos(cls, v: list[str]) -> list[str]:
        return [s.strip() for s in v if isinstance(s, str) and s.strip()]
