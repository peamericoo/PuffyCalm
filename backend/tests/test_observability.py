"""Phase O — structured log helpers + webhook result fields (order_id trace)."""

from __future__ import annotations

import os
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.application.checkout.service import process_stripe_event
from app.api.v1.webhooks import _peek_event_meta
from app.core.logging import email_domain, redact_email
from app.infrastructure.db.models import Order, OrderItem, Product, StripeEvent
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def test_email_domain_safe() -> None:
    assert email_domain("Buyer.Name@Example.COM") == "example.com"
    assert email_domain("no-at") == ""
    assert email_domain(None) == ""
    assert email_domain("") == ""


def test_redact_email() -> None:
    assert redact_email("alice@puffycalm.com") == "a***@puffycalm.com"
    assert redact_email("x@y.z") == "x***@y.z"
    assert redact_email("") == ""
    assert "@" in redact_email("ab@cd.com")
    assert "ab@" not in redact_email("ab@cd.com")


def test_peek_event_meta_no_pii() -> None:
    raw = b'{"id":"evt_abc","type":"payment_intent.payment_failed","data":{"object":{"metadata":{"order_id":"ord_x"}}}}'
    meta = _peek_event_meta(raw)
    assert meta["event_id"] == "evt_abc"
    assert meta["event_type"] == "payment_intent.payment_failed"
    assert "email" not in meta
    assert "card" not in str(meta).lower()


def test_peek_event_meta_invalid() -> None:
    assert _peek_event_meta(b"not-json") == {}


@pytest.mark.asyncio
async def test_process_payment_failed_order_id_without_db() -> None:
    """
    Simulated payment failure returns orderId for log grep — no Postgres required.
    Validates the Phase O DoD path: falha rastreável por order_id.
    """
    order = MagicMock(spec=Order)
    order.id = "ord_fail_sim_001"
    order.public_code = "PC-FAILTEST"
    order.status = "requires_payment"

    session = AsyncMock()
    session.get = AsyncMock(side_effect=lambda model, key: None if model is StripeEvent else None)
    # First get StripeEvent → None; order resolved via helper patch

    with patch(
        "app.application.checkout.service._resolve_order_from_session",
        new=AsyncMock(return_value=None),
    ), patch(
        "app.application.checkout.service._resolve_order_from_payment_intent",
        new=AsyncMock(return_value=order),
    ):
        # session.get(StripeEvent) → None; session.add / commit succeed
        async def _get(model, key):  # type: ignore[no-untyped-def]
            return None

        session.get = AsyncMock(side_effect=_get)
        session.add = MagicMock()
        session.commit = AsyncMock()

        result = await process_stripe_event(
            session,
            {
                "id": "evt_sim_fail_1",
                "type": "payment_intent.payment_failed",
                "data": {
                    "object": {
                        "id": "pi_sim",
                        "metadata": {"order_id": "ord_fail_sim_001"},
                    }
                },
            },
        )

    assert result["status"] == "processed"
    assert result["eventId"] == "evt_sim_fail_1"
    assert result["orderId"] == "ord_fail_sim_001"
    assert result["publicCode"] == "PC-FAILTEST"
    assert order.status == "failed"
    session.add.assert_called()  # StripeEvent recorded


def _require_db() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 for webhook observability tests")


async def _ensure_seed() -> None:
    factory = get_session_factory()
    async with factory() as session:
        count = (
            await session.execute(select(Product).limit(1))
        ).scalar_one_or_none()
        if count is None:
            await seed_catalog(session, reset=True)


async def _create_pending_order() -> tuple[str, str, str]:
    """Returns (order_id, public_code, stripe_session_id)."""
    factory = get_session_factory()
    async with factory() as session:
        product = (
            await session.execute(
                select(Product).where(Product.in_stock.is_(True)).limit(1)
            )
        ).scalar_one()
        order_id = f"ord_obs_{uuid.uuid4().hex[:12]}"
        public_code = f"PC-{uuid.uuid4().hex[:8].upper()}"
        sid = f"cs_test_{uuid.uuid4().hex[:16]}"
        unit = int(Decimal(str(product.price)) * 100)
        order = Order(
            id=order_id,
            public_code=public_code,
            email="obs-buyer@example.com",
            status="requires_payment",
            currency="USD",
            subtotal_cents=unit,
            shipping_cents=699,
            total_cents=unit + 699,
            shipping_address={
                "fullName": "Obs Buyer",
                "line1": "1 Market St",
                "city": "San Francisco",
                "region": "CA",
                "postal": "94105",
                "country": "US",
            },
            stripe_checkout_session_id=sid,
            items=[
                OrderItem(
                    id=f"oli_{uuid.uuid4().hex[:12]}",
                    product_id=product.id,
                    product_slug=product.slug,
                    product_name=product.name,
                    quantity=1,
                    unit_price_cents=unit,
                    line_total_cents=unit,
                    image_url=product.image_url or "",
                )
            ],
        )
        session.add(order)
        await session.commit()
        return order_id, public_code, sid


