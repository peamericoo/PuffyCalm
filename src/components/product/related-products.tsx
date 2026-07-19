import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface RelatedProductsProps {
  products: Product[];
  className?: string;
}

/**
 * Simple related grid — square tiles, light gaps, no experimental chrome.
 */
export function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section
      className={cn(
        "mt-16 border-t border-border/60 pt-12 sm:mt-20 sm:pt-14",
        className,
      )}
    >
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Next up
          </p>
          <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            You may also like
          </h2>
        </div>
        <Link
          href="/category/all"
          className="shrink-0 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4",
          products.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {products.map((p) => {
          const promo =
            p.compareAtPrice && p.compareAtPrice > p.price
              ? p.compareAtPrice
              : null;

          return (
            <article key={p.id} className="group/rel flex flex-col">
              <Link
                href={`/product/${p.slug}`}
                className="relative block aspect-square w-full overflow-hidden bg-[#f0f4f7]"
              >
                <Image
                  src={p.imageUrl}
                  alt={p.imageAlt}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-500 group-hover/rel:scale-[1.03]"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-1 pt-3">
                {p.categoryLabel ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {p.categoryLabel}
                  </p>
                ) : null}
                <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-foreground transition-colors group-hover/rel:text-brand-deep sm:text-[15px]">
                  <Link href={`/product/${p.slug}`}>{p.name}</Link>
                </h3>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[16px] font-bold tracking-tight text-brand-deep">
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
          );
        })}
      </div>
    </section>
  );
}
