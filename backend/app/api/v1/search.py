"""Catalog search — header autocomplete."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.api.v1.schemas.product import SearchResponseOut
from app.application.catalog.service import search_products

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponseOut)
async def search(
    session: Annotated[AsyncSession, Depends(db_session)],
    q: Annotated[str, Query(description="Search query")] = "",
    limit: Annotated[int, Query(ge=1, le=24)] = 6,
) -> SearchResponseOut:
    """Lightweight product search by name / category / features."""
    return await search_products(session, q, limit=limit)
