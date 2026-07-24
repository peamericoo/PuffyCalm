"""Admin product CRUD + publish lifecycle (Phase H)."""

from __future__ import annotations

import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from math import ceil

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.checkout.inventory import DEFAULT_STOCK_QTY, sync_in_stock_flag
from app.domain.product_rules import ProductStatus
from app.infrastructure.db.models import Category, Product, ProductImage, ProductSpec

_PRODUCT_LOAD = (
    selectinload(Product.categories),
    selectinload(Product.images),
    selectinload(Product.specs),
)

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{1,62}[a-zA-Z0-9]$")
_ALL_STATUSES = frozenset(s.value for s in ProductStatus)

# Minimum sellable price (USD major units). Stripe min is $0.50; allow draft free? No — gt 0.
_MIN_PRICE = Decimal("0.01")
_MAX_PRICE = Decimal("99999.99")


class AdminProductNotFoundError(Exception):
    code = "product_not_found"

    def __init__(self, product_id: str) -> None:
        self.product_id = product_id
        super().__init__(f"Product not found: {product_id}")


class AdminProductConflictError(Exception):
    def __init__(self, message: str, *, code: str) -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class AdminProductValidationError(Exception):
    def __init__(self, message: str, *, code: str = "validation_error") -> None:
        self.message = message
        self.code = code
        super().__init__(message)


@dataclass(frozen=True)
class AdminProductListResult:
    items: list[Product]
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


def _to_decimal_price(value: float | Decimal | None, *, field: str) -> Decimal | None:
    if value is None:
        return None
    try:
        d = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError) as exc:
        raise AdminProductValidationError(
            f"Invalid {field}",
            code="invalid_price",
        ) from exc
    if d < _MIN_PRICE or d > _MAX_PRICE:
        raise AdminProductValidationError(
            f"{field} must be between {_MIN_PRICE} and {_MAX_PRICE}",
            code="invalid_price",
        )
    return d


def _validate_slug(slug: str) -> str:
    s = slug.strip().lower()
    if not s or not _SLUG_RE.match(s):
        raise AdminProductValidationError(
            "slug must be lowercase alphanumeric with hyphens "
            "(e.g. shiatsu-neck-massager)",
            code="invalid_slug",
        )
    if len(s) > 255:
        raise AdminProductValidationError("slug too long", code="invalid_slug")
    return s


def _validate_product_id(product_id: str) -> str:
    """Product id is the stable SKU-like key (no separate sku column)."""
    s = product_id.strip()
    if not s or not _ID_RE.match(s):
        raise AdminProductValidationError(
            "id must be 3–64 chars alphanumeric/underscore/hyphen "
            "(SKU-like primary key)",
            code="invalid_sku",
        )
    return s


def _generate_product_id() -> str:
    return f"prod_{secrets.token_hex(6)}"


async def _slug_taken(
    session: AsyncSession,
    slug: str,
    *,
    exclude_id: str | None = None,
) -> bool:
    q = select(Product.id).where(Product.slug == slug)
    if exclude_id:
        q = q.where(Product.id != exclude_id)
    return (await session.scalar(q)) is not None


async def _id_taken(session: AsyncSession, product_id: str) -> bool:
    return (await session.scalar(select(Product.id).where(Product.id == product_id))) is not None


async def _resolve_categories(
    session: AsyncSession,
    slugs: list[str],
) -> list[Category]:
    if not slugs:
        return []
    # Reject virtual "all" — M2M is only real categories
    clean = [s for s in slugs if s and s != "all"]
    if not clean:
        return []
    result = await session.execute(
        select(Category).where(
            Category.slug.in_(clean),
            Category.is_virtual.is_(False),
        )
    )
    found = list(result.scalars().all())
    found_slugs = {c.slug for c in found}
    missing = [s for s in clean if s not in found_slugs]
    if missing:
        raise AdminProductValidationError(
            f"Unknown category slug(s): {', '.join(missing)}",
            code="invalid_category",
        )
    # Preserve request order
    by_slug = {c.slug: c for c in found}
    return [by_slug[s] for s in clean if s in by_slug]