@pytest.mark.asyncio
async def test_process_event_paid_returns_order_id(client: AsyncClient) -> None:
    """Payment success path includes orderId for log grep / Railway search."""
    _require_db()
    await _ensure_seed()
    order_id, public_code, sid = await _create_pending_order()
    factory = get_session_factory()

    event = {
        "id": f"evt_obs_paid_{uuid.uuid4().hex}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": sid,
                "payment_intent": f"pi_obs_{uuid.uuid4().hex[:8]}",
                "metadata": {"order_id": order_id},
            }
        },
    }

    async with factory() as session:
        result = await process_stripe_event(session, event)

    assert result["status"] == "processed"
    assert result["eventId"] == event["id"]
    assert result["type"] == "checkout.session.completed"
    assert result["orderId"] == order_id
    assert result["publicCode"] == public_code

    async with factory() as session:
        order = await session.get(Order, order_id)
        assert order is not None
        assert order.status == "paid"


@pytest.mark.asyncio
async def test_process_event_payment_failed_returns_order_id(
    client: AsyncClient,
) -> None:
    """Simulated payment failure is traceable by order_id in handler result."""
    _require_db()
    await _ensure_seed()
    order_id, public_code, sid = await _create_pending_order()
    factory = get_session_factory()

    event = {
        "id": f"evt_obs_fail_{uuid.uuid4().hex}",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": f"pi_fail_{uuid.uuid4().hex[:8]}",
                "metadata": {"order_id": order_id},
            }
        },
    }

    async with factory() as session:
        result = await process_stripe_event(session, event)

    assert result["status"] == "processed"
    assert result["orderId"] == order_id
    assert result["publicCode"] == public_code
    assert result["eventId"] == event["id"]

    async with factory() as session:
        order = await session.get(Order, order_id)
        assert order is not None
        assert order.status == "failed"


@pytest.mark.asyncio
async def test_process_event_duplicate_stable_keys(client: AsyncClient) -> None:
    _require_db()
    await _ensure_seed()
    order_id, _public_code, sid = await _create_pending_order()
    factory = get_session_factory()
    event = {
        "id": f"evt_obs_dup_{uuid.uuid4().hex}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": sid,
                "payment_intent": "pi_dup",
                "metadata": {"order_id": order_id},
            }
        },
    }
    async with factory() as session:
        r1 = await process_stripe_event(session, event)
    async with factory() as session:
        r2 = await process_stripe_event(session, event)

    assert r1["status"] == "processed"
    assert r1["orderId"] == order_id
    assert r2["status"] == "duplicate"
    assert "orderId" in r2
    assert "publicCode" in r2
    assert "eventId" in r2


@pytest.mark.asyncio
async def test_webhook_http_dev_unsigned_returns_order_id(
    client: AsyncClient,
) -> None:
    """POST /webhooks/stripe (dev unsigned) surfaces orderId in JSON body."""
    _require_db()
    await _ensure_seed()
    order_id, public_code, sid = await _create_pending_order()

    event = {
        "id": f"evt_http_{uuid.uuid4().hex}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": sid,
                "payment_intent": f"pi_http_{uuid.uuid4().hex[:8]}",
                "metadata": {"order_id": order_id},
            }
        },
    }

    # Force unsigned-dev path (secret empty + development)
    mock_settings = MagicMock()
    mock_settings.stripe_webhook_secret = ""
    mock_settings.is_development = True

    with patch("app.api.v1.webhooks.get_settings", return_value=mock_settings):
        res = await client.post("/api/v1/webhooks/stripe", json=event)

    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "processed"
    assert body["orderId"] == order_id
    assert body["publicCode"] == public_code
    assert body["eventId"] == event["id"]


@pytest.mark.asyncio
async def test_checkout_create_failed_unknown_product_logs_path(
    client: AsyncClient,
) -> None:
    """Checkout rejection still returns structured detail.code (traceable)."""
    _require_db()
    await _ensure_seed()
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
            json={
                "email": "trace@example.com",
                "lines": [{"productId": "prod_does_not_exist_obs", "quantity": 1}],
                "shipping": {
                    "fullName": "Trace",
                    "line1": "1 St",
                    "city": "SF",
                    "region": "CA",
                    "postal": "94105",
                    "country": "US",
                },
            },
        )
    assert res.status_code == 404
    detail = res.json().get("detail") or {}
    assert detail.get("code") == "product_not_found"
