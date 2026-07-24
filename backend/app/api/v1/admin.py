"""Admin-gated routes (RBAC). Orders = F/G; products = Phase H; media = I; content = J."""

from __future__ import annotations

from typing import Annotated

import hmac
import os

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequireAdmin, RequireStaff, db_session
from app.api.v1.schemas.admin_media import (
    AdminMediaDeleteIn,
    AdminMediaDeleteOut,
    AdminMediaUploadOut,
)
from app.api.v1.schemas.admin_orders import (
    AdminOrderDetailOut,
    AdminOrderItemOut,
    AdminOrderListItemOut,
    AdminOrderListOut,
    AdminOrderPatchIn,
)
from app.api.v1.schemas.admin_products import (
    AdminProductCreateIn,
    AdminProductDetailOut,
    AdminProductImageOut,
    AdminProductListItemOut,
    AdminProductListOut,
    AdminProductSpecOut,
    AdminProductUpdateIn,
)
from app.api.v1.schemas.auth import AdminPingOut
from app.api.v1.schemas.admin_categories import (
    AdminCategoryCreateIn,
    AdminCategoryOut,
    AdminCategoryUpdateIn,
)
from app.api.v1.schemas.admin_reviews import AdminReviewCreateIn, AdminReviewOut
from app.api.v1.schemas.content import (
    HeroSlideOut,
    HomeContentIn,
    HomeContentOut,
    LifestyleTileOut,
    PromoSettingsOut,
)
from app.application.admin_categories.service import (
    AdminCategoryError,
    create_admin_category,
    list_admin_categories,
    update_admin_category,
)
from app.application.admin_dashboard.service import build_dashboard
from app.application.admin_orders.service import (
    AdminOrderNotFoundError,
    AdminOrderUpdateError,
    get_admin_order,
    list_admin_orders,
    update_admin_order,
)
from app.application.admin_products.service import (
    AdminProductConflictError,
    AdminProductNotFoundError,
    AdminProductValidationError,
    create_admin_product,
    get_admin_product,
    list_admin_products,
    publish_admin_product,
    unpublish_admin_product,
    update_admin_product,
)
from app.application.admin_reviews.service import (
    AdminReviewError,
    create_admin_review,
    delete_admin_review,
    list_admin_reviews,
)
from app.application.content.service import (
    ContentValidationError,
    get_home_content,
    update_home_content,
)
from app.application.media.service import (
    MediaNotFoundError,
    MediaServiceError,
    delete_media,
    upload_media,
)
from app.application.media.validation import MediaValidationError
from app.domain.order_rules import ALL_ORDER_STATUSES
from app.infrastructure.db.models import Order, Product

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping", response_model=AdminPingOut)
async def admin_ping(user: RequireStaff) -> AdminPingOut:
    """Any staff or admin — proves auth + RBAC wiring."""
    return AdminPingOut(
        status="ok",
        user_id=user.id,
        role=user.role,
        message="admin area reachable",
    )


@router.get("/dashboard")
async def admin_dashboard(
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
    days: Annotated[int, Query(ge=7, le=90)] = 30,
) -> dict:
    """
    Ops dashboard: revenue KPIs, order funnel, fulfillment queue,
    catalog health, daily series for charts.
    """
    _ = user
    return await build_dashboard(session, days=days)


@router.get("/only-admin", response_model=AdminPingOut)
async def only_admin(user: RequireAdmin) -> AdminPingOut:
    """Admin-only probe (staff → 403)."""
    return AdminPingOut(
        status="ok",
        user_id=user.id,
        role=user.role,
        message="admin-only endpoint",
    )


# ---------------------------------------------------------------------------
# Phase F — Admin orders API (staff + admin)
# ---------------------------------------------------------------------------


def _iso(dt: object | None) -> str | None:
    if dt is None:
        return None
    iso = getattr(dt, "isoformat", None)
    if callable(iso):
        return str(iso())
    return str(dt)


def _list_item(order: Order) -> AdminOrderListItemOut:
    return AdminOrderListItemOut(
        id=order.id,
        public_code=order.public_code,
        email=order.email,
        status=order.status,
        currency=order.currency or "USD",
        subtotal_cents=order.subtotal_cents,
        shipping_cents=order.shipping_cents,
        total_cents=order.total_cents,
        item_count=len(order.items) if order.items is not None else 0,
        paid_at=_iso(order.paid_at),
        created_at=_iso(order.created_at) or "",
        updated_at=_iso(order.updated_at) or "",
    )


