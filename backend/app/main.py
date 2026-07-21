"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from app import __version__
from app.api.router import build_root_probes_router, build_v1_router
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.core.security import assert_secret_configured
from app.infrastructure.db.session import close_db, init_db
from app.infrastructure.redis.client import close_redis, init_redis
from app.infrastructure.storage.factory import get_storage
from app.infrastructure.storage.local import LocalStorage
from app.infrastructure.storage.s3 import S3Storage

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings)
    assert_secret_configured(settings)

    log.info("starting_app", env=settings.app_env, version=settings.app_version)
    init_db(settings)
    await init_redis(settings)
    log.info(
        "dependencies_ready",
        media_backend="s3" if settings.s3_configured else "local",
    )

    yield

    log.info("shutting_down")
    await close_redis()
    await close_db()


def _register_media_proxy(application: FastAPI) -> None:
    """
    Public GET /media/{key} — serves product images.

    Railway S3 buckets are private; this proxy is the public surface for storefront
    ``product_images.url`` values. Local backend reads from MEDIA_LOCAL_DIR.
    """

    @application.get(
        "/media/{object_key:path}",
        include_in_schema=True,
        tags=["media"],
        response_model=None,
    )
    async def serve_media(object_key: str) -> FileResponse | StreamingResponse:
        # Basic path traversal guard
        if not object_key or ".." in object_key.split("/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key")
        # Only serve product media prefixes (uploaded by admin)
        if not object_key.startswith("products/"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

        store = get_storage()
        if isinstance(store, LocalStorage):
            path = Path(store._root) / object_key  # noqa: SLF001 — intentional
            if not path.is_file():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            # Ensure resolved path stays under root
            try:
                path.resolve().relative_to(Path(store._root).resolve())  # noqa: SLF001
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid key",
                ) from exc
            return FileResponse(path)

        if isinstance(store, S3Storage):
            try:
                body, content_type, length = store.get_object(key=object_key)
            except ClientError as exc:
                code = (exc.response or {}).get("Error", {}).get("Code", "")
                if code in {"NoSuchKey", "404", "NotFound"}:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Not found",
                    ) from exc
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Storage error",
                ) from exc

            headers: dict[str, str] = {
                "Cache-Control": "public, max-age=86400, immutable",
            }
            if length is not None:
                headers["Content-Length"] = str(length)

            # botocore StreamingBody is a sync file-like iterable
            return StreamingResponse(
                body,
                media_type=content_type or "application/octet-stream",
                headers=headers,
            )

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


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

    # Public media proxy (Phase I) — local files or S3 stream
    _register_media_proxy(application)

    return application


app = create_app()
