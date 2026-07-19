import type { Product } from "@/types/product";
import { getProductSpecs } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductStoryProps {
  product: Product;
  className?: string;
}

/**
 * Editorial product story — full description + ritual moments from features/specs.
 * Matches Seoul / Sky Calm PDP: display type, quiet labels, no heavy cards.
 */
export function ProductStory({ product, className }: ProductStoryProps) {
  const specs = getProductSpecs(product);
  const moments =
    specs.length > 0
      ? specs.map((s) => ({ label: s.label, text: s.value }))
      : product.features.map((f, i) => ({
          label: `0${i + 1}`,
          text: f,
        }));

  const paragraphs = product.description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // If single long paragraph, keep as one block; still readable
  const body =
    paragraphs.length > 0
      ? paragraphs
      : [product.shortDescription].filter(Boolean);

  return (
    <section
      id="story"
      aria-labelledby="product-story-heading"
      className={cn("scroll-mt-28", className)}
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Narrative */}
        <div className="lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            The ritual
          </p>
          <h2
            id="product-story-heading"
            className="mt-2 font-display text-[1.65rem] font-medium leading-[1.15] tracking-tight text-foreground sm:text-[2rem]"
          >
            Why it earns a place in your day
          </h2>

          <div className="mt-5 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-[15.5px] sm:leading-[1.7]">
            {body.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
            {product.shortDescription &&
            !body.some((b) => b.includes(product.shortDescription)) ? (
              <p className="text-foreground/80">{product.shortDescription}</p>
            ) : null}
          </div>
        </div>

        {/* Moments spine */}
        <div className="lg:col-span-7">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:mb-5">
            Built for
          </p>

          <ol className="relative space-y-0">
            {/* Vertical sky line */}
            <span
              aria-hidden
              className="absolute bottom-3 left-[0.9rem] top-3 w-px bg-gradient-to-b from-brand/50 via-border to-transparent sm:left-[1.05rem]"
            />

            {moments.map((m, i) => (
              <li
                key={`${m.label}-${i}`}
                className="relative grid grid-cols-[2rem_1fr] gap-3 py-3.5 sm:grid-cols-[2.5rem_1fr] sm:gap-5 sm:py-4"
              >
                <span className="relative z-[1] flex h-7 w-7 items-center justify-center rounded-full border border-brand/35 bg-brand-mist text-[10px] font-semibold tabular-nums text-brand-deep sm:h-8 sm:w-8 sm:text-[11px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 border-b border-border/60 pb-3.5 sm:pb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="mt-1 text-[14px] leading-snug text-foreground/90 sm:text-[15px]">
                    {m.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
