"""Wipe demo home CMS payload (promo + hero) in the connected database.

Usage:
  cd backend
  # with public DATABASE_URL / railway env:
  python scripts/wipe_home_demo.py
"""

from __future__ import annotations

import asyncio
import sys
from datetime import UTC, datetime

from sqlalchemy import select

from app.application.content.defaults import HOME_KEY, default_home_payload
from app.core.config import get_settings
from app.infrastructure.db.models.content import ContentBlock
from app.infrastructure.db.session import close_db, get_session_factory, init_db


async def main() -> int:
    settings = get_settings()
    init_db(settings)
    fac = get_session_factory()
    async with fac() as session:
        block = await session.scalar(
            select(ContentBlock).where(ContentBlock.key == HOME_KEY)
        )
        empty = default_home_payload()
        if block is None:
            session.add(ContentBlock(key=HOME_KEY, payload=empty))
            print("INSERTED empty home content block", flush=True)
        else:
            before = block.payload if isinstance(block.payload, dict) else {}
            n_promo = len(before.get("promoMessages") or before.get("promo_messages") or [])
            n_hero = len(before.get("heroSlides") or before.get("hero_slides") or [])
            block.payload = empty
            block.updated_at = datetime.now(UTC)
            print(
                f"WIPED home content (was promo={n_promo} hero={n_hero}) → empty",
                flush=True,
            )
        await session.commit()
    await close_db()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        raise
