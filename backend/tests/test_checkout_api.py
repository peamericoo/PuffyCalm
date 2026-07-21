"""Checkout API tests (require Postgres seed + optional Stripe)."""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.infrastructure.db.models import Product
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def _require_db() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 for checkout API tests")


@pytest.fixture
async def seeded(client: AsyncClient) -> None:
    _require_db()
    factory = get_session_factory()
    async with factory() as session:
        count = await session.scalar(select(func.count()).select_from(Product))
        if not count:
            await seed_catalog(session, reset=True)


def _checkout_body(product_id: str) -> dict:
    return {
        "email": "buyer@example.com",
        "lines": [{"productId": product_id, "quantity": 1}],
        "shipping": {
            "fullName": "Alex Rivera",
            "line1": "1 Market St",
            "city": "San Francisco",
            "region": "CA",
            "postal": "94105",
            "country": "US",
        },
    }


@pytest.mark.asyncio
async def test_checkout_session_mocked_stripe(
    client: AsyncClient,
    seeded: None,
) -> None:
    factory = get_session_factory()
    async with factory() as session:
        product = (
            await session.execute(select(Product).where(Product.in_stock.is_(True)).limit(1))
        ).scalar_one()
        product_id = product.id

    import uuid

    sid = f"cs_test_mock_{uuid.uuid4().hex[:12]}"
    mock_session = MagicMock()
    mock_session.id = sid
    mock_session.client_secret = f"{sid}_secret_abc"
    mock_session.payment_intent = f"pi_test_mock_{uuid.uuid4().hex[:8]}"

    with (
        patch("app.application.checkout.service.get_settings") as gs,
        patch("stripe.checkout.Session.create", return_value=mock_session) as create_mock,
    ):
        settings = gs.return_value
        settings.stripe_configured = True
        settings.stripe_secret_key = "sk_test_mock"
        settings.stripe_api_version = ""
        settings.storefront_url = "http://localhost:3000"
        settings.free_shipping_threshold_cents = 7500
        settings.flat_shipping_cents = 699

        # create_checkout_session also calls get_settings internally via default
        # Patch module-level get_settings used in service
        with patch(
            "app.application.checkout.service.get_settings",
            return_value=MagicMock(
                stripe_configured=True,
                stripe_secret_key="sk_test_mock",
                stripe_api_version="",
                storefront_url="http://localhost:3000",
                free_shipping_threshold_cents=7500,
                flat_shipping_cents=699,
            ),
        ):
            res = await client.post(
                "/api/v1/checkout/sessions",
                json=_checkout_body(product_id),
            )

    assert res.status_code == 201, res.text
    data = res.json()
    assert data["orderId"].startswith("ord_")
    assert data["publicCode"].startswith("PC-")
    assert data["clientSecret"]
    assert data["totalCents"] >= 50
    assert "subtotalCents" in data
    assert "shippingCents" in data
    assert data["totalCents"] == data["subtotalCents"] + data["shippingCents"]
    assert data["currency"] == "USD"
    create_mock.assert_called_once()

    # Guest order lookup
    order_id = data["orderId"]
    bad = await client.get(f"/api/v1/orders/{order_id}", params={"email": "wrong@x.com"})
    assert bad.status_code == 404

    ok = await client.get(
        f"/api/v1/orders/{order_id}",
        params={"email": "buyer@example.com"},
    )
    assert ok.status_code == 200
    order = ok.json()
    assert order["status"] in {"pending", "requires_payment"}
    assert order["items"][0]["productId"] == product_id


@pytest.mark.asyncio
async def test_checkout_unknown_product(client: AsyncClient, seeded: None) -> None:
    with patch(
        "app.application.checkout.service.get_settings",
        return_value=MagicMock(
            stripe_configured=True,
            stripe_secret_key="sk_test_mock",
            stripe_api_version="",
            storefront_url="http://localhost:3000",
            free_shipping_threshold_cents=7500,
            flat_shipping_cents=699,
        ),
    ):
        res = await client.post(
            "/api/v1/checkout/sessions",
            json=_checkout_body("prod_does_not_exist"),
        )
    assert res.status_code == 404
