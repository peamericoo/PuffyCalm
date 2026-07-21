"use client";

import { formatMoney } from "@/lib/format";
import styles from "./cart.module.css";

interface CartDiscountProps {
  amount: number;
  currency: string;
}

/**
 * High-visibility savings strip — not a tiny muted line.
 */
export function CartDiscount({ amount, currency }: CartDiscountProps) {
  if (amount <= 0) return null;

  return (
    <div className={styles.savingsBanner} role="status">
      <span className={styles.savingsLabel}>You’re saving</span>
      <span key={amount} className={styles.savingsValue}>
        {formatMoney(amount, currency)}
      </span>
    </div>
  );
}
