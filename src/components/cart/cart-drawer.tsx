"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { CartCheckoutButton } from "@/components/cart/cart-checkout-button";
import { CartDiscount } from "@/components/cart/cart-discount";
import { CartHeader } from "@/components/cart/cart-header";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { computeCartSavings } from "@/lib/cart/savings";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { cn } from "@/lib/utils";
import styles from "./cart.module.css";

const REMOVE_MS = 280;

/**
 * Premium bag surface — fully rebuilt presentation layer.
 *
 * Desktop (md+): full-viewport right rail (~380–456px), slide from right.
 * Mobile: high bottom sheet (~92dvh), slide from bottom — not a narrow rail.
 *
 * Business logic stays in Zustand (`useCartStore` / totals).
 */
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const items = useCartStore((s) => s.items);
  const totals = useCartTotals();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(() => new Set());
  const leaveTimers = useRef<Map<string, number>>(new Map());

  const savings = useMemo(() => computeCartSavings(items), [items]);

  /* Cleanup leave timers on unmount */
  useEffect(() => {
    const timers = leaveTimers.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  /* Body scroll lock + focus close control */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [isOpen]);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const requestRemove = useCallback(
    (productId: string) => {
      if (leaveTimers.current.has(productId)) return;

      const prefersReduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduce) {
        removeItem(productId);
        return;
      }

      setLeavingIds((prev) => new Set(prev).add(productId));
      const timer = window.setTimeout(() => {
        removeItem(productId);
        leaveTimers.current.delete(productId);
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, REMOVE_MS);
      leaveTimers.current.set(productId, timer);
    },
    [removeItem],
  );

  return (
    <div
      className={cn(
        styles.shell,
        isOpen ? styles.shellOpen : styles.shellClosed,
      )}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close bag"
        onClick={closeCart}
        className={styles.backdrop}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.panel}
      >
        <div className={styles.handle} aria-hidden>
          <span className={styles.handleBar} />
        </div>

        <CartHeader
          titleId={titleId}
          itemCount={totals.itemCount}
          savings={savings}
          currency={totals.currency}
          closeRef={closeRef}
          onClose={closeCart}
        />

        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              Your bag is empty
            </p>
            <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-muted-foreground">
              Find something calm for the desk.
            </p>
            <Button
              asChild
              variant="default"
              className="pressable mt-6"
              onClick={closeCart}
            >
              <Link href="/category/all" transitionTypes={["catalog"]}>
                Continue shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.body}>
              <ul className={styles.lineList}>
                {items.map((item, i) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    index={i}
                    isOpen={isOpen}
                    leaving={leavingIds.has(item.productId)}
                    onNavigate={closeCart}
                    onRequestRemove={requestRemove}
                  />
                ))}
              </ul>
            </div>

            <footer className={styles.footer}>
              <CartDiscount amount={savings} currency={totals.currency} />
              <CartSummary
                totals={totals}
                savings={0}
                density="drawer"
                showProgress
              />
              <CartCheckoutButton
                total={totals.total}
                currency={totals.currency}
                onNavigate={closeCart}
              />
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
