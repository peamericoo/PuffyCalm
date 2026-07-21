"""Phase L — inventory decrement idempotency + stock gate (DB required)."""

from __future__ import annotations

import os
import uuid
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.application.checkout.service import mark_order_paid, process_stripe_event
from app.infrastructure.db.models import Order, OrderItem, Product
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import get_session_factory


def _require_db() -> None:
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 for inventory webhook tests")


async def _ensure_seed() -> None:
    factory = get_session_factory()
    async with factory() as session:
        count = (
            await session.execute(select(Product).limit(1))
        ).scalar_one_or_none()
        if count is None:
            await seed_catalog(session, reset=True)


def _checkout_body(product_id: str, quantity: int = 1) -> dict:
    return {
        "email": f"inv-{uuid.uuid4().hex[:8]}@example.com",
        "lines": [{"productId": product_id, "quantity": quantity}],
        "shipping": {
            "fullName": "Alex Rivera",
            "line1": "1 Market St",
            "city": "San Francisco",
            "region": "CA",
            "postal": "94105",
            "country": "US",
        },
    }


async def _create_pending_order_with_stock(
    *,
    stock_qty: int = 10,
    quantity: int = 1,
) -> tuple[str, str, int]:
    """
    Insert a requires_payment order + product stock setup.
    Returns (order_id, product_id, stock_before).
    """
    factory = get_session_factory()
    async with factory() as session:
        product = (
            await session.execute(
                select(Product).where(Product.in_stock.is_(True)).limit(1)
            )
        ).scalar_one()
        product.stock_qty = stock_qty
        product.in_stock = stock_qty > 0
        product_id = product.id

        order_id = f"ord_inv_{uuid.uuid4().hex[:12]}"
        unit = int(Decimal(str(product.price)) * 100)
        order = Order(
            id=order_id,
            public_code=f"PC-{uuid.uuid4().hex[:8].upper()}",
            email="inv-buyer@example.com",
            status="requires_payment",
            currency="USD",
            subtotal_cents=unit * quantity,
            shipping_cents=699,
            total_cents=unit * quantity + 699,
            shipping_address={
                "fullName": "Alex Rivera",
                "line1": "1 Market St",
                "city": "San Francisco",
                "region": "CA",
                "postal": "94105",
                "country": "US",
            },
            stripe_checkout_session_id=f"cs_test_{uuid.uuid4().hex[:16]}",
            items=[
                OrderItem(
                    id=f"oli_{uuid.uuid4().hex[:12]}",
                    product_id=product.id,
                    product_slug=product.slug,
                    product_name=product.name,
                    quantity=quantity,
                    unit_price_cents=unit,
                    line_total_cents=unit * quantity,
                    image_url=product.image_url or "",
                )
            ],
        )
        session.add(order)
        await session.commit()
        return order_id, product_id, stock_qty


@pytest.mark.asyncio
async def test_double_mark_order_paid_decrements_once(client: AsyncClient) -> None:
    """Same order paid twice → stock decrements only once."""
    _require_db()
    await _ensure_seed()

    order_id, product_id, stock_before = await _create_pending_order_with_stock(
        stock_qty=10, quantity=2
    )
    factory = get_session_factory()

    async with factory() as session:
        order = (
            await session.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == order_id)
            )
        ).scalar_one()
        await mark_order_paid(session, order, payment_intent_id="pi_test_1")

    async with factory() as session:
        order = (
            await session.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == order_id)
            )
        ).scalar_one()
        assert order.status == "paid"
        await mark_order_paid(session, order, payment_intent_id="pi_test_1")

    async with factory() as session:
        product = await session.get(Product, product_id)
        assert product is not None
        assert product.stock_qty == stock_before - 2
        order = await session.get(Order, order_id)
        assert order is not None
        assert order.status == "paid"


@pytest.mark.asyncio
async def test_double_webhook_same_event_id_no_double_decrement(
    client: AsyncClient,
) -> None:
    """Identical Stripe event_id delivered twice → stripe_events + stock once."""
    _require_db()
    await _ensure_seed()

    order_id, product_id, stock_before = await _create_pending_order_with_stock(
        stock_qty=8, quantity=1
    )
    factory = get_session_factory()

    async with factory() as session:
        order = await session.get(Order, order_id)
        assert order is not None
        sid = order.stripe_checkout_session_id

    event = {
        "id": f"evt_dup_{uuid.uuid4().hex}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": sid,
                "payment_intent": "pi_webhook_1",
                "metadata": {"order_id": order_id},
            }
        },
    }

    async with factory() as session:
        r1 = await process_stripe_event(session, event)
    async with factory() as session:
        r2 = await process_stripe_event(session, event)

    assert r1["status"] == "processed"
    assert r2["status"] == "duplicate"

    async with factory() as session:
        product = await session.get(Product, product_id)
        assert product is not None
        assert product.stock_qty == stock_before - 1


