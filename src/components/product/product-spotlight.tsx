import styles from "./product-spotlight.module.css";
import { cn } from "@/lib/utils";

interface ProductSpotlightProps {
  className?: string;
  /** Beam scale relative to the stage */
  size?: "md" | "lg";
}

/**
 * Static stage spotlight — volumetric light from above that hits the product.
 * Pure CSS, no pointer tracking.
 *
 * Two layers so stacking is reliable with the photo in between:
 *  - behind: stage atmosphere + cone + landing pool
 *  - over: soft surface hit, top rim, floor falloff
 */
export function ProductSpotlight({
  className,
  size = "lg",
}: ProductSpotlightProps) {
  const sizeClass = size === "lg" ? styles.sizeLg : styles.sizeMd;

  return (
    <>
      <div
        aria-hidden
        className={cn(styles.behind, sizeClass, className)}
      >
        <div className={styles.stage} />
        <div className={styles.cone} />
        <div className={styles.pool} />
      </div>

      <div aria-hidden className={cn(styles.over, sizeClass)}>
        <div className={styles.hit} />
        <div className={styles.rim} />
        <div className={styles.floor} />
        <div className={styles.grain} />
      </div>
    </>
  );
}
