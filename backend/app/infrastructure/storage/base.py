"""Storage protocol + shared types for media uploads."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class StoredObject:
    """Result of a successful put."""

    key: str
    url: str
    content_type: str
    size_bytes: int


class StorageBackend(Protocol):
    """Minimal object storage surface used by media service."""

    def put(
        self,
        *,
        key: str,
        data: bytes,
        content_type: str,
    ) -> StoredObject: ...

    def delete(self, *, key: str) -> None: ...

    def owns_url(self, url: str) -> bool:
        """True if URL points at an object managed by this backend."""
        ...

    def key_from_url(self, url: str) -> str | None:
        """Extract object key from a public URL, or None if not ours."""
        ...