def _detail(order: Order) -> AdminOrderDetailOut:
    return AdminOrderDetailOut(
        id=order.id,
        public_code=order.public_code,
        email=order.email,
        status=order.status,
        currency=order.currency or "USD",
        subtotal_cents=order.subtotal_cents,
        shipping_cents=order.shipping_cents,
        total_cents=order.total_cents,
        shipping_address=order.shipping_address or {},
        admin_notes=order.admin_notes,
        stripe_checkout_session_id=order.stripe_checkout_session_id,
        stripe_payment_intent_id=order.stripe_payment_intent_id,
        items=[
            AdminOrderItemOut(
                id=i.id,
                product_id=i.product_id,
                product_slug=i.product_slug,
                product_name=i.product_name,
                quantity=i.quantity,
                unit_price_cents=i.unit_price_cents,
                line_total_cents=i.line_total_cents,
                image_url=i.image_url or "",
            )
            for i in (order.items or [])
        ],
        paid_at=_iso(order.paid_at),
        created_at=_iso(order.created_at) or "",
        updated_at=_iso(order.updated_at) or "",
    )


@router.get("/orders", response_model=AdminOrderListOut)
async def admin_list_orders(
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
    status_filter: Annotated[
        str | None,
        Query(
            alias="status",
            description="Exact order status filter (optional)",
        ),
    ] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
) -> AdminOrderListOut:
    """List orders (newest first). Staff or admin."""
    _ = user
    if status_filter is not None and status_filter.strip():
        if status_filter.strip() not in ALL_ORDER_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": f"Unknown status filter: {status_filter}",
                    "code": "invalid_status",
                },
            )

    result = await list_admin_orders(
        session,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    return AdminOrderListOut(
        items=[_list_item(o) for o in result.items],
        page=result.page,
        page_size=result.page_size,
        total_items=result.total_items,
        total_pages=result.total_pages,
        has_next=result.has_next,
        has_prev=result.has_prev,
    )


@router.get("/orders/{order_id}", response_model=AdminOrderDetailOut)
async def admin_get_order(
    order_id: str,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminOrderDetailOut:
    """Order detail with items, shipping, payment ids, notes. Staff or admin."""
    _ = user
    try:
        order = await get_admin_order(session, order_id)
    except AdminOrderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(exc), "code": exc.code},
        ) from exc
    return _detail(order)


@router.patch("/orders/{order_id}", response_model=AdminOrderDetailOut)
async def admin_patch_order(
    order_id: str,
    body: AdminOrderPatchIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminOrderDetailOut:
    """
    Update status (allowed transitions only) and/or admin_notes.

    Payment statuses (paid/failed) are not set here — Stripe owns those.
    """
    _ = user
    fields = body.model_fields_set
    try:
        order = await update_admin_order(
            session,
            order_id,
            status=body.status,
            admin_notes=body.admin_notes,
            fields_set=fields,
        )
    except AdminOrderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(exc), "code": exc.code},
        ) from exc
    except AdminOrderUpdateError as exc:
        if exc.code == "illegal_status_transition":
            code = status.HTTP_409_CONFLICT
        elif exc.code == "empty_patch":
            code = status.HTTP_400_BAD_REQUEST
        else:
            code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=code,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return _detail(order)


# ---------------------------------------------------------------------------
# Phase H — Admin products API (staff + admin)
# ---------------------------------------------------------------------------


def _real_category_slugs(product: Product) -> list[str]:
    return [
        c.slug
        for c in (product.categories or [])
        if not c.is_virtual and c.slug != "all"
    ]


def _product_list_item(product: Product) -> AdminProductListItemOut:
    return AdminProductListItemOut(
        id=product.id,
        slug=product.slug,
        name=product.name,
        status=product.status,
        price=float(product.price),
        currency=product.currency or "USD",
        image_url=product.image_url or "",
        supplier_url=product.supplier_url or "",
        in_stock=product.in_stock,
        stock_qty=int(product.stock_qty or 0),
        featured=bool(product.featured),
        category_slugs=_real_category_slugs(product),
        published_at=_iso(product.published_at),
        created_at=_iso(product.created_at) or "",
        updated_at=_iso(product.updated_at) or "",
    )


