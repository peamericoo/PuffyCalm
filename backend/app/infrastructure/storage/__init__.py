"""Object storage backends (Phase I media)."""

from app.infrastructure.storage.base import StoredObject, StorageBackend
from app.infrastructure.storage.factory import get_storage

__all__ = ["StoredObject", "StorageBackend", "get_storage"]
