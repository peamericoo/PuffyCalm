"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { getProductBySlug } from "@/lib/mock/products";
import { formatMoney } from "@/lib/format";

/**
 * Full bag page — optional fallback for deep links / desktop review.
 * Primary UX is still the cart drawer.
 */
export function CartPageView() {
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const addItemQuiet = useCartStore((s) => s.addItemQuiet);
  const openCart = useCartStore((s) => s.openCart);
  const totals = useCartTotals();

  // Back-compat: /cart?add=slug&qty=n
  useEffect(() => {
    const add = searchParams.get("add");
    if (!add) return;
    const product = getProductBySlug(add);
    if (!product) return;
    const qty = Number(searchParams.get("qty") ?? "1");
    addItemQuiet(product, Number.isFinite(qty) ? qty : 1);
    openCart();
    // Strip query without full navigation noise
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("add");
      url.searchParams.delete("qty");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, addItemQuiet, openCart]);

  if (items.length === 0) {
    return (
      <section className="px-3 py-16 sm:px-5 sm:py-24">
        <Container className="max-w-lg animate-fade-up text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep ring-1 ring-brand/15">
            <ShoppingBag className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
            Your bag is empty
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Browse the collection and add something that fits your day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="default" className="pressable">
              <Link href="/category/all">Browse products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="px-3 pb-20 pt-6 sm:px-5 sm:pb-24 sm:pt-8">
      <Container className="animate-fade-up">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              Your bag
            </p>
            <h1 className="font-display text-[1.65rem] font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
            </h1>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-brand-deep">
            <Link href="/category/all">Continue shopping</Link>
          </Button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10 xl:grid-cols-[1fr_24rem]">
          <div className="rounded-[1.35rem] border border-border/70 bg-white/90 px-4 shadow-sm ring-1 ring-white/70 sm:px-5">
            <ul className="divide-y divide-border/50">
              {items.map((item) => (
                <li key={item.productId}>
                  <CartLineRow item={item} density="page" />
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--promo-h)+var(--nav-h)+1rem)]">
            <div className="rounded-[1.35rem] border border-border/70 bg-white/95 p-5 shadow-sm ring-1 ring-white/70 sm:p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Order summary
              </h2>
              <CartSummary totals={totals} className="mt-4" />

              <Button
                asChild
                variant="default"
                size="lg"
                className="pressable mt-5 w-full"
              >
                <Link href="/checkout">
                  Checkout · {formatMoney(totals.total, totals.currency)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
                Guest checkout · Payments secured by Stripe
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
