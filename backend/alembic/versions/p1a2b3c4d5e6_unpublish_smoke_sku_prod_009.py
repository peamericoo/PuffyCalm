"""Phase P: unpublish smoke SKU prod_009 from storefront

Revision ID: p1a2b3c4d5e6
Revises: l1a2b3c4d5e6
Create Date: 2026-07-21 22:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "p1a2b3c4d5e6"
down_revision: Union[str, None] = "l1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Hide internal Stripe min-charge SKU from public catalog/PDP/search.
    # Row kept for deliberate re-publish via admin during payment smoke.
    op.execute(
        sa.text(
            """
            UPDATE products
            SET status = 'draft',
                featured = false
            WHERE id = 'prod_009'
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE products
            SET status = 'published',
                featured = true
            WHERE id = 'prod_009'
            """
        )
    )
