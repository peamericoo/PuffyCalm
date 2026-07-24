"""Content blocks service — home promo + hero (Phase J)."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.content.defaults import HOME_KEY, default_home_payload
from app.infrastructure.db.models.content import ContentBlock

_HREF_RE = re.compile(r"^(/[a-zA-Z0-9/_\-.?=&%#]*|https?://\S+)$")
_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,64}$")
_PROMO_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class ContentValidationError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.isoformat()


def _normalize_slide(raw: dict[str, Any], *, index: int) -> dict[str, Any]:
    sid = str(raw.get("id") or "").strip() or f"slide_{index + 1}_{uuid4().hex[:6]}"
    if not _ID_RE.match(sid):
        raise ContentValidationError("invalid_slide_id", f"Invalid slide id: {sid!r}")

    title_line1 = str(raw.get("titleLine1") or raw.get("title_line1") or "").strip()
    title_line2 = str(raw.get("titleLine2") or raw.get("title_line2") or "").strip()
    subtitle = str(raw.get("subtitle") or "").strip()
    cta_label = str(raw.get("ctaLabel") or raw.get("cta_label") or "").strip()
    cta_href = str(raw.get("ctaHref") or raw.get("cta_href") or "").strip()
    image_url = str(raw.get("imageUrl") or raw.get("image_url") or "").strip()
    image_alt = str(raw.get("imageAlt") or raw.get("image_alt") or "").strip()

    if not title_line1:
        raise ContentValidationError("invalid_slide", f"Slide {index + 1}: titleLine1 required")
    if not title_line2:
        raise ContentValidationError("invalid_slide", f"Slide {index + 1}: titleLine2 required")
    if not subtitle:
        raise ContentValidationError("invalid_slide", f"Slide {index + 1}: subtitle required")
    if not cta_label:
        raise ContentValidationError("invalid_slide", f"Slide {index + 1}: ctaLabel required")
    if not cta_href or not _HREF_RE.match(cta_href):
        raise ContentValidationError("invalid_slide", f"Slide {index + 1}: invalid ctaHref")
    if not image_url or not (
        image_url.startswith("http://")
        or image_url.startswith("https://")
        or image_url.startswith("/media/")
    ):
        raise ContentValidationError(
            "invalid_slide",
            f"Slide {index + 1}: imageUrl must be http(s) or /media/…",
        )
    if not image_alt:
        image_alt = title_line1

    title_accent = raw.get("titleAccent") if "titleAccent" in raw else raw.get("title_accent")
    secondary_label = (
        raw.get("secondaryLabel") if "secondaryLabel" in raw else raw.get("secondary_label")
    )
    secondary_href = (
        raw.get("secondaryHref") if "secondaryHref" in raw else raw.get("secondary_href")
    )

    out: dict[str, Any] = {
        "id": sid,
        "titleLine1": title_line1[:120],
        "titleLine2": title_line2[:120],
        "subtitle": subtitle[:500],
        "ctaLabel": cta_label[:80],
        "ctaHref": cta_href[:512],
        "imageUrl": image_url[:1024],
        "imageAlt": image_alt[:200],
    }

    if title_accent is not None and str(title_accent).strip():
        out["titleAccent"] = str(title_accent).strip()[:80]
    if secondary_label is not None and str(secondary_label).strip():
        out["secondaryLabel"] = str(secondary_label).strip()[:80]
    if secondary_href is not None and str(secondary_href).strip():
        href = str(secondary_href).strip()
        if not _HREF_RE.match(href):
            raise ContentValidationError(
                "invalid_slide",
                f"Slide {index + 1}: invalid secondaryHref",
            )
        out["secondaryHref"] = href[:512]

    return out


_LIFESTYLE_SPANS = frozenset({"tall", "wide", "square"})


def _normalize_promo_settings(raw: Any) -> dict[str, Any]:
    defaults = default_home_payload()["promoSettings"]
    if raw is None:
        return dict(defaults)
    if not isinstance(raw, dict):
        raise ContentValidationError(
            "invalid_promo_settings",
            "promoSettings must be an object",
        )

    speed_raw = raw.get("speedSeconds") if "speedSeconds" in raw else raw.get("speed_seconds")
    if speed_raw is None:
        speed_seconds = int(defaults["speedSeconds"])
    else:
        try:
            speed_seconds = int(round(float(speed_raw)))
        except (TypeError, ValueError):
            raise ContentValidationError(
                "invalid_promo_settings",
                "promoSettings.speedSeconds must be a number",
            ) from None
    if speed_seconds < 8 or speed_seconds > 120:
        raise ContentValidationError(
            "invalid_promo_settings",
            "promoSettings.speedSeconds must be between 8 and 120",
        )

    color = str(raw.get("color") or defaults["color"]).strip()
    if not _PROMO_COLOR_RE.match(color):
        raise ContentValidationError(
            "invalid_promo_settings",
            "promoSettings.color must be a 6-digit hex color",
        )

    return {
        "speedSeconds": speed_seconds,
        "color": color,
    }


def _normalize_lifestyle(raw: dict[str, Any], *, index: int) -> dict[str, Any]:
    lid = str(raw.get("id") or "").strip() or f"life_{index + 1}_{uuid4().hex[:6]}"
    if not _ID_RE.match(lid):
        raise ContentValidationError("invalid_lifestyle_id", f"Invalid lifestyle id: {lid!r}")
    title = str(raw.get("title") or "").strip()
    href = str(raw.get("href") or "").strip()
    image_url = str(raw.get("imageUrl") or raw.get("image_url") or "").strip()
    span = str(raw.get("span") or "square").strip().lower()
    if not title:
        raise ContentValidationError("invalid_lifestyle", f"Lifestyle {index + 1}: title required")
    if not href or not _HREF_RE.match(href):
        raise ContentValidationError("invalid_lifestyle", f"Lifestyle {index + 1}: invalid href")
    if not image_url or not (
        image_url.startswith("http://")
        or image_url.startswith("https://")
        or image_url.startswith("/media/")
    ):
        raise ContentValidationError(
            "invalid_lifestyle",
            f"Lifestyle {index + 1}: imageUrl must be http(s) or /media/…",
        )
    if span not in _LIFESTYLE_SPANS:
        span = "square"
    return {
        "id": lid,
        "title": title[:80],
        "href": href[:512],
        "imageUrl": image_url[:1024],
        "span": span,
    }


def normalize_home_payload(raw: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalize home CMS payload."""
    promos_raw = raw.get("promoMessages") if "promoMessages" in raw else raw.get("promo_messages")
    settings_raw = (
        raw.get("promoSettings") if "promoSettings" in raw else raw.get("promo_settings")
    )
    slides_raw = raw.get("heroSlides") if "heroSlides" in raw else raw.get("hero_slides")
    life_raw = (
        raw.get("lifestyleCollections")
        if "lifestyleCollections" in raw
        else raw.get("lifestyle_collections")
    )

    if promos_raw is None:
        raise ContentValidationError("invalid_payload", "promoMessages is required")
    if not isinstance(promos_raw, list):
        raise ContentValidationError("invalid_payload", "promoMessages must be an array")
    if slides_raw is None:
        raise ContentValidationError("invalid_payload", "heroSlides is required")
    if not isinstance(slides_raw, list):
        raise ContentValidationError("invalid_payload", "heroSlides must be an array")
    if life_raw is None:
        life_raw = []
    if not isinstance(life_raw, list):
        raise ContentValidationError(
            "invalid_payload", "lifestyleCollections must be an array"
        )

    promo_messages: list[str] = []
    for i, item in enumerate(promos_raw):
        if not isinstance(item, str):
            raise ContentValidationError("invalid_promo", f"promoMessages[{i}] must be a string")
        text = item.strip()
        if not text:
            continue
        if len(text) > 200:
            raise ContentValidationError(
                "invalid_promo",
                f"promoMessages[{i}] max 200 characters",
            )
        promo_messages.append(text)

    # Empty promo/hero/lifestyle is valid (clean storefront until admin fills).
    if len(promo_messages) > 20:
        raise ContentValidationError("invalid_promo", "Maximum 20 promo messages")

    promo_settings = _normalize_promo_settings(settings_raw)

    if len(slides_raw) > 8:
        raise ContentValidationError("invalid_slide", "Maximum 8 hero slides")

    hero_slides: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for i, item in enumerate(slides_raw):
        if not isinstance(item, dict):
            raise ContentValidationError("invalid_slide", f"heroSlides[{i}] must be an object")
        slide = _normalize_slide(item, index=i)
        if slide["id"] in seen_ids:
            raise ContentValidationError("invalid_slide_id", f"Duplicate slide id: {slide['id']}")
        seen_ids.add(slide["id"])
        hero_slides.append(slide)

    if len(life_raw) > 8:
        raise ContentValidationError("invalid_lifestyle", "Maximum 8 lifestyle tiles")

    lifestyle: list[dict[str, Any]] = []
    seen_life: set[str] = set()
    for i, item in enumerate(life_raw):
        if not isinstance(item, dict):
            raise ContentValidationError(
                "invalid_lifestyle", f"lifestyleCollections[{i}] must be an object"
            )
        tile = _normalize_lifestyle(item, index=i)
        if tile["id"] in seen_life:
            raise ContentValidationError(
                "invalid_lifestyle_id", f"Duplicate lifestyle id: {tile['id']}"
            )
        seen_life.add(tile["id"])
        lifestyle.append(tile)

    return {
        "promoMessages": promo_messages,
        "promoSettings": promo_settings,
        "heroSlides": hero_slides,
        "lifestyleCollections": lifestyle,
    }


