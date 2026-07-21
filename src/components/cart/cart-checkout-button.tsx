"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import styles from "./cart.module.css";

interface CartCheckoutButtonProps {
  total: number;
  currency: string;
  onNavigate: () => void;
}

export function CartCheckoutButton({
  total,
  currency,
  onNavigate,
}: CartCheckoutButtonProps) {
  return (
    <Link
      href="/checkout"
      onClick={onNavigate}
      className={styles.checkoutBtn}
    >
      <span>Checkout</span>
      <span key={total} className={styles.checkoutTotal}>
        · {formatMoney(total, currency)}
      </span>
      <ArrowRight className="h-4 w-4 opacity-90" strokeWidth={2.1} />
    </Link>
  );
}
