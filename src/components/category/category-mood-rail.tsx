import Image from "next/image";
import Link from "next/link";
import { categoryDisplayImage } from "@/lib/catalog/category-image";
import type { Category } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryMoodRailProps {
  siblings: Category[];
  activeSlug: string;
  className?: string;
}

/**
 * Horizontal collection tiles (Estore “Handbags / Jewellery” row).
 */
export function CategoryMoodRail({
  siblings,
  activeSlug,
  className,
}: CategoryMoodRailProps) {
  // Mood collections first, `all` last
  const ordered = [
    ...siblings.filter((c) => c.slug !== "all"),
    ...siblings.filter((c) => c.slug === "all"),
  ];

  if (ordered.length === 0) return null;

  return (
    <nav
      aria-label="Collections"
      className={cn("-mx-1 overflow-x-auto no-scrollbar", className)}
    >
      <ul className="flex w-max gap-3 px-1 sm:gap-4">
        {ordered.map((c) => {
          const active = c.slug === activeSlug;
          return (
            <li key={c.id} className="w-[7.5rem] shrink-0 sm:w-[8.75rem]">
              <Link
                href={`/category/${c.slug}`}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group block text-center outline-none",
                  "transition-opacity",
                )}
              >
                <span
                  className={cn(
                    "relative mb-2 block aspect-square overflow-hidden bg-[#f0f4f7]",
                    "ring-offset-2 transition-[box-shadow,transform] duration-300",
                    active
                      ? "ring-2 ring-foreground"
                      : "ring-1 ring-border/70 group-hover:ring-foreground/25",
                  )}
                >
                  {categoryDisplayImage(c.imageUrl) ? (
                    <Image
                      src={categoryDisplayImage(c.imageUrl)!}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span
                      className="absolute inset-0 brand-gradient opacity-90"
                      aria-hidden
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "block text-[12.5px] font-medium tracking-tight sm:text-[13px]",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {c.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
