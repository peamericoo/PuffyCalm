import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryHeroProps {
  category: Category;
  total: number;
  className?: string;
}

/**
 * Collection header — compact breadcrumb + title + soft mood image.
 */
export function CategoryHero({ category, total, className }: CategoryHeroProps) {
  return (
    <header className={cn("relative overflow-hidden", className)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="min-w-0 lg:col-span-7">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground sm:mb-5 sm:text-[13px]"
          >
            <Link
              href="/"
              transitionTypes={["nav-back"]}
              className="transition hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <Link
              href="/category/all"
              transitionTypes={["nav-back"]}
              className="transition hover:text-foreground"
            >
              Shop
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="truncate text-foreground/75">{category.name}</span>
          </nav>

          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Collection
          </p>
          <h1 className="mt-1.5 font-display text-[1.85rem] font-medium leading-[1.1] tracking-tight text-foreground sm:text-[2.5rem] lg:text-[2.75rem]">
            {category.name}
          </h1>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-[15.5px]">
            {category.tagline}
          </p>
          {category.description ? (
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground/90 sm:text-[14px]">
              {category.description}
            </p>
          ) : null}
          <p className="mt-4 text-[12px] font-medium tabular-nums text-foreground/70 sm:text-[13px]">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>

        <div className="relative hidden aspect-[16/10] overflow-hidden bg-[#f0f4f7] lg:col-span-5 lg:block lg:aspect-[5/3]">
          <Image
            src={category.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 0vw, 40vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-brand-soft/20"
          />
        </div>
      </div>
    </header>
  );
}
