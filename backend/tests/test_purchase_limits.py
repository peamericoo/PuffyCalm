"""Unit tests for product sellable rules and quantity limits (no DB)."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.application.checkout.purchase_limits import (
    PurchaseLimitError,
    assert_product_sellable,
    assert_quantity_allowed,
)


def _product(**kwargs: object) -> SimpleNamespace:
    base = {
        "id": "prod_x",
        "name": "Test Product",
        "status": "published",
        "in_stock": True,
        "stock_qty": 50,
        "max_quantity_per_order": 1,
        "purchase_limit_per_customer": 1,
    }
    base.update(kwargs)
    return SimpleNamespace(**base)


def test_sellable_published_in_stock() -> None:
    assert_product_sellable(_product())  # type: ignore[arg-type]


def test_draft_not_sellable() -> None:
    with pytest.raises(PurchaseLimitError) as ei:
        assert_product_sellable(_product(status="draft"))  # type: ignore[arg-type]
    assert ei.value.code == "product_not_available"


def test_archived_not_sellable() -> None:
    with pytest.raises(PurchaseLimitError) as ei:
        assert_product_sellable(_product(status="archived"))  # type: ignore[arg-type]
    assert ei.value.code == "product_not_available"


def test_out_of_stock() -> None:
    with pytest.raises(PurchaseLimitError) as ei:
        assert_product_sellable(_product(in_stock=False))  # type: ignore[arg-type]
    assert ei.value.code == "out_of_stock"


def test_stock_qty_zero_blocks_sellable() -> None:
    """Phase L: qty 0 never sells even if in_stock left stale True."""
    with pytest.raises(PurchaseLimitError) as ei:
        assert_product_sellable(_product(in_stock=True, stock_qty=0))  # type: ignore[arg-type]
    assert ei.value.code == "out_of_stock"


def test_max_quantity_one() -> None:
    p = _product(max_quantity_per_order=1, stock_qty=50)
    assert_quantity_allowed(p, 1)  # type: ignore[arg-type]
    with pytest.raises(PurchaseLimitError) as ei:
        assert_quantity_allowed(p, 2)  # type: ignore[arg-type]
    assert ei.value.code == "max_quantity_exceeded"


def test_max_quantity_default_style() -> None:
    p = _product(max_quantity_per_order=9, stock_qty=50)
    assert_quantity_allowed(p, 9)  # type: ignore[arg-type]
    with pytest.raises(PurchaseLimitError):
        assert_quantity_allowed(p, 10)  # type: ignore[arg-type]


def test_quantity_exceeds_stock_qty() -> None:
    p = _product(max_quantity_per_order=9, stock_qty=2)
    assert_quantity_allowed(p, 2)  # type: ignore[arg-type]
    with pytest.raises(PurchaseLimitError) as ei:
        assert_quantity_allowed(p, 3)  # type: ignore[arg-type]
    assert ei.value.code == "insufficient_stock"
