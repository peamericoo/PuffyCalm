"""Unit tests for content payload normalization (no DB)."""

from __future__ import annotations

import pytest

from app.application.content.service import ContentValidationError, normalize_home_payload


def test_normalize_happy_path() -> None:
    out = normalize_home_payload(
        {
            "promoMessages": ["  Hello  ", "World"],
            "heroSlides": [
                {
                    "id": "s1",
                    "titleLine1": "A",
                    "titleLine2": "B",
                    "subtitle": "Sub",
                    "ctaLabel": "Go",
                    "ctaHref": "/category/all",
                    "imageUrl": "https://example.com/a.jpg",
                    "imageAlt": "alt",
                }
            ],
        }
    )
    assert out["promoMessages"] == ["Hello", "World"]
    assert out["heroSlides"][0]["id"] == "s1"
    assert out["heroSlides"][0]["titleLine1"] == "A"


def test_normalize_allows_media_proxy_url() -> None:
    out = normalize_home_payload(
        {
            "promoMessages": ["Promo"],
            "heroSlides": [
                {
                    "titleLine1": "A",
                    "titleLine2": "B",
                    "subtitle": "Sub",
                    "ctaLabel": "Go",
                    "ctaHref": "/x",
                    "imageUrl": "/media/products/orphan/x.jpg",
                    "imageAlt": "alt",
                }
            ],
        }
    )
    assert out["heroSlides"][0]["imageUrl"].startswith("/media/")


def test_normalize_rejects_empty_promo() -> None:
    with pytest.raises(ContentValidationError) as ei:
        normalize_home_payload(
            {
                "promoMessages": ["  ", ""],
                "heroSlides": [
                    {
                        "titleLine1": "A",
                        "titleLine2": "B",
                        "subtitle": "S",
                        "ctaLabel": "C",
                        "ctaHref": "/x",
                        "imageUrl": "https://example.com/a.jpg",
                    }
                ],
            }
        )
    assert ei.value.code == "invalid_promo"


def test_normalize_rejects_bad_image() -> None:
    with pytest.raises(ContentValidationError) as ei:
        normalize_home_payload(
            {
                "promoMessages": ["Ok"],
                "heroSlides": [
                    {
                        "titleLine1": "A",
                        "titleLine2": "B",
                        "subtitle": "S",
                        "ctaLabel": "C",
                        "ctaHref": "/x",
                        "imageUrl": "ftp://bad",
                    }
                ],
            }
        )
    assert ei.value.code == "invalid_slide"
