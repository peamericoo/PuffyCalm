"""One-shot Phase P: set prod_009 to draft on target Postgres.

Requires DATABASE_PUBLIC_URL (or DATABASE_URL) in the environment.
Do not commit real connection strings. Safe to keep in repo.
"""

from __future__ import annotations

import os
import sys

import psycopg


def main() -> int:
    url = os.environ.get("DATABASE_PUBLIC_URL") or os.environ.get("DATABASE_URL")
    if not url:
        print("Set DATABASE_PUBLIC_URL or DATABASE_URL", file=sys.stderr)
        return 2

    # asyncpg-style URLs may use postgresql+asyncpg — normalize for psycopg
    url = url.replace("postgresql+asyncpg://", "postgresql://")

    with psycopg.connect(url, sslmode="require") as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, status, featured FROM products WHERE id = %s",
                ("prod_009",),
            )
            print("before", cur.fetchone())
            cur.execute(
                """
                UPDATE products
                SET status = 'draft', featured = false
                WHERE id = 'prod_009'
                RETURNING id, status, featured
                """
            )
            print("after", cur.fetchone())
            cur.execute("SELECT count(*) FROM products WHERE status = 'published'")
            print("published_count", cur.fetchone()[0])
        conn.commit()
    print("ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
