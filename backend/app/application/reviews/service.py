"""Reviews use cases — server-side pagination (never dump full set)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.review import (
    ProductReviewOut,
    RatingBreakdownOut,
    ReviewsPageOut,
    ReviewsQueryOut,
    ReviewsSummaryOut,
)
from app.infrastructure.db.models import Product, Review

ReviewSort = Literal["featured", "helpful", "recent"]


class ReviewsNotFoundError(Exception):
    def __init__(self, product_id: str) -> None:
        self.product_id = product_id
        super().__init__(f"product not found: {product_id}")


def _clamp_page(page: int, total_pages: int) -> int:
    if page < 1 or not isinstance(page, int):
        return 1
    if total_pages < 1:
        return 1
    return min(page, total_pages)


def _normalize_page_size(page_size: int, *, min_s: int = 1, max_s: int = 24, fallback: int = 4) -> int:
    if page_size < min_s:
        return fallback
    return min(page_size, max_s)


def _page_meta(total_items: int, page: int, page_size: int) -> dict[str, int | bool]:
    size = _normalize_page_size(page_size)
    total = max(0, total_items)
    total_pages = 0 if total == 0 else (total + size - 1) // size
    safe_page = 1 if total_pages == 0 else _clamp_page(page, total_pages)
    offset = (safe_page - 1) * size
    return {
        "page": safe_page,
        "page_size": size,
        "total_items": total,
        "total_pages": total_pages,
        "has_next": total_pages > 0 and safe_page < total_pages,
        "has_prev": safe_page > 1,
        "offset": offset,
    }


def _review_to_out(review: Review) -> ProductReviewOut:
    created = review.created_at
    if created is None:
        created_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    else:
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        created_iso = created.isoformat().replace("+00:00", "Z")

    tags = list(review.tags) if review.tags else None
    return ProductReviewOut(
        id=review.id,
        author=review.author,
        initials=review.initials,
        rating=review.rating,
        title=review.title,
        body=review.body,
        date_label=review.date_label,
        created_at=created_iso,
        verified=review.verified,
        helpful=review.helpful,
        tags=tags,
        featured=review.featured if review.featured else None,
    )


def _sort_reviews(items: list[ProductReviewOut], sort: ReviewSort) -> list[ProductReviewOut]:
    if sort == "helpful":
        return sorted(items, key=lambda r: (-r.helpful, -r.rating))
    if sort == "recent":
        return sorted(items, key=lambda r: r.created_at, reverse=True)
    # featured
    return sorted(
        items,
        key=lambda r: (-int(bool(r.featured)), -r.helpful, -r.rating),
    )


def _unique_tags(reviews: list[ProductReviewOut], limit: int = 6) -> list[str]:
    tags: list[str] = []
    for r in reviews:
        for t in r.tags or []:
            if t not in tags:
                tags.append(t)
            if len(tags) >= limit:
                return tags
    return tags


def _breakdown(reviews: list[ProductReviewOut]) -> list[RatingBreakdownOut]:
    total = len(reviews) or 1
    counts: dict[int, int] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        star = min(5, max(1, int(round(r.rating))))
        counts[star] = counts.get(star, 0) + 1
    out: list[RatingBreakdownOut] = []
    for stars in (5, 4, 3, 2, 1):
        count = counts[stars]
        percent = round((count / total) * 100) if reviews else 0
        out.append(
            RatingBreakdownOut(stars=stars, percent=percent, count=count)  # type: ignore[arg-type]
        )
    return out


async def get_product_reviews_page(
    session: AsyncSession,
    *,
    product_id: str,
    page: int = 1,
    page_size: int = 4,
    sort: ReviewSort = "featured",
    tag: str | None = None,
) -> ReviewsPageOut:
    product = await session.get(Product, product_id)
    if product is None:
        raise ReviewsNotFoundError(product_id)

    result = await session.execute(select(Review).where(Review.product_id == product_id))
    rows = list(result.scalars().all())
    catalog = [_review_to_out(r) for r in rows]

    tag_clean = tag.strip() if tag and tag.strip() else None
    filtered = catalog
    if tag_clean:
        filtered = [r for r in catalog if r.tags and tag_clean in r.tags]

    sorted_list = _sort_reviews(filtered, sort)
    meta = _page_meta(len(sorted_list), page, page_size)
    offset = int(meta["offset"])
    size = int(meta["page_size"])
    items = sorted_list[offset : offset + size]

    featured = next((r for r in catalog if r.featured), None)
    if featured is None and catalog:
        featured = _sort_reviews(catalog, "helpful")[0]

    # Prefer product aggregate when present (storefront-facing count)
    average = float(product.rating)
    count = product.review_count if product.review_count > 0 else len(catalog)

    summary = ReviewsSummaryOut(
        average=average,
        count=count,
        breakdown=_breakdown(catalog),
        featured=featured,
        tags=_unique_tags(catalog),
    )

    query = ReviewsQueryOut(
        product_id=product_id,
        page=int(meta["page"]),
        page_size=size,
        sort=sort,
        tag=tag_clean,
    )

    return ReviewsPageOut(
        items=items,
        page=int(meta["page"]),
        page_size=size,
        total_items=int(meta["total_items"]),
        total_pages=int(meta["total_pages"]),
        has_next=bool(meta["has_next"]),
        has_prev=bool(meta["has_prev"]),
        summary=summary,
        query=query,
    )
