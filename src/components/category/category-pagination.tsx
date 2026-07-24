"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

interface CategoryPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  className?: string;
}

type PageItem = number | "gap";

function buildPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const set = new Set([1, pageCount, page - 1, page, page + 1]);
  const nums = Array.from(set)
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  for (const n of nums) {
    const prev = items[items.length - 1];
    if (typeof prev === "number" && n - prev > 1) {
      items.push("gap");
    }
    items.push(n);
  }
  return items;
}

function rangeLabel(page: number, pageSize: number, total: number) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}-${end} of ${total}`;
}

export function CategoryPagination({
  page,
  pageCount,
  total,
  pageSize,
  className,
}: CategoryPaginationProps) {
  const { setPage, pending } = useCatalogUrl();

  if (pageCount <= 1 || total <= pageSize) return null;

  const scrollToPageTop = () => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 360);
    });
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    scrollToPageTop();
  };

  return (
    <nav
      aria-label="Product pagination"
      className={cn(
        "mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.15rem] border border-white/70 bg-white/68 p-3 shadow-[0_1px_0_rgb(255_255_255/0.88)_inset,0_16px_36px_-30px_rgb(26_35_50/0.24)] backdrop-blur-md sm:flex-row sm:px-4",
        pending && "opacity-70 transition-opacity duration-150",
        className,
      )}
    >
      <p className="text-[13px] font-medium text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {rangeLabel(page, pageSize, total)}
        </span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/70 bg-white/72 px-3.5 text-[13px] font-semibold text-foreground shadow-[0_1px_0_rgb(255_255_255/0.85)_inset] transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          Previous
        </button>

        <div className="hidden items-center gap-1.5 sm:flex">
          {buildPageItems(page, pageCount).map((item, idx) =>
            item === "gap" ? (
              <span
                key={`gap-${idx}`}
                className="flex h-10 w-9 items-center justify-center text-[13px] font-semibold text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item)}
                disabled={item === page || pending}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-[13px] font-bold tabular-nums transition",
                  item === page
                    ? "border-brand/40 bg-brand-deep text-white shadow-[0_10px_20px_-14px_rgb(58_124_165/0.6)]"
                    : "border-white/70 bg-white/62 text-muted-foreground hover:bg-white hover:text-foreground",
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="flex h-10 items-center rounded-full border border-white/70 bg-white/62 px-3 text-[13px] font-semibold text-muted-foreground sm:hidden">
          {page} / {pageCount}
        </span>

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= pageCount || pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/70 bg-white/72 px-3.5 text-[13px] font-semibold text-foreground shadow-[0_1px_0_rgb(255_255_255/0.85)_inset] transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </nav>
  );
}
