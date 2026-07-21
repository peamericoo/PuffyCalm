"""Admin CRUD for categories (Shop by Mood / Filters images)."""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import Category

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,64}$")


class AdminCategoryError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def _valid_image_url(url: str) -> bool:
    u = (url or "").strip()
    if not u:
        return True  # empty = clean placeholder
    return (
        u.startswith("http://")
        or u.startswith("https://")
        or u.startswith("/media/")
    )


async def list_admin_categories(session: AsyncSession) -> list[Category]:
    result = await session.scalars(
        select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
    )
    return list(result.all())


async def update_admin_category(
    session: AsyncSession,
    category_id: str,
    data: dict[str, Any],
) -> Category:
    cat = await session.get(Category, category_id)
    if cat is None:
        raise AdminCategoryError("not_found", f"Category {category_id} not found")

    if "name" in data and data["name"] is not None:
        name = str(data["name"]).strip()
        if not name:
            raise AdminCategoryError("invalid_name", "Name is required")
        cat.name = name[:255]

    if "tagline" in data and data["tagline"] is not None:
        cat.tagline = str(data["tagline"]).strip()[:255]

    if "description" in data and data["description"] is not None:
        cat.description = str(data["description"]).strip()

    if "cta_label" in data and data["cta_label"] is not None:
        cat.cta_label = str(data["cta_label"]).strip()[:128] or "Shop"

    if "image_url" in data and data["image_url"] is not None:
        image_url = str(data["image_url"]).strip()
        if not _valid_image_url(image_url):
            raise AdminCategoryError(
                "invalid_image",
                "imageUrl must be empty, http(s), or /media/…",
            )
        cat.image_url = image_url[:1024]

    if "sort_order" in data and data["sort_order"] is not None:
        cat.sort_order = int(data["sort_order"])

    await session.commit()
    await session.refresh(cat)
    return cat


async def create_admin_category(
    session: AsyncSession,
    *,
    slug: str,
    name: str,
    tagline: str = "",
    description: str = "",
    image_url: str = "",
    cta_label: str = "Shop",
    is_virtual: bool = False,
) -> Category:
    slug = (slug or "").strip().lower()
    name = (name or "").strip()
    if not _SLUG_RE.match(slug):
        raise AdminCategoryError(
            "invalid_slug",
            "Slug must be lowercase letters, numbers, hyphens",
        )
    if not name:
        raise AdminCategoryError("invalid_name", "Name is required")
    if not _valid_image_url(image_url):
        raise AdminCategoryError(
            "invalid_image",
            "imageUrl must be empty, http(s), or /media/…",
        )

    existing = await session.scalar(select(Category).where(Category.slug == slug))
    if existing is not None:
        raise AdminCategoryError("slug_taken", f"Slug already exists: {slug}")

    cat_id = f"cat_{slug}"[:64]
    if not _ID_RE.match(cat_id):
        cat_id = f"cat_{slug.replace('-', '_')}"[:64]

    max_sort = await session.scalar(select(func.max(Category.sort_order))) or 0
    cat = Category(
        id=cat_id,
        slug=slug,
        name=name[:255],
        tagline=(tagline or "").strip()[:255],
        description=(description or "").strip(),
        image_url=(image_url or "").strip()[:1024],
        cta_label=(cta_label or "Shop").strip()[:128] or "Shop",
        is_virtual=is_virtual,
        sort_order=int(max_sort) + 1,
    )
    session.add(cat)
    await session.commit()
    await session.refresh(cat)
    return cat
