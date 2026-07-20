"""Pure catalog filter / sort / facets — port of src/lib/catalog/filter.ts + sort.ts."""

from __future__ import annotations

from typing import Literal

from app.api.v1.schemas.catalog import (
    CatalogFacetsOut,
    StockFacetOut,
    TypeFacetOut,
)
from app.api.v1.schemas.product import ProductOut

CatalogSort = Literal["featured", "price-asc", "price-desc", "rating"]
StockFilter = Literal["all", "in", "out"]


def _on_sale(product: ProductOut) -> bool:
    return bool(
        product.compare_at_price is not None and product.compare_at_price > product.price
    )


def filter_products(
    products: list[ProductOut],
    *,
    stock: StockFilter,
    types: list[str],
    sale: bool,
) -> list[ProductOut]:
    out: list[ProductOut] = []
    for p in products:
        if stock == "in" and not p.in_stock:
            continue
        if stock == "out" and p.in_stock:
            continue
        if sale and not _on_sale(p):
            continue
        if types:
            type_set = [t for t in types if t and t != "all"]
            if type_set and not any(t in p.category_slugs for t in type_set):
                continue
        out.append(p)
    return out


def sort_products(products: list[ProductOut], sort: CatalogSort) -> list[ProductOut]:
    list_ = list(products)

    if sort == "price-asc":
        return sorted(list_, key=lambda p: (p.price, p.name.lower()))
    if sort == "price-desc":
        return sorted(list_, key=lambda p: (-p.price, p.name.lower()))
    if sort == "rating":
        return sorted(
            list_,
            key=lambda p: (-p.rating, -p.review_count, p.name.lower()),
        )
    # featured (default)
    return sorted(
        list_,
        key=lambda p: (
            -int(bool(p.featured)),
            -int(_on_sale(p)),
            -p.rating,
            -p.review_count,
        ),
    )


def build_facets(
    pool: list[ProductOut],
    type_meta: list[tuple[str, str]],
) -> CatalogFacetsOut:
    stock = StockFacetOut(
        in_=sum(1 for p in pool if p.in_stock),
        out=sum(1 for p in pool if not p.in_stock),
    )
    sale = sum(1 for p in pool if _on_sale(p))
    types: list[TypeFacetOut] = []
    for slug, name in type_meta:
        if slug == "all":
            continue
        count = sum(1 for p in pool if slug in p.category_slugs)
        if count > 0:
            types.append(TypeFacetOut(slug=slug, name=name, count=count))
    return CatalogFacetsOut(stock=stock, types=types, sale=sale)


def score_search(product: ProductOut, q: str) -> int:
    """Header autocomplete scoring — port of mock searchProducts."""
    name = product.name.lower()
    cat = (product.category_label or "").lower()
    short = product.short_description.lower()
    features = " ".join(product.features).lower()
    score = 0
    if name == q:
        score += 100
    elif name.startswith(q):
        score += 60
    elif q in name:
        score += 40
    if q in cat:
        score += 20
    if q in short:
        score += 12
    if q in features:
        score += 8
    tokens = [t for t in q.split() if t]
    if len(tokens) > 1:
        hay = f"{name} {cat} {short} {features}"
        if all(t in hay for t in tokens):
            score += 15
        else:
            score = 0
    return score
