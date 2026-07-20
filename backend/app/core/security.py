"""Password hashing, JWT, and auth cookie helpers (Phase 4).

Browser admin: prefer **HttpOnly** cookies (access + refresh).
Scripts/curl: optional ``Authorization: Bearer <access>``.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import bcrypt
import jwt
from fastapi import Response

from app.core.config import Settings, get_settings
from app.core.logging import get_logger

log = get_logger(__name__)

TokenType = Literal["access", "refresh"]


def assert_secret_configured(settings: Settings) -> None:
    """Warn-level guard in development when SECRET_KEY is still the scaffold default."""
    if settings.secret_key.startswith("change-me"):
        if not settings.is_development:
            raise RuntimeError("SECRET_KEY must be set in non-development environments")
        log.warning("secret_key_is_default_dev_only")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_token(
    *,
    subject: str,
    role: str,
    token_type: TokenType,
    settings: Settings | None = None,
    extra: dict[str, Any] | None = None,
) -> tuple[str, str, datetime]:
    """Return (token, jti, expires_at)."""
    settings = settings or get_settings()
    jti = uuid.uuid4().hex
    if token_type == "access":
        delta = timedelta(minutes=settings.access_token_minutes)
    else:
        delta = timedelta(days=settings.refresh_token_days)
    exp = _now() + delta
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "jti": jti,
        "iat": int(_now().timestamp()),
        "exp": exp,
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, exp


def decode_token(token: str, *, settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or get_settings()
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.jwt_algorithm],
    )


def _cookie_kwargs(settings: Settings) -> dict:
    kwargs: dict = {
        "httponly": True,
        "secure": settings.cookies_secure,
        "samesite": settings.cookie_samesite,
    }
    if settings.cookie_domain:
        kwargs["domain"] = settings.cookie_domain
    return kwargs


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    settings: Settings | None = None,
) -> None:
    settings = settings or get_settings()
    common = _cookie_kwargs(settings)
    response.set_cookie(
        key=settings.cookie_access_name,
        value=access_token,
        max_age=settings.access_token_minutes * 60,
        path="/",
        **common,
    )
    # Refresh only needed on auth routes (login rotation / logout)
    response.set_cookie(
        key=settings.cookie_refresh_name,
        value=refresh_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        path=f"{settings.api_v1_prefix}/auth",
        **common,
    )


def clear_auth_cookies(response: Response, *, settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    common = _cookie_kwargs(settings)
    response.delete_cookie(
        key=settings.cookie_access_name,
        path="/",
        **common,
    )
    response.delete_cookie(
        key=settings.cookie_refresh_name,
        path=f"{settings.api_v1_prefix}/auth",
        **common,
    )
