"""One-shot: hide demo catalog from storefront + remove seeded fake reviews.

Safe for orders: products are drafted (not hard-deleted) because order_items
FK is ON DELETE RESTRICT.

Usage (with Railway API env):
  cd backend
  railway run --service api --environment production -- python scripts/wipe_demo_storefront.py
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import delete, func, select, text, update

from app.core.config import get_settings
from app.infrastructure.db.models import Product, Review
from app.infrastructure.db.session import close_db, get_session_factory, init_db


async def main() -> int:
    settings = get_settings()
    init_db(settings)
    fac = get_session_factory()
    async with fac() as session:
        pub = await session.scalar(
            select(func.count()).select_from(Product).where(Product.status == "published")
        )
        allp = await session.scalar(select(func.count()).select_from(Product))
        revs = await session.scalar(select(func.count()).select_from(Review))
        products_in_orders = await session.scalar(
            text("SELECT COUNT(DISTINCT product_id) FROM order_items")
        )
        print(
            f"BEFORE products_total={allp} published={pub} "
            f"reviews={revs} products_in_orders={products_in_orders}",
            flush=True,
        )

        res = await session.execute(
            update(Product).values(
                status="draft",
                featured=False,
                published_at=None,
                review_count=0,
            )
        )
        await session.execute(delete(Review))
        await session.commit()

        pub2 = await session.scalar(
            select(func.count()).select_from(Product).where(Product.status == "published")
        )
        revs2 = await session.scalar(select(func.count()).select_from(Review))
        print(
            f"AFTER published={pub2} reviews={revs2} "
            f"product_rows_touched={res.rowcount}",
            flush=True,
        )
    await close_db()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        raise
