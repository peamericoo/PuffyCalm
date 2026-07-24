"""Phase J — public + admin home content API (Postgres)."""

from __future__ import annotations

import os

import pytest
from httpx import AsyncClient

from app.application.auth.service import seed_admin_users
from app.application.content.defaults import default_home_payload
from app.application.content.service import seed_home_content
from app.core.config import get_settings
from app.infrastructure.db.session import get_session_factory


def _require_ready() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_READY=1 to run content API tests")


async def _login_admin(client: AsyncClient) -> None:
    settings = get_settings()
    await client.post("/api/v1/auth/logout")
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.admin_email, "password": settings.admin_password},
    )
    assert res.status_code == 200, res.text


@pytest.fixture
async def content_ready(client: AsyncClient) -> None:
    _require_ready()
    settings = get_settings()
    factory = get_session_factory()
    async with factory() as session:
        await seed_admin_users(session, settings=settings)
        await seed_home_content(session, force=True)
    await _login_admin(client)


@pytest.mark.asyncio
async def test_public_home_content_returns_defaults(client: AsyncClient) -> None:
    _require_ready()
    factory = get_session_factory()
    async with factory() as session:
        await seed_home_content(session, force=True)

    res = await client.get("/api/v1/content/home")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "promoMessages" in data
    assert "promoSettings" in data
    assert "heroSlides" in data
    # Clean defaults: empty until admin fills CMS (no demo Unsplash seed).
    assert isinstance(data["promoMessages"], list)
    assert data["promoSettings"] == {"speedSeconds": 32, "color": "#3a7ca5"}
    assert isinstance(data["heroSlides"], list)
    assert data["promoMessages"] == []
    assert data["heroSlides"] == []


@pytest.mark.asyncio
async def test_admin_content_unauthenticated_401(client: AsyncClient) -> None:
    _require_ready()
    res = await client.get("/api/v1/admin/content/home")
    assert res.status_code == 401
    put = await client.put(
        "/api/v1/admin/content/home",
        json=default_home_payload(),
    )
    assert put.status_code == 401


@pytest.mark.asyncio
async def test_admin_get_and_put_home_content(
    client: AsyncClient, content_ready: None
) -> None:
    get_res = await client.get("/api/v1/admin/content/home")
    assert get_res.status_code == 200, get_res.text
    current = get_res.json()
    assert current["promoMessages"] == []
    assert current["promoSettings"] == {"speedSeconds": 32, "color": "#3a7ca5"}
    assert current["heroSlides"] == []

    new_promo = ["🚀 Phase J test promo — free shipping $75+"]
    new_settings = {"speedSeconds": 18, "color": "#f06d52"}
    new_slides = [
        {
            "id": "slide_test_j",
            "titleLine1": "Test hero",
            "titleLine2": "from admin.",
            "titleAccent": "admin.",
            "subtitle": "CMS-lite validation slide.",
            "ctaLabel": "Shop now",
            "ctaHref": "/category/all",
            "secondaryLabel": "Browse",
            "secondaryHref": "/category/recovery",
            "imageUrl": "https://example.com/hero-test.jpg",
            "imageAlt": "Test slide",
        }
    ]
    put_res = await client.put(
        "/api/v1/admin/content/home",
        json={
            "promoMessages": new_promo,
            "promoSettings": new_settings,
            "heroSlides": new_slides,
        },
    )
    assert put_res.status_code == 200, put_res.text
    saved = put_res.json()
    assert saved["promoMessages"] == new_promo
    assert saved["promoSettings"] == new_settings
    assert len(saved["heroSlides"]) == 1
    assert saved["heroSlides"][0]["id"] == "slide_test_j"
    assert saved["heroSlides"][0]["titleLine1"] == "Test hero"

    # Public reflects immediately (no FE cache in unit test)
    pub = await client.get("/api/v1/content/home")
    assert pub.status_code == 200
    assert pub.json()["promoMessages"] == new_promo
    assert pub.json()["promoSettings"] == new_settings
    assert pub.json()["heroSlides"][0]["titleLine1"] == "Test hero"

    # Restore clean empty defaults for other suites
    restore = await client.put(
        "/api/v1/admin/content/home",
        json=default_home_payload(),
    )
    assert restore.status_code == 200, restore.text


@pytest.mark.asyncio
async def test_admin_put_allows_empty_home(
    client: AsyncClient, content_ready: None
) -> None:
    res = await client.put(
        "/api/v1/admin/content/home",
        json={"promoMessages": [], "heroSlides": []},
    )
    assert res.status_code == 200, res.text
    assert res.json()["promoMessages"] == []
    assert res.json()["heroSlides"] == []


@pytest.mark.asyncio
async def test_admin_put_rejects_bad_image_url(
    client: AsyncClient, content_ready: None
) -> None:
    payload = {
        "promoMessages": [],
        "heroSlides": [
            {
                "id": "bad_img",
                "titleLine1": "A",
                "titleLine2": "B",
                "subtitle": "S",
                "ctaLabel": "Go",
                "ctaHref": "/category/all",
                "imageUrl": "not-a-url",
                "imageAlt": "x",
            }
        ],
    }
    res = await client.put("/api/v1/admin/content/home", json=payload)
    assert res.status_code == 400, res.text
    detail = res.json().get("detail") or {}
    if isinstance(detail, dict):
        assert detail.get("code") == "invalid_slide"
