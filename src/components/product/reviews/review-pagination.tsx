import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageRangeLabel, pageWindow } from "@/lib/reviews/paginate";
import { cn } from "@/lib/utils";

interface ReviewPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Disable while a request is in flight */
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible page controls for review feed.
 * Hides when there’s nothing to paginate.
 */
export function ReviewPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled,
  className,
}: ReviewPaginationProps) {
  if (totalPages <= 1 || totalItems === 0) return null;

  const window = pageWindow(page, totalPages, 1);
  const range = pageRangeLabel(page, pageSize, totalItems);

  return (
    <nav
      aria-label="Review pages"
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-5 sm:flex-row sm:pt-6",
        className,
      )}
    >
      <p className="text-[12px] tabular-nums text-muted-foreground">{range}</p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center border border-border/80 bg-white text-foreground transition-colors",
            "hover:border-foreground/25 hover:bg-brand-mist disabled:pointer-events-none disabled:opacity-35",
          )}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        <ul className="flex items-center gap-1">
          {window.map((item, i) =>
            item === "ellipsis" ? (
              <li
                key={`e-${i}`}
                className="px-1.5 text-[12px] text-muted-foreground"
                aria-hidden
              >
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  disabled={disabled}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 min-w-9 items-center justify-center px-2 text-[12.5px] font-medium tabular-nums transition-colors",
                    item === page
                      ? "bg-foreground text-white"
                      : "border border-border/80 bg-white text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                    disabled && "pointer-events-none opacity-60",
                  )}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ul>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center border border-border/80 bg-white text-foreground transition-colors",
            "hover:border-foreground/25 hover:bg-brand-mist disabled:pointer-events-none disabled:opacity-35",
          )}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
