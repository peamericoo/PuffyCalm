import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryProductGridProps {
  products: Product[];
  className?: string;
  variant?: "standard" | "editorial";
}

/**
 * Product shelf — cards unchanged.
 * 2-col mobile · 3-col standard desktop · 4-col editorial desktop.
 */
export function CategoryProductGrid({
  products,
  className,
  variant = "standard",
}: CategoryProductGridProps) {
  return (
    <ul
      className={cn(
        "grid list-none grid-cols-2 gap-3 sm:gap-3.5",
        variant === "editorial"
          ? "lg:grid-cols-4 lg:gap-4 xl:gap-5"
          : "lg:grid-cols-3 lg:gap-4",
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard
            product={product}
            compact
            presentation={variant === "editorial" ? "catalog" : "standard"}
          />
        </li>
      ))}
    </ul>
  );
}
