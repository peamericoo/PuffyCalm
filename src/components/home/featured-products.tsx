import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts } from "@/lib/mock/products";

export function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 4);

  return (
    <section className="px-3 py-8 sm:px-5 sm:py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl animate-fade-up">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Just dropped
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Essentials that earn their place
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              A tight edit of recovery, comfort, and everyday tools — built for
              real life, not hype.
            </p>
          </div>
          <Button asChild variant="outline" className="pressable w-fit animate-fade-up delay-1">
            <Link href="/category/all">View all products</Link>
          </Button>
        </div>

        {/* Desktop: 4-up wide grid uses full monitor width */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 stagger">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
