"""product lifecycle status + purchase rules

Revision ID: f1a2b3c4d5e6
Revises: e7f8a9b0c1d2
Create Date: 2026-07-20 18:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "e7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="published",
        ),
    )
    op.add_column(
        "products",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column(
            "max_quantity_per_order",
            sa.Integer(),
            nullable=False,
            server_default="9",
        ),
    )
    op.add_column(
        "products",
        sa.Column("purchase_limit_per_customer", sa.Integer(), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("seo_title", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("seo_description", sa.Text(), nullable=True),
    )
    op.create_index("ix_products_status", "products", ["status"], unique=False)

    # Fulfillment notes on orders (admin ops)
    op.add_column(
        "orders",
        sa.Column("admin_notes", sa.Text(), nullable=True),
    )

    # Composite index for purchase-limit lookups
    op.create_index(
        "ix_orders_email_status",
        "orders",
        ["email", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_orders_email_status", table_name="orders")
    op.drop_column("orders", "admin_notes")
    op.drop_index("ix_products_status", table_name="products")
    op.drop_column("products", "seo_description")
    op.drop_column("products", "seo_title")
    op.drop_column("products", "purchase_limit_per_customer")
    op.drop_column("products", "max_quantity_per_order")
    op.drop_column("products", "published_at")
    op.drop_column("products", "status")
