"""Stripe client configuration."""

from __future__ import annotations

import stripe

from app.core.config import Settings, get_settings


def configure_stripe(settings: Settings | None = None) -> None:
    """Apply secret key (and optional API version) to the stripe module."""
    settings = settings or get_settings()
    key = settings.stripe_secret_key.strip()
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    stripe.api_key = key
    if settings.stripe_api_version:
        stripe.api_version = settings.stripe_api_version


def get_stripe_client(settings: Settings | None = None) -> type[stripe]:
    """Configure stripe and return the module for convenience."""
    configure_stripe(settings)
    return stripe