def _product_detail(product: Product) -> AdminProductDetailOut:
    images = [
        AdminProductImageOut(url=img.url, sort_order=img.sort_order)
        for img in (product.images or [])
    ]
    specs = [
        AdminProductSpecOut(label=s.label, value=s.value, sort_order=s.sort_order)
        for s in (product.specs or [])
    ]
    compare = (
        float(product.compare_at_price) if product.compare_at_price is not None else None
    )
    return AdminProductDetailOut(
        id=product.id,
        slug=product.slug,
        name=product.name,
        status=product.status,
        short_description=product.short_description or "",
        description=product.description or "",
        price=float(product.price),
        compare_at_price=compare,
        currency=product.currency or "USD",
        image_url=product.image_url or "",
        image_alt=product.image_alt or "",
        supplier_url=product.supplier_url or "",
        images=images,
        category_slugs=_real_category_slugs(product),
        category_label=product.category_label,
        badges=list(product.badges or []),
        features=list(product.features or []),
        specs=specs,
        in_stock=product.in_stock,
        stock_qty=int(product.stock_qty or 0),
        featured=bool(product.featured),
        max_quantity_per_order=product.max_quantity_per_order,
        purchase_limit_per_customer=product.purchase_limit_per_customer,
        seo_title=product.seo_title,
        seo_description=product.seo_description,
        rating=float(product.rating or 0),
        review_count=int(product.review_count or 0),
        published_at=_iso(product.published_at),
        created_at=_iso(product.created_at) or "",
        updated_at=_iso(product.updated_at) or "",
    )


