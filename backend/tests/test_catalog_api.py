"""Catalog / products / search API tests (require Postgres seed)."""

from __future__ import annotations

import os

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.infrastructure.db.models import Product
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def _require_db() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 to run catalog API tests")


@pytest.fixture
async def seeded(client: AsyncClient) -> None:
    """Ensure seed data exists (lifespan already started DB)."""
    _require_db()
    factory = get_session_factory()
    async with factory() as session:
        count = await session.scalar(select(func.count()).select_from(Product))
        if not count:
            await seed_catalog(session, reset=True)


@pytest.mark.asyncio
async def test_catalog_recovery_filters(client: AsyncClient, seeded: None) -> None:
    res = await client.get(
        "/api/v1/catalog",
        params={"categorySlug": "recovery"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["category"]["slug"] == "recovery"
    assert data["poolTotal"] >= 4
    assert data["total"] == data["poolTotal"]  # no extra filters
    assert "imageUrl" in data["products"][0]
    assert "categorySlugs" in data["products"][0]
    assert "all" in data["products"][0]["categorySlugs"]
    assert data["facets"]["stock"]["in"] + data["facets"]["stock"]["out"] == data["poolTotal"]
    assert any(s["slug"] == "all" for s in data["siblings"])


@pytest.mark.asyncio
async def test_catalog_sale_filter(client: AsyncClient, seeded: None) -> None:
    res = await client.get(
        "/api/v1/catalog",
        params={"categorySlug": "all", "sale": "true"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["sale"] is True
    for p in data["products"]:
        assert p.get("compareAtPrice") is not None
        assert p["compareAtPrice"] > p["price"]


@pytest.mark.asyncio
async def test_catalog_unknown_category_404(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/catalog", params={"categorySlug": "nope"})
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_categories_list(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/categories")
    assert res.status_code == 200
    data = res.json()
    slugs = {c["slug"] for c in data}
    assert "all" in slugs
    assert "recovery" in slugs
    all_cat = next(c for c in data if c["slug"] == "all")
    assert all_cat["productCount"] == 8


@pytest.mark.asyncio
async def test_category_by_slug(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/categories/recovery")
    assert res.status_code == 200
    assert res.json()["slug"] == "recovery"
    res404 = await client.get("/api/v1/categories/missing")
    assert res404.status_code == 404


@pytest.mark.asyncio
async def test_product_by_slug_with_related(client: AsyncClient, seeded: None) -> None:
    res = await client.get(
        "/api/v1/products/shiatsu-neck-shoulder-massager",
        params={"related": 4},
    )
    assert res.status_code == 200
    data = res.json()
    product = data["product"]
    assert product["id"] == "prod_001"
    assert product["slug"] == "shiatsu-neck-shoulder-massager"
    assert product["price"] == 54.0
    assert len(product["images"]) >= 1
    assert product["specs"] and len(product["specs"]) >= 1
    assert "imageUrl" in product
    assert len(data["related"]) == 4
    assert all(r["slug"] != product["slug"] for r in data["related"])


@pytest.mark.asyncio
async def test_product_404(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/products/does-not-exist")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_search_massager(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/search", params={"q": "massager", "limit": 6})
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "massager"
    assert data["total"] >= 1
    assert any("massager" in i["name"].lower() for i in data["items"])


@pytest.mark.asyncio
async def test_search_empty_query(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/search", params={"q": ""})
    assert res.status_code == 200
    assert res.json()["items"] == []