@pytest.mark.asyncio
async def test_two_event_types_same_order_decrement_once(client: AsyncClient) -> None:
    """session.completed + payment_intent.succeeded → inventory once."""
    _require_db()
    await _ensure_seed()

    order_id, product_id, stock_before = await _create_pending_order_with_stock(
        stock_qty=15, quantity=3
    )
    factory = get_session_factory()

    async with factory() as session:
        order = await session.get(Order, order_id)
        assert order is not None
        sid = order.stripe_checkout_session_id
        order.stripe_payment_intent_id = "pi_dual_event"
        await session.commit()

    evt_session = {
        "id": f"evt_cs_{uuid.uuid4().hex}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": sid,
                "payment_intent": "pi_dual_event",
                "metadata": {"order_id": order_id},
            }
        },
    }
    evt_pi = {
        "id": f"evt_pi_{uuid.uuid4().hex}",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_dual_event",
                "metadata": {"order_id": order_id},
            }
        },
    }

    async with factory() as session:
        await process_stripe_event(session, evt_session)
    async with factory() as session:
        await process_stripe_event(session, evt_pi)

    async with factory() as session:
        product = await session.get(Product, product_id)
        assert product is not None
        assert product.stock_qty == stock_before - 3
        order = await session.get(Order, order_id)
        assert order is not None
        assert order.status == "paid"


def _mock_stripe_settings() -> MagicMock:
    return MagicMock(
        stripe_configured=True,
        stripe_secret_key="sk_test_mock",
        stripe_api_version="",
        storefront_url="http://localhost:3000",
        free_shipping_threshold_cents=7500,
        flat_shipping_cents=699,
    )


@pytest.mark.asyncio
async def test_checkout_blocks_stock_qty_zero(
    client: AsyncClient,
) -> None:
    """Create checkout session fails with 409 when stock_qty is 0."""
    _require_db()
    await _ensure_seed()

    factory = get_session_factory()
    product_id: str | None = None
    try:
        async with factory() as session:
            product = (
                await session.execute(
                    select(Product).where(Product.status == "published").limit(1)
                )
            ).scalar_one()
            product.stock_qty = 0
            product.in_stock = True  # stale flag — still must block
            product_id = product.id
            await session.commit()

        settings = _mock_stripe_settings()
        # API injects settings from get_settings(); patch both layers.
        with (
            patch("app.api.v1.checkout.get_settings", return_value=settings),
            patch("app.application.checkout.service.get_settings", return_value=settings),
            patch("stripe.checkout.Session.create") as create_mock,
        ):
            res = await client.post(
                "/api/v1/checkout/sessions",
                json=_checkout_body(product_id),
            )
            create_mock.assert_not_called()

        assert res.status_code == 409, res.text
        detail = res.json().get("detail") or {}
        assert detail.get("code") == "out_of_stock"
    finally:
        if product_id:
            async with factory() as session:
                product = await session.get(Product, product_id)
                if product is not None:
                    product.stock_qty = 100
                    product.in_stock = True
                    await session.commit()


@pytest.mark.asyncio
async def test_checkout_blocks_in_stock_false(
    client: AsyncClient,
) -> None:
    _require_db()
    await _ensure_seed()

    factory = get_session_factory()
    product_id: str | None = None
    try:
        async with factory() as session:
            product = (
                await session.execute(
                    select(Product).where(Product.status == "published").limit(1)
                )
            ).scalar_one()
            product.in_stock = False
            product.stock_qty = 50
            product_id = product.id
            await session.commit()

        settings = _mock_stripe_settings()
        with (
            patch("app.api.v1.checkout.get_settings", return_value=settings),
            patch("app.application.checkout.service.get_settings", return_value=settings),
            patch("stripe.checkout.Session.create") as create_mock,
        ):
            res = await client.post(
                "/api/v1/checkout/sessions",
                json=_checkout_body(product_id),
            )
            create_mock.assert_not_called()

        assert res.status_code == 409, res.text
        assert (res.json().get("detail") or {}).get("code") == "out_of_stock"
    finally:
        if product_id:
            async with factory() as session:
                product = await session.get(Product, product_id)
                if product is not None:
                    product.stock_qty = 100
                    product.in_stock = True
                    await session.commit()


@pytest.mark.asyncio
async def test_paid_to_zero_sets_in_stock_false(client: AsyncClient) -> None:
    _require_db()
    await _ensure_seed()

    order_id, product_id, _ = await _create_pending_order_with_stock(
        stock_qty=1, quantity=1
    )
    factory = get_session_factory()

    async with factory() as session:
        order = (
            await session.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == order_id)
            )
        ).scalar_one()
        await mark_order_paid(session, order, payment_intent_id="pi_last_unit")

    async with factory() as session:
        product = await session.get(Product, product_id)
        assert product is not None
        assert product.stock_qty == 0
        assert product.in_stock is False
