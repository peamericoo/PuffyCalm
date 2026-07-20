"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.router import build_root_probes_router, build_v1_router
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.core.security import assert_secret_configured
from app.infrastructure.db.session import close_db, init_db
from app.infrastructure.redis.client import close_redis, init_redis

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings)
    assert_secret_configured(settings)

    log.info("starting_app", env=settings.app_env, version=settings.app_version)
    init_db(settings)
    await init_redis(settings)
    log.info("dependencies_ready")

    yield

    log.info("shutting_down")
    await close_redis()
    await close_db()


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version or __version__,
        debug=settings.app_debug,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # GET /health, GET /ready
    application.include_router(build_root_probes_router())
    # GET /api/v1/, /api/v1/health, /api/v1/ready, ...
    application.include_router(build_v1_router())

    return application


app = create_app()
