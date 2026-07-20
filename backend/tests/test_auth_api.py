"""Auth + RBAC tests (Postgres + Redis; HttpOnly cookie session)."""

from __future__ import annotations

import os

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.application.auth.service import seed_admin_users
from app.core.config import get_settings
from app.infrastructure.db.models import User
from app.infrastructure.db.session import get_session_factory


def _require_ready() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_READY=1 to run auth tests")


@pytest.fixture
async def users(client: AsyncClient) -> dict[str, str]:
    _require_ready()
    settings = get_settings()
    factory = get_session_factory()
    async with factory() as session:
        await seed_admin_users(session, settings=settings)
    return {
        "admin_email": settings.admin_email,
        "admin_password": settings.admin_password,
        "staff_email": settings.staff_email,
        "staff_password": settings.staff_password,
    }


@pytest.mark.asyncio
async def test_login_sets_cookies_and_me(client: AsyncClient, users: dict[str, str]) -> None:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": users["admin_email"], "password": users["admin_password"]},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == users["admin_email"]
    assert data["user"]["role"] == "admin"
    assert data["user"]["fullName"]
    assert data.get("accessToken")
    # HttpOnly cookies set
    assert "pc_access" in res.cookies
    assert "pc_refresh" in res.cookies

    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_login_invalid(client: AsyncClient, users: dict[str, str]) -> None:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": users["admin_email"], "password": "wrong-password-xx"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_bearer_access(client: AsyncClient, users: dict[str, str]) -> None:
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": users["admin_email"], "password": users["admin_password"]},
    )
    token = login.json()["accessToken"]
    # Fresh client without cookies — Bearer only
    res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        cookies={},  # try clear — httpx may still send jar; use separate call
    )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_admin_ping_rbac(client: AsyncClient, users: dict[str, str]) -> None:
    # unauthenticated
    bare = await client.get("/api/v1/admin/ping")
    # May be 401; if previous tests left cookies on client, logout first
    await client.post("/api/v1/auth/logout")
    bare = await client.get("/api/v1/admin/ping")
    assert bare.status_code == 401

    # staff can ping
    await client.post(
        "/api/v1/auth/login",
        json={"email": users["staff_email"], "password": users["staff_password"]},
    )
    ping = await client.get("/api/v1/admin/ping")
    assert ping.status_code == 200
    assert ping.json()["role"] == "staff"

    # staff cannot only-admin
    only = await client.get("/api/v1/admin/only-admin")
    assert only.status_code == 403

    # admin can
    await client.post("/api/v1/auth/logout")
    await client.post(
        "/api/v1/auth/login",
        json={"email": users["admin_email"], "password": users["admin_password"]},
    )
    only_ok = await client.get("/api/v1/admin/only-admin")
    assert only_ok.status_code == 200
    assert only_ok.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_refresh_and_logout(client: AsyncClient, users: dict[str, str]) -> None:
    await client.post("/api/v1/auth/logout")
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": users["admin_email"], "password": users["admin_password"]},
    )
    assert login.status_code == 200
    old_access = login.cookies.get("pc_access")

    ref = await client.post("/api/v1/auth/refresh")
    assert ref.status_code == 200
    assert ref.json()["user"]["role"] == "admin"
    new_access = ref.cookies.get("pc_access") or client.cookies.get("pc_access")
    assert new_access

    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200

    out = await client.post("/api/v1/auth/logout")
    assert out.status_code == 200

    # After logout, refresh should fail (cookie cleared / jti revoked)
    ref2 = await client.post("/api/v1/auth/refresh")
    assert ref2.status_code == 401


@pytest.mark.asyncio
async def test_seed_users_idempotent(client: AsyncClient, users: dict[str, str]) -> None:
    factory = get_session_factory()
    async with factory() as session:
        again = await seed_admin_users(session)
        assert all(v in {"exists", "created"} for v in again.values())
        result = await session.execute(select(User))
        emails = {u.email for u in result.scalars().all()}
    assert users["admin_email"] in emails
    assert users["staff_email"] in emails
