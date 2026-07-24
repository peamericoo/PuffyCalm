"""add internal supplier URLs to products

Revision ID: q1a2b3c4d5e6
Revises: p1a2b3c4d5e6
Create Date: 2026-07-23 16:35:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "q1a2b3c4d5e6"
down_revision: Union[str, None] = "p1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SUPPLIER_URLS = {
    "PC-R01": "https://www.aliexpress.com/item/1005006994543682.html",
    "PC-R02": "https://www.aliexpress.com/item/1005007343958003.html",
    "PC-R03": "https://www.aliexpress.com/item/1005006727246796.html",
    "PC-R04": "https://www.aliexpress.com/item/1005011587150935.html",
    "PC-R05": "https://www.aliexpress.com/item/1005011859639485.html",
    "PC-R06": "https://www.aliexpress.com/item/1005006898158416.html",
    "PC-R07": "https://www.aliexpress.com/item/1005008430069353.html",
    "PC-R08": "https://www.aliexpress.com/item/1005003401750847.html",
    "PC-R11": "https://www.aliexpress.com/item/1005010439451124.html",
    "PC-R12": "https://www.aliexpress.com/item/1005010429582376.html",
    "PC-R13": "https://www.aliexpress.com/item/1005007512788964.html",
    "PC-R14": "https://www.aliexpress.com/item/1005009439592203.html",
    "PC-R15": "https://www.aliexpress.com/item/1005006678112450.html",
    "PC-R16": "https://www.aliexpress.com/item/1005005527280487.html",
    "PC-R17": "https://www.aliexpress.com/item/1005005646988237.html",
    "PC-R18": "https://www.aliexpress.com/item/1005010194529538.html",
    "PC-R19": "https://www.aliexpress.com/item/1005007011832030.html",
    "PC-R20": "https://www.aliexpress.com/item/1005010285433656.html",
    "PC-R24": "https://www.aliexpress.com/item/1005011888557514.html",
    "PC-C01": "https://www.aliexpress.com/item/1005008885893465.html",
    "PC-C02": "https://www.aliexpress.com/item/1005009974552093.html",
    "PC-C03": "https://www.aliexpress.com/item/1005010527964693.html",
    "PC-C04": "https://www.aliexpress.com/item/1005009022057491.html",
    "PC-C05": "https://www.aliexpress.com/item/1005006727714252.html",
    "PC-C06": "https://www.aliexpress.com/item/1005008077649373.html",
    "PC-C07": "https://www.aliexpress.com/item/1005007009566999.html",
    "PC-C08": "https://www.aliexpress.com/item/1005008988624177.html",
    "PC-C09": "https://www.aliexpress.com/item/1005010537789516.html",
    "PC-C10": "https://www.aliexpress.com/item/1005012471210386.html",
    "PC-E01": "https://www.aliexpress.com/item/1005009460608069.html",
    "PC-E02": "https://www.aliexpress.com/item/1005010089150445.html",
    "PC-E03": "https://www.aliexpress.com/item/1005007038349706.html",
    "PC-E04": "https://www.aliexpress.com/item/1005008248139301.html",
    "PC-E05": "https://www.aliexpress.com/item/1005008189258865.html",
    "PC-E06": "https://www.aliexpress.com/item/1005008077731013.html",
    "PC-E07": "https://www.aliexpress.com/item/1005010557548663.html",
}


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("supplier_url", sa.String(length=2048), nullable=False, server_default=""),
    )
    connection = op.get_bind()
    for product_id, supplier_url in SUPPLIER_URLS.items():
        connection.execute(
            sa.text("UPDATE products SET supplier_url = :supplier_url WHERE id = :product_id"),
            {"product_id": product_id, "supplier_url": supplier_url},
        )


def downgrade() -> None:
    op.drop_column("products", "supplier_url")
