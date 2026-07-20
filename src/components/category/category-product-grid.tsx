import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryProductGridProps {
  products: Product[];
  className?: string;
}

/**
 * 2-col mobile · 3-col desktop beside filters (Estore shelf).
 */
export function CategoryProductGrid({
  products,
  className,
}: CategoryProductGridProps) {
  return (
    <ul
      className={cn(
        "grid list-none grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3",
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
