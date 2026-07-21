"""Default home promo + hero content (mirrors former FE mock)."""

from __future__ import annotations

from typing import Any

HOME_KEY = "home"

DEFAULT_PROMO_MESSAGES: list[str] = [
    "🎉 We just launched — welcome to PuffyCalm",
    "🔥 Launch sale: up to 20% off bestsellers this week",
    "🚚 Free tracked shipping on orders $75+",
    "⏱️ Limited launch offer — comfort upgrades from $39",
    "✨ Guest checkout · Ships to US, UK, AU & CA",
    "💆 New drops: recovery tools that actually feel premium",
]

DEFAULT_HERO_SLIDES: list[dict[str, Any]] = [
    {
        "id": "slide_launch",
        "titleLine1": "Your body is",
        "titleLine2": "asking for better.",
        "titleAccent": "better.",
        "subtitle": (
            "Stop living with the ache. Premium comfort & recovery — free shipping over $75."
        ),
        "ctaLabel": "Shop the launch",
        "ctaHref": "/category/all",
        "secondaryLabel": "See bestsellers",
        "secondaryHref": "/category/recovery",
        "imageUrl": (
            "https://images.unsplash.com/photo-1545205597-3d9d02c29597"
            "?auto=format&fit=crop&w=1800&q=80"
        ),
        "imageAlt": "Calm wellness lifestyle",
    },
    {
        "id": "slide_recovery",
        "titleLine1": "Release the tension",
        "titleLine2": "you keep ignoring.",
        "titleAccent": "ignoring.",
        "subtitle": (
            "Massage & heat therapy engineered for desk-heavy days that never clock out."
        ),
        "ctaLabel": "Unknot now",
        "ctaHref": "/category/recovery",
        "secondaryLabel": "Browse all",
        "secondaryHref": "/category/all",
        "imageUrl": (
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b"
            "?auto=format&fit=crop&w=1800&q=80"
        ),
        "imageAlt": "Yoga recovery stretch lifestyle",
    },
    {
        "id": "slide_comfort",
        "titleLine1": "Long hours.",
        "titleLine2": "Zero excuses for pain.",
        "titleAccent": "pain.",
        "subtitle": (
            "Support that turns eight hours at a desk into eight better ones — finally."
        ),
        "ctaLabel": "Sit better",
        "ctaHref": "/category/comfort",
        "secondaryLabel": "Browse all",
        "secondaryHref": "/category/all",
        "imageUrl": (
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174"
            "?auto=format&fit=crop&w=1800&q=80"
        ),
        "imageAlt": "Modern workspace comfort",
    },
    {
        "id": "slide_everyday",
        "titleLine1": "Tiny upgrades.",
        "titleLine2": "Ridiculously better days.",
        "titleAccent": "better days.",
        "subtitle": (
            "Posture, focus, routine — small tools that quietly change how you feel by 5pm."
        ),
        "ctaLabel": "Upgrade daily",
        "ctaHref": "/category/everyday",
        "secondaryLabel": "Browse all",
        "secondaryHref": "/category/all",
        "imageUrl": (
            "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
            "?auto=format&fit=crop&w=1800&q=80"
        ),
        "imageAlt": "Productive everyday desk setup",
    },
]


def default_home_payload() -> dict[str, Any]:
    return {
        "promoMessages": list(DEFAULT_PROMO_MESSAGES),
        "heroSlides": [dict(s) for s in DEFAULT_HERO_SLIDES],
    }
