"""Inject conversion-focused home CMS copy into content_blocks.

Legitimate CMS path: same payload Admin → Content edits.
Preserves existing hero imageUrl / slide ids (and lifestyle tiles).
Only rewrites promo ticker + hero titles/subtitles/CTAs.

Run (prod):
  railway run --service api python scripts/inject_launch_copy.py
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from app.application.content.defaults import HOME_KEY
from app.application.content.service import normalize_home_payload
from app.core.config import get_settings
from app.infrastructure.db.models.content import ContentBlock
from app.infrastructure.db.session import close_db, get_session_factory, init_db

# Max 20 · ≤200 chars · honest launch claims (no fake %) · emoji ticker energy
PROMO_MESSAGES: list[str] = [
    "🎉 Welcome to PuffyCalm — comfort that actually ships",
    "🚚 Free tracked shipping on orders $75+",
    "✨ Guest checkout · buy in minutes, no account needed",
    "💳 Stripe-secure pay · totals clear before you confirm",
    "💆 Desk-day tension? Recovery tools that feel premium",
    "🪑 Sit softer. Focus longer. Stress less.",
    "🌍 Ships to the US, UK, Australia & Canada",
    "⏱️ Bag → checkout → done. Under a few minutes.",
    "📦 Track anytime with your email + order code",
    "🔥 Tight catalog on purpose — quality over filler SKUs",
    "💤 Wind-down support for tight shoulders & long sits",
    "🎯 Small upgrades that change how 5pm feels",
    "🛟 Real humans: support@puffycalm.com",
    "🛒 Save your bag and come back — cart stays on this device",
    "🌟 Premium feel without the spa appointment",
    "🛋️ Built for chairs, commutes, and nights that never quit",
    "📬 Shipping estimate shown at checkout — no surprise fees",
    "🆕 New store energy — fresh drops as we grow",
    "💪 Stop managing the ache. Start fixing it.",
    "🙌 You're early — thanks for shopping the launch",
]

# Conversion-first hero copy templates applied to existing slides (by index).
# imageUrl + id always come from whatever is already live in the DB.
HERO_COPY_BY_INDEX: list[dict[str, Any]] = [
    {
        "titleLine1": "Your body is",
        "titleLine2": "done settling.",
        "titleAccent": "settling.",
        "subtitle": (
            "Stop living with the ache. Premium comfort & recovery for desk days, "
            "long sits, and tight shoulders — free tracked shipping over $75."
        ),
        "ctaLabel": "Shop now",
        "ctaHref": "/category/all",
        "secondaryLabel": "Shop recovery",
        "secondaryHref": "/category/recovery",
        "imageAlt": "PuffyCalm comfort and recovery",
    },
    {
        "titleLine1": "Feel better",
        "titleLine2": "before bedtime.",
        "titleAccent": "bedtime.",
        "subtitle": (
            "Massage, heat, and support engineered for people who live in chairs. "
            "Guest checkout · ships US, UK, AU & CA."
        ),
        "ctaLabel": "Browse bestsellers",
        "ctaHref": "/category/all",
        "secondaryLabel": "How shipping works",
        "secondaryHref": "/help#shipping",
        "imageAlt": "Evening recovery and unwind",
    },
    {
        "titleLine1": "Long hours.",
        "titleLine2": "Zero excuses for pain.",
        "titleAccent": "pain.",
        "subtitle": (
            "Lumbar, cushions, and warmth that turn eight desk hours into eight "
            "better ones — finally."
        ),
        "ctaLabel": "Sit better",
        "ctaHref": "/category/comfort",
        "secondaryLabel": "See all products",
        "secondaryHref": "/category/all",
        "imageAlt": "Workspace comfort upgrades",
    },
    {
        "titleLine1": "Tiny upgrades.",
        "titleLine2": "Ridiculously better days.",
        "titleAccent": "better days.",
        "subtitle": (
            "Posture, focus, routine — small tools that quietly change how you "
            "feel by 5pm."
        ),
        "ctaLabel": "Upgrade daily",
        "ctaHref": "/category/everyday",
        "secondaryLabel": "Shop the catalog",
        "secondaryHref": "/category/all",
        "imageAlt": "Everyday essentials for better days",
    },
]


def _merge_hero_slides(existing: list[Any]) -> list[dict[str, Any]]:
    """Rewrite copy on existing slides; keep id + imageUrl from prod."""
    if not existing:
        # No images yet — do not invent Unsplash. Admin uploads first.
        return []

    out: list[dict[str, Any]] = []
    for i, raw in enumerate(existing):
        if not isinstance(raw, dict):
            continue
        image_url = str(raw.get("imageUrl") or raw.get("image_url") or "").strip()
        if not image_url:
            continue
        template = HERO_COPY_BY_INDEX[i % len(HERO_COPY_BY_INDEX)]
        slide: dict[str, Any] = {
            "id": str(raw.get("id") or f"slide_{i + 1}"),
            "imageUrl": image_url,
            **template,
        }
        out.append(slide)
    return out


async def main() -> None:
    init_db(get_settings())
    fac = get_session_factory()
    async with fac() as session:
        block = await session.get(ContentBlock, HOME_KEY)
        if block is None:
            block = ContentBlock(key=HOME_KEY, payload={})
            session.add(block)
            await session.flush()

        existing = block.payload if isinstance(block.payload, dict) else {}
        hero_in = existing.get("heroSlides") or existing.get("hero_slides") or []
        life_in = (
            existing.get("lifestyleCollections")
            or existing.get("lifestyle_collections")
            or []
        )

        payload = normalize_home_payload(
            {
                "promoMessages": PROMO_MESSAGES,
                "heroSlides": _merge_hero_slides(list(hero_in) if isinstance(hero_in, list) else []),
                "lifestyleCollections": life_in if isinstance(life_in, list) else [],
            }
        )

        block.payload = payload
        block.updated_at = datetime.now(UTC)
        await session.commit()

        print("OK inject_launch_copy")
        print(f"  promos={len(payload['promoMessages'])}")
        print(f"  heroes={len(payload['heroSlides'])}")
        print(f"  lifestyle={len(payload['lifestyleCollections'])}")
        for s in payload["heroSlides"]:
            print(f"  - {s['id']}: {s['titleLine1']} / {s['titleLine2']}")

    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
