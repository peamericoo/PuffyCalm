"use client";

import { useState } from "react";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { ScoreMarks } from "@/components/product/reviews/score-marks";
import type { ProductReview } from "@/types/review";
import styles from "./product-reviews.module.css";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: ProductReview;
  featured?: boolean;
  className?: string;
}

export function ReviewCard({ review, featured, className }: ReviewCardProps) {
  const [open, setOpen] = useState(Boolean(featured));
  const long = review.body.length > 160;
  const text =
    !long || open ? review.body : `${review.body.slice(0, 150).trim()}…`;

  return (
    <article
      className={cn(
        "flex h-full flex-col p-4 sm:p-5",
        featured ? styles.featured : "border border-border/70 bg-white",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand-soft text-[11px] font-semibold tracking-wide text-brand-deep"
          >
            {review.initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="truncate text-[13.5px] font-semibold text-foreground">
                {review.author}
              </p>
              {review.verified ? (
                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-success">
                  <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {review.dateLabel}
            </p>
          </div>
        </div>
        <ScoreMarks rating={review.rating} />
      </div>

      <h3
        className={cn(
          "mt-3 font-display font-medium tracking-tight text-foreground",
          featured
            ? "text-[1.1rem] leading-snug sm:text-[1.25rem]"
            : "text-[14.5px] leading-snug sm:text-[15px]",
        )}
      >
        {review.title}
      </h3>

      <p
        className={cn(
          "mt-1.5 flex-1 text-muted-foreground",
          featured
            ? "text-[13.5px] leading-relaxed sm:text-[14.5px]"
            : "text-[13px] leading-relaxed",
        )}
      >
        {text}
      </p>

      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 self-start text-[12px] font-medium text-brand-deep transition hover:text-foreground"
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}

      {review.tags && review.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((t) => (
            <li
              key={t}
              className="border border-border/80 bg-brand-mist/80 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center gap-1.5 border-t border-border/50 pt-2.5 text-[11.5px] text-muted-foreground">
        <ThumbsUp className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
        <span>
          <span className="font-medium text-foreground/80">{review.helpful}</span>{" "}
          found this helpful
        </span>
      </div>
    </article>
  );
}
