"""Unit tests for media MIME/size validation (no DB)."""

from __future__ import annotations

import pytest

from app.application.media.validation import MediaValidationError, validate_image_upload

# Minimal valid magic headers + padding
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
GIF = b"GIF89a" + b"\x00" * 32
WEBP = b"RIFF" + (40).to_bytes(4, "little") + b"WEBP" + b"\x00" * 32


def test_accepts_jpeg() -> None:
    v = validate_image_upload(JPEG, declared_content_type="image/jpeg", max_bytes=1024)
    assert v.content_type == "image/jpeg"
    assert v.extension == "jpg"


def test_accepts_png_webp_gif() -> None:
    assert validate_image_upload(PNG, declared_content_type=None, max_bytes=1024).extension == "png"
    assert (
        validate_image_upload(WEBP, declared_content_type="image/webp", max_bytes=1024).extension
        == "webp"
    )
    assert validate_image_upload(GIF, declared_content_type=None, max_bytes=1024).extension == "gif"


def test_rejects_empty() -> None:
    with pytest.raises(MediaValidationError) as ei:
        validate_image_upload(b"", declared_content_type=None, max_bytes=1024)
    assert ei.value.code == "empty_file"


def test_rejects_too_large() -> None:
    with pytest.raises(MediaValidationError) as ei:
        validate_image_upload(JPEG * 10, declared_content_type=None, max_bytes=20)
    assert ei.value.code == "file_too_large"


def test_rejects_unknown() -> None:
    with pytest.raises(MediaValidationError) as ei:
        validate_image_upload(b"not-an-image!!!!!", declared_content_type=None, max_bytes=1024)
    assert ei.value.code == "unsupported_type"


def test_mime_mismatch() -> None:
    with pytest.raises(MediaValidationError) as ei:
        validate_image_upload(JPEG, declared_content_type="image/png", max_bytes=1024)
    assert ei.value.code == "mime_mismatch"


def test_octet_stream_ok() -> None:
    v = validate_image_upload(
        PNG, declared_content_type="application/octet-stream", max_bytes=1024
    )
    assert v.content_type == "image/png"
