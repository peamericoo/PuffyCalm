"""Admin-gated routes (RBAC). Orders = F/G; products = Phase H; media = Phase I."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
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
from app.application.media.service import (
    MediaNotFoundError,
    MediaServiceError,
    delete_media,
    upload_media,
)
from app.application.media.validation import MediaValidationError
from app.domain.order_rules import ALL_ORDER_STATUSES
from app.infrastructure.db.models import Order, Product, User

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
        in_stock=product.in_stock,
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
        images=images,
        category_slugs=_real_category_slugs(product),
        category_label=product.category_label,
        badges=list(product.badges or []),
        features=list(product.features or []),
        specs=specs,
        in_stock=product.in_stock,
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
