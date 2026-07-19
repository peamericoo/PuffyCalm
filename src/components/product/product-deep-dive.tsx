import { ProductStory } from "@/components/product/product-story";
import { ProductReviews } from "@/components/product/reviews";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductDeepDiveProps {
  product: Product;
  className?: string;
}

const nav = [
  { href: "#story", label: "Story" },
  { href: "#reviews", label: "Reviews" },
] as const;

/**
 * PDP depth below the buy grid: compact story + reviews-first layout.
 */
export function ProductDeepDive({ product, className }: ProductDeepDiveProps) {
  return (
    <section
      className={cn(
        "mt-12 border-t border-border/60 pt-8 sm:mt-16 sm:pt-12",
        className,
      )}
    >
      <nav
        aria-label="Product details"
        className="mb-6 flex items-center gap-1 sm:mb-8"
      >
        {nav.map((item, i) => (
          <span key={item.href} className="flex items-center gap-1">
            {i > 0 ? (
              <span className="mx-1 text-border/80" aria-hidden>
                /
              </span>
            ) : null}
            <a
              href={item.href}
              className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          </span>
        ))}
        <span className="ml-auto hidden text-[12px] text-muted-foreground sm:inline">
          {product.name}
        </span>
      </nav>

      <ProductStory product={product} />

      <div
        aria-hidden
        className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent sm:my-10"
      />

      <ProductReviews product={product} pageSize={4} />
    </section>
  );
}
