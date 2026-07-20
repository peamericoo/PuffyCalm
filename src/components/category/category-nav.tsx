import Link from "next/link";
import type { Category } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  siblings: Category[];
  activeSlug: string;
  className?: string;
}

/**
 * Horizontal collection pills — switch mood without leaving catalog chrome.
 */
export function CategoryNav({
  siblings,
  activeSlug,
  className,
}: CategoryNavProps) {
  if (siblings.length === 0) return null;

  return (
    <nav
      aria-label="Collections"
      className={cn("-mx-1 overflow-x-auto no-scrollbar", className)}
    >
      <ul className="flex w-max min-w-full gap-1.5 px-1 sm:gap-2">
        {siblings.map((c) => {
          const active = c.slug === activeSlug;
          return (
            <li key={c.id}>
              <Link
                href={`/category/${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-[12px] font-medium transition-colors sm:px-4 sm:text-[13px]",
                  active
                    ? "bg-foreground text-white"
                    : "border border-border/80 bg-white text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                {c.name}
                <span
                  className={cn(
                    "tabular-nums text-[11px]",
                    active ? "text-white/70" : "text-muted-foreground/80",
                  )}
                >
                  {c.productCount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
