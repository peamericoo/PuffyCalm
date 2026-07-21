import asyncio
from sqlalchemy import text, select, func, update, delete
from app.infrastructure.db.session import get_session_factory, init_db, close_db
from app.infrastructure.db.models import Product, Review, ProductImage, ProductSpec

async def main():
    await init_db()
    fac = get_session_factory()
    async with fac() as session:
        pub = await session.scalar(select(func.count()).select_from(Product).where(Product.status=="published"))
        allp = await session.scalar(select(func.count()).select_from(Product))
        revs = await session.scalar(select(func.count()).select_from(Review))
        orders_with_items = await session.scalar(text("SELECT COUNT(DISTINCT product_id) FROM order_items"))
        print(f"products_total={allp} published={pub} reviews={revs} products_in_orders={orders_with_items}")
        # Soft-remove from storefront: draft + not featured + zero review display fields
        res = await session.execute(
            update(Product).values(
                status="draft",
                featured=False,
                published_at=None,
                review_count=0,
                # keep rating column if exists
            )
        )
        # Delete all fake reviews
        await session.execute(delete(Review))
        await session.commit()
        pub2 = await session.scalar(select(func.count()).select_from(Product).where(Product.status=="published"))
        revs2 = await session.scalar(select(func.count()).select_from(Review))
        print(f"AFTER draft_all published={pub2} reviews={revs2} rows_updated_products={res.rowcount}")
    await close_db()

asyncio.run(main())
