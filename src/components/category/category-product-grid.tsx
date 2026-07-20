import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryProductGridProps {
  products: Product[];
  className?: string;
}

/**
 * Category shelf grid — denser on mobile, 3–4 cols on large screens.
 * Reuses ProductCard so PDP transitions stay consistent.
 */
export function CategoryProductGrid({
  products,
  className,
}: CategoryProductGridProps) {
  return (
    <ul
      className={cn(
        "grid list-none grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} compact />
        </li>
      ))}
    </ul>
  );
}
