import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryHeaderProps {
  category: Category;
  className?: string;
}

/**
 * Slim Estore-style header: breadcrumb + display title only.
 * No long copy, no side hero image.
 */
export function CategoryHeader({ category, className }: CategoryHeaderProps) {
  return (
    <header className={cn(className)}>
      <nav
        aria-label="Breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground sm:mb-4 sm:text-[13px]"
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
          Collection
        </Link>
        {category.slug !== "all" ? (
          <>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="text-foreground/75">{category.name}</span>
          </>
        ) : null}
      </nav>

      <h1 className="font-display text-[2rem] font-medium leading-[1.05] tracking-tight text-foreground sm:text-[2.65rem] lg:text-[2.85rem]">
        {category.slug === "all" ? "All products" : category.name}
      </h1>
    </header>
  );
}
