import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types/product";
import { DisplayStack } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

interface CategoryHeaderProps {
  category: Category;
  total: number;
  className?: string;
}

/**
 * Slim catalog header — title + breadcrumb only. No trust chips clutter.
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
    ? `${total} essentials to feel better`
    : `${total} piece${total === 1 ? "" : "s"} · ${category.tagline || "curated for how you feel"}`;

  return (
    <header className={cn(className)}>
      <nav
        aria-label="Breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground sm:mb-3.5 sm:text-[13px]"
      >
        <Link
          href="/"
          prefetch={false}
          transitionTypes={["nav-back"]}
          className="transition hover:text-foreground"
        >
          Home
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
        <Link
          href="/category/all"
          prefetch={false}
          transitionTypes={["catalog"]}
          scroll={false}
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
            <span className="font-medium text-foreground/80">
              {category.name}
            </span>
          </>
        ) : null}
      </nav>

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
    </header>
  );
}
