"""Admin auth endpoints — HttpOnly cookies + optional Bearer body token."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, db_session
from app.api.v1.schemas.auth import (
    AuthSessionOut,
    GoogleExchangeRequest,
    LoginRequest,
    MessageOut,
    UserOut,
)
from app.application.auth.service import (
    AuthError,
    authenticate_user,
    exchange_google_id_token,
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


def _session_out(
    user: User,
    access_token: str,
    *,
    include_token: bool,
    auth_via: str = "cookie",
) -> AuthSessionOut:
    return AuthSessionOut(
        user=_user_out(user),
        access_token=access_token if include_token else None,
        token_type="bearer",
        auth_via=auth_via,
    )


def _auth_error_http(exc: AuthError) -> HTTPException:
    """Map AuthError codes to HTTP status for login / Google exchange."""
    if exc.code in {"inactive"}:
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.message)
    if exc.code in {"not_admin"}:
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=exc.message)
    if exc.code in {"google_not_configured"}:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.message,
        )
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.message)


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
        raise _auth_error_http(exc) from exc

    set_auth_cookies(
        response,
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
    )
    return _session_out(user, pair.access_token, include_token=True)


@router.post("/google-exchange", response_model=AuthSessionOut)
async def google_exchange(
    body: GoogleExchangeRequest,
    response: Response,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AuthSessionOut:
    """
    **Phase E1** — Bridge Google OAuth (Auth.js) → FastAPI admin JWT cookies.

    Client posts a Google **ID token** (OpenID). If the verified email is in
    ``ADMIN_EMAILS`` / ``STAFF_EMAILS``, sets ``pc_access`` + ``pc_refresh``.

    Browser must call with ``credentials: "include"`` so cookies stick on the API host.
    Cross-origin (Railway web ≠ api): set ``COOKIE_SAMESITE=none`` + secure cookies.
    """
    try:
        user, pair = await exchange_google_id_token(session, body.id_token)
    except AuthError as exc:
        raise _auth_error_http(exc) from exc

    set_auth_cookies(
        response,
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
    )
    return _session_out(
        user,
        pair.access_token,
        include_token=True,
        auth_via="google-cookie",
    )


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
