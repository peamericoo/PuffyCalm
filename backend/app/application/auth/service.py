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


def _unusable_password_hash() -> str:
    """Random hash so Google-only users cannot password-login by guessing."""
    return hash_password(f"google-only:{uuid.uuid4().hex}:{uuid.uuid4().hex}")


async def get_or_create_google_admin_user(
    session: AsyncSession,
    *,
    email: str,
    full_name: str,
    role: str,
    settings: Settings | None = None,
) -> User:
    """
    Upsert an admin/staff user after a verified Google identity.

    Existing password-seeded rows keep their password_hash; role is synced
    to the allowlist result. New rows get an unusable password hash.
    """
    settings = settings or get_settings()
    email_n = email.strip().lower()
    if role not in {UserRole.admin.value, UserRole.staff.value}:
        raise AuthError("invalid_role", "Invalid admin role")

    user = await get_user_by_email(session, email_n)
    if user is not None:
        changed = False
        if user.role != role:
            user.role = role
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if full_name and full_name != user.full_name:
            user.full_name = full_name
            changed = True
        if changed:
            await session.commit()
            await session.refresh(user)
        return user

    # Prefer stable id for primary admin email (seed-compatible)
    fixed_id = "user_admin" if role == UserRole.admin.value else None
    if fixed_id and await session.get(User, fixed_id) is not None:
        fixed_id = None

    user = User(
        id=fixed_id or f"user_{uuid.uuid4().hex[:12]}",
        email=email_n,
        password_hash=_unusable_password_hash(),
        full_name=full_name or email_n.split("@")[0],
        role=role,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    log.info("google_admin_user_created", email=email_n, role=role, user_id=user.id)
    return user


async def exchange_google_id_token(
    session: AsyncSession,
    id_token: str,
    *,
    settings: Settings | None = None,
    verify_fn=None,
) -> tuple[User, TokenPair]:
    """
    Verify Google ID token → allowlist role → issue JWT cookie pair.

    ``verify_fn`` is injectable for tests (async (token, settings=) -> claims).
    """
    settings = settings or get_settings()

    if verify_fn is None:
        from app.application.auth.google import verify_google_id_token

        verify_fn = verify_google_id_token

    claims = await verify_fn(id_token, settings=settings)
    email = str(claims.get("email") or "").strip().lower()
    role = settings.role_for_google_email(email)
    if role is None:
        log.info("google_exchange_not_allowlisted", email=email)
        raise AuthError(
            "not_admin",
            "This Google account is not authorized for admin access",
        )

    name = str(claims.get("name") or claims.get("given_name") or "").strip()
    user = await get_or_create_google_admin_user(
        session,
        email=email,
        full_name=name,
        role=role,
        settings=settings,
    )
    if not user.is_active:
        raise AuthError("inactive", "User account is inactive")

    pair = await issue_tokens(user, settings=settings)
    log.info("google_exchange_ok", email=email, role=role, user_id=user.id)
    return user, pair


async def seed_admin_users(session: AsyncSession, *, settings: Settings | None = None) -> dict[str, str]:
    """Idempotent bootstrap of admin + staff accounts from settings."""
    settings = settings or get_settings()
    created: dict[str, str] = {}

    # Seed primary admin from ADMIN_EMAIL (first of ADMIN_EMAILS if set for password seed)
    primary_admin = next(iter(settings.admin_email_set), settings.admin_email)

    specs = [
        (
            primary_admin,
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
