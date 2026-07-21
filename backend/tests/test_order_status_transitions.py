"""Unit tests — admin order status state machine (no DB)."""

from __future__ import annotations

import pytest

from app.domain.order_rules import (
    ADMIN_TRANSITIONS,
    IllegalOrderTransition,
    allowed_admin_targets,
    assert_admin_status_transition,
)
from app.domain.product_rules import OrderStatus


def test_same_status_is_noop() -> None:
    for s in OrderStatus:
        assert_admin_status_transition(s.value, s.value)


def test_paid_to_processing_allowed() -> None:
    assert_admin_status_transition("paid", "processing")


def test_paid_to_cancelled_allowed() -> None:
    """Manual cancel/refund path — admin may cancel a paid order."""
    assert_admin_status_transition("paid", "cancelled")


def test_paid_to_shipped_illegal() -> None:
    """Cannot skip processing."""
    with pytest.raises(IllegalOrderTransition) as ei:
        assert_admin_status_transition("paid", "shipped")
    assert ei.value.code == "illegal_status_transition"
    assert ei.value.from_status == "paid"
    assert ei.value.to_status == "shipped"


def test_paid_to_delivered_illegal() -> None:
    with pytest.raises(IllegalOrderTransition):
        assert_admin_status_transition("paid", "delivered")


def test_processing_to_shipped_allowed() -> None:
    assert_admin_status_transition("processing", "shipped")


def test_shipped_to_delivered_allowed() -> None:
    assert_admin_status_transition("shipped", "delivered")


def test_delivered_is_terminal() -> None:
    for target in ("shipped", "processing", "paid", "cancelled"):
        with pytest.raises(IllegalOrderTransition):
            assert_admin_status_transition("delivered", target)


def test_cancelled_is_terminal() -> None:
    for target in ("paid", "processing", "pending"):
        with pytest.raises(IllegalOrderTransition):
            assert_admin_status_transition("cancelled", target)


def test_admin_cannot_mark_paid() -> None:
    """Payment promotion is webhook-only."""
    for src in ("pending", "requires_payment", "failed"):
        with pytest.raises(IllegalOrderTransition):
            assert_admin_status_transition(src, "paid")


def test_unpaid_cancel_allowed() -> None:
    assert_admin_status_transition("pending", "cancelled")
    assert_admin_status_transition("requires_payment", "cancelled")
    assert_admin_status_transition("failed", "cancelled")


def test_unknown_target_status() -> None:
    with pytest.raises(IllegalOrderTransition) as ei:
        assert_admin_status_transition("paid", "refunded")
    assert ei.value.code == "invalid_status"


def test_allowed_admin_targets_map() -> None:
    assert OrderStatus.processing.value in allowed_admin_targets("paid")
    assert OrderStatus.shipped.value not in allowed_admin_targets("paid")
    assert allowed_admin_targets("delivered") == frozenset()
    # Every known status has an entry
    for s in OrderStatus:
        assert s.value in ADMIN_TRANSITIONS
