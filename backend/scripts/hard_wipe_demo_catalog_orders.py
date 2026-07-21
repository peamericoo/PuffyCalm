"""Hard-delete demo products and orders from the connected DB.

Order of operations (FK: order_items.product_id ON DELETE RESTRICT):
  1. order_items
  2. orders
  3. stripe_events (optional demo noise)
  4. reviews, product_images, product_specs, product_categories
  5. products

Categories are kept (structure for Admin → Categories).

Usage:
  cd backend
  DATABASE_URL=... DATABASE_SSL=require python scripts/hard_wipe_demo_catalog_orders.py
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text

from app.core.config import get_settings
from app.infrastructure.db.session import close_db, get_session_factory, init_db


async def main() -> int:
    settings = get_settings()
    init_db(settings)
    fac = get_session_factory()
    async with fac() as session:
        before = {}
        for key, q in {
            "products": "SELECT count(*) FROM products",
            "orders": "SELECT count(*) FROM orders",
            "order_items": "SELECT count(*) FROM order_items",
            "reviews": "SELECT count(*) FROM reviews",
            "stripe_events": "SELECT count(*) FROM stripe_events",
        }.items():
            before[key] = (await session.execute(text(q))).scalar_one()
        print("BEFORE", before, flush=True)

        status_rows = (
            await session.execute(
                text("SELECT status, count(*) FROM products GROUP BY status ORDER BY 1")
            )
        ).fetchall()
        print("PRODUCT_STATUS", [tuple(r) for r in status_rows], flush=True)

        # 1–2 orders first (cascade items if we delete orders, but items also FK products)
        await session.execute(text("DELETE FROM order_items"))
        await session.execute(text("DELETE FROM orders"))
        # 3 webhook noise from smoke tests
        await session.execute(text("DELETE FROM stripe_events"))
        # 4 product children
        await session.execute(text("DELETE FROM reviews"))
        await session.execute(text("DELETE FROM product_images"))
        await session.execute(text("DELETE FROM product_specs"))
        await session.execute(text("DELETE FROM product_categories"))
        # 5 products
        await session.execute(text("DELETE FROM products"))
        await session.commit()

        after = {}
        for key, q in {
            "products": "SELECT count(*) FROM products",
            "orders": "SELECT count(*) FROM orders",
            "order_items": "SELECT count(*) FROM order_items",
            "reviews": "SELECT count(*) FROM reviews",
            "stripe_events": "SELECT count(*) FROM stripe_events",
            "categories": "SELECT count(*) FROM categories",
        }.items():
            after[key] = (await session.execute(text(q))).scalar_one()
        print("AFTER", after, flush=True)
        print("OK hard wipe complete — categories kept for admin covers", flush=True)
    await close_db()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        raise
