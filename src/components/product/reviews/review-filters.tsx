import type { ReviewSort } from "@/types/review";
import { cn } from "@/lib/utils";

const SORTS: { key: ReviewSort; label: string }[] = [
  { key: "featured", label: "Top voices" },
  { key: "helpful", label: "Most helpful" },
  { key: "recent", label: "Recent" },
];

interface ReviewFiltersProps {
  sort: ReviewSort;
  tag: string | null;
  tags: string[];
  onSortChange: (sort: ReviewSort) => void;
  onTagChange: (tag: string | null) => void;
  className?: string;
}

export function ReviewFilters({
  sort,
  tag,
  tags,
  onSortChange,
  onTagChange,
  className,
}: ReviewFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Sort reviews"
        className="flex flex-wrap gap-1.5"
      >
        {SORTS.map((s) => {
          const active = sort === s.key;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSortChange(s.key)}
              className={cn(
                "px-3 py-1.5 text-[12px] font-medium transition-colors",
                active
                  ? "bg-foreground text-white"
                  : "border border-border/80 bg-white text-muted-foreground hover:border-foreground/25 hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Topics
          </span>
          <button
            type="button"
            onClick={() => onTagChange(null)}
            className={cn(
              "px-2.5 py-1 text-[11.5px] font-medium transition-colors",
              tag === null
                ? "bg-brand-soft text-brand-deep"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {tags.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onTagChange(tag === h ? null : h)}
              className={cn(
                "border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                tag === h
                  ? "border-brand-deep/40 bg-brand-soft text-brand-deep"
                  : "border-border/80 bg-white text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              )}
            >
              {h}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
