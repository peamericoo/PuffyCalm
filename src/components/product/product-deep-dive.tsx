import { ProductReviews } from "@/components/product/product-reviews";
import { ProductStory } from "@/components/product/product-story";
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
 * Full PDP depth below the buy grid: editorial story + innovative reviews.
 * Same sky-calm language as the top of the page — no heavy chrome.
 */
export function ProductDeepDive({ product, className }: ProductDeepDiveProps) {
  return (
    <section
      className={cn(
        "mt-14 border-t border-border/60 pt-10 sm:mt-20 sm:pt-14",
        className,
      )}
    >
      {/* Jump rail — quiet, mobile-friendly */}
      <nav
        aria-label="Product details"
        className="mb-10 flex items-center gap-1 sm:mb-12"
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

      {/* Soft separator — sky wash, not a hard card wall */}
      <div
        aria-hidden
        className="my-12 h-px bg-gradient-to-r from-transparent via-border to-transparent sm:my-16"
      />

      <ProductReviews product={product} />
    </section>
  );
}
