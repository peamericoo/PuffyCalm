"""Stripe SDK wrappers — secret key never leaves the API."""

from app.infrastructure.stripe.client import get_stripe_client

__all__ = ["get_stripe_client"]
