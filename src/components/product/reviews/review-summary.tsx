import { ScoreMarks } from "@/components/product/reviews/score-marks";
import type { ProductReview, RatingBreakdown } from "@/types/review";
import styles from "./product-reviews.module.css";
import { cn } from "@/lib/utils";

interface ReviewSummaryProps {
  average: number;
  count: number;
  breakdown: RatingBreakdown[];
  featured: ProductReview | null;
  className?: string;
}

/** Score ring + rating mix + pull quote. */
export function ReviewSummary({
  average,
  count,
  breakdown,
  featured,
  className,
}: ReviewSummaryProps) {
  const scorePct = Math.min(1, Math.max(0, average / 5));

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 border border-border/70 bg-[#fafcfd] p-4 sm:gap-7 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center",
        className,
      )}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div
          className={styles.scoreRing}
          style={{ ["--score" as string]: scorePct }}
          role="img"
          aria-label={`Average rating ${average.toFixed(1)} out of 5`}
        >
          <div className={styles.scoreInner}>
            <div className={styles.scoreValue}>{average.toFixed(1)}</div>
            <div className={styles.scoreOf}>of 5</div>
          </div>
        </div>
        <div className="min-w-0">
          <ScoreMarks rating={average} />
          <p className="mt-2 max-w-[11rem] text-[12px] leading-snug text-muted-foreground sm:max-w-none">
            Based on {count.toLocaleString()} reviews
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2.5 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
          Rating mix
        </p>
        <ul className="space-y-1.5">
          {breakdown.map((row) => (
            <li key={row.stars} className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-5 shrink-0 text-right text-[12px] font-medium tabular-nums text-foreground/80">
                {row.stars}
              </span>
              <div className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ ["--w" as string]: `${row.percent}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {row.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {featured ? (
        <blockquote className="relative min-w-0 border-t border-border/60 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="font-display text-[1.05rem] font-medium leading-snug tracking-tight text-foreground sm:text-[1.2rem]">
            “{featured.title}”
          </p>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
            {featured.body}
          </p>
          <footer className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground/85">
              {featured.author}
            </span>
            <span className="text-border">·</span>
            <span>{featured.dateLabel}</span>
          </footer>
        </blockquote>
      ) : null}
    </div>
  );
}
