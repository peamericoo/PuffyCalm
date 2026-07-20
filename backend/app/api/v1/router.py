"""API v1 route aggregation."""

from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    catalog,
    checkout,
    health,
    orders,
    products,
    reviews,
    search,
    webhooks,
)
from app.core.config import get_settings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(catalog.router)
api_router.include_router(products.router)
api_router.include_router(reviews.router)
api_router.include_router(search.router)
api_router.include_router(checkout.router)
api_router.include_router(orders.router)
api_router.include_router(webhooks.router)


@api_router.get("/", tags=["meta"])
async def api_root() -> dict[str, str]:
    settings = get_settings()
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "prefix": settings.api_v1_prefix,
        "docs": "/docs",
    }
