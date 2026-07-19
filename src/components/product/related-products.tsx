import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface RelatedProductsProps {
  products: Product[];
  className?: string;
}

/**
 * Flush related grid — square, no radius, no ugly crop carnival.
 * United composition: 1px hairlines via gap-px on a tinted stage.
 */
export function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (products.length === 0) return null;

  const cols =
    products.length >= 4
      ? "grid-cols-2 lg:grid-cols-4"
      : products.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2";

  return (
    <section
      className={cn(
        "mt-16 border-t border-foreground/[0.08] pt-12 sm:mt-24 sm:pt-14",
        className,
      )}
    >
      <Reveal variant="soft">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Next up
            </p>
            <h2 className="mt-1.5 font-display text-[1.5rem] font-medium tracking-tight text-foreground sm:text-[1.85rem]">
              You may also like
            </h2>
          </div>
          <Link
            href="/category/all"
            className="shrink-0 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            View all
          </Link>
        </div>
      </Reveal>

      {/* One block: gap-px creates hairline grid between square tiles */}
      <div
        className={cn(
          "grid gap-px border border-foreground/[0.1] bg-foreground/[0.1]",
          cols,
        )}
      >
        {products.map((p, i) => {
          const promo =
            p.compareAtPrice && p.compareAtPrice > p.price
              ? p.compareAtPrice
              : null;

          return (
            <Reveal
              key={p.id}
              variant="rise"
              delay={50 + i * 55}
              className="h-full bg-white"
            >
              <article className="group/rel flex h-full flex-col bg-white">
                <Link
                  href={`/product/${p.slug}`}
                  className="relative block aspect-square w-full overflow-hidden bg-[#eef3f6]"
                >
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover/rel:scale-[1.035]"
                  />
                </Link>

                <div className="flex flex-1 flex-col gap-1 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  {p.categoryLabel ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {p.categoryLabel}
                    </p>
                  ) : null}
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover/rel:text-brand-deep sm:text-[15px]">
                    <Link href={`/product/${p.slug}`}>{p.name}</Link>
                  </h3>
                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1.5">
                    <span className="text-[17px] font-bold tracking-tight text-brand-deep sm:text-[18px]">
                      {formatMoney(p.price, p.currency)}
                    </span>
                    {promo ? (
                      <span className="text-[12px] text-muted-foreground line-through">
                        {formatMoney(promo, p.currency)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