async def ensure_home_block(session: AsyncSession) -> ContentBlock:
    """Return home block, inserting defaults if missing."""
    block = await session.get(ContentBlock, HOME_KEY)
    if block is not None:
        return block
    block = ContentBlock(key=HOME_KEY, payload=default_home_payload())
    session.add(block)
    await session.commit()
    await session.refresh(block)
    return block


async def get_home_content(session: AsyncSession) -> dict[str, Any]:
    block = await ensure_home_block(session)
    payload = block.payload if isinstance(block.payload, dict) else {}
    defaults = default_home_payload()

    # Important: empty lists are intentional — do not treat them as missing
    # (Python `[] or defaults` would re-inject demo content).
    if "promoMessages" in payload:
        promo_raw = payload.get("promoMessages")
    elif "promo_messages" in payload:
        promo_raw = payload.get("promo_messages")
    else:
        promo_raw = defaults["promoMessages"]

    if "promoSettings" in payload:
        settings_raw = payload.get("promoSettings")
    elif "promo_settings" in payload:
        settings_raw = payload.get("promo_settings")
    else:
        settings_raw = defaults["promoSettings"]

    if "heroSlides" in payload:
        slides_raw = payload.get("heroSlides")
    elif "hero_slides" in payload:
        slides_raw = payload.get("hero_slides")
    else:
        slides_raw = defaults["heroSlides"]

    if "lifestyleCollections" in payload:
        life_raw = payload.get("lifestyleCollections")
    elif "lifestyle_collections" in payload:
        life_raw = payload.get("lifestyle_collections")
    else:
        life_raw = defaults.get("lifestyleCollections", [])

    try:
        promo_settings = _normalize_promo_settings(settings_raw)
    except ContentValidationError:
        promo_settings = defaults["promoSettings"]

    return {
        "promoMessages": promo_raw if isinstance(promo_raw, list) else defaults["promoMessages"],
        "promoSettings": promo_settings,
        "heroSlides": slides_raw if isinstance(slides_raw, list) else defaults["heroSlides"],
        "lifestyleCollections": (
            life_raw if isinstance(life_raw, list) else defaults.get("lifestyleCollections", [])
        ),
        "updatedAt": _iso(block.updated_at),
    }


async def update_home_content(
    session: AsyncSession,
    raw: dict[str, Any],
) -> dict[str, Any]:
    normalized = normalize_home_payload(raw)
    block = await session.get(ContentBlock, HOME_KEY)
    if block is None:
        block = ContentBlock(key=HOME_KEY, payload=normalized)
        session.add(block)
    else:
        block.payload = normalized
        block.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(block)
    return {
        "promoMessages": normalized["promoMessages"],
        "promoSettings": normalized["promoSettings"],
        "heroSlides": normalized["heroSlides"],
        "lifestyleCollections": normalized.get("lifestyleCollections") or [],
        "updatedAt": _iso(block.updated_at),
    }


async def seed_home_content(session: AsyncSession, *, force: bool = False) -> bool:
    """Idempotent seed of home defaults. Returns True if inserted/updated."""
    existing = await session.scalar(select(ContentBlock).where(ContentBlock.key == HOME_KEY))
    if existing is not None and not force:
        return False
    if existing is None:
        session.add(ContentBlock(key=HOME_KEY, payload=default_home_payload()))
    else:
        existing.payload = default_home_payload()
        existing.updated_at = datetime.now(UTC)
    await session.commit()
    return True
