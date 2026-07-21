"""Admin dashboard response schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class DashboardKpis(CamelModel):
    revenue_cents_all_time: int = Field(serialization_alias="revenueCentsAllTime")
    revenue_cents_7d: int = Field(serialization_alias="revenueCents7d")
    orders_total: int = Field(serialization_alias="ordersTotal")
    orders_paid_pipeline: int = Field(serialization_alias="ordersPaidPipeline")
    average_order_cents: int = Field(serialization_alias="averageOrderCents")
    units_sold: int = Field(serialization_alias="unitsSold")
    unique_buyers: int = Field(serialization_alias="uniqueBuyers")
    fulfill_queue_orders: int = Field(serialization_alias="fulfillQueueOrders")
    fulfill_queue_units: int = Field(serialization_alias="fulfillQueueUnits")
    open_checkouts: int = Field(serialization_alias="openCheckouts")
    products_published: int = Field(serialization_alias="productsPublished")
    products_draft: int = Field(serialization_alias="productsDraft")
    products_archived: int = Field(serialization_alias="productsArchived")
    reviews_total: int = Field(serialization_alias="reviewsTotal")
    staff_users: int = Field(serialization_alias="staffUsers")


class DashboardOut(CamelModel):
    """Loose envelope — FE maps freely; keep aliases on nested dicts in service."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    generated_at: str = Field(serialization_alias="generatedAt")
    range_days: int = Field(serialization_alias="rangeDays")
    kpis: dict[str, Any]
    orders_by_status: list[dict[str, Any]] = Field(serialization_alias="ordersByStatus")
    series: list[dict[str, Any]]
    top_products: list[dict[str, Any]] = Field(serialization_alias="topProducts")
    fulfillment_queue: list[dict[str, Any]] = Field(
        serialization_alias="fulfillmentQueue"
    )
    recent_orders: list[dict[str, Any]] = Field(serialization_alias="recentOrders")
    low_stock: list[dict[str, Any]] = Field(serialization_alias="lowStock")
