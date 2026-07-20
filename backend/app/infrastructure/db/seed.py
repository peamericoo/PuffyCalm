"""Seed catalog tables from seed_data (idempotent upsert).

Usage (inside API container):
  python -m app.infrastructure.db.seed
  python -m app.infrastructure.db.seed --reset
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.domain.product_rules import ProductStatus
from app.infrastructure.db.models import (
    Category,
    Product,
    ProductImage,
    ProductSpec,
    Review,
)
from app.infrastructure.db.seed_data import CATEGORIES, PRODUCTS, REVIEW_SEEDS
from app.infrastructure.db.session import close_db, get_session_factory, init_db

log = get_logger(__name__)

_PRODUCT_LOAD = (
    selectinload(Product.categories),
    selectinload(Product.images),
    selectinload(Product.specs),
)


async def _clear_catalog(session: AsyncSession) -> None:
    await session.execute(delete(Review))
    await session.execute(delete(ProductSpec))
    await session.execute(delete(ProductImage))
    await session.execute(delete(Product))
    await session.execute(delete(Category))
    await session.commit()
    log.info("catalog_cleared")


async def _get_product(session: AsyncSession, product_id: str) -> Product | None:
    return await session.scalar(
        select(Product).where(Product.id == product_id).options(*_PRODUCT_LOAD)
    )


async def seed_catalog(session: AsyncSession, *, reset: bool = False) -> dict[str, int]:
    if reset:
        await _clear_catalog(session)

    # Categories
    cat_by_slug: dict[str, Category] = {}
    for raw in CATEGORIES:
        existing = await session.get(Category, raw["id"])
        if existing is None:
            cat = Category(**{k: v for k, v in raw.items()})
            session.add(cat)
            cat_by_slug[raw["slug"]] = cat
        else:
            for key, value in raw.items():
                if key != "id":
                    setattr(existing, key, value)
            cat_by_slug[raw["slug"]] = existing

    await session.flush()

    # Products — seed is always published for storefront/dev
    now = datetime.now(UTC)
    for raw in PRODUCTS:
        data = {
            k: v
            for k, v in raw.items()
            if k not in {"images", "specs", "category_slugs"}
        }
        data.setdefault("status", ProductStatus.published.value)
        data.setdefault("published_at", now)
        data.setdefault("max_quantity_per_order", 9)
        product = await _get_product(session, raw["id"])
        if product is None:
            product = Product(**data)
            session.add(product)
            await session.flush()
            product = await _get_product(session, raw["id"])
            assert product is not None
        else:
            for key, value in data.items():
                if key != "id":
                    setattr(product, key, value)
            product.status = ProductStatus.published.value
            if product.published_at is None:
                product.published_at = now

        linked: list[Category] = []
        for slug in raw["category_slugs"]:
            cat = cat_by_slug.get(slug)
            if cat is None or cat.is_virtual:
                continue
            linked.append(cat)
        product.categories = linked

        # Replace gallery
        product.images.clear()
        for i, url in enumerate(raw["images"]):
            product.images.append(ProductImage(url=url, sort_order=i))

        # Replace specs
        product.specs.clear()
        for i, spec in enumerate(raw["specs"]):
            product.specs.append(
                ProductSpec(label=spec["label"], value=spec["value"], sort_order=i)
            )

        # Reviews — upsert by id
        for idx, seed in enumerate(REVIEW_SEEDS):
            review_id = f"{raw['id']}_rev_{idx}"
            review = await session.get(Review, review_id)
            created_at = datetime.fromisoformat(seed["created_at"])
            payload: dict[str, Any] = {
                "id": review_id,
                "product_id": raw["id"],
                "author": seed["author"],
                "initials": seed["initials"],
                "rating": seed["rating"],
                "title": seed["title"],
                "body": seed["body"],
                "date_label": seed["date_label"],
                "created_at": created_at,
                "verified": seed["verified"],
                "helpful": seed["helpful"],
                "tags": list(seed["tags"]),
                "featured": bool(seed.get("featured")) and idx == 0,
            }
            if review is None:
                session.add(Review(**payload))
            else:
                for key, value in payload.items():
                    if key != "id":
                        setattr(review, key, value)

    await session.commit()

    counts = {
        "categories": int(
            (await session.execute(select(func.count()).select_from(Category))).scalar_one()
        ),
        "products": int(
            (await session.execute(select(func.count()).select_from(Product))).scalar_one()
        ),
        "reviews": int(
            (await session.execute(select(func.count()).select_from(Review))).scalar_one()
        ),
        "images": int(
            (await session.execute(select(func.count()).select_from(ProductImage))).scalar_one()
        ),
        "specs": int(
            (await session.execute(select(func.count()).select_from(ProductSpec))).scalar_one()
        ),
    }
    log.info("catalog_seeded", **counts)
    return counts


async def _run(reset: bool, *, users_only: bool = False) -> int:
    settings = get_settings()
    setup_logging(settings)
    init_db(settings)
    factory = get_session_factory()
    try:
        async with factory() as session:
            if not users_only:
                counts = await seed_catalog(session, reset=reset)
                print("Catalog seed complete:", counts)
            from app.application.auth.service import seed_admin_users

            users = await seed_admin_users(session, settings=settings)
            print("Users seed:", users)
        return 0
    finally:
        await close_db()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Seed PuffyCalm catalog + admin users")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing catalog rows before seeding",
    )
    parser.add_argument(
        "--users-only",
        action="store_true",
        help="Only seed admin/staff users (no catalog)",
    )
    args = parser.parse_args(argv)
    raise SystemExit(asyncio.run(_run(reset=args.reset, users_only=args.users_only)))


if __name__ == "__main__":
    main(sys.argv[1:])
