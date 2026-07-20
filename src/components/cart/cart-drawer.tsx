"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Primary cart surface on mobile & desktop — full /cart is optional fallback.
 * Low-friction: edit qty here, one tap to unified checkout.
 */
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const totals = useCartTotals();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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
        isOpen
          ? "pointer-events-auto"
          : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close bag"
        onClick={closeCart}
        className={cn(
          "absolute inset-0 bg-foreground/25 backdrop-blur-[3px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[26.5rem] flex-col",
          "bg-white/98 shadow-[-20px_0_50px_-24px_rgb(26_35_50/0.45)] backdrop-blur-xl",
          "ring-1 ring-border/50",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              Your bag
            </p>
            <h2
              id={titleId}
              className="font-display text-[1.2rem] font-semibold tracking-[-0.02em] text-foreground"
            >
              {totals.itemCount === 0
                ? "Empty for now"
                : `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}`}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-brand-soft"
          >
            <X className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep ring-1 ring-brand/15">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-foreground">
              Your bag is empty
            </p>
            <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-muted-foreground">
              Soft resets for real days — find something that feels like you.
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
              <ul className="divide-y divide-border/50">
                {items.map((item) => (
                  <li key={item.productId}>
                    <CartLineRow
                      item={item}
                      density="drawer"
                      onNavigate={closeCart}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <footer className="shrink-0 border-t border-border/60 bg-white/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5">
              <CartSummary totals={totals} />

              <div className="mt-4 flex flex-col gap-2.5">
                <Button asChild variant="default" size="lg" className="pressable w-full">
                  <Link href="/checkout" onClick={closeCart}>
                    Checkout · {formatMoney(totals.total, totals.currency)}
                    <ArrowRight className="h-4 w-4 opacity-90" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/cart" onClick={closeCart}>
                    View full bag
                  </Link>
                </Button>
              </div>

              <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
                Guest checkout · Secured by Stripe · Easy returns
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