def _set_images(product: Product, urls: list[str]) -> None:
    product.images.clear()
    for i, url in enumerate(urls):
        u = url.strip()
        if not u:
            continue
        product.images.append(ProductImage(url=u, sort_order=i))
    if product.images and not (product.image_url or "").strip():
        product.image_url = product.images[0].url


def _set_specs(product: Product, specs: list[tuple[str, str]]) -> None:
    product.specs.clear()
    for i, (label, value) in enumerate(specs):
        product.specs.append(
            ProductSpec(label=label.strip(), value=value.strip(), sort_order=i)
        )


def _apply_status_side_effects(product: Product, new_status: str) -> None:
    if new_status not in _ALL_STATUSES:
        raise AdminProductValidationError(
            f"Unknown status: {new_status}",
            code="invalid_status",
        )
    old = product.status
    product.status = new_status
    if new_status == ProductStatus.published.value:
        if product.published_at is None or old != ProductStatus.published.value:
            product.published_at = datetime.now(UTC)
    # draft / archived keep published_at history if ever published


async def list_admin_products(
    session: AsyncSession,
    *,
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> AdminProductListResult:
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    filters = []
    if status and status.strip():
        st = status.strip()
        if st not in _ALL_STATUSES:
            raise AdminProductValidationError(
                f"Unknown status filter: {st}",
                code="invalid_status",
            )
        filters.append(Product.status == st)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        filters.append(
            or_(
                func.lower(Product.name).like(term),
                func.lower(Product.slug).like(term),
                func.lower(Product.id).like(term),
            )
        )

    count_q = select(func.count()).select_from(Product)
    list_q = select(Product).options(*_PRODUCT_LOAD).order_by(
        Product.updated_at.desc(),
        Product.id,
    )
    if filters:
        for f in filters:
            count_q = count_q.where(f)
            list_q = list_q.where(f)

    total_items = int(await session.scalar(count_q) or 0)
    total_pages = max(1, ceil(total_items / page_size)) if total_items else 1
    if page > total_pages:
        page = total_pages

    offset = (page - 1) * page_size
    result = await session.execute(list_q.offset(offset).limit(page_size))
    items = list(result.scalars().unique().all())

    return AdminProductListResult(
        items=items,
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


async def get_admin_product(session: AsyncSession, product_id: str) -> Product:
    result = await session.execute(
        select(Product).where(Product.id == product_id).options(*_PRODUCT_LOAD)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise AdminProductNotFoundError(product_id)
    return product


async def create_admin_product(
    session: AsyncSession,
    *,
    data: dict,
) -> Product:
    """
    Create product.

    ``data`` keys use snake_case (from schema dump).
    Optional ``id`` is the SKU-like primary key; auto-generated if missing.
    """
    slug = _validate_slug(str(data["slug"]))
    if await _slug_taken(session, slug):
        raise AdminProductConflictError(
            f"Slug already in use: {slug}",
            code="slug_conflict",
        )

    raw_id = data.get("id")
    if raw_id:
        product_id = _validate_product_id(str(raw_id))
        if await _id_taken(session, product_id):
            raise AdminProductConflictError(
                f"Product id (SKU) already in use: {product_id}",
                code="sku_conflict",
            )
    else:
        product_id = _generate_product_id()
        while await _id_taken(session, product_id):
            product_id = _generate_product_id()

    price = _to_decimal_price(data.get("price"), field="price")
    assert price is not None
    compare = data.get("compare_at_price")
    compare_dec = (
        _to_decimal_price(compare, field="compareAtPrice") if compare is not None else None
    )

    status = str(data.get("status") or ProductStatus.draft.value)
    if status not in _ALL_STATUSES:
        raise AdminProductValidationError(
            f"Unknown status: {status}",
            code="invalid_status",
        )

    image_urls = [
        img["url"] if isinstance(img, dict) else getattr(img, "url", str(img))
        for img in (data.get("images") or [])
    ]
    image_url = (data.get("image_url") or "").strip()
    if not image_url and image_urls:
        image_url = image_urls[0]

    # Resolve M2M + nested rows BEFORE flush so async session never lazy-loads
    # (MissingGreenlet if relationship access happens after expire/flush).
    cats = await _resolve_categories(session, list(data.get("category_slugs") or []))
    specs_raw = data.get("specs") or []
    specs: list[tuple[str, str]] = []
    for s in specs_raw:
        if isinstance(s, dict):
            specs.append((str(s["label"]), str(s["value"])))
        else:
            specs.append((str(s.label), str(s.value)))

    product = Product(
        id=product_id,
        slug=slug,
        name=str(data.get("name") or "").strip(),
        short_description=str(data.get("short_description") or ""),
        description=str(data.get("description") or ""),
        price=price,
        compare_at_price=compare_dec,
        currency=str(data.get("currency") or "USD").upper()[:3],
        image_url=image_url,
        image_alt=str(data.get("image_alt") or data.get("name") or ""),
        badges=list(data.get("badges") or []),
        features=list(data.get("features") or []),
        in_stock=bool(data.get("in_stock", True)),
        stock_qty=max(0, int(data.get("stock_qty") if data.get("stock_qty") is not None else DEFAULT_STOCK_QTY)),
        featured=bool(data.get("featured", False)),
        category_label=data.get("category_label"),
        status=ProductStatus.draft.value,  # set via side effects below
        max_quantity_per_order=int(data.get("max_quantity_per_order") or 9),
        purchase_limit_per_customer=data.get("purchase_limit_per_customer"),
        seo_title=data.get("seo_title"),
        seo_description=data.get("seo_description"),
        rating=Decimal("0"),
        review_count=0,
    )
    # Keep flags coherent: in_stock true with qty 0 → bump to 1; qty 0 → OOS
    if product.in_stock and product.stock_qty < 1:
        product.stock_qty = 1
    if product.stock_qty < 1:
        product.in_stock = False
    product.categories = cats
    for i, url in enumerate(image_urls):
        u = str(url).strip()
        if u:
            product.images.append(ProductImage(url=u, sort_order=i))
    if product.images and not (product.image_url or "").strip():
        product.image_url = product.images[0].url
    for i, (label, value) in enumerate(specs):
        product.specs.append(
            ProductSpec(label=label.strip(), value=value.strip(), sort_order=i)
        )

    _apply_status_side_effects(product, status)
    session.add(product)
    await session.commit()
    return await get_admin_product(session, product_id)


async def update_admin_product(
    session: AsyncSession,
    product_id: str,
    *,
    data: dict,
    fields_set: set[str],
) -> Product:
    if not fields_set:
        raise AdminProductValidationError(
            "Provide at least one field to update",
            code="empty_patch",
        )

    product = await get_admin_product(session, product_id)

    if "slug" in fields_set and data.get("slug") is not None:
        slug = _validate_slug(str(data["slug"]))
        if await _slug_taken(session, slug, exclude_id=product.id):
            raise AdminProductConflictError(
                f"Slug already in use: {slug}",
                code="slug_conflict",
            )
        product.slug = slug

    if "name" in fields_set and data.get("name") is not None:
        product.name = str(data["name"]).strip()
    if "short_description" in fields_set:
        product.short_description = str(data.get("short_description") or "")
    if "description" in fields_set:
        product.description = str(data.get("description") or "")
    if "price" in fields_set and data.get("price") is not None:
        product.price = _to_decimal_price(data["price"], field="price")  # type: ignore[assignment]
    if "compare_at_price" in fields_set:
        cap = data.get("compare_at_price")
        product.compare_at_price = (
            _to_decimal_price(cap, field="compareAtPrice") if cap is not None else None
        )
    if "image_url" in fields_set:
        product.image_url = str(data.get("image_url") or "")
    if "image_alt" in fields_set:
        product.image_alt = str(data.get("image_alt") or "")
    if "category_label" in fields_set:
        product.category_label = data.get("category_label")
    if "badges" in fields_set and data.get("badges") is not None:
        product.badges = list(data["badges"])
    if "features" in fields_set and data.get("features") is not None:
        product.features = list(data["features"])
    if "stock_qty" in fields_set and data.get("stock_qty") is not None:
        product.stock_qty = max(0, int(data["stock_qty"]))
        sync_in_stock_flag(product)
        # Restock: qty > 0 with only stock_qty patch → mark sellable again
        if product.stock_qty > 0 and "in_stock" not in fields_set:
            product.in_stock = True
    if "in_stock" in fields_set and data.get("in_stock") is not None:
        product.in_stock = bool(data["in_stock"])
        if product.in_stock and product.stock_qty < 1:
            product.stock_qty = 1
        if not product.in_stock:
            # Soft hold: leave stock_qty as-is for ops visibility
            pass
    if "featured" in fields_set and data.get("featured") is not None:
        product.featured = bool(data["featured"])
    if "max_quantity_per_order" in fields_set and data.get("max_quantity_per_order") is not None:
        product.max_quantity_per_order = int(data["max_quantity_per_order"])
    if "purchase_limit_per_customer" in fields_set:
        product.purchase_limit_per_customer = data.get("purchase_limit_per_customer")
    if "seo_title" in fields_set:
        product.seo_title = data.get("seo_title")
    if "seo_description" in fields_set:
        product.seo_description = data.get("seo_description")

    if "category_slugs" in fields_set and data.get("category_slugs") is not None:
        product.categories = await _resolve_categories(
            session,
            list(data["category_slugs"]),
        )

    if "images" in fields_set and data.get("images") is not None:
        new_urls = [
            str(
                img["url"] if isinstance(img, dict) else getattr(img, "url", str(img))
            ).strip()
            for img in data["images"]
        ]
        new_urls = [u for u in new_urls if u]
        old_urls = [i.url for i in (product.images or []) if i.url]
        orphaned = [u for u in old_urls if u not in set(new_urls)]

        # Flush orphan removals before inserting the replacement gallery.  PostgreSQL
        # enforces (product_id, sort_order) immediately, whereas SQLAlchemy may try
        # to INSERT the new rows before deleting the cleared relationship rows.
        # That made product saves after an upload fail with a 500 / "Failed to fetch".
        product.images.clear()
        await session.flush()
        _set_images(product, new_urls)
        # Phase I: best-effort delete owned S3/local objects no longer referenced
        if orphaned:
            from app.application.media.service import delete_owned_urls

            delete_owned_urls(urls=orphaned)

    if "specs" in fields_set and data.get("specs") is not None:
        specs: list[tuple[str, str]] = []
        for s in data["specs"]:
            if isinstance(s, dict):
                specs.append((str(s["label"]), str(s["value"])))
            else:
                specs.append((str(s.label), str(s.value)))
        _set_specs(product, specs)

    if "status" in fields_set and data.get("status") is not None:
        _apply_status_side_effects(product, str(data["status"]))

    await session.commit()
    return await get_admin_product(session, product_id)


async def publish_admin_product(session: AsyncSession, product_id: str) -> Product:
    product = await get_admin_product(session, product_id)
    # Minimal publish validation
    if float(product.price) <= 0:
        raise AdminProductValidationError(
            "Cannot publish product with invalid price",
            code="invalid_price",
        )
    if not (product.slug or "").strip():
        raise AdminProductValidationError(
            "Cannot publish product without slug",
            code="invalid_slug",
        )
    if not (product.name or "").strip():
        raise AdminProductValidationError(
            "Cannot publish product without name",
            code="validation_error",
        )
    _apply_status_side_effects(product, ProductStatus.published.value)
    await session.commit()
    return await get_admin_product(session, product_id)


async def unpublish_admin_product(session: AsyncSession, product_id: str) -> Product:
    """Move to draft — disappears from public catalog (status filter published only)."""
    product = await get_admin_product(session, product_id)
    _apply_status_side_effects(product, ProductStatus.draft.value)
    await session.commit()
    return await get_admin_product(session, product_id)
