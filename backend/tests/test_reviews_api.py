"""Reviews API tests (require Postgres seed)."""

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
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 to run reviews API tests")


@pytest.fixture
async def seeded(client: AsyncClient) -> None:
    _require_db()
    factory = get_session_factory()
    async with factory() as session:
        count = await session.scalar(select(func.count()).select_from(Product))
        if not count:
            await seed_catalog(session, reset=True)


@pytest.mark.asyncio
async def test_reviews_paginated(client: AsyncClient, seeded: None) -> None:
    res = await client.get(
        "/api/v1/products/prod_001/reviews",
        params={"page": 1, "pageSize": 4, "sort": "featured"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["pageSize"] == 4
    assert data["totalItems"] == 12
    assert data["totalPages"] == 3
    assert data["hasNext"] is True
    assert data["hasPrev"] is False
    assert len(data["items"]) == 4
    item = data["items"][0]
    assert "dateLabel" in item
    assert "createdAt" in item
    assert "author" in item
    summary = data["summary"]
    assert summary["average"] > 0
    assert summary["count"] > 0
    assert len(summary["breakdown"]) == 5
    assert summary["breakdown"][0]["stars"] == 5
    assert data["query"]["productId"] == "prod_001"


@pytest.mark.asyncio
async def test_reviews_page_2(client: AsyncClient, seeded: None) -> None:
    res = await client.get(
        "/api/v1/products/prod_001/reviews",
        params={"page": 2, "pageSize": 4},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 2
    assert data["hasPrev"] is True
    assert data["hasNext"] is True


@pytest.mark.asyncio
async def test_reviews_product_404(client: AsyncClient, seeded: None) -> None:
    res = await client.get("/api/v1/products/prod_missing/reviews")
    assert res.status_code == 404
