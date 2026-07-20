"""Catalog seed smoke tests (require live Postgres — docker compose)."""

import os

import pytest
from sqlalchemy import func, select

from app.core.config import get_settings
from app.infrastructure.db.models import Category, Product, ProductImage, Review
from app.infrastructure.db.seed import seed_catalog
from app.infrastructure.db.session import close_db, get_session_factory, init_db


@pytest.fixture
async def db_ready():
    if os.getenv("REQUIRE_DB") != "1" and os.getenv("REQUIRE_READY") != "1":
        pytest.skip("Set REQUIRE_DB=1 or REQUIRE_READY=1 to run seed tests")
    settings = get_settings()
    init_db(settings)
    yield
    await close_db()


@pytest.mark.asyncio
async def test_seed_catalog_counts(db_ready) -> None:
    factory = get_session_factory()
    async with factory() as session:
        counts = await seed_catalog(session, reset=True)

    assert counts["categories"] == 4
    assert counts["products"] == 8
    assert counts["reviews"] == 8 * 12  # seeds per product
    assert counts["images"] == 8 * 3
    assert counts["specs"] == 8 * 4

    async with factory() as session:
        # Virtual "all" exists but is not linked to products
        all_cat = (
            await session.execute(select(Category).where(Category.slug == "all"))
        ).scalar_one()
        assert all_cat.is_virtual is True

        recovery = (
            await session.execute(select(Category).where(Category.slug == "recovery"))
        ).scalar_one()
        # load products relationship
        await session.refresh(recovery, attribute_names=["products"])
        assert len(recovery.products) >= 4

        product = (
            await session.execute(
                select(Product).where(Product.slug == "shiatsu-neck-shoulder-massager")
            )
        ).scalar_one()
        assert float(product.price) == 54.0
        assert "bestseller" in product.badges

        img_count = (
            await session.execute(
                select(func.count())
                .select_from(ProductImage)
                .where(ProductImage.product_id == product.id)
            )
        ).scalar_one()
        assert img_count == 3

        rev_count = (
            await session.execute(
                select(func.count()).select_from(Review).where(Review.product_id == product.id)
            )
        ).scalar_one()
        assert rev_count == 12
