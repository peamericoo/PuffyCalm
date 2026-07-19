import { ReviewCard } from "@/components/product/reviews/review-card";
import type { ProductReview } from "@/types/review";
import { cn } from "@/lib/utils";

interface ReviewFeedProps {
  items: ProductReview[];
  /** Highlight first item only on page 1 + featured sort with no tag */
  highlightFirst?: boolean;
  loading?: boolean;
  empty?: boolean;
  className?: string;
}

export function ReviewFeed({
  items,
  highlightFirst,
  loading,
  empty,
  className,
}: ReviewFeedProps) {
  if (empty && !loading) {
    return (
      <p className="border border-dashed border-border py-10 text-center text-[14px] text-muted-foreground">
        No reviews with that topic yet — try another filter.
      </p>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div
        className={cn("grid grid-cols-1 gap-3 md:grid-cols-2", className)}
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse border border-border/50 bg-brand-mist/60"
          />
        ))}
      </div>
    );
  }

  const [first, ...rest] = items;
  const showFeatured = Boolean(highlightFirst && first);

  return (
    <div
      className={cn("space-y-3 sm:space-y-4", loading && "opacity-60", className)}
      aria-busy={loading || undefined}
    >
      {showFeatured && first ? (
        <ReviewCard review={first} featured />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {(showFeatured ? rest : items).map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
