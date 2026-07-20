"""Catalog HTTP endpoints — GET /catalog, /categories."""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.catalog import CatalogPageOut, CategoryOut
from app.application.catalog.service import (
    CatalogNotFoundError,
    get_catalog_page,
    get_categories,
    get_category_by_slug,
)

router = APIRouter(tags=["catalog"])

CatalogSort = Literal["featured", "price-asc", "price-desc", "rating"]
StockFilter = Literal["all", "in", "out"]


@router.get("/catalog", response_model=CatalogPageOut)
async def catalog(
    session: Annotated[AsyncSession, Depends(db_session)],
    category_slug: Annotated[
        str,
        Query(alias="categorySlug", description="Category slug; use `all` for full pool"),
    ] = "all",
    sort: Annotated[CatalogSort, Query()] = "featured",
    stock: Annotated[StockFilter, Query()] = "all",
    types: Annotated[
        list[str] | None,
        Query(description="Extra type refine (collection slugs, never `all`)"),
    ] = None,
    sale: Annotated[bool, Query(description="Only discounted items")] = False,
) -> CatalogPageOut:
    """Catalog page with filter/sort/facets (CatalogPage shape)."""
    try:
        return await get_catalog_page(
            session,
            category_slug=category_slug,
            sort=sort,
            stock=stock,
            types=types,
            sale=sale,
        )
    except CatalogNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{exc.resource} not found: {exc.key}",
        ) from exc


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    session: Annotated[AsyncSession, Depends(db_session)],
) -> list[CategoryOut]:
    """All categories including virtual `all`, with productCount."""
    return await get_categories(session)


@router.get("/categories/{slug}", response_model=CategoryOut)
async def category_detail(
    slug: str,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> CategoryOut:
    try:
        return await get_category_by_slug(session, slug)
    except CatalogNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{exc.resource} not found: {exc.key}",
        ) from exc
