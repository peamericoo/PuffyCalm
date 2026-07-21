"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Bag surface — dual layout, zero extra chrome:
 * - Desktop (md+): right sidebar, minimal
 * - Mobile: bottom sheet (app-like), primary path
 */
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const totals = useCartTotals();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const savings = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (item.compareAtPrice && item.compareAtPrice > item.price) {
          return sum + (item.compareAtPrice - item.price) * item.quantity;
        }
        return sum;
      }, 0),
    [items],
  );

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60]",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      {/* Scrim */}
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close bag"
        onClick={closeCart}
        className={cn(
          "absolute inset-0 bg-foreground/30 transition-opacity duration-300 ease-out",
          "md:bg-foreground/25 md:backdrop-blur-[2px]",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/*
        Panel:
        - default (mobile): bottom sheet
        - md+: right rail
      */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "bag-panel absolute flex flex-col bg-white",
          /* Mobile bottom sheet */
          "inset-x-0 bottom-0 max-h-[min(92dvh,100%)] rounded-t-[1.35rem]",
          "shadow-[0_-16px_48px_-20px_rgb(26_35_50/0.35)]",
          "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0",
          /* Desktop sidebar */
          "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:max-h-none",
          "md:w-full md:max-w-[24.5rem] md:rounded-none",
          "md:shadow-[-18px_0_44px_-22px_rgb(26_35_50/0.4)]",
          "md:ring-1 md:ring-border/40",
          isOpen ? "md:translate-x-0" : "md:translate-x-full",
          isOpen ? "md:opacity-100" : "md:opacity-0",
          /* Reset mobile Y when desktop */
          "md:translate-y-0",
        )}
      >
        {/* Mobile grab handle */}
        <div
          className="flex shrink-0 justify-center pb-0.5 pt-2.5 md:hidden"
          aria-hidden
        >
          <span className="h-1 w-10 rounded-full bg-border/90" />
        </div>

        <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-1 md:border-b md:border-border/50 md:px-5 md:py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-foreground md:text-[1.25rem]"
            >
              Bag
              {totals.itemCount > 0 ? (
                <span className="ml-1.5 text-[0.95em] font-medium tabular-nums text-muted-foreground">
                  · {totals.itemCount}
                </span>
              ) : null}
            </h2>
            {savings > 0 ? (
              <p className="bag-save-tag mt-0.5 text-[12px] font-semibold text-cta">
                You’re saving {formatMoney(savings, totals.currency)}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "text-muted-foreground transition-[background-color,color,transform] duration-200",
              "hover:bg-brand-soft hover:text-foreground active:scale-95",
            )}
          >
            <X className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center md:pb-0">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl",
                "bg-brand-soft text-brand-deep ring-1 ring-brand/15",
                isOpen && "bag-pop",
              )}
            >
              <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-foreground">
              Your bag is empty
            </p>
            <p className="mt-1.5 max-w-[15rem] text-[13px] leading-relaxed text-muted-foreground">
              Find something calm for the desk.
            </p>
            <Button
              asChild
              variant="default"
              className="pressable mt-6"
              onClick={closeCart}
            >
              <Link href="/category/all">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 md:px-5">
              <ul className="flex flex-col gap-2 pb-2 pt-1 md:gap-0 md:divide-y md:divide-border/45 md:pb-1">
                {items.map((item, i) => (
                  <li
                    key={item.productId}
                    className={cn(
                      "bag-line",
                      "md:py-0",
                      /* Mobile: soft card per line for clarity */
                      "rounded-2xl bg-brand-mist/60 ring-1 ring-border/40 md:rounded-none md:bg-transparent md:ring-0",
                    )}
                    style={
                      isOpen
                        ? { animationDelay: `${40 + i * 45}ms` }
                        : undefined
                    }
                  >
                    <CartLineRow
                      item={item}
                      density="drawer"
                      onNavigate={closeCart}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <footer
              className={cn(
                "shrink-0 border-t border-border/50 bg-white",
                "px-4 pt-3.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] md:px-5 md:pb-5 md:pt-4",
              )}
            >
              <CartSummary
                totals={totals}
                savings={savings}
                density="drawer"
              />

              <Button
                asChild
                variant="default"
                size="lg"
                className="pressable mt-3.5 h-12 w-full text-[14px] md:mt-4"
              >
                <Link href="/checkout" onClick={closeCart}>
                  Checkout
                  <span className="tabular-nums opacity-95">
                    · {formatMoney(totals.total, totals.currency)}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-90" />
                </Link>
              </Button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
