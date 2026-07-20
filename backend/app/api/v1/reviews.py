"""Product reviews HTTP endpoints — server-side pagination."""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.review import ReviewsPageOut
from app.application.reviews.service import ReviewsNotFoundError, get_product_reviews_page

router = APIRouter(tags=["reviews"])

ReviewSort = Literal["featured", "helpful", "recent"]


@router.get(
    "/products/{product_id}/reviews",
    response_model=ReviewsPageOut,
)
async def product_reviews(
    product_id: str,
    session: Annotated[AsyncSession, Depends(db_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=24)] = 4,
    sort: Annotated[ReviewSort, Query()] = "featured",
    tag: Annotated[str | None, Query()] = None,
) -> ReviewsPageOut:
    """Paginated reviews for a product id (e.g. prod_001)."""
    try:
        return await get_product_reviews_page(
            session,
            product_id=product_id,
            page=page,
            page_size=page_size,
            sort=sort,
            tag=tag,
        )
    except ReviewsNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"product not found: {exc.product_id}",
        ) from exc
