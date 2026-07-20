"""ORM → API schema mappers (camelCase Product / Category)."""

from __future__ import annotations

from app.api.v1.schemas.catalog import CategoryOut
from app.api.v1.schemas.product import ProductOut, ProductSpecOut
from app.infrastructure.db.models import Category, Product


def category_slugs_for_product(product: Product) -> list[str]:
    """Real category slugs + virtual `all` (FE still expects it)."""
    real = [c.slug for c in product.categories if not c.is_virtual and c.slug != "all"]
    # Stable order: real slugs as loaded, then all
    seen: set[str] = set()
    ordered: list[str] = []
    for s in real:
        if s not in seen:
            seen.add(s)
            ordered.append(s)
    if "all" not in seen:
        ordered.append("all")
    return ordered


def product_to_out(product: Product, *, include_specs: bool = True) -> ProductOut:
    images = [img.url for img in product.images]
    if not images and product.image_url:
        images = [product.image_url]

    specs: list[ProductSpecOut] | None = None
    if include_specs and product.specs:
        specs = [ProductSpecOut(label=s.label, value=s.value) for s in product.specs]
    elif include_specs:
        specs = []

    badges = list(product.badges) if product.badges else None
    compare = float(product.compare_at_price) if product.compare_at_price is not None else None

    return ProductOut(
        id=product.id,
        slug=product.slug,
        name=product.name,
        short_description=product.short_description,
        description=product.description,
        price=float(product.price),
        compare_at_price=compare,
        currency="USD",
        category_slugs=category_slugs_for_product(product),
        image_url=product.image_url or (images[0] if images else ""),
        images=images,
        image_alt=product.image_alt,
        rating=float(product.rating),
        review_count=product.review_count,
        badges=badges,
        features=list(product.features or []),
        specs=specs,
        in_stock=product.in_stock,
        featured=product.featured,
        category_label=product.category_label,
    )


def category_to_out(category: Category, product_count: int) -> CategoryOut:
    return CategoryOut(
        id=category.id,
        slug=category.slug,
        name=category.name,
        description=category.description,
        tagline=category.tagline,
        image_url=category.image_url,
        cta_label=category.cta_label,
        product_count=product_count,
    )
