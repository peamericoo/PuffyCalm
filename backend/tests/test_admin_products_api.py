"""Admin products API — CRUD, publish lifecycle, validation (Postgres)."""

from __future__ import annotations

import os
import uuid

import pytest
from httpx import AsyncClient

from app.application.auth.service import seed_admin_users
from app.core.config import get_settings
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def _require_ready() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_READY=1 to run admin products API tests")


async def _login_admin(client: AsyncClient) -> None:
    settings = get_settings()
    await client.post("/api/v1/auth/logout")
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.admin_email, "password": settings.admin_password},
    )
    assert res.status_code == 200, res.text


@pytest.fixture
async def admin_ready(client: AsyncClient) -> None:
    _require_ready()
    settings = get_settings()
    factory = get_session_factory()
    async with factory() as session:
        await seed_admin_users(session, settings=settings)
        await seed_catalog(session, reset=False)
    await _login_admin(client)


def _unique_slug(prefix: str = "phase-h") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _create_payload(**overrides: object) -> dict:
    slug = str(overrides.pop("slug", _unique_slug()))
    base: dict = {
        "slug": slug,
        "name": "Phase H Test Massager",
        "shortDescription": "Draft product for admin API tests",
        "description": "Full description for Phase H publish flow.",
        "price": 49.99,
        "compareAtPrice": 59.99,
        "imageUrl": "https://example.com/img/main.jpg",
        "imageAlt": "Test product",
        "images": [
            {"url": "https://example.com/img/main.jpg"},
            {"url": "https://example.com/img/side.jpg"},
        ],
        "categorySlugs": ["recovery"],
        "categoryLabel": "Recovery",
        "badges": ["new"],
        "features": ["Quiet motor", "Heat"],
        "specs": [
            {"label": "Weight", "value": "1.2 kg"},
            {"label": "Power", "value": "USB-C"},
        ],
        "inStock": True,
        "featured": False,
        "status": "draft",
    }
    base.update(overrides)
    return base


@pytest.mark.asyncio
async def test_admin_products_unauthenticated_401(client: AsyncClient) -> None:
    _require_ready()
    bare = await client.get("/api/v1/admin/products")
    assert bare.status_code == 401


@pytest.mark.asyncio
async def test_admin_list_products(client: AsyncClient, admin_ready: None) -> None:
    res = await client.get("/api/v1/admin/products", params={"pageSize": 50})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "items" in data
    assert data["page"] == 1
    assert data["pageSize"] == 50
    assert data["totalItems"] >= 1
    # Seed products are published
    statuses = {i["status"] for i in data["items"]}
    assert "published" in statuses


