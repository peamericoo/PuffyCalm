"""Unit tests for shipping math (no DB / Stripe)."""

from app.application.checkout.service import compute_shipping_cents
from app.core.config import Settings


def test_free_shipping_at_threshold() -> None:
    s = Settings(
        free_shipping_threshold_cents=7500,
        flat_shipping_cents=699,
    )
    assert compute_shipping_cents(7500, s) == 0
    assert compute_shipping_cents(7499, s) == 699
    assert compute_shipping_cents(0, s) == 0
    assert compute_shipping_cents(10000, s) == 0
