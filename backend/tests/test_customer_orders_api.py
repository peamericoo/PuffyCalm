"""Phase K — customer order lookup + list by email (require Postgres + seed)."""

from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.application.checkout.service import normalize_public_code
from app.infrastructure.db.models import Order, OrderItem, Product
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def _require_db() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 for customer order API tests")


@pytest.fixture
async def seeded(client: AsyncClient) -> None:
    _require_db()
    factory = get_session_factory()
    async with factory() as session:
        count = await session.scalar(select(func.count()).select_from(Product))
        if not count:
            await seed_catalog(session, reset=True)


async def _insert_order(
    *,
    email: str,
    public_code: str | None = None,
    status: str = "paid",
) -> dict[str, str]:
    """Insert a minimal order row (no Stripe) for read-path tests."""
    factory = get_session_factory()
    async with factory() as session:
        product = (
            await session.execute(
                select(Product).where(Product.in_stock.is_(True)).limit(1)
            )
        ).scalar_one()
        order_id = f"ord_{uuid.uuid4().hex[:16]}"
        code = public_code or f"PC-{uuid.uuid4().hex[:8].upper()}"
        order = Order(
            id=order_id,
            public_code=code,
            email=email.strip().lower(),
            status=status,
            currency="USD",
            subtotal_cents=4999,
            shipping_cents=699,
            total_cents=5698,
            shipping_address={
                "fullName": "Test Buyer",
                "line1": "1 Test St",
                "city": "Austin",
                "region": "TX",
                "postal": "78701",
                "country": "US",
            },
            paid_at=datetime.now(UTC) if status == "paid" else None,
        )
        item = OrderItem(
            id=f"oi_{uuid.uuid4().hex[:16]}",
            order_id=order_id,
            product_id=product.id,
            product_slug=product.slug,
            product_name=product.name,
            quantity=1,
            unit_price_cents=4999,
            line_total_cents=4999,
            image_url=product.image_url or "",
        )
        session.add(order)
        session.add(item)
        await session.commit()
        return {"orderId": order_id, "publicCode": code, "email": email.strip().lower()}


def test_normalize_public_code() -> None:
    assert normalize_public_code("pc-ab12cd34") == "PC-AB12CD34"
    assert normalize_public_code("  PC-AB12CD34  ") == "PC-AB12CD34"
    assert normalize_public_code("ab12cd34") == "PC-AB12CD34"
    assert normalize_public_code("") == ""
    assert normalize_public_code("NOT-A-CODE") == "NOT-A-CODE"


@pytest.mark.asyncio
async def test_lookup_by_code_and_email(
    client: AsyncClient,
    seeded: None,
) -> None:
    data = await _insert_order(email="lookup@example.com")
    code = data["publicCode"]
    assert code.startswith("PC-")

    # missing params
    bad = await client.get("/api/v1/orders/lookup")
    assert bad.status_code == 400

    missing_code = await client.get(
        "/api/v1/orders/lookup",
        params={"email": "lookup@example.com"},
    )
    assert missing_code.status_code == 400

    # wrong email
    wrong = await client.get(
        "/api/v1/orders/lookup",
        params={"email": "other@example.com", "code": code},
    )
    assert wrong.status_code == 404

    # ok
    ok = await client.get(
        "/api/v1/orders/lookup",
        params={"email": "lookup@example.com", "code": code},
    )
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["publicCode"] == code
    assert body["email"] == "lookup@example.com"
    assert body["id"] == data["orderId"]
    assert len(body["items"]) >= 1
    assert body["status"] == "paid"

    # bare hex suffix without PC-
    bare = code.removeprefix("PC-")
    ok2 = await client.get(
        "/api/v1/orders/lookup",
        params={"email": "lookup@example.com", "code": bare},
    )
    assert ok2.status_code == 200
    assert ok2.json()["id"] == data["orderId"]


@pytest.mark.asyncio
async def test_list_by_email(
    client: AsyncClient,
    seeded: None,
) -> None:
    email = f"google.user.k.{uuid.uuid4().hex[:8]}@example.com"
    first = await _insert_order(email=email)
    second = await _insert_order(email=email)

    missing = await client.get("/api/v1/orders/by-email")
    assert missing.status_code == 400

    empty = await client.get(
        "/api/v1/orders/by-email",
        params={"email": f"nobody-k-{uuid.uuid4().hex[:6]}@example.com"},
    )
    assert empty.status_code == 200
    empty_body = empty.json()
    assert empty_body["items"] == []
    assert empty_body["totalItems"] == 0

    listed = await client.get(
        "/api/v1/orders/by-email",
        params={"email": email, "pageSize": 20},
    )
    assert listed.status_code == 200, listed.text
    body = listed.json()
    assert body["totalItems"] >= 2
    ids = {item["id"] for item in body["items"]}
    assert first["orderId"] in ids
    assert second["orderId"] in ids
    for item in body["items"]:
        assert item["email"].lower() == email.lower()
        assert "publicCode" in item
        assert "itemCount" in item
        assert "items" in item
        # no admin-only fields
        assert "adminNotes" not in item
        assert "stripeCheckoutSessionId" not in item

    # case-insensitive email match
    upper = await client.get(
        "/api/v1/orders/by-email",
        params={"email": email.upper()},
    )
    assert upper.status_code == 200
    assert upper.json()["totalItems"] >= 2


@pytest.mark.asyncio
async def test_get_by_id_still_requires_email(
    client: AsyncClient,
    seeded: None,
) -> None:
    """Regression: success-page guest path unchanged."""
    data = await _insert_order(email="success@example.com")
    oid = data["orderId"]

    no_email = await client.get(f"/api/v1/orders/{oid}")
    assert no_email.status_code == 400

    ok = await client.get(
        f"/api/v1/orders/{oid}",
        params={"email": "success@example.com"},
    )
    assert ok.status_code == 200
    assert ok.json()["publicCode"] == data["publicCode"]

    wrong = await client.get(
        f"/api/v1/orders/{oid}",
        params={"email": "wrong@example.com"},
    )
    assert wrong.status_code == 404
