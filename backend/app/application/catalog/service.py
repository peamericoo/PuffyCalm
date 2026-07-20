"""Catalog use cases — Postgres only, no fixtures on the response path."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.schemas.catalog import CatalogPageOut, CategoryOut
from app.api.v1.schemas.product import ProductDetailOut, ProductOut, SearchResponseOut
from app.application.catalog.filter_sort import (
    CatalogSort,
    StockFilter,
    build_facets,
    filter_products,
    score_search,
    sort_products,
)
from app.application.catalog.mappers import category_to_out, product_to_out
from app.domain.product_rules import ProductStatus
from app.infrastructure.db.models import Category, Product, product_categories

_PUBLISHED = ProductStatus.published.value


class CatalogNotFoundError(Exception):
    """Category or product not found."""

    def __init__(self, resource: str, key: str) -> None:
        self.resource = resource
        self.key = key
        super().__init__(f"{resource} not found: {key}")


_PRODUCT_LOAD = (
    selectinload(Product.categories),
    selectinload(Product.images),
    selectinload(Product.specs),
)


async def _load_all_products(session: AsyncSession) -> list[Product]:
    """Storefront: published products only."""
    result = await session.execute(
        select(Product)
        .where(Product.status == _PUBLISHED)
        .options(*_PRODUCT_LOAD)
        .order_by(Product.id)
    )
    return list(result.scalars().unique().all())


async def _load_all_categories(session: AsyncSession) -> list[Category]:
    result = await session.execute(select(Category).order_by(Category.sort_order, Category.slug))
    return list(result.scalars().all())


async def _product_counts_by_category(session: AsyncSession) -> dict[str, int]:
    """Counts for real categories (M2M). Virtual `all` = published products only."""
    published = Product.status == _PUBLISHED
    rows = await session.execute(
        select(Category.slug, func.count(product_categories.c.product_id))
        .select_from(Category)
        .outerjoin(
            product_categories,
            Category.id == product_categories.c.category_id,
        )
        .outerjoin(
            Product,
            (Product.id == product_categories.c.product_id) & published,
        )
        .where(Category.is_virtual.is_(False))
        .group_by(Category.slug)
    )
    counts = {slug: int(n) for slug, n in rows.all()}
    total = await session.scalar(
        select(func.count()).select_from(Product).where(published)
    )
    counts["all"] = int(total or 0)
    return counts


async def _products_for_category_slug(
    session: AsyncSession,
    slug: str,
) -> list[Product]:
    if slug == "all":
        return await _load_all_products(session)

    result = await session.execute(
        select(Product)
        .join(product_categories, Product.id == product_categories.c.product_id)
        .join(Category, Category.id == product_categories.c.category_id)
        .where(Category.slug == slug, Product.status == _PUBLISHED)
        .options(*_PRODUCT_LOAD)
        .order_by(Product.id)
    )
    return list(result.scalars().unique().all())


async def get_categories(session: AsyncSession) -> list[CategoryOut]:
    cats = await _load_all_categories(session)
    counts = await _product_counts_by_category(session)
    return [category_to_out(c, counts.get(c.slug, 0)) for c in cats]


async def get_category_by_slug(session: AsyncSession, slug: str) -> CategoryOut:
    slug = slug.strip().lower()
    result = await session.execute(select(Category).where(Category.slug == slug))
    cat = result.scalar_one_or_none()
    if cat is None:
        raise CatalogNotFoundError("category", slug)
    counts = await _product_counts_by_category(session)
    return category_to_out(cat, counts.get(cat.slug, 0))


async def get_catalog_page(
    session: AsyncSession,
    *,
    category_slug: str = "all",
    sort: CatalogSort = "featured",
    stock: StockFilter = "all",
    types: list[str] | None = None,
    sale: bool = False,
) -> CatalogPageOut:
    slug = (category_slug or "all").strip().lower() or "all"
    type_filters = [t.strip().lower() for t in (types or []) if t and t.strip()]

    result = await session.execute(select(Category).where(Category.slug == slug))
    category = result.scalar_one_or_none()
    if category is None:
        raise CatalogNotFoundError("category", slug)

    pool_orm = await _products_for_category_slug(session, slug)
    pool = [product_to_out(p) for p in pool_orm]
    pool_total = len(pool)

    all_cats = await _load_all_categories(session)
    counts = await _product_counts_by_category(session)
    type_meta = [(c.slug, c.name) for c in all_cats]
    facets = build_facets(pool, type_meta)

    filtered = filter_products(pool, stock=stock, types=type_filters, sale=sale)
    products = sort_products(filtered, sort)

    siblings = [category_to_out(c, counts.get(c.slug, 0)) for c in all_cats]
    category_out = category_to_out(category, pool_total)

    return CatalogPageOut(
        category=category_out,
        products=products,
        siblings=siblings,
        sort=sort,
        stock=stock,
        types=type_filters,
        sale=sale,
        total=len(products),
        pool_total=pool_total,
        facets=facets,
    )


async def get_product_by_slug(
    session: AsyncSession,
    slug: str,
    *,
    related: int = 0,
) -> ProductDetailOut:
    slug = slug.strip().lower()
    result = await session.execute(
        select(Product)
        .where(Product.slug == slug, Product.status == _PUBLISHED)
        .options(*_PRODUCT_LOAD)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise CatalogNotFoundError("product", slug)

    product_out = product_to_out(product)
    related_out: list[ProductOut] = []
    if related > 0:
        related_out = await _related_products(session, product, limit=related)

    return ProductDetailOut(product=product_out, related=related_out)


async def _related_products(
    session: AsyncSession,
    current: Product,
    *,
    limit: int = 4,
) -> list[ProductOut]:
    all_products = await _load_all_products(session)
    current_slugs = {c.slug for c in current.categories if c.slug != "all"}

    same_cat: list[Product] = []
    rest: list[Product] = []
    for p in all_products:
        if p.id == current.id:
            continue
        p_slugs = {c.slug for c in p.categories if c.slug != "all"}
        if current_slugs & p_slugs:
            same_cat.append(p)
        else:
            rest.append(p)

    ordered = same_cat + rest
    return [product_to_out(p, include_specs=False) for p in ordered[:limit]]


async def search_products(
    session: AsyncSession,
    q: str,
    *,
    limit: int = 6,
) -> SearchResponseOut:
    query = q.strip()
    if not query:
        return SearchResponseOut(query=query, items=[], total=0)

    limit = max(1, min(limit, 24))
    q_lower = query.lower()
    products = await _load_all_products(session)
    scored: list[tuple[int, ProductOut]] = []
    for p in products:
        out = product_to_out(p, include_specs=False)
        score = score_search(out, q_lower)
        if score > 0:
            scored.append((score, out))
    scored.sort(key=lambda x: -x[0])
    items = [p for _, p in scored[:limit]]
    return SearchResponseOut(query=query, items=items, total=len(scored))
