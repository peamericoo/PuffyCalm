import type { Product } from "@/types/product";
import { getProductSpecs } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductStoryProps {
  product: Product;
  className?: string;
}

/**
 * Compact product story — short blurb + chip row for key specs.
 * Full narrative weight lives in reviews (“What owners say”).
 */
export function ProductStory({ product, className }: ProductStoryProps) {
  const specs = getProductSpecs(product).slice(0, 4);
  const blurb =
    product.shortDescription?.trim() ||
    product.description.split(/(?<=\.)\s/)[0] ||
    product.description;

  return (
    <section
      id="story"
      aria-labelledby="product-story-heading"
      className={cn("scroll-mt-28", className)}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            The ritual
          </p>
          <h2
            id="product-story-heading"
            className="mt-1.5 font-display text-[1.35rem] font-medium leading-tight tracking-tight text-foreground sm:text-[1.5rem]"
          >
            Why it earns a place in your day
          </h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground sm:text-[14.5px]">
            {blurb}
          </p>
        </div>

        {specs.length > 0 ? (
          <ul
            aria-label="Key details"
            className="grid w-full grid-cols-2 gap-2 sm:max-w-md lg:w-auto lg:min-w-[18rem] lg:shrink-0"
          >
            {specs.map((s) => (
              <li
                key={s.label}
                className="border border-border/70 bg-[#fafcfd] px-3 py-2"
              >
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-foreground/90">
                  {s.value}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