@pytest.mark.asyncio
async def test_admin_create_draft_and_get(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    payload = _create_payload()
    res = await client.post("/api/v1/admin/products", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["status"] == "draft"
    assert body["slug"] == payload["slug"]
    assert body["price"] == 49.99
    assert body["categorySlugs"] == ["recovery"]
    assert len(body["images"]) == 2
    assert body["images"][0]["sortOrder"] == 0
    assert len(body["specs"]) == 2
    assert body["id"].startswith("prod_")

    # Not on public catalog while draft
    public = await client.get(f"/api/v1/products/{payload['slug']}")
    assert public.status_code == 404

    detail = await client.get(f"/api/v1/admin/products/{body['id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == body["id"]


@pytest.mark.asyncio
async def test_admin_publish_then_visible_storefront(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    payload = _create_payload()
    created = await client.post("/api/v1/admin/products", json=payload)
    assert created.status_code == 201, created.text
    pid = created.json()["id"]
    slug = created.json()["slug"]

    pub = await client.post(f"/api/v1/admin/products/{pid}/publish")
    assert pub.status_code == 200, pub.text
    assert pub.json()["status"] == "published"
    assert pub.json()["publishedAt"] is not None

    store = await client.get(f"/api/v1/products/{slug}")
    assert store.status_code == 200, store.text
    assert store.json()["product"]["id"] == pid
    assert store.json()["product"]["name"] == payload["name"]

    # Also in category catalog
    cat = await client.get(
        "/api/v1/catalog",
        params={"categorySlug": "recovery", "stock": "all"},
    )
    assert cat.status_code == 200
    ids = {p["id"] for p in cat.json()["products"]}
    assert pid in ids


@pytest.mark.asyncio
async def test_admin_unpublish_hides_from_storefront(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    payload = _create_payload(status="published")
    created = await client.post("/api/v1/admin/products", json=payload)
    assert created.status_code == 201, created.text
    pid = created.json()["id"]
    slug = created.json()["slug"]

    assert (await client.get(f"/api/v1/products/{slug}")).status_code == 200

    unpub = await client.post(f"/api/v1/admin/products/{pid}/unpublish")
    assert unpub.status_code == 200, unpub.text
    assert unpub.json()["status"] == "draft"

    assert (await client.get(f"/api/v1/products/{slug}")).status_code == 404

    cat = await client.get(
        "/api/v1/catalog",
        params={"categorySlug": "all", "stock": "all"},
    )
    assert cat.status_code == 200
    ids = {p["id"] for p in cat.json()["products"]}
    assert pid not in ids


@pytest.mark.asyncio
async def test_admin_update_product(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    created = await client.post("/api/v1/admin/products", json=_create_payload())
    pid = created.json()["id"]

    patch = await client.patch(
        f"/api/v1/admin/products/{pid}",
        json={
            "name": "Updated Name",
            "price": 42.5,
            "images": [{"url": "https://example.com/only.jpg"}],
            "specs": [{"label": "Color", "value": "Sky"}],
            "categorySlugs": ["comfort"],
            "features": ["One feature"],
        },
    )
    assert patch.status_code == 200, patch.text
    data = patch.json()
    assert data["name"] == "Updated Name"
    assert data["price"] == 42.5
    assert len(data["images"]) == 1
    assert data["images"][0]["url"].endswith("only.jpg")
    assert data["specs"][0]["label"] == "Color"
    assert data["categorySlugs"] == ["comfort"]
    assert data["features"] == ["One feature"]


@pytest.mark.asyncio
async def test_admin_slug_conflict(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    slug = _unique_slug("conflict")
    r1 = await client.post("/api/v1/admin/products", json=_create_payload(slug=slug))
    assert r1.status_code == 201

    r2 = await client.post("/api/v1/admin/products", json=_create_payload(slug=slug))
    assert r2.status_code == 409
    assert r2.json()["detail"]["code"] == "slug_conflict"


@pytest.mark.asyncio
async def test_admin_sku_id_conflict(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    sku = f"prod_h_{uuid.uuid4().hex[:8]}"
    r1 = await client.post(
        "/api/v1/admin/products",
        json=_create_payload(id=sku),
    )
    assert r1.status_code == 201, r1.text
    assert r1.json()["id"] == sku

    r2 = await client.post(
        "/api/v1/admin/products",
        json=_create_payload(id=sku, slug=_unique_slug("other")),
    )
    assert r2.status_code == 409
    assert r2.json()["detail"]["code"] == "sku_conflict"


@pytest.mark.asyncio
async def test_admin_invalid_price(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    # Pydantic rejects price <= 0 at schema layer
    res = await client.post(
        "/api/v1/admin/products",
        json=_create_payload(price=0),
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_admin_invalid_slug_format(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    res = await client.post(
        "/api/v1/admin/products",
        json=_create_payload(slug="Bad Slug!!"),
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "invalid_slug"


@pytest.mark.asyncio
async def test_admin_invalid_category(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    res = await client.post(
        "/api/v1/admin/products",
        json=_create_payload(categorySlugs=["does-not-exist"]),
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "invalid_category"


@pytest.mark.asyncio
async def test_admin_get_product_404(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    res = await client.get("/api/v1/admin/products/prod_does_not_exist_xx")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_admin_list_filter_status(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    await client.post("/api/v1/admin/products", json=_create_payload(status="draft"))
    res = await client.get(
        "/api/v1/admin/products",
        params={"status": "draft", "pageSize": 50},
    )
    assert res.status_code == 200
    assert all(i["status"] == "draft" for i in res.json()["items"])


@pytest.mark.asyncio
async def test_admin_patch_empty_400(
    client: AsyncClient,
    admin_ready: None,
) -> None:
    created = await client.post("/api/v1/admin/products", json=_create_payload())
    pid = created.json()["id"]
    res = await client.patch(f"/api/v1/admin/products/{pid}", json={})
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "empty_patch"
