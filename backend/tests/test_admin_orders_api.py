"""Admin orders API — list / get / patch + RBAC (Postgres + Redis)."""

from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.application.auth.service import seed_admin_users
from app.core.config import get_settings
from app.infrastructure.db.models import Order, OrderItem, Product
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def _require_ready() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_READY=1 to run admin orders API tests")


async def _login_admin(client: AsyncClient) -> None:
    settings = get_settings()
    await client.post("/api/v1/auth/logout")
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.admin_email, "password": settings.admin_password},
    )
    assert res.status_code == 200, res.text


async def _login_staff(client: AsyncClient) -> None:
    settings = get_settings()
    await client.post("/api/v1/auth/logout")
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.staff_email, "password": settings.staff_password},
    )
    assert res.status_code == 200, res.text


def _new_order(
    *,
    product: Product,
    status: str = "paid",
    email: str = "buyer@example.com",
    with_item: bool = True,
) -> Order:
    oid = f"ord_{uuid.uuid4().hex[:16]}"
    # unit price from product for realism; totals fixed for assertions
    unit = 4999
    order = Order(
        id=oid,
        public_code=f"PC-{uuid.uuid4().hex[:8].upper()}",
        email=email,
        status=status,
        currency="USD",
        subtotal_cents=unit,
        shipping_cents=699,
        total_cents=unit + 699,
        shipping_address={
            "fullName": "Alex Rivera",
            "line1": "1 Market St",
            "city": "San Francisco",
            "region": "CA",
            "postal": "94105",
            "country": "US",
        },
        stripe_checkout_session_id=f"cs_test_{uuid.uuid4().hex[:12]}",
        stripe_payment_intent_id=f"pi_test_{uuid.uuid4().hex[:10]}",
        paid_at=datetime.now(UTC) if status == "paid" else None,
        admin_notes=None,
    )
    if with_item:
        order.items = [
            OrderItem(
                id=f"oi_{uuid.uuid4().hex[:16]}",
                order_id=oid,
                product_id=product.id,
                product_slug=product.slug,
                product_name=product.name,
                quantity=1,
                unit_price_cents=unit,
                line_total_cents=unit,
                image_url="/images/gun.jpg",
            )
        ]
    return order


@pytest.fixture
async def users_and_orders(client: AsyncClient) -> dict[str, str]:
    _require_ready()
    settings = get_settings()
    factory = get_session_factory()
    async with factory() as session:
        await seed_admin_users(session, settings=settings)
        count = await session.scalar(select(func.count()).select_from(Product))
        if not count:
            await seed_catalog(session, reset=True)
        product = (
            await session.execute(select(Product).where(Product.in_stock.is_(True)).limit(1))
        ).scalar_one()
        paid = _new_order(
            product=product,
            status="paid",
            email="paid-buyer@example.com",
        )
        processing = _new_order(
            product=product,
            status="processing",
            email="proc@example.com",
        )
        session.add(paid)
        session.add(processing)
        await session.commit()
        return {
            "paid_id": paid.id,
            "processing_id": processing.id,
            "paid_code": paid.public_code,
            "product_id": product.id,
        }


@pytest.mark.asyncio
async def test_admin_orders_unauthenticated_401(client: AsyncClient) -> None:
    _require_ready()
    await client.post("/api/v1/auth/logout")
    bare = await client.get("/api/v1/admin/orders")
    assert bare.status_code == 401


