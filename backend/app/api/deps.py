"""FastAPI dependency injection helpers."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth.service import load_user
from app.core.config import get_settings
from app.core.security import decode_token
from app.infrastructure.db.models import User
from app.infrastructure.db.session import get_db_session
from app.infrastructure.redis.client import get_redis

_bearer = HTTPBearer(auto_error=False)


async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


def redis_client():
    return get_redis()


def _extract_access_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> str | None:
    """Prefer Bearer for scripts; fall back to HttpOnly cookie (browser admin)."""
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        return credentials.credentials
    settings = get_settings()
    return request.cookies.get(settings.cookie_access_name)


async def get_current_user(
    request: Request,
    session: Annotated[AsyncSession, Depends(db_session)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
) -> User:
    settings = get_settings()
    token = _extract_access_token(request, credentials)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token, settings=settings)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    user_id = str(payload.get("sub") or "")
    user = await load_user(session, user_id) if user_id else None
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive or not found",
        )
    return user


def require_roles(*roles: str) -> Callable[..., User]:
    """Dependency factory: current user must have one of the given roles."""

    allowed = frozenset(roles)

    async def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(sorted(allowed))}",
            )
        return user

    return _dep


# Common role guards
RequireAdmin = Annotated[User, Depends(require_roles("admin"))]
RequireStaff = Annotated[User, Depends(require_roles("admin", "staff"))]
CurrentUser = Annotated[User, Depends(get_current_user)]
