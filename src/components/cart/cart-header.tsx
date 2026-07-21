"use client";

import type { RefObject } from "react";
import { X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import styles from "./cart.module.css";

interface CartHeaderProps {
  titleId: string;
  itemCount: number;
  savings: number;
  currency: string;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function CartHeader({
  titleId,
  itemCount,
  savings,
  currency,
  closeRef,
  onClose,
}: CartHeaderProps) {
  return (
    <header className={styles.header}>
      <div className="min-w-0">
        <h2
          id={titleId}
          className="font-display text-[1.2rem] font-semibold tracking-[-0.025em] text-foreground md:text-[1.35rem]"
        >
          Bag
          {itemCount > 0 ? (
            <span className="ml-1.5 text-[0.92em] font-medium tabular-nums text-muted-foreground">
              · {itemCount}
            </span>
          ) : null}
        </h2>
        {itemCount > 0 ? (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {savings > 0
              ? `Includes ${formatMoney(savings, currency)} in savings`
              : "Review and checkout"}
          </p>
        ) : null}
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close bag"
        className={styles.closeBtn}
      >
        <X className="h-5 w-5" strokeWidth={1.9} />
      </button>
    </header>
  );
}