def _raise_product_http(exc: Exception) -> None:
    if isinstance(exc, AdminProductNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(exc), "code": exc.code},
        ) from exc
    if isinstance(exc, AdminProductConflictError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    if isinstance(exc, AdminProductValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    raise exc


@router.get("/products", response_model=AdminProductListOut)
async def admin_list_products(
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
    status_filter: Annotated[
        str | None,
        Query(alias="status", description="draft | published | archived"),
    ] = None,
    q: Annotated[
        str | None,
        Query(description="Search name, slug, or product id"),
    ] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
) -> AdminProductListOut:
    """List products (all statuses). Staff or admin."""
    _ = user
    try:
        result = await list_admin_products(
            session,
            status=status_filter,
            q=q,
            page=page,
            page_size=page_size,
        )
    except AdminProductValidationError as exc:
        _raise_product_http(exc)
        raise  # unreachable; satisfies type checker
    return AdminProductListOut(
        items=[_product_list_item(p) for p in result.items],
        page=result.page,
        page_size=result.page_size,
        total_items=result.total_items,
        total_pages=result.total_pages,
        has_next=result.has_next,
        has_prev=result.has_prev,
    )


@router.get("/products/{product_id}", response_model=AdminProductDetailOut)
async def admin_get_product(
    product_id: str,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminProductDetailOut:
    """Product detail including draft/archived. Staff or admin."""
    _ = user
    try:
        product = await get_admin_product(session, product_id)
    except AdminProductNotFoundError as exc:
        _raise_product_http(exc)
        raise
    return _product_detail(product)


@router.post(
    "/products",
    response_model=AdminProductDetailOut,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_product(
    body: AdminProductCreateIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminProductDetailOut:
    """
    Create product (default status draft).

    Optional ``id`` is the SKU-like primary key; auto-generated if omitted.
    Images are URL + order only (binary upload = Phase I).
    """
    _ = user
    payload = body.model_dump(by_alias=False)
    # Normalize nested models to plain dicts for service
    payload["images"] = [{"url": i.url} for i in body.images]
    payload["specs"] = [{"label": s.label, "value": s.value} for s in body.specs]
    try:
        product = await create_admin_product(session, data=payload)
    except (
        AdminProductConflictError,
        AdminProductValidationError,
    ) as exc:
        _raise_product_http(exc)
        raise
    return _product_detail(product)


@router.patch("/products/{product_id}", response_model=AdminProductDetailOut)
async def admin_update_product(
    product_id: str,
    body: AdminProductUpdateIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminProductDetailOut:
    """Partial update. Nested images/specs fully replace when provided."""
    _ = user
    fields = set(body.model_fields_set)
    payload = body.model_dump(by_alias=False, exclude_unset=True)
    if "images" in fields and body.images is not None:
        payload["images"] = [{"url": i.url} for i in body.images]
    if "specs" in fields and body.specs is not None:
        payload["specs"] = [{"label": s.label, "value": s.value} for s in body.specs]
    try:
        product = await update_admin_product(
            session,
            product_id,
            data=payload,
            fields_set=fields,
        )
    except (
        AdminProductNotFoundError,
        AdminProductConflictError,
        AdminProductValidationError,
    ) as exc:
        _raise_product_http(exc)
        raise
    return _product_detail(product)


@router.post("/products/{product_id}/publish", response_model=AdminProductDetailOut)
async def admin_publish_product(
    product_id: str,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminProductDetailOut:
    """Set status=published → visible on storefront catalog."""
    _ = user
    try:
        product = await publish_admin_product(session, product_id)
    except (
        AdminProductNotFoundError,
        AdminProductValidationError,
    ) as exc:
        _raise_product_http(exc)
        raise
    return _product_detail(product)


@router.post("/products/{product_id}/unpublish", response_model=AdminProductDetailOut)
async def admin_unpublish_product(
    product_id: str,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminProductDetailOut:
    """Set status=draft → removed from public catalog/search/PDP."""
    _ = user
    try:
        product = await unpublish_admin_product(session, product_id)
    except AdminProductNotFoundError as exc:
        _raise_product_http(exc)
        raise
    return _product_detail(product)


# ---------------------------------------------------------------------------
# Phase I — Admin media upload (staff + admin)
# ---------------------------------------------------------------------------


@router.post(
    "/media",
    response_model=AdminMediaUploadOut,
    status_code=status.HTTP_201_CREATED,
)
async def admin_upload_media(
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
    file: Annotated[UploadFile, File(description="Image file (jpeg/png/webp/gif)")],
    product_id: Annotated[
        str | None,
        Form(alias="productId", description="Optional product id to append gallery"),
    ] = None,
    set_cover: Annotated[
        bool,
        Form(alias="setCover", description="Set as product cover image_url"),
    ] = False,
) -> AdminMediaUploadOut:
    """
    Multipart upload → object storage → public URL.

    Optional ``productId`` appends a ``product_images`` row and may set cover.
    """
    _ = user
    raw = await file.read()
    try:
        result = await upload_media(
            session,
            data=raw,
            declared_content_type=file.content_type,
            product_id=product_id,
            set_cover=set_cover,
        )
    except MediaValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    except MediaNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    except MediaServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return AdminMediaUploadOut(
        key=result.key,
        url=result.url,
        content_type=result.content_type,
        size_bytes=result.size_bytes,
        product_id=result.product_id,
        sort_order=result.sort_order,
        set_cover=result.set_cover,
    )


@router.post(
    "/media/internal",
    response_model=AdminMediaUploadOut,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,  # hide from public docs
)
async def admin_upload_media_internal(
    session: Annotated[AsyncSession, Depends(db_session)],
    file: Annotated[UploadFile, File(description="Image file (jpeg/png/webp/gif)")],
    x_internal_upload_key: Annotated[str | None, Header()] = None,
    product_id: Annotated[
        str | None,
        Form(alias="productId", description="Optional product id to append gallery"),
    ] = None,
    set_cover: Annotated[
        bool,
        Form(alias="setCover", description="Set as product cover image_url"),
    ] = False,
) -> AdminMediaUploadOut:
    """
    Internal-only multipart upload called by the Next.js server proxy.

    Authenticated via the ``X-Internal-Upload-Key`` header (shared secret
    between the web and api Railway services). No JWT cookie required —
    the Next.js server validates the admin Auth.js session before forwarding.
    """
    expected = os.environ.get("INTERNAL_UPLOAD_KEY", "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "Internal upload not configured", "code": "not_configured"},
        )
    provided = (x_internal_upload_key or "").strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid internal key", "code": "invalid_key"},
        )

    raw = await file.read()
    try:
        result = await upload_media(
            session,
            data=raw,
            declared_content_type=file.content_type,
            product_id=product_id,
            set_cover=set_cover,
        )
    except MediaValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    except MediaNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    except MediaServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return AdminMediaUploadOut(
        key=result.key,
        url=result.url,
        content_type=result.content_type,
        size_bytes=result.size_bytes,
        product_id=result.product_id,
        sort_order=result.sort_order,
        set_cover=result.set_cover,
    )


@router.delete("/media", response_model=AdminMediaDeleteOut)
async def admin_delete_media(
    body: AdminMediaDeleteIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminMediaDeleteOut:
    """
    Delete storage object (if owned) and detach matching product_images rows.

    Provide ``key`` and/or ``url``.
    """
    _ = user
    try:
        result = await delete_media(
            session,
            key=body.key,
            url=body.url,
        )
    except MediaValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    except MediaServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return AdminMediaDeleteOut(
        deleted=bool(result.get("deleted")),
        key=result.get("key") if isinstance(result.get("key"), str) else None,
        url=result.get("url") if isinstance(result.get("url"), str) else None,
        storage_deleted=bool(result.get("storageDeleted")),
        images_removed=int(result.get("imagesRemoved") or 0),
        products_touched=int(result.get("productsTouched") or 0),
    )


# ---------------------------------------------------------------------------
# Phase J — CMS-lite home content (promo ticker + hero slides)
# ---------------------------------------------------------------------------


def _home_content_out(data: dict) -> HomeContentOut:
    settings = data.get("promoSettings") or data.get("promo_settings") or {}
    if not isinstance(settings, dict):
        settings = {}
    slides: list[HeroSlideOut] = []
    for s in data.get("heroSlides") or []:
        if not isinstance(s, dict):
            continue
        slides.append(
            HeroSlideOut(
                id=str(s.get("id") or ""),
                title_line1=str(s.get("titleLine1") or s.get("title_line1") or ""),
                title_line2=str(s.get("titleLine2") or s.get("title_line2") or ""),
                title_accent=s.get("titleAccent") or s.get("title_accent"),
                subtitle=str(s.get("subtitle") or ""),
                cta_label=str(s.get("ctaLabel") or s.get("cta_label") or ""),
                cta_href=str(s.get("ctaHref") or s.get("cta_href") or ""),
                secondary_label=s.get("secondaryLabel") or s.get("secondary_label"),
                secondary_href=s.get("secondaryHref") or s.get("secondary_href"),
                image_url=str(s.get("imageUrl") or s.get("image_url") or ""),
                image_alt=str(s.get("imageAlt") or s.get("image_alt") or ""),
            )
        )
    lifestyle: list[LifestyleTileOut] = []
    for t in data.get("lifestyleCollections") or data.get("lifestyle_collections") or []:
        if not isinstance(t, dict):
            continue
        lifestyle.append(
            LifestyleTileOut(
                id=str(t.get("id") or ""),
                title=str(t.get("title") or ""),
                href=str(t.get("href") or ""),
                image_url=str(t.get("imageUrl") or t.get("image_url") or ""),
                span=str(t.get("span") or "square"),
            )
        )
    return HomeContentOut(
        promo_messages=list(data.get("promoMessages") or []),
        promo_settings=PromoSettingsOut(
            speed_seconds=int(
                settings.get("speedSeconds") or settings.get("speed_seconds") or 32
            ),
            color=str(settings.get("color") or "#3a7ca5"),
        ),
        hero_slides=slides,
        lifestyle_collections=lifestyle,
        updated_at=data.get("updatedAt"),
    )


def _category_out(cat: object) -> AdminCategoryOut:
    return AdminCategoryOut(
        id=str(getattr(cat, "id", "")),
        slug=str(getattr(cat, "slug", "")),
        name=str(getattr(cat, "name", "")),
        description=str(getattr(cat, "description", "") or ""),
        tagline=str(getattr(cat, "tagline", "") or ""),
        image_url=str(getattr(cat, "image_url", "") or ""),
        cta_label=str(getattr(cat, "cta_label", "") or "Shop"),
        is_virtual=bool(getattr(cat, "is_virtual", False)),
        sort_order=int(getattr(cat, "sort_order", 0) or 0),
    )


def _review_out(r: object) -> AdminReviewOut:
    created = getattr(r, "created_at", None)
    created_s = created.isoformat() if created is not None else ""
    tags = getattr(r, "tags", None) or []
    if not isinstance(tags, list):
        tags = []
    return AdminReviewOut(
        id=str(getattr(r, "id", "")),
        product_id=str(getattr(r, "product_id", "")),
        author=str(getattr(r, "author", "")),
        initials=str(getattr(r, "initials", "") or ""),
        rating=int(getattr(r, "rating", 0) or 0),
        title=str(getattr(r, "title", "") or ""),
        body=str(getattr(r, "body", "") or ""),
        date_label=str(getattr(r, "date_label", "") or ""),
        verified=bool(getattr(r, "verified", False)),
        helpful=int(getattr(r, "helpful", 0) or 0),
        tags=[str(t) for t in tags if t],
        featured=bool(getattr(r, "featured", False)),
        created_at=created_s,
    )


@router.get("/content/home", response_model=HomeContentOut)
async def admin_get_home_content(
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> HomeContentOut:
    """Staff: read editable home promo + hero + lifestyle content."""
    _ = user
    data = await get_home_content(session)
    return _home_content_out(data)


@router.put("/content/home", response_model=HomeContentOut)
async def admin_put_home_content(
    body: HomeContentIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> HomeContentOut:
    """Staff: replace home promo + hero + lifestyle (full payload)."""
    _ = user
    raw = {
        "promoMessages": body.promo_messages,
        "promoSettings": {
            "speedSeconds": body.promo_settings.speed_seconds,
            "color": body.promo_settings.color,
        },
        "heroSlides": [
            {
                "id": s.id,
                "titleLine1": s.title_line1,
                "titleLine2": s.title_line2,
                "titleAccent": s.title_accent,
                "subtitle": s.subtitle,
                "ctaLabel": s.cta_label,
                "ctaHref": s.cta_href,
                "secondaryLabel": s.secondary_label,
                "secondaryHref": s.secondary_href,
                "imageUrl": s.image_url,
                "imageAlt": s.image_alt,
            }
            for s in body.hero_slides
        ],
        "lifestyleCollections": [
            {
                "id": t.id,
                "title": t.title,
                "href": t.href,
                "imageUrl": t.image_url,
                "span": t.span,
            }
            for t in body.lifestyle_collections
        ],
    }
    try:
        data = await update_home_content(session, raw)
    except ContentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return _home_content_out(data)


# ---------------------------------------------------------------------------
# Categories — Shop by Mood / Filters cover images
# ---------------------------------------------------------------------------


@router.get("/categories", response_model=list[AdminCategoryOut])
async def admin_list_categories(
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> list[AdminCategoryOut]:
    _ = user
    cats = await list_admin_categories(session)
    return [_category_out(c) for c in cats]


@router.post(
    "/categories",
    response_model=AdminCategoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_category(
    body: AdminCategoryCreateIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminCategoryOut:
    _ = user
    try:
        cat = await create_admin_category(
            session,
            slug=body.slug,
            name=body.name,
            tagline=body.tagline,
            description=body.description,
            image_url=body.image_url,
            cta_label=body.cta_label,
            is_virtual=body.is_virtual,
        )
    except AdminCategoryError as exc:
        code = (
            status.HTTP_404_NOT_FOUND
            if exc.code == "not_found"
            else status.HTTP_409_CONFLICT
            if exc.code == "slug_taken"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=code,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return _category_out(cat)


@router.patch("/categories/{category_id}", response_model=AdminCategoryOut)
async def admin_patch_category(
    category_id: str,
    body: AdminCategoryUpdateIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminCategoryOut:
    _ = user
    data = body.model_dump(by_alias=False, exclude_unset=True)
    try:
        cat = await update_admin_category(session, category_id, data)
    except AdminCategoryError as exc:
        code = (
            status.HTTP_404_NOT_FOUND
            if exc.code == "not_found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=code,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return _category_out(cat)


# ---------------------------------------------------------------------------
# Product reviews (replace seed demo reviews)
# ---------------------------------------------------------------------------


@router.get(
    "/products/{product_id}/reviews",
    response_model=list[AdminReviewOut],
)
async def admin_list_product_reviews(
    product_id: str,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> list[AdminReviewOut]:
    _ = user
    try:
        rows = await list_admin_reviews(session, product_id)
    except AdminReviewError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return [_review_out(r) for r in rows]


@router.post(
    "/products/{product_id}/reviews",
    response_model=AdminReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_product_review(
    product_id: str,
    body: AdminReviewCreateIn,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> AdminReviewOut:
    _ = user
    try:
        review = await create_admin_review(
            session,
            product_id,
            body.model_dump(by_alias=False),
        )
    except AdminReviewError as exc:
        code = (
            status.HTTP_404_NOT_FOUND
            if exc.code == "not_found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=code,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
    return _review_out(review)


@router.delete(
    "/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def admin_delete_review(
    review_id: str,
    user: RequireStaff,
    session: Annotated[AsyncSession, Depends(db_session)],
) -> None:
    _ = user
    try:
        await delete_admin_review(session, review_id)
    except AdminReviewError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": exc.message, "code": exc.code},
        ) from exc
