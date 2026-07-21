"""Admin media API — upload/delete with local storage (Postgres when REQUIRE_READY)."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient

from app.application.auth.service import seed_admin_users
from app.core.config import get_settings
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory
from app.infrastructure.storage.factory import reset_storage_cache

# Minimal JPEG
_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def _require_ready() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_READY=1 to run admin media API tests")


async def _login_admin(client: AsyncClient) -> None:
    settings = get_settings()
    await client.post("/api/v1/auth/logout")
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.admin_email, "password": settings.admin_password},
    )
    assert res.status_code == 200, res.text


@pytest.fixture
async def admin_ready(client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    _require_ready()
    # Force local storage for isolation
    monkeypatch.setenv("S3_BUCKET", "")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "")
    monkeypatch.setenv("S3_ENDPOINT_URL", "")
    monkeypatch.setenv("MEDIA_LOCAL_DIR", str(tmp_path / "uploads"))
    monkeypatch.setenv("MEDIA_LOCAL_PUBLIC_BASE_URL", "http://test/media")
    get_settings.cache_clear()
    reset_storage_cache()

    settings = get_settings()
    factory = get_session_factory()
    async with factory() as session:
        await seed_admin_users(session, settings=settings)
        await seed_catalog(session, reset=False)
    await _login_admin(client)
    return tmp_path / "uploads"


@pytest.mark.asyncio
async def test_admin_media_unauthenticated_401(client: AsyncClient) -> None:
    _require_ready()
    res = await client.post(
        "/api/v1/admin/media",
        files={"file": ("x.jpg", _JPEG, "image/jpeg")},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_upload_orphan_and_delete(
    client: AsyncClient, admin_ready: Path
) -> None:
    res = await client.post(
        "/api/v1/admin/media",
        files={"file": ("hero.jpg", _JPEG, "image/jpeg")},
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["url"].startswith("http://test/media/")
    assert data["key"].startswith("products/orphan/")
    assert data["contentType"] == "image/jpeg"
    assert data["sizeBytes"] == len(_JPEG)
    assert data["productId"] is None

    # file on disk
    local = admin_ready / data["key"]
    assert local.is_file()

    del_res = await client.request(
        "DELETE",
        "/api/v1/admin/media",
        json={"key": data["key"], "url": data["url"]},
    )
    assert del_res.status_code == 200, del_res.text
    body = del_res.json()
    assert body["deleted"] is True
    assert body["storageDeleted"] is True
    assert not local.exists()


@pytest.mark.asyncio
async def test_upload_associate_product(
    client: AsyncClient, admin_ready: Path
) -> None:
    slug = f"phase-i-{uuid.uuid4().hex[:8]}"
    create = await client.post(
        "/api/v1/admin/products",
        json={
            "slug": slug,
            "name": "Phase I Media Product",
            "price": 42.0,
            "status": "draft",
            "categorySlugs": ["recovery"],
        },
    )
    assert create.status_code == 201, create.text
    product = create.json()
    pid = product["id"]

    res = await client.post(
        "/api/v1/admin/media",
        files={"file": ("cover.jpg", _JPEG, "image/jpeg")},
        data={"productId": pid, "setCover": "true"},
    )
    assert res.status_code == 201, res.text
    media = res.json()
    assert media["productId"] == pid
    assert media["setCover"] is True
    assert media["sortOrder"] == 0

    detail = await client.get(f"/api/v1/admin/products/{pid}")
    assert detail.status_code == 200
    d = detail.json()
    assert d["imageUrl"] == media["url"]
    assert any(i["url"] == media["url"] for i in d["images"])


@pytest.mark.asyncio
async def test_reject_bad_type(client: AsyncClient, admin_ready: Path) -> None:
    res = await client.post(
        "/api/v1/admin/media",
        files={"file": ("x.txt", b"hello world not image", "text/plain")},
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "unsupported_type"
