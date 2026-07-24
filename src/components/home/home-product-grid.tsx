import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

const ROW_SIZE = 4;
const PAGE_SIZE = ROW_SIZE * 2;

function ProductRow({
  products,
  row,
}: {
  products: Product[];
  row: "top" | "bottom";
}) {
  return (
    <div
      className={cn(
        "home-product-row grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-4 lg:gap-4",
        row === "bottom" && "home-product-row--bottom",
      )}
    >
      {products.map((product, index) => (
        <div key={product.id} className="h-full min-h-0">
          <ProductCard
            product={product}
            compact
            priority={row === "top" && index < ROW_SIZE}
            presentation="catalog"
          />
        </div>
      ))}
    </div>
  );
}

export function HomeProductGrid({ products }: { products: Product[] }) {
  const visible = products.slice(0, PAGE_SIZE);
  const topRow = visible.slice(0, ROW_SIZE);
  const bottomRow = visible.slice(ROW_SIZE, PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="home-section-heading mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <p className="home-section-kicker">Most picked</p>
          <h2 className="home-section-title">Customer favorites</h2>
        </div>
      </div>

      <div className="home-product-rails space-y-3.5 overflow-visible lg:space-y-4">
        {topRow.length > 0 ? <ProductRow products={topRow} row="top" /> : null}
        {bottomRow.length > 0 ? (
          <ProductRow products={bottomRow} row="bottom" />
        ) : null}
      </div>
    </div>
  );
}
