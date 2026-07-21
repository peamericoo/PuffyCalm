"""add products.stock_qty for inventory (Phase L)

Revision ID: l1a2b3c4d5e6
Revises: j1a2b3c4d5e6
Create Date: 2026-07-21 18:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "l1a2b3c4d5e6"
down_revision: Union[str, None] = "j1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Dropship-friendly default: enough units that ops can sell without
# micro-managing qty; set 0 (or in_stock=false) to block sales.
_DEFAULT_STOCK_QTY = 100


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "stock_qty",
            sa.Integer(),
            nullable=False,
            server_default=str(_DEFAULT_STOCK_QTY),
        ),
    )
    # Align boolean flag with qty for existing rows that were marked out of stock.
    op.execute(
        sa.text(
            "UPDATE products SET stock_qty = 0 WHERE in_stock IS FALSE AND stock_qty > 0"
        )
    )
    op.execute(
        sa.text(
            "UPDATE products SET in_stock = FALSE WHERE stock_qty < 1 AND in_stock IS TRUE"
        )
    )


def downgrade() -> None:
    op.drop_column("products", "stock_qty")
