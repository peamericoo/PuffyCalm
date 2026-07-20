"""Liveness and readiness probes."""

from fastapi import APIRouter, Response, status
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logging import get_logger
from app.infrastructure.db.session import ping_database
from app.infrastructure.redis.client import ping_redis

router = APIRouter(tags=["health"])
log = get_logger(__name__)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    env: str


class ReadyCheck(BaseModel):
    postgres: bool
    redis: bool


class ReadyResponse(BaseModel):
    status: str
    checks: ReadyCheck


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness — process is up (no dependency checks)."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        env=settings.app_env,
    )


@router.get(
    "/ready",
    response_model=ReadyResponse,
    responses={503: {"model": ReadyResponse}},
)
async def ready(response: Response) -> ReadyResponse:
    """Readiness — Postgres and Redis must respond."""
    postgres_ok = False
    redis_ok = False

    try:
        postgres_ok = await ping_database()
    except Exception as exc:  # noqa: BLE001 — surface as readiness failure
        log.warning("postgres_ping_failed", error=str(exc))

    try:
        redis_ok = await ping_redis()
    except Exception as exc:  # noqa: BLE001
        log.warning("redis_ping_failed", error=str(exc))

    ok = postgres_ok and redis_ok
    if not ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadyResponse(
        status="ok" if ok else "degraded",
        checks=ReadyCheck(postgres=postgres_ok, redis=redis_ok),
    )
