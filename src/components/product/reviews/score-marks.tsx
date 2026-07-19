import styles from "./product-reviews.module.css";
import { cn } from "@/lib/utils";

interface ScoreMarksProps {
  rating: number;
  className?: string;
}

/** Minimal brand score dots (not yellow stars). */
export function ScoreMarks({ rating, className }: ScoreMarksProps) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <span
      className={cn(styles.marks, className)}
      aria-label={`${rating} out of 5`}
    >
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
