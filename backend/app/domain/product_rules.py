"""Product lifecycle and purchase-rule constants (domain, no I/O)."""

from __future__ import annotations

from enum import StrEnum


class ProductStatus(StrEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class OrderStatus(StrEnum):
    """Payment + fulfillment pipeline (string column on orders)."""

    pending = "pending"
    requires_payment = "requires_payment"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"


# Statuses that count as a completed purchase for purchase limits
PURCHASE_COUNT_STATUSES: frozenset[str] = frozenset(
    {
        OrderStatus.paid.value,
        OrderStatus.processing.value,
        OrderStatus.shipped.value,
        OrderStatus.delivered.value,
    }
)

DEFAULT_MAX_QUANTITY_PER_ORDER = 9
STOREFRONT_VISIBLE_STATUSES: frozenset[str] = frozenset({ProductStatus.published.value})
