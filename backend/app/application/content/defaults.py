"""Default home promo + hero content.

Empty by default so a fresh / wiped storefront has no demo Unsplash or
launch-copy. Admin fills via CMS; offline FE may use the same empty shape.
"""

from __future__ import annotations

from typing import Any

HOME_KEY = "home"

# Kept as empty templates — do not reintroduce stock photography here.
DEFAULT_PROMO_MESSAGES: list[str] = []
DEFAULT_PROMO_SETTINGS: dict[str, Any] = {
    "speedSeconds": 32,
    "color": "#3a7ca5",
}
DEFAULT_HERO_SLIDES: list[dict[str, Any]] = []


DEFAULT_LIFESTYLE_COLLECTIONS: list[dict[str, Any]] = []


def default_home_payload() -> dict[str, Any]:
    return {
        "promoMessages": list(DEFAULT_PROMO_MESSAGES),
        "promoSettings": dict(DEFAULT_PROMO_SETTINGS),
        "heroSlides": [dict(s) for s in DEFAULT_HERO_SLIDES],
        "lifestyleCollections": [dict(s) for s in DEFAULT_LIFESTYLE_COLLECTIONS],
    }
