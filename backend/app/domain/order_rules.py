"""Order status lifecycle — domain rules, no I/O.

Payment transitions (→ paid / → failed) are owned by Stripe webhooks /
checkout reconcile. Admin PATCH only applies fulfillment + cancel edges.
"""

from __future__ import annotations

from app.domain.product_rules import OrderStatus

# Re-export for callers that import from order_rules
__all__ = [
    "OrderStatus",
    "ALL_ORDER_STATUSES",
    "TERMINAL_STATUSES",
    "ADMIN_TRANSITIONS",
    "IllegalOrderTransition",
    "assert_admin_status_transition",
    "allowed_admin_targets",
]

ALL_ORDER_STATUSES: frozenset[str] = frozenset(s.value for s in OrderStatus)

TERMINAL_STATUSES: frozenset[str] = frozenset(
    {
        OrderStatus.delivered.value,
        OrderStatus.cancelled.value,
    }
)

# Admin-allowed edges: from_status → set of target statuses.
# Intentionally does NOT include payment promotions (paid/failed) —
# those remain webhook/checkout only.
ADMIN_TRANSITIONS: dict[str, frozenset[str]] = {
    OrderStatus.pending.value: frozenset({OrderStatus.cancelled.value}),
    OrderStatus.requires_payment.value: frozenset({OrderStatus.cancelled.value}),
    OrderStatus.paid.value: frozenset(
        {
            OrderStatus.processing.value,
            OrderStatus.cancelled.value,
        }
    ),
    OrderStatus.processing.value: frozenset(
        {
            OrderStatus.shipped.value,
            OrderStatus.cancelled.value,
        }
    ),
    OrderStatus.shipped.value: frozenset({OrderStatus.delivered.value}),
    OrderStatus.failed.value: frozenset({OrderStatus.cancelled.value}),
    OrderStatus.delivered.value: frozenset(),
    OrderStatus.cancelled.value: frozenset(),
}


class IllegalOrderTransition(Exception):
    """Raised when an admin tries a status change outside the state machine."""

    def __init__(
        self,
        message: str,
        *,
        from_status: str,
        to_status: str,
        code: str = "illegal_status_transition",
    ) -> None:
        super().__init__(message)
        self.message = message
        self.from_status = from_status
        self.to_status = to_status
        self.code = code


def allowed_admin_targets(from_status: str) -> frozenset[str]:
    """Targets an admin may set from ``from_status`` (empty if unknown/terminal)."""
    return ADMIN_TRANSITIONS.get(from_status, frozenset())


def assert_admin_status_transition(from_status: str, to_status: str) -> None:
    """
    Validate admin status change.

    Same-status is a no-op (allowed). Unknown statuses or edges not in
    ADMIN_TRANSITIONS raise IllegalOrderTransition.
    """
    if from_status == to_status:
        return

    if to_status not in ALL_ORDER_STATUSES:
        raise IllegalOrderTransition(
            f"Unknown target status: {to_status}",
            from_status=from_status,
            to_status=to_status,
            code="invalid_status",
        )

    if from_status not in ALL_ORDER_STATUSES:
        raise IllegalOrderTransition(
            f"Unknown current status: {from_status}",
            from_status=from_status,
            to_status=to_status,
            code="invalid_status",
        )

    allowed = allowed_admin_targets(from_status)
    if to_status not in allowed:
        targets = ", ".join(sorted(allowed)) if allowed else "(none — terminal)"
        raise IllegalOrderTransition(
            f"Cannot transition order from '{from_status}' to '{to_status}'. "
            f"Allowed: {targets}",
            from_status=from_status,
            to_status=to_status,
        )
