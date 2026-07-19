"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import {
  getRatingBreakdown,
  getReviewHighlights,
  getReviewsForProduct,
} from "@/lib/mock/reviews";
import type { Product } from "@/types/product";
import type { ProductReview } from "@/types/review";
import styles from "./product-reviews.module.css";
import { cn } from "@/lib/utils";

interface ProductReviewsProps {
  product: Product;
  className?: string;
}

type SortKey = "featured" | "helpful" | "recent";

function ScoreMarks({ rating, className }: { rating: number; className?: string }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={cn(styles.marks, className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const on = i < full;
        const isHalf = !on && half && i === full;
        return (
          <span
            key={i}
            className={cn(
              styles.mark,
              on && styles.markOn,
              isHalf && styles.markHalf,
            )}
          />
        );
      })}
    </span>
  );
}

function ReviewCard({
  review,
  featured,
}: {
  review: ProductReview;
  featured?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(featured));
  const long = review.body.length > 180;
  const text =
    !long || open ? review.body : `${review.body.slice(0, 170).trim()}…`;

  return (
    <article
      className={cn(
        "flex h-full flex-col p-5 sm:p-6",
        featured ? styles.featured : "border border-border/70 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand-soft text-[12px] font-semibold tracking-wide text-brand-deep"
          >
            {review.initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="truncate text-[14px] font-semibold text-foreground">
                {review.author}
              </p>
              {review.verified ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-success">
                  <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {review.dateLabel}
            </p>
          </div>
        </div>
        <ScoreMarks rating={review.rating} />
      </div>

      <h3
        className={cn(
          "mt-4 font-display font-medium tracking-tight text-foreground",
          featured
            ? "text-[1.2rem] leading-snug sm:text-[1.35rem]"
            : "text-[15px] leading-snug sm:text-[16px]",
        )}
      >
        {review.title}
      </h3>

      <p
        className={cn(
          "mt-2 flex-1 text-muted-foreground",
          featured
            ? "text-[14.5px] leading-relaxed sm:text-[15.5px] sm:leading-[1.7]"
            : "text-[13.5px] leading-relaxed sm:text-[14px]",
        )}
      >
        {text}
      </p>

      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 self-start text-[12px] font-medium text-brand-deep transition hover:text-foreground"
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}

      {review.tags && review.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <li
              key={tag}
              className="border border-border/80 bg-brand-mist/80 px-2 py-0.5 text-[10.5px] font-medium tracking-wide text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[12px] text-muted-foreground">
        <ThumbsUp className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
        <span>
          <span className="font-medium text-foreground/80">{review.helpful}</span>{" "}
          found this helpful
        </span>
      </div>
    </article>
  );
}

/**
 * Innovative reviews block for the PDP:
 * score ring + sky distribution + pull quote + filterable calm feed.
 */
export function ProductReviews({ product, className }: ProductReviewsProps) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [tag, setTag] = useState<string | null>(null);

  const all = useMemo(() => getReviewsForProduct(product, 6), [product]);
  const breakdown = useMemo(() => getRatingBreakdown(product), [product]);
  const highlights = useMemo(() => getReviewHighlights(all), [all]);

  const featured = all.find((r) => r.featured) ?? all[0];
  const scorePct = Math.min(1, Math.max(0, product.rating / 5));

  const filtered = useMemo(() => {
    let list = [...all];
    if (tag) list = list.filter((r) => r.tags?.includes(tag));
    if (sort === "helpful") {
      list.sort((a, b) => b.helpful - a.helpful);
    } else if (sort === "recent") {
      // pool is roughly newest-first after seed rotation; reverse for “older”
      list = [...list].reverse();
    } else {
      list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.helpful - a.helpful);
    }
    return list;
  }, [all, sort, tag]);

  const rest = filtered.filter((r) => r.id !== featured?.id);
  const showFeatured =
    featured &&
    sort === "featured" &&
    (!tag || featured.tags?.includes(tag));

  const sorts: { key: SortKey; label: string }[] = [
    { key: "featured", label: "Top voices" },
    { key: "helpful", label: "Most helpful" },
    { key: "recent", label: "Recent" },
  ];

  return (
    <section
      id="reviews"
      aria-labelledby="product-reviews-heading"
      className={cn("scroll-mt-28", className)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Social proof
          </p>
          <h2
            id="product-reviews-heading"
            className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl"
          >
            What owners say
          </h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {product.reviewCount.toLocaleString()}
          </span>{" "}
          reviews · real orders
        </p>
      </div>

      {/* Score band */}
      <div className="grid grid-cols-1 gap-6 border border-border/70 bg-[#fafcfd] p-5 sm:gap-8 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="flex items-center gap-5 sm:gap-6">
          <div
            className={styles.scoreRing}
            style={{ ["--score" as string]: scorePct }}
            role="img"
            aria-label={`Average rating ${product.rating.toFixed(1)} out of 5`}
          >
            <div className={styles.scoreInner}>
              <div className={styles.scoreValue}>{product.rating.toFixed(1)}</div>
              <div className={styles.scoreOf}>of 5</div>
            </div>
          </div>
          <div className="min-w-0">
            <ScoreMarks rating={product.rating} />
            <p className="mt-2 max-w-[12rem] text-[12px] leading-snug text-muted-foreground sm:max-w-none">
              Based on {product.reviewCount.toLocaleString()} reviews
            </p>
          </div>
        </div>

        {/* Distribution */}
        <div className="min-w-0">
          <p className="mb-3 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
            Rating mix
          </p>
          <ul className="space-y-2">
            {breakdown.map((row) => (
              <li key={row.stars} className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-6 shrink-0 text-right text-[12px] font-medium tabular-nums text-foreground/80">
                  {row.stars}
                </span>
                <div className={styles.barTrack}>
                  <span
                    className={styles.barFill}
                    style={{ ["--w" as string]: `${row.percent}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {row.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pull quote */}
        {featured ? (
          <blockquote className="relative min-w-0 border-t border-border/60 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <p className="font-display text-[1.15rem] font-medium leading-snug tracking-tight text-foreground sm:text-[1.3rem]">
              “{featured.title}”
            </p>
            <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground sm:text-[14px]">
              {featured.body}
            </p>
            <footer className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground/85">
                {featured.author}
              </span>
              <span className="text-border">·</span>
              <span>{featured.dateLabel}</span>
            </footer>
          </blockquote>
        ) : null}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Sort reviews"
          className="flex flex-wrap gap-1.5"
        >
          {sorts.map((s) => {
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSort(s.key)}
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

        {highlights.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Topics
            </span>
            <button
              type="button"
              onClick={() => setTag(null)}
              className={cn(
                "px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                tag === null
                  ? "bg-brand-soft text-brand-deep"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {highlights.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setTag((t) => (t === h ? null : h))}
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

      {/* Feed */}
      <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
        {showFeatured && featured ? (
          <ReviewCard review={featured} featured />
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {(showFeatured ? rest : filtered).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="border border-dashed border-border py-10 text-center text-[14px] text-muted-foreground">
            No reviews with that topic yet — try another filter.
          </p>
        ) : null}
      </div>
    </section>
  );
}
