"""Upload / delete product media; optional associate to product_images."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.media.validation import MediaValidationError, validate_image_upload
from app.core.config import Settings, get_settings
from app.infrastructure.db.models import Product, ProductImage
from app.infrastructure.storage.base import StorageBackend
from app.infrastructure.storage.factory import get_storage


class MediaNotFoundError(Exception):
    def __init__(
        self,
        message: str = "Product not found",
        *,
        code: str = "not_found",
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class MediaServiceError(Exception):
    def __init__(self, message: str, *, code: str = "media_error") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass(frozen=True, slots=True)
class MediaUploadResult:
    key: str
    url: str
    content_type: str
    size_bytes: int
    product_id: str | None
    sort_order: int | None
    set_cover: bool


def _object_key(*, product_id: str | None, extension: str) -> str:
    day = datetime.now(UTC).strftime("%Y/%m/%d")
    uid = uuid.uuid4().hex
    folder = product_id.strip() if product_id and product_id.strip() else "orphan"
    safe_folder = "".join(c if c.isalnum() or c in "-_" else "_" for c in folder)[:64]
    return f"products/{safe_folder}/{day}/{uid}.{extension}"


def _public_url_for_key(store: StorageBackend, key: str) -> str | None:
    base = getattr(store, "_public_base", None)
    if isinstance(base, str) and base.strip():
        return f"{base.rstrip('/')}/{key.lstrip('/')}"
    return None


async def upload_media(
    session: AsyncSession,
    *,
    data: bytes,
    declared_content_type: str | None,
    product_id: str | None = None,
    set_cover: bool = False,
    storage: StorageBackend | None = None,
    settings: Settings | None = None,
) -> MediaUploadResult:
    """
    Validate + store image. If product_id given, append product_images row
    and optionally set products.image_url as cover.
    """
    s = settings or get_settings()
    store = storage or get_storage()

    validated = validate_image_upload(
        data,
        declared_content_type=declared_content_type,
        max_bytes=s.media_max_bytes,
    )

    pid: str | None = None
    product: Product | None = None
    if product_id and product_id.strip():
        pid = product_id.strip()
        result = await session.execute(
            select(Product)
            .where(Product.id == pid)
            .options(selectinload(Product.images))
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise MediaNotFoundError(
                f"Product {pid} not found",
                code="product_not_found",
            )

    key = _object_key(product_id=pid, extension=validated.extension)
    try:
        stored = store.put(
            key=key,
            data=validated.data,
            content_type=validated.content_type,
        )
    except Exception as exc:  # noqa: BLE001
        raise MediaServiceError(
            f"Storage upload failed: {exc.__class__.__name__}",
            code="storage_error",
        ) from exc

    sort_order: int | None = None
    cover = False
    if product is not None:
        existing = list(product.images or [])
        next_order = (
            (max((i.sort_order for i in existing), default=-1) + 1) if existing else 0
        )
        product.images.append(ProductImage(url=stored.url, sort_order=next_order))
        sort_order = next_order
        if set_cover or not (product.image_url or "").strip():
            product.image_url = stored.url
            cover = True
        await session.commit()

    return MediaUploadResult(
        key=stored.key,
        url=stored.url,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        product_id=pid,
        sort_order=sort_order,
        set_cover=cover,
    )


async def delete_media(
    session: AsyncSession,
    *,
    key: str | None = None,
    url: str | None = None,
    storage: StorageBackend | None = None,
) -> dict[str, object]:
    """
    Delete object from storage when we own it, and detach matching product_images.

    Orphan policy (MVP):
    - Prefer delete by key (authoritative).
    - If only URL given, resolve key via storage.key_from_url.
    - Remove product_images rows matching URL; if cover matches, fall back to first gallery.
    - External URLs (Unsplash): storage delete skipped; DB rows still removed if URL matches.
    """
    store = storage or get_storage()
    resolved_key = (key or "").strip() or None
    resolved_url = (url or "").strip() or None

    if not resolved_key and not resolved_url:
        raise MediaValidationError("Provide key or url", code="missing_target")

    if not resolved_key and resolved_url:
        resolved_key = store.key_from_url(resolved_url)

    if not resolved_url and resolved_key:
        resolved_url = _public_url_for_key(store, resolved_key)

    storage_deleted = False
    if resolved_key:
        try:
            store.delete(key=resolved_key)
            storage_deleted = True
        except Exception as exc:  # noqa: BLE001
            raise MediaServiceError(
                f"Storage delete failed: {exc.__class__.__name__}",
                code="storage_error",
            ) from exc

    urls_to_clear: set[str] = set()
    if resolved_url:
        urls_to_clear.add(resolved_url)
    if resolved_key:
        built = _public_url_for_key(store, resolved_key)
        if built:
            urls_to_clear.add(built)

    images_removed = 0
    products_touched = 0
    if urls_to_clear:
        result = await session.execute(
            select(ProductImage).where(ProductImage.url.in_(list(urls_to_clear)))
        )
        rows = list(result.scalars().all())
        product_ids = {r.product_id for r in rows}
        for row in rows:
            await session.delete(row)
            images_removed += 1

        if product_ids:
            prod_result = await session.execute(
                select(Product)
                .where(Product.id.in_(product_ids))
                .options(selectinload(Product.images))
            )
            for product in prod_result.scalars().all():
                products_touched += 1
                await session.refresh(product, attribute_names=["images"])
                cover = (product.image_url or "").strip()
                if cover in urls_to_clear:
                    remaining = sorted(
                        [
                            i
                            for i in (product.images or [])
                            if (i.url or "").strip() not in urls_to_clear
                        ],
                        key=lambda x: x.sort_order,
                    )
                    product.image_url = remaining[0].url if remaining else ""
        await session.commit()

    return {
        "deleted": True,
        "key": resolved_key,
        "url": resolved_url,
        "storageDeleted": storage_deleted,
        "imagesRemoved": images_removed,
        "productsTouched": products_touched,
    }


def delete_owned_urls(
    *,
    urls: list[str],
    storage: StorageBackend | None = None,
) -> int:
    """
    Best-effort delete of storage objects for URLs we own.
    Used when product gallery is replaced (orphan cleanup).
    """
    store = storage or get_storage()
    deleted = 0
    for url in urls:
        key = store.key_from_url(url)
        if not key:
            continue
        try:
            store.delete(key=key)
            deleted += 1
        except Exception:
            continue
    return deleted
