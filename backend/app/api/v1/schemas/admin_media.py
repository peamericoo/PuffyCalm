"""Admin media upload schemas (Phase I)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class AdminMediaUploadOut(CamelModel):
    key: str
    url: str
    content_type: str = Field(serialization_alias="contentType")
    size_bytes: int = Field(serialization_alias="sizeBytes")
    product_id: str | None = Field(default=None, serialization_alias="productId")
    sort_order: int | None = Field(default=None, serialization_alias="sortOrder")
    set_cover: bool = Field(default=False, serialization_alias="setCover")


class AdminMediaDeleteIn(CamelModel):
    key: str | None = Field(default=None, description="Object key in bucket")
    url: str | None = Field(default=None, description="Public URL (alternative to key)")


class AdminMediaDeleteOut(CamelModel):
    deleted: bool
    key: str | None = None
    url: str | None = None
    storage_deleted: bool = Field(default=False, serialization_alias="storageDeleted")
    images_removed: int = Field(default=0, serialization_alias="imagesRemoved")
    products_touched: int = Field(default=0, serialization_alias="productsTouched")
