"""Top-level API router helpers."""

from fastapi import APIRouter

from app.api.v1 import health
from app.api.v1.router import api_router as v1_api_router
from app.core.config import get_settings


def build_root_probes_router() -> APIRouter:
    """Liveness/readiness at service root (for Docker/K8s + gateway)."""
    router = APIRouter()
    router.include_router(health.router)
    return router


def build_v1_router() -> APIRouter:
    settings = get_settings()
    router = APIRouter(prefix=settings.api_v1_prefix)
    router.include_router(v1_api_router)
    return router
