"""MIME / magic-bytes / size validation for product media."""

from __future__ import annotations

from dataclasses import dataclass


class MediaValidationError(Exception):
    def __init__(self, message: str, *, code: str = "invalid_media") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


# Allowed image types for product gallery (no SVG — XSS risk).
ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }
)

# Extension by canonical content-type
_EXT: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


@dataclass(frozen=True, slots=True)
class ValidatedMedia:
    content_type: str
    extension: str
    size_bytes: int
    data: bytes


def _detect_content_type(data: bytes) -> str | None:
    if len(data) < 12:
        return None
    # JPEG
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    # PNG
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    # GIF
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    # WebP: RIFF....WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image_upload(
    data: bytes,
    *,
    declared_content_type: str | None,
    max_bytes: int,
) -> ValidatedMedia:
    if not data:
        raise MediaValidationError("Empty file", code="empty_file")
    if len(data) > max_bytes:
        mb = max_bytes / (1024 * 1024)
        raise MediaValidationError(
            f"File exceeds maximum size of {mb:.0f} MiB",
            code="file_too_large",
        )

    detected = _detect_content_type(data)
    if detected is None:
        raise MediaValidationError(
            "Unrecognized or unsupported image format",
            code="unsupported_type",
        )
    if detected not in ALLOWED_CONTENT_TYPES:
        raise MediaValidationError(
            f"Content type not allowed: {detected}",
            code="unsupported_type",
        )

    # If client sent a Content-Type, it must match family (ignore charset quirks)
    if declared_content_type:
        declared = declared_content_type.split(";")[0].strip().lower()
        if declared and declared not in ("application/octet-stream", "binary/octet-stream"):
            # Allow image/jpg alias
            if declared == "image/jpg":
                declared = "image/jpeg"
            if declared != detected:
                raise MediaValidationError(
                    f"Declared Content-Type {declared!r} does not match file content ({detected})",
                    code="mime_mismatch",
                )

    return ValidatedMedia(
        content_type=detected,
        extension=_EXT[detected],
        size_bytes=len(data),
        data=data,
    )
