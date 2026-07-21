"""S3-compatible storage (Railway bucket / AWS / R2).

Railway buckets are **private** (no public ACL). Objects are stored in S3 and
served via the API ``GET /media/{key}`` proxy. ``S3_PUBLIC_BASE_URL`` should be
the public API media base, e.g. ``https://api.example.com/media``.
"""

from __future__ import annotations

from urllib.parse import urlparse

import boto3
from botocore.client import Config
from botocore.response import StreamingBody

from app.core.config import Settings
from app.infrastructure.storage.base import StoredObject


class S3Storage:
    def __init__(self, settings: Settings) -> None:
        self._bucket = settings.s3_bucket.strip()
        self._public_base = settings.resolved_s3_public_base_url()
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url.strip() or None,
            aws_access_key_id=settings.s3_access_key_id.strip(),
            aws_secret_access_key=settings.s3_secret_access_key.strip(),
            region_name=(settings.s3_region or "auto").strip() or "auto",
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "virtual"},
            ),
        )

    def put(self, *, key: str, data: bytes, content_type: str) -> StoredObject:
        # Railway private buckets: no ACL / public-read (NotImplemented).
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return StoredObject(
            key=key,
            url=self._public_url(key),
            content_type=content_type,
            size_bytes=len(data),
        )

    def delete(self, *, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)

    def get_object(self, *, key: str) -> tuple[StreamingBody, str | None, int | None]:
        """Return (body stream, content_type, content_length) for proxy serve."""
        resp = self._client.get_object(Bucket=self._bucket, Key=key)
        body = resp["Body"]
        ct = resp.get("ContentType")
        length = resp.get("ContentLength")
        return body, ct, length

    def owns_url(self, url: str) -> bool:
        return self.key_from_url(url) is not None

    def key_from_url(self, url: str) -> str | None:
        if not url or not self._public_base:
            return None
        u = url.strip()
        base = self._public_base.rstrip("/")
        if u.startswith(base + "/"):
            return u[len(base) + 1 :].split("?", 1)[0]
        # path-style fallback: https://endpoint/bucket/key
        try:
            parsed = urlparse(u)
            path = (parsed.path or "").lstrip("/")
            if path.startswith(self._bucket + "/"):
                return path[len(self._bucket) + 1 :]
        except Exception:
            return None
        return None

    def _public_url(self, key: str) -> str:
        base = self._public_base.rstrip("/")
        return f"{base}/{key.lstrip('/')}"
