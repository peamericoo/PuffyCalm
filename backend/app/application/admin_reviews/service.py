"""Admin create/list/delete reviews + product aggregate refresh."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import Product, Review


class AdminReviewError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


async def _recalc_product_stats(session: AsyncSession, product_id: str) -> None:
    product = await session.get(Product, product_id)
    if product is None:
        return
    rows = (
        await session.execute(
            select(func.count(Review.id), func.avg(Review.rating)).where(
                Review.product_id == product_id
            )
        )
    ).one()
    count = int(rows[0] or 0)
    avg = rows[1]
    product.review_count = count
    if count == 0 or avg is None:
        product.rating = Decimal("0")
    else:
        product.rating = Decimal(str(round(float(avg), 2)))


async def list_admin_reviews(
    session: AsyncSession,
    product_id: str,
) -> list[Review]:
    product = await session.get(Product, product_id)
    if product is None:
        raise AdminReviewError("not_found", "Product not found")
    result = await session.scalars(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    return list(result.all())


async def create_admin_review(
    session: AsyncSession,
    product_id: str,
    data: dict[str, Any],
) -> Review:
    product = await session.get(Product, product_id)
    if product is None:
        raise AdminReviewError("not_found", "Product not found")

    author = str(data.get("author") or "").strip()
    if not author:
        raise AdminReviewError("invalid_author", "Author is required")
    rating = int(data.get("rating") or 0)
    if rating < 1 or rating > 5:
        raise AdminReviewError("invalid_rating", "Rating must be 1–5")

    title = str(data.get("title") or "").strip()[:255]
    body = str(data.get("body") or "").strip()
    if not body:
        raise AdminReviewError("invalid_body", "Review body is required")

    initials = str(data.get("initials") or "").strip().upper()[:8]
    if not initials:
        parts = author.split()
        initials = "".join(p[0] for p in parts[:2] if p).upper()[:8] or "PC"

    tags_raw = data.get("tags") or []
    tags: list[str] = []
    if isinstance(tags_raw, list):
        for t in tags_raw:
            if isinstance(t, str) and t.strip():
                tags.append(t.strip()[:48])
    elif isinstance(tags_raw, str) and tags_raw.strip():
        tags = [x.strip()[:48] for x in tags_raw.split(",") if x.strip()]

    now = datetime.now(UTC)
    date_label = str(data.get("date_label") or data.get("dateLabel") or "").strip()
    if not date_label:
        date_label = now.strftime("%b %Y")

    review = Review(
        id=f"{product_id}_rev_{uuid4().hex[:10]}",
        product_id=product_id,
        author=author[:128],
        initials=initials,
        rating=rating,
        title=title,
        body=body,
        date_label=date_label[:64],
        created_at=now,
        verified=bool(data.get("verified", True)),
        helpful=int(data.get("helpful") or 0),
        tags=tags[:8],
        featured=bool(data.get("featured", False)),
    )
    session.add(review)
    await session.flush()
    await _recalc_product_stats(session, product_id)
    await session.commit()
    await session.refresh(review)
    return review


async def delete_admin_review(session: AsyncSession, review_id: str) -> str:
    review = await session.get(Review, review_id)
    if review is None:
        raise AdminReviewError("not_found", "Review not found")
    product_id = review.product_id
    await session.delete(review)
    await session.flush()
    await _recalc_product_stats(session, product_id)
    await session.commit()
    return product_id
