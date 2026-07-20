"""Product detail HTTP endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.product import ProductDetailOut
from app.application.catalog.service import CatalogNotFoundError, get_product_by_slug

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/{slug}", response_model=ProductDetailOut)
async def product_by_slug(
    slug: str,
    session: Annotated[AsyncSession, Depends(db_session)],
    related: Annotated[
        int,
        Query(ge=0, le=12, description="Number of related products to include"),
    ] = 0,
) -> ProductDetailOut:
    """PDP payload: product (+ optional related)."""
    try:
        return await get_product_by_slug(session, slug, related=related)
    except CatalogNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{exc.resource} not found: {exc.key}",
        ) from exc
