"""Google ID token verification for admin auth bridge (Phase E / E1).

Validates audience against ``GOOGLE_CLIENT_ID`` (Web OAuth client).
Uses Google's tokeninfo endpoint (low volume admin only; not public login scale).
"""

from __future__ import annotations

from typing import Any

import httpx

from app.application.auth.service import AuthError
from app.core.config import Settings, get_settings
from app.core.logging import get_logger

log = get_logger(__name__)

_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
_ALLOWED_ISSUERS = frozenset(
    {
        "accounts.google.com",
        "https://accounts.google.com",
    }
)


async def verify_google_id_token(
    id_token: str,
    *,
    settings: Settings | None = None,
    http_client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    """
    Verify a Google OpenID Connect ID token.

    Returns claims dict with at least: email, email_verified, sub, name (optional).
    Raises AuthError on any failure.
    """
    settings = settings or get_settings()
    client_id = (settings.google_client_id or "").strip()
    if not client_id:
        raise AuthError(
            "google_not_configured",
            "GOOGLE_CLIENT_ID is not configured on the API",
        )

    token = (id_token or "").strip()
    if not token or len(token) < 20:
        raise AuthError("invalid_token", "Missing or malformed Google ID token")

    owns_client = http_client is None
    client = http_client or httpx.AsyncClient(timeout=10.0)
    try:
        response = await client.get(_TOKENINFO_URL, params={"id_token": token})
    except httpx.HTTPError as exc:
        log.warning("google_tokeninfo_network_error", error=str(exc))
        raise AuthError("google_unreachable", "Could not verify Google token") from exc
    finally:
        if owns_client:
            await client.aclose()

    if response.status_code != 200:
        log.info("google_tokeninfo_rejected", status=response.status_code)
        raise AuthError("invalid_token", "Invalid or expired Google ID token")

    try:
        claims: dict[str, Any] = response.json()
    except Exception as exc:  # noqa: BLE001
        raise AuthError("invalid_token", "Malformed Google token response") from exc

    aud = str(claims.get("aud") or "")
    if aud != client_id:
        log.info("google_token_bad_audience")
        raise AuthError("invalid_audience", "Google token audience mismatch")

    iss = str(claims.get("iss") or "")
    if iss not in _ALLOWED_ISSUERS:
        raise AuthError("invalid_issuer", "Google token issuer mismatch")

    email = str(claims.get("email") or "").strip().lower()
    if not email:
        raise AuthError("email_required", "Google account has no email")

    verified = claims.get("email_verified")
    if verified not in (True, "true", "1", 1):
        raise AuthError("email_unverified", "Google email is not verified")

    return claims
