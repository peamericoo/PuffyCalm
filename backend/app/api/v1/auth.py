"""Admin auth endpoints — HttpOnly cookies + optional Bearer body token."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, db_session
from app.api.v1.schemas.auth import AuthSessionOut, LoginRequest, MessageOut, UserOut
from app.application.auth.service import (
    AuthError,
    authenticate_user,
    issue_tokens,
    logout_refresh,
    refresh_tokens,
)
from app.core.config import get_settings
from app.core.security import clear_auth_cookies, set_auth_cookies
from app.infrastructure.db.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )


def _session_out(user: User, access_token: str, *, include_token: bool) -> AuthSessionOut:
    return AuthSessionOut(
        user=_user_out(user),
        access_token=access_token if include_token else None,
        token_type="bearer",
        auth_via="cookie",
    )


@router.post("/login", response_model=AuthSessionOut)
async def login(
    body: LoginRequest,
    response: Response,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AuthSessionOut:
    """
    Authenticate admin/staff.

    Sets **HttpOnly** cookies ``pc_access`` + ``pc_refresh`` (preferred for browser).
    Also returns ``accessToken`` in JSON for curl / non-browser clients.
    """
    try:
        user = await authenticate_user(session, body.email, body.password)
        pair = await issue_tokens(user)
    except AuthError as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if exc.code == "inactive"
            else status.HTTP_401_UNAUTHORIZED
        )
        raise HTTPException(status_code=code, detail=exc.message) from exc

    set_auth_cookies(
        response,
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
    )
    return _session_out(user, pair.access_token, include_token=True)


@router.post("/refresh", response_model=AuthSessionOut)
async def refresh(
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AuthSessionOut:
    """Rotate tokens using the HttpOnly refresh cookie (or body not used — cookie only)."""
    settings = get_settings()
    refresh_token = request.cookies.get(settings.cookie_refresh_name)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh cookie",
        )
    try:
        user, pair = await refresh_tokens(session, refresh_token)
    except AuthError as exc:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
        ) from exc

    set_auth_cookies(
        response,
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
    )
    return _session_out(user, pair.access_token, include_token=True)


@router.post("/logout", response_model=MessageOut)
async def logout(request: Request, response: Response) -> MessageOut:
    """Revoke refresh jti in Redis and clear cookies."""
    settings = get_settings()
    refresh_token = request.cookies.get(settings.cookie_refresh_name)
    await logout_refresh(refresh_token)
    clear_auth_cookies(response)
    return MessageOut(status="ok", detail="Logged out")


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> UserOut:
    """Current authenticated user (cookie or Bearer)."""
    return _user_out(user)
