import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { categories } from "@/lib/mock/categories";

/** Full-width horizontal collection band — not stacked giant cards */
export function CategoriesStrip() {
  const items = categories.filter((c) => c.slug !== "all");

  return (
    <section className="px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
          <Reveal>
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Shop by mood
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <Link
              href="/category/all"
              className="pressable text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Browse all
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {items.map((category, index) => (
            <Reveal key={category.id} delay={index * 70}>
              <Link
                href={`/category/${category.slug}`}
                className="group relative flex min-h-[200px] overflow-hidden rounded-[1.4rem] card-soft md:min-h-[240px] lg:min-h-[260px]"
              >
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover img-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
                <div className="relative z-10 mt-auto flex w-full items-end justify-between gap-3 p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                      0{index + 1}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-medium text-white">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      {category.tagline}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-foreground transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