@pytest.mark.asyncio
async def test_admin_list_orders(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_staff(client)
    res = await client.get("/api/v1/admin/orders", params={"pageSize": 50})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "items" in data
    assert data["page"] >= 1
    assert data["pageSize"] == 50
    assert data["totalItems"] >= 2
    ids = {i["id"] for i in data["items"]}
    assert users_and_orders["paid_id"] in ids
    # camelCase
    sample = next(i for i in data["items"] if i["id"] == users_and_orders["paid_id"])
    assert "publicCode" in sample
    assert "subtotalCents" in sample
    assert "itemCount" in sample
    assert sample["itemCount"] >= 1


@pytest.mark.asyncio
async def test_admin_list_filter_status(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_admin(client)
    res = await client.get(
        "/api/v1/admin/orders",
        params={"status": "processing", "pageSize": 50},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["totalItems"] >= 1
    for item in data["items"]:
        assert item["status"] == "processing"
    assert users_and_orders["processing_id"] in {i["id"] for i in data["items"]}


@pytest.mark.asyncio
async def test_admin_list_invalid_status_400(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_admin(client)
    res = await client.get("/api/v1/admin/orders", params={"status": "nope"})
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "invalid_status"


@pytest.mark.asyncio
async def test_admin_get_order_detail(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_staff(client)
    oid = users_and_orders["paid_id"]
    res = await client.get(f"/api/v1/admin/orders/{oid}")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["id"] == oid
    assert data["email"] == "paid-buyer@example.com"
    assert data["status"] == "paid"
    assert data["shippingAddress"]["city"] == "San Francisco"
    assert data["stripeCheckoutSessionId"]
    assert data["stripePaymentIntentId"]
    assert len(data["items"]) >= 1
    assert data["items"][0]["productName"]
    assert "subtotalCents" in data
    assert "adminNotes" in data


@pytest.mark.asyncio
async def test_admin_get_order_404(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_admin(client)
    res = await client.get("/api/v1/admin/orders/ord_does_not_exist_xx")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_admin_patch_status_and_notes(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_admin(client)
    oid = users_and_orders["paid_id"]
    res = await client.patch(
        f"/api/v1/admin/orders/{oid}",
        json={"status": "processing", "adminNotes": "Packed for courier"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "processing"
    assert data["adminNotes"] == "Packed for courier"

    # Idempotent same status + notes update
    res2 = await client.patch(
        f"/api/v1/admin/orders/{oid}",
        json={"status": "processing", "adminNotes": "Label printed"},
    )
    assert res2.status_code == 200
    assert res2.json()["adminNotes"] == "Label printed"


async def _product(session) -> Product:
    product = (
        await session.execute(select(Product).where(Product.in_stock.is_(True)).limit(1))
    ).scalar_one()
    return product


@pytest.mark.asyncio
async def test_admin_patch_illegal_transition_409(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    """paid → shipped skips processing → 409."""
    factory = get_session_factory()
    async with factory() as session:
        product = await _product(session)
        order = _new_order(
            product=product,
            status="paid",
            email="illegal@example.com",
        )
        session.add(order)
        await session.commit()
        oid = order.id

    await _login_staff(client)
    res = await client.patch(
        f"/api/v1/admin/orders/{oid}",
        json={"status": "shipped"},
    )
    assert res.status_code == 409, res.text
    detail = res.json()["detail"]
    assert detail["code"] == "illegal_status_transition"

    # Unchanged in DB
    get_res = await client.get(f"/api/v1/admin/orders/{oid}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "paid"


@pytest.mark.asyncio
async def test_admin_patch_paid_to_cancelled_allowed(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    factory = get_session_factory()
    async with factory() as session:
        product = await _product(session)
        order = _new_order(
            product=product,
            status="paid",
            email="cancel-me@example.com",
        )
        session.add(order)
        await session.commit()
        oid = order.id

    await _login_admin(client)
    res = await client.patch(
        f"/api/v1/admin/orders/{oid}",
        json={"status": "cancelled", "adminNotes": "Customer requested refund"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_admin_patch_empty_body_400(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_admin(client)
    oid = users_and_orders["processing_id"]
    res = await client.patch(f"/api/v1/admin/orders/{oid}", json={})
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "empty_patch"


@pytest.mark.asyncio
async def test_admin_patch_notes_only(
    client: AsyncClient,
    users_and_orders: dict[str, str],
) -> None:
    await _login_staff(client)
    oid = users_and_orders["processing_id"]
    res = await client.patch(
        f"/api/v1/admin/orders/{oid}",
        json={"adminNotes": "Waiting on warehouse"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "processing"
    assert res.json()["adminNotes"] == "Waiting on warehouse"
