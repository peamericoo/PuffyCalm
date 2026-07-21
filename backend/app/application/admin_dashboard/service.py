"""Admin ops dashboard aggregates — sales, funnel, catalog, fulfillment."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.db.models import Order, OrderItem, Product, Review, User

# Money-making statuses for dropshipping revenue
REVENUE_STATUSES = frozenset(
    {"paid", "processing", "shipped", "delivered"}
)
# Needs operator action to buy/ship
FULFILL_QUEUE = frozenset({"paid", "processing"})
# Open checkout / not paid
OPEN_CHECKOUT = frozenset({"pending", "requires_payment"})


def _day_key(dt: datetime | None) -> str:
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC).date().isoformat()


async def build_dashboard(
    session: AsyncSession,
    *,
    days: int = 30,
) -> dict[str, Any]:
    days = max(7, min(days, 90))
    now = datetime.now(UTC)
    since = now - timedelta(days=days)
    since_7 = now - timedelta(days=7)

    # --- Orders (load window for series + all-time counts) ---
    status_rows = (
        await session.execute(
            select(Order.status, func.count(Order.id)).group_by(Order.status)
        )
    ).all()
    by_status: dict[str, int] = {str(s): int(c) for s, c in status_rows}
    total_orders = sum(by_status.values())

    # Revenue all-time from paid pipeline
    rev_all = await session.scalar(
        select(func.coalesce(func.sum(Order.total_cents), 0)).where(
            Order.status.in_(REVENUE_STATUSES)
        )
    )
    rev_all = int(rev_all or 0)

    paid_count = await session.scalar(
        select(func.count(Order.id)).where(Order.status.in_(REVENUE_STATUSES))
    )
    paid_count = int(paid_count or 0)
    aov = int(rev_all / paid_count) if paid_count else 0

    # Units sold (order items on revenue orders)
    units = await session.scalar(
        select(func.coalesce(func.sum(OrderItem.quantity), 0))
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.in_(REVENUE_STATUSES))
    )
    units = int(units or 0)

    # Fulfillment queue
    fulfill_orders = (
        await session.scalars(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.status.in_(FULFILL_QUEUE))
            .order_by(Order.created_at.asc())
            .limit(25)
        )
    ).all()
    fulfill_units = sum(
        sum(i.quantity for i in o.items) for o in fulfill_orders
    )

    # Recent orders for live feed
    recent = (
        await session.scalars(
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .limit(15)
        )
    ).all()

    # Series: last N days orders + revenue (from created_at / paid)
    window_orders = (
        await session.scalars(
            select(Order).where(Order.created_at >= since).order_by(Order.created_at.asc())
        )
    ).all()

    # Continuous day axis for charts
    day_keys = [
        (now - timedelta(days=days - 1 - i)).date().isoformat() for i in range(days)
    ]
    orders_by_day: dict[str, int] = {k: 0 for k in day_keys}
    revenue_by_day: dict[str, int] = {k: 0 for k in day_keys}
    for o in window_orders:
        k = _day_key(o.created_at)
        if k in orders_by_day:
            orders_by_day[k] += 1
        if o.status in REVENUE_STATUSES:
            # attribute revenue to paid_at day if present else created
            rk = _day_key(o.paid_at) or k
            if rk in revenue_by_day:
                revenue_by_day[rk] += int(o.total_cents or 0)
            elif k in revenue_by_day:
                revenue_by_day[k] += int(o.total_cents or 0)

    series = [
        {
            "date": k,
            "orders": orders_by_day[k],
            "revenueCents": revenue_by_day[k],
        }
        for k in day_keys
    ]

    rev_7 = sum(
        int(o.total_cents or 0)
        for o in window_orders
        if o.status in REVENUE_STATUSES
        and o.created_at
        and (o.paid_at or o.created_at) >= since_7
    )

    # Top products by units (revenue orders)
    top_rows = (
        await session.execute(
            select(
                OrderItem.product_id,
                OrderItem.product_name,
                OrderItem.product_slug,
                func.sum(OrderItem.quantity).label("qty"),
                func.sum(OrderItem.line_total_cents).label("rev"),
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.status.in_(REVENUE_STATUSES))
            .group_by(
                OrderItem.product_id,
                OrderItem.product_name,
                OrderItem.product_slug,
            )
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(8)
        )
    ).all()
    top_products = [
        {
            "productId": str(r[0]),
            "name": str(r[1]),
            "slug": str(r[2]),
            "units": int(r[3] or 0),
            "revenueCents": int(r[4] or 0),
        }
        for r in top_rows
    ]

    # Catalog
    prod_status = (
        await session.execute(
            select(Product.status, func.count(Product.id)).group_by(Product.status)
        )
    ).all()
    products_by_status = {str(s): int(c) for s, c in prod_status}
    low_stock = (
        await session.scalars(
            select(Product)
            .where(
                Product.status == "published",
                Product.stock_qty <= 5,
            )
            .order_by(Product.stock_qty.asc())
            .limit(10)
        )
    ).all()

    review_count = int(
        (await session.scalar(select(func.count()).select_from(Review))) or 0
    )
    # Customers = unique order emails (no separate customer table for guests)
    unique_buyers = int(
        (
            await session.scalar(
                select(func.count(func.distinct(Order.email))).where(
                    Order.status.in_(REVENUE_STATUSES)
                )
            )
        )
        or 0
    )
    staff_users = int(
        (
            await session.scalar(
                select(func.count())
                .select_from(User)
                .where(User.role.in_(("admin", "staff")))
            )
        )
        or 0
    )

    def _order_card(o: Order) -> dict[str, Any]:
        return {
            "id": o.id,
            "publicCode": o.public_code,
            "email": o.email,
            "status": o.status,
            "totalCents": int(o.total_cents or 0),
            "itemCount": sum(i.quantity for i in o.items),
            "createdAt": o.created_at.isoformat() if o.created_at else "",
            "paidAt": o.paid_at.isoformat() if o.paid_at else None,
        }

    return {
        "generatedAt": now.isoformat(),
        "rangeDays": days,
        "kpis": {
            "revenueCentsAllTime": rev_all,
            "revenueCents7d": rev_7,
            "ordersTotal": total_orders,
            "ordersPaidPipeline": paid_count,
            "averageOrderCents": aov,
            "unitsSold": units,
            "uniqueBuyers": unique_buyers,
            "fulfillQueueOrders": sum(
                by_status.get(s, 0) for s in FULFILL_QUEUE
            ),
            "fulfillQueueUnits": fulfill_units,
            "openCheckouts": sum(by_status.get(s, 0) for s in OPEN_CHECKOUT),
            "productsPublished": products_by_status.get("published", 0),
            "productsDraft": products_by_status.get("draft", 0),
            "productsArchived": products_by_status.get("archived", 0),
            "reviewsTotal": review_count,
            "staffUsers": staff_users,
        },
        "ordersByStatus": [
            {"status": k, "count": v}
            for k, v in sorted(by_status.items(), key=lambda x: -x[1])
        ],
        "series": series,
        "topProducts": top_products,
        "fulfillmentQueue": [_order_card(o) for o in fulfill_orders],
        "recentOrders": [_order_card(o) for o in recent],
        "lowStock": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "stockQty": int(p.stock_qty or 0),
                "status": p.status,
            }
            for p in low_stock
        ],
    }
