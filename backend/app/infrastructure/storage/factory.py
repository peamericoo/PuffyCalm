"""Resolve storage backend from settings."""

from __future__ import annotations

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.infrastructure.storage.base import StorageBackend
from app.infrastructure.storage.local import LocalStorage
from app.infrastructure.storage.s3 import S3Storage


def build_storage(settings: Settings | None = None) -> StorageBackend:
    s = settings or get_settings()
    if s.s3_configured:
        return S3Storage(s)
    return LocalStorage(s)


@lru_cache
def get_storage() -> StorageBackend:
    return build_storage()


def reset_storage_cache() -> None:
    get_storage.cache_clear()
