"""Health endpoint tests.

`/health` is dependency-free. `/ready` requires Postgres + Redis;
in CI without compose it may return 503 — we only assert shape when up.
"""

import os

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_ok(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "service" in data


@pytest.mark.asyncio
async def test_api_v1_root(client: AsyncClient) -> None:
    response = await client.get("/api/v1/")
    assert response.status_code == 200
    data = response.json()
    assert data["prefix"] == "/api/v1"
    assert "version" in data


@pytest.mark.asyncio
async def test_ready_shape(client: AsyncClient) -> None:
    """When compose stack is up, readiness is 200; otherwise 503 with checks."""
    response = await client.get("/ready")
    assert response.status_code in {200, 503}
    data = response.json()
    assert "checks" in data
    assert "postgres" in data["checks"]
    assert "redis" in data["checks"]

    # Optional strict mode for docker compose CI
    if os.getenv("REQUIRE_READY") == "1":
        assert response.status_code == 200
        assert data["status"] == "ok"
        assert data["checks"]["postgres"] is True
        assert data["checks"]["redis"] is True
