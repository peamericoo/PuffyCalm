"""Public content API — home promo + hero (Phase J)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.content import (
    HeroSlideOut,
    HomeContentOut,
    LifestyleTileOut,
    PromoSettingsOut,
)
from app.application.content.service import get_home_content

router = APIRouter(prefix="/content", tags=["content"])


def _to_out(data: dict) -> HomeContentOut:
    settings = data.get("promoSettings") or data.get("promo_settings") or {}
    if not isinstance(settings, dict):
        settings = {}
    slides = []
    for s in data.get("heroSlides") or []:
        if not isinstance(s, dict):
            continue
        slides.append(
            HeroSlideOut(
                id=str(s.get("id") or ""),
                title_line1=str(s.get("titleLine1") or s.get("title_line1") or ""),
                title_line2=str(s.get("titleLine2") or s.get("title_line2") or ""),
                title_accent=s.get("titleAccent") or s.get("title_accent"),
                subtitle=str(s.get("subtitle") or ""),
                cta_label=str(s.get("ctaLabel") or s.get("cta_label") or ""),
                cta_href=str(s.get("ctaHref") or s.get("cta_href") or ""),
                secondary_label=s.get("secondaryLabel") or s.get("secondary_label"),
                secondary_href=s.get("secondaryHref") or s.get("secondary_href"),
                image_url=str(s.get("imageUrl") or s.get("image_url") or ""),
                image_alt=str(s.get("imageAlt") or s.get("image_alt") or ""),
            )
        )
    lifestyle = []
    for t in data.get("lifestyleCollections") or data.get("lifestyle_collections") or []:
        if not isinstance(t, dict):
            continue
        lifestyle.append(
            LifestyleTileOut(
                id=str(t.get("id") or ""),
                title=str(t.get("title") or ""),
                href=str(t.get("href") or ""),
                image_url=str(t.get("imageUrl") or t.get("image_url") or ""),
                span=str(t.get("span") or "square"),
            )
        )
    return HomeContentOut(
        promo_messages=list(data.get("promoMessages") or []),
        promo_settings=PromoSettingsOut(
            speed_seconds=int(
                settings.get("speedSeconds") or settings.get("speed_seconds") or 32
            ),
            color=str(settings.get("color") or "#3a7ca5"),
        ),
        hero_slides=slides,
        lifestyle_collections=lifestyle,
        updated_at=data.get("updatedAt"),
    )


@router.get("/home", response_model=HomeContentOut)
async def public_home_content(session: AsyncSession = Depends(db_session)) -> HomeContentOut:
    """Public storefront home content (promo ticker + hero slides)."""
    data = await get_home_content(session)
    return _to_out(data)
