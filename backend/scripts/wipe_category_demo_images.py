"""Clear seed Unsplash URLs from categories (Shop by Mood / Filters).

Usage:
  cd backend
  DATABASE_URL=... DATABASE_SSL=require python scripts/wipe_category_demo_images.py
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text, update

from app.core.config import get_settings
from app.infrastructure.db.models import Category
from app.infrastructure.db.session import close_db, get_session_factory, init_db


async def main() -> int:
    settings = get_settings()
    init_db(settings)
    fac = get_session_factory()
    async with fac() as session:
        before = await session.execute(
            text(
                "SELECT slug, image_url FROM categories "
                "WHERE image_url ILIKE '%unsplash%' OR image_url ILIKE '%picsum%'"
            )
        )
        rows = before.fetchall()
        print(f"demo_category_images={len(rows)}", flush=True)
        for slug, url in rows:
            print(f"  {slug}: {(url or '')[:72]}", flush=True)

        res = await session.execute(
            update(Category)
            .where(
                (Category.image_url.ilike("%unsplash%"))
                | (Category.image_url.ilike("%picsum%"))
            )
            .values(image_url="")
        )
        await session.commit()
        print(f"cleared_rows={res.rowcount}", flush=True)
    await close_db()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        raise
