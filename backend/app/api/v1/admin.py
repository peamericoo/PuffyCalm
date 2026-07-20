"""Admin-gated routes (RBAC smoke). Full admin UI is Phase 8."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import RequireAdmin, RequireStaff
from app.api.v1.schemas.auth import AdminPingOut
from app.infrastructure.db.models import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping", response_model=AdminPingOut)
async def admin_ping(user: RequireStaff) -> AdminPingOut:
    """Any staff or admin — proves auth + RBAC wiring."""
    return AdminPingOut(
        status="ok",
        user_id=user.id,
        role=user.role,
        message="admin area reachable",
    )


@router.get("/only-admin", response_model=AdminPingOut)
async def only_admin(user: RequireAdmin) -> AdminPingOut:
    """Admin-only probe (staff → 403)."""
    return AdminPingOut(
        status="ok",
        user_id=user.id,
        role=user.role,
        message="admin-only endpoint",
    )
