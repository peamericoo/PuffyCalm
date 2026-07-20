"""Auth use cases — login, refresh rotation, logout, admin seed."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.infrastructure.db.models import User, UserRole
from app.infrastructure.redis.client import get_redis

log = get_logger(__name__)

_REFRESH_KEY = "auth:refresh:{jti}"


class AuthError(Exception):
    def __init__(self, code: str, message: str = "") -> None:
        self.code = code
        self.message = message or code
        super().__init__(self.message)


@dataclass(slots=True)
class TokenPair:
    access_token: str
    refresh_token: str
    access_jti: str
    refresh_jti: str
    token_type: str = "bearer"


async def load_user(session: AsyncSession, user_id: str) -> User | None:
    return await session.get(User, user_id)


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(
        select(User).where(User.email == email.strip().lower())
    )
    return result.scalar_one_or_none()


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if user is None or not verify_password(password, user.password_hash):
        raise AuthError("invalid_credentials", "Invalid email or password")
    if not user.is_active:
        raise AuthError("inactive", "User account is inactive")
    return user


async def _store_refresh(jti: str, user_id: str, settings: Settings) -> None:
    redis = get_redis()
    ttl = settings.refresh_token_days * 24 * 60 * 60
    await redis.set(_REFRESH_KEY.format(jti=jti), user_id, ex=ttl)


async def _revoke_refresh(jti: str) -> None:
    redis = get_redis()
    await redis.delete(_REFRESH_KEY.format(jti=jti))


async def _refresh_valid(jti: str, user_id: str) -> bool:
    redis = get_redis()
    stored = await redis.get(_REFRESH_KEY.format(jti=jti))
    return stored == user_id


async def issue_tokens(user: User, *, settings: Settings | None = None) -> TokenPair:
    settings = settings or get_settings()
    access, access_jti, _ = create_token(
        subject=user.id,
        role=user.role,
        token_type="access",
        settings=settings,
    )
    refresh, refresh_jti, _ = create_token(
        subject=user.id,
        role=user.role,
        token_type="refresh",
        settings=settings,
    )
    await _store_refresh(refresh_jti, user.id, settings)
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        access_jti=access_jti,
        refresh_jti=refresh_jti,
    )


async def refresh_tokens(
    session: AsyncSession,
    refresh_token: str,
    *,
    settings: Settings | None = None,
) -> tuple[User, TokenPair]:
    settings = settings or get_settings()
    try:
        payload = decode_token(refresh_token, settings=settings)
    except Exception as exc:  # noqa: BLE001 — map all JWT errors
        raise AuthError("invalid_token", "Invalid refresh token") from exc

    if payload.get("type") != "refresh":
        raise AuthError("invalid_token", "Not a refresh token")

    user_id = str(payload.get("sub") or "")
    jti = str(payload.get("jti") or "")
    if not user_id or not jti:
        raise AuthError("invalid_token", "Malformed refresh token")

    if not await _refresh_valid(jti, user_id):
        raise AuthError("revoked", "Refresh token revoked or expired")

    user = await load_user(session, user_id)
    if user is None or not user.is_active:
        raise AuthError("inactive", "User not found or inactive")

    # Rotate: revoke old, issue new pair
    await _revoke_refresh(jti)
    pair = await issue_tokens(user, settings=settings)
    return user, pair


async def logout_refresh(refresh_token: str | None, *, settings: Settings | None = None) -> None:
    if not refresh_token:
        return
    settings = settings or get_settings()
    try:
        payload = decode_token(refresh_token, settings=settings)
        jti = str(payload.get("jti") or "")
        if jti:
            await _revoke_refresh(jti)
    except Exception:  # noqa: BLE001 — logout is best-effort
        log.info("logout_refresh_decode_failed")


async def seed_admin_users(session: AsyncSession, *, settings: Settings | None = None) -> dict[str, str]:
    """Idempotent bootstrap of admin + staff accounts from settings."""
    settings = settings or get_settings()
    created: dict[str, str] = {}

    specs = [
        (
            settings.admin_email,
            settings.admin_password,
            settings.admin_full_name,
            UserRole.admin.value,
            "user_admin",
        ),
        (
            settings.staff_email,
            settings.staff_password,
            settings.staff_full_name,
            UserRole.staff.value,
            "user_staff",
        ),
    ]

    for email, password, full_name, role, fixed_id in specs:
        email_n = email.strip().lower()
        existing = await get_user_by_email(session, email_n)
        if existing is not None:
            created[email_n] = "exists"
            continue
        user = User(
            id=fixed_id if fixed_id else f"user_{uuid.uuid4().hex[:12]}",
            email=email_n,
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=True,
        )
        # Avoid PK collision if fixed id already used with different email
        if await session.get(User, user.id) is not None:
            user.id = f"user_{uuid.uuid4().hex[:12]}"
        session.add(user)
        created[email_n] = "created"

    await session.commit()
    log.info("admin_users_seeded", **created)
    return created
