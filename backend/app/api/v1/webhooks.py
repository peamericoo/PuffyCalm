"""Stripe webhooks — raw body + signature verification."""

from __future__ import annotations

import json
from typing import Annotated, Any

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.application.checkout.service import CheckoutError, process_stripe_event
from app.core.config import get_settings
from app.core.logging import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _event_to_dict(event: Any) -> dict[str, Any]:
    if isinstance(event, dict):
        return event
    if hasattr(event, "to_dict"):
        return event.to_dict()  # type: ignore[no-any-return]
    return dict(event)


def _peek_event_meta(payload: bytes) -> dict[str, str]:
    """Best-effort event id/type from raw body (no card fields). For failure logs."""
    try:
        raw = json.loads(payload.decode("utf-8"))
        if not isinstance(raw, dict):
            return {}
        return {
            "event_id": str(raw.get("id") or ""),
            "event_type": str(raw.get("type") or ""),
        }
    except (UnicodeDecodeError, json.JSONDecodeError, TypeError):
        return {}


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> dict[str, Any]:
    """
    Stripe event endpoint.

    Configure:
    ``stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe``
    """
    settings = get_settings()
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    peek = _peek_event_meta(payload)

    if settings.stripe_webhook_secret.strip():
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig,
                settings.stripe_webhook_secret,
            )
            event_dict = _event_to_dict(event)
        except ValueError as exc:
            log.warning("stripe_webhook_invalid_payload", **peek)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload",
            ) from exc
        except stripe.SignatureVerificationError as exc:
            log.warning("stripe_webhook_invalid_signature", **peek)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature",
            ) from exc
    else:
        if not settings.is_development:
            log.error("stripe_webhook_secret_missing")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Webhook secret not configured",
            )
        log.warning("stripe_webhook_unsigned_dev_mode", **peek)
        try:
            event_dict = json.loads(payload.decode("utf-8"))
            if not isinstance(event_dict, dict):
                raise ValueError("event must be object")
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            log.warning("stripe_webhook_invalid_payload", **peek)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload",
            ) from exc

    event_id = str(event_dict.get("id") or peek.get("event_id") or "")
    event_type = str(event_dict.get("type") or peek.get("event_type") or "")
    log.info(
        "stripe_webhook_received",
        event_id=event_id,
        event_type=event_type,
    )

    try:
        result = await process_stripe_event(session, event_dict)
    except CheckoutError as exc:
        log.exception(
            "webhook_process_failed",
            event_id=event_id,
            event_type=event_type,
            code=exc.code,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        ) from exc
    except Exception:
        # Unexpected 5xx path — always include event id for Railway log search
        log.exception(
            "webhook_process_error",
            event_id=event_id,
            event_type=event_type,
        )
        raise

    # Structured success (includes order_id when resolved by service)
    log.info(
        "stripe_webhook_ok",
        event_id=result.get("eventId") or event_id,
        event_type=result.get("type") or event_type,
        status=result.get("status"),
        order_id=result.get("orderId") or "",
        public_code=result.get("publicCode") or "",
    )
    return result
