"""Local filesystem storage for dev/test when S3 is not configured."""

from __future__ import annotations

from pathlib import Path

from app.core.config import Settings
from app.infrastructure.storage.base import StoredObject


class LocalStorage:
    def __init__(self, settings: Settings) -> None:
        self._root = Path(settings.media_local_dir).resolve()
        self._root.mkdir(parents=True, exist_ok=True)
        self._public_base = settings.media_local_public_base_url.strip().rstrip("/")

    def put(self, *, key: str, data: bytes, content_type: str) -> StoredObject:
        _ = content_type
        path = self._root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return StoredObject(
            key=key,
            url=f"{self._public_base}/{key.lstrip('/')}",
            content_type=content_type,
            size_bytes=len(data),
        )

    def delete(self, *, key: str) -> None:
        path = self._root / key
        if path.is_file():
            path.unlink()

    def owns_url(self, url: str) -> bool:
        return self.key_from_url(url) is not None

    def key_from_url(self, url: str) -> str | None:
        if not url or not self._public_base:
            return None
        u = url.strip()
        base = self._public_base.rstrip("/")
        if u.startswith(base + "/"):
            return u[len(base) + 1 :].split("?", 1)[0]
        return None
