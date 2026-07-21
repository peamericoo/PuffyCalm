"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QTY } from "@/lib/cart/constants";
import styles from "./cart.module.css";

interface CartItemQuantityProps {
  quantity: number;
  productName: string;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function CartItemQuantity({
  quantity,
  productName,
  onDecrease,
  onIncrease,
}: CartItemQuantityProps) {
  return (
    <div className={styles.qty} role="group" aria-label={`Quantity for ${productName}`}>
      <button
        type="button"
        className={styles.qtyBtn}
        aria-label={`Decrease quantity of ${productName}`}
        disabled={quantity <= 1}
        onClick={onDecrease}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span key={quantity} className={styles.qtyValue} aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={styles.qtyBtn}
        aria-label={`Increase quantity of ${productName}`}
        disabled={quantity >= MAX_LINE_QTY}
        onClick={onIncrease}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}
