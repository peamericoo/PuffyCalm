import Link from "next/link";
import { ChevronRight, Package, Truck } from "lucide-react";
import type { Category } from "@/types/product";
import { DisplayStack } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

interface CategoryHeaderProps {
  category: Category;
  total: number;
  className?: string;
}

/**
 * Premium catalog header — short, conversion-forward, no wall of copy.
 */
export function CategoryHeader({
  category,
  total,
  className,
}: CategoryHeaderProps) {
  const isAll = category.slug === "all";
  const title = isAll ? "All products" : category.name;
  const eyebrow = isAll ? "Shop the edit" : "Collection";
  const lead = isAll
    ? `${total} essentials · free shipping over $75`
    : `${total} piece${total === 1 ? "" : "s"} · ${category.tagline || "curated for how you feel"}`;

  return (
    <header className={cn(className)}>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground sm:mb-5 sm:text-[13px]"
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
          className={cn(
            "transition hover:text-foreground",
            isAll && "font-medium text-foreground/80",
          )}
        >
          Shop
        </Link>
        {!isAll ? (
          <>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="font-medium text-foreground/80">{category.name}</span>
          </>
        ) : null}
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <DisplayStack
          eyebrow={eyebrow}
          title={title}
          description={lead}
          accent={isAll ? "products" : undefined}
          accentLast={isAll}
          size="md"
          as="h1"
          motion="rise"
          noReveal
          className="max-w-xl"
        />

        <ul className="flex flex-wrap items-center gap-2 sm:justify-end">
          <li className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground">
            <Truck className="h-3.5 w-3.5 text-brand-deep" strokeWidth={2.25} />
            Free ship $75+
          </li>
          <li className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground">
            <Package className="h-3.5 w-3.5 text-brand-deep" strokeWidth={2.25} />
            Guest checkout
          </li>
        </ul>
      </div>
    </header>
  );
}
