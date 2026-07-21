"""Phase E — Google ID token → admin JWT cookies (mocked Google verify)."""

from __future__ import annotations

import os
from typing import Any

import pytest
from httpx import AsyncClient

from app.application.auth.service import AuthError, seed_admin_users
from app.core.config import Settings, get_settings
from app.infrastructure.db.session import get_session_factory


def _require_ready() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_READY=1 to run auth integration tests")


@pytest.fixture
async def seeded(client: AsyncClient) -> Settings:
    _require_ready()
    settings = get_settings()
    factory = get_session_factory()
    async with factory() as session:
        await seed_admin_users(session, settings=settings)
    await client.post("/api/v1/auth/logout")
    return settings


def test_admin_email_set_fallback() -> None:
    s = Settings(
        admin_email="owner@example.com",
        admin_emails="",
        staff_email="staff@example.com",
        staff_emails="",
    )
    assert s.admin_email_set == frozenset({"owner@example.com"})
    assert s.role_for_google_email("owner@example.com") == "admin"
    assert s.role_for_google_email("staff@example.com") == "staff"
    assert s.role_for_google_email("customer@gmail.com") is None


def test_admin_emails_csv_overrides_single() -> None:
    s = Settings(
        admin_email="legacy@example.com",
        admin_emails="a@x.com, B@Y.com ",
        staff_emails="staff2@z.com",
        staff_email="staff@example.com",
    )
    assert s.admin_email_set == frozenset({"a@x.com", "b@y.com"})
    assert "legacy@example.com" not in s.admin_email_set
    assert s.role_for_google_email("b@y.com") == "admin"
    assert s.role_for_google_email("staff2@z.com") == "staff"
    assert s.role_for_google_email("staff@example.com") == "staff"


@pytest.mark.asyncio
async def test_google_exchange_admin_ping(
    client: AsyncClient,
    seeded: Settings,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    admin_email = next(iter(seeded.admin_email_set))

    async def fake_verify(id_token: str, *, settings: Settings | None = None) -> dict[str, Any]:
        assert id_token == "good-admin-token"
        return {
            "email": admin_email,
            "email_verified": "true",
            "name": "Phase E Admin",
            "sub": "google-sub-admin",
            "aud": "test-client",
            "iss": "https://accounts.google.com",
        }

    monkeypatch.setattr(
        "app.application.auth.google.verify_google_id_token",
        fake_verify,
    )

    res = await client.post(
        "/api/v1/auth/google-exchange",
        json={"idToken": "good-admin-token"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["user"]["email"] == admin_email
    assert body["user"]["role"] == "admin"
    assert body["authVia"] == "google-cookie"
    assert "pc_access" in res.cookies

    ping = await client.get("/api/v1/admin/ping")
    assert ping.status_code == 200
    assert ping.json()["role"] == "admin"

    only = await client.get("/api/v1/admin/only-admin")
    assert only.status_code == 200


@pytest.mark.asyncio
async def test_google_exchange_customer_forbidden(
    client: AsyncClient,
    seeded: Settings,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    await client.post("/api/v1/auth/logout")

    async def fake_verify(id_token: str, *, settings: Settings | None = None) -> dict[str, Any]:
        return {
            "email": "random.customer@gmail.com",
            "email_verified": True,
            "name": "Customer",
            "sub": "google-sub-cust",
        }

    monkeypatch.setattr(
        "app.application.auth.google.verify_google_id_token",
        fake_verify,
    )

    res = await client.post(
        "/api/v1/auth/google-exchange",
        json={"idToken": "customer-token"},
    )
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()

    ping = await client.get("/api/v1/admin/ping")
    assert ping.status_code == 401


@pytest.mark.asyncio
async def test_google_exchange_invalid_token(
    client: AsyncClient,
    seeded: Settings,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    await client.post("/api/v1/auth/logout")

    async def fake_verify(id_token: str, *, settings: Settings | None = None) -> dict[str, Any]:
        raise AuthError("invalid_token", "Invalid or expired Google ID token")

    monkeypatch.setattr(
        "app.application.auth.google.verify_google_id_token",
        fake_verify,
    )

    res = await client.post(
        "/api/v1/auth/google-exchange",
        json={"idToken": "expired-or-bad-token-xxxxx"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_admin_ping_unauthenticated(client: AsyncClient, seeded: Settings) -> None:
    await client.post("/api/v1/auth/logout")
    bare = await client.get("/api/v1/admin/ping")
    assert bare.status_code == 401


@pytest.mark.asyncio
async def test_google_exchange_staff_cannot_only_admin(
    client: AsyncClient,
    seeded: Settings,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    await client.post("/api/v1/auth/logout")
    staff_email = seeded.staff_email.strip().lower()

    async def fake_verify(id_token: str, *, settings: Settings | None = None) -> dict[str, Any]:
        return {
            "email": staff_email,
            "email_verified": True,
            "name": "Staff User",
            "sub": "google-sub-staff",
        }

    monkeypatch.setattr(
        "app.application.auth.google.verify_google_id_token",
        fake_verify,
    )

    res = await client.post(
        "/api/v1/auth/google-exchange",
        json={"idToken": "good-staff-token"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "staff"

    ping = await client.get("/api/v1/admin/ping")
    assert ping.status_code == 200

    only = await client.get("/api/v1/admin/only-admin")
    assert only.status_code == 403
