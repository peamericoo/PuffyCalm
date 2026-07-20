"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { CartSummary } from "@/components/cart/cart-summary";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * One-page checkout — mock UI for Express wallets + guest form + Stripe slots.
 * No multi-step wizard. Google prefill is optional, never a gate.
 */
export function CheckoutView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totals = useCartTotals();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canPay = useMemo(() => items.length > 0, [items.length]);

  const mockGooglePrefill = () => {
    setEmail((e) => e || "alex@gmail.com");
    setFullName((n) => n || "Alex Rivera");
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email for your receipt";
    }
    if (!fullName.trim()) next.fullName = "Name is required";
    if (!line1.trim()) next.line1 = "Address is required";
    if (!city.trim()) next.city = "City is required";
    if (!region.trim()) next.region = "State is required";
    if (!postal.trim()) next.postal = "ZIP is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeOrder = async () => {
    if (!canPay || submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    // Mock latency for Stripe-ish feel
    await new Promise((r) => setTimeout(r, 700));
    const orderId = `PC-${Date.now().toString(36).toUpperCase()}`;
    clearCart();
    router.push(
      `/success?order=${orderId}&email=${encodeURIComponent(email.trim())}`,
    );
  };

  if (items.length === 0) {
    return (
      <section className="px-3 py-16 sm:px-5 sm:py-24">
        <Container className="max-w-lg animate-fade-up text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep ring-1 ring-brand/15">
            <ShoppingBag className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
            Nothing to checkout
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Add something to your bag first — then pay in one calm step.
          </p>
          <Button asChild variant="default" className="pressable mt-8">
            <Link href="/category/all">Browse products</Link>
          </Button>
        </Container>
      </section>
    );
  }

  return (
    <section className="px-3 pb-24 pt-5 sm:px-5 sm:pb-28 sm:pt-8">
      <Container className="animate-fade-up">
        <Link
          href="/cart"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-brand-deep"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to bag
        </Link>

        <header className="mb-6 sm:mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            Checkout
          </p>
          <h1 className="font-display text-[1.65rem] font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            You’re almost there
          </h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-muted-foreground sm:text-[14.5px]">
            Guest checkout by default. Sign in with Google only if you want
            details filled faster — never required to pay.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_22.5rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            {/* Express wallets — Stripe Express Checkout slot */}
            <section className="rounded-[1.35rem] border border-border/70 bg-white/95 p-4 shadow-sm ring-1 ring-white/70 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Express checkout
                </h2>
                <span className="text-[10px] font-medium text-muted-foreground/70">
                  Stripe · mock
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    mockGooglePrefill();
                    setLine1((v) => v || "1 Market St");
                    setCity((v) => v || "San Francisco");
                    setRegion((v) => v || "CA");
                    setPostal((v) => v || "94105");
                  }}
                  className="pressable flex h-12 items-center justify-center rounded-xl bg-black text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Pay
                </button>
                <button
                  type="button"
                  onClick={mockGooglePrefill}
                  className="pressable flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-[#f2f2f2] text-[13px] font-semibold text-foreground transition-colors hover:bg-[#e8e8e8]"
                >
                  <GoogleMark className="h-4 w-4" />
                  Pay
                </button>
                <button
                  type="button"
                  onClick={mockGooglePrefill}
                  className="pressable flex h-12 items-center justify-center rounded-xl bg-[#00c0f2] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Link
                </button>
              </div>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-border/70" />
                </div>
                <p className="relative mx-auto w-fit bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Or pay with card
                </p>
              </div>
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Wallet buttons will map to Stripe Express Checkout Element.
                Tapping them here prefills the form for design review.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-[1.35rem] border border-border/70 bg-white/95 p-4 shadow-sm ring-1 ring-white/70 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-foreground">
                  1. Contact
                </h2>
                <button
                  type="button"
                  onClick={mockGooglePrefill}
                  className="pressable inline-flex h-9 items-center gap-2 rounded-full border border-border bg-white px-3.5 text-[12.5px] font-semibold text-foreground shadow-sm transition-colors hover:bg-brand-soft"
                >
                  <GoogleMark className="h-3.5 w-3.5" />
                  Continue with Google
                </button>
              </div>
              <label className="block space-y-1.5">
                <span className="text-[12.5px] font-medium text-foreground/80">
                  Email for receipt
                </span>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={cn(errors.email && "border-cta/60 ring-cta/20")}
                />
                {errors.email ? (
                  <span className="text-[12px] text-cta">{errors.email}</span>
                ) : null}
              </label>
              <p className="mt-2.5 text-[12px] text-muted-foreground">
                No account required. We’ll email your order confirmation.
              </p>
            </section>

            {/* Shipping */}
            <section className="rounded-[1.35rem] border border-border/70 bg-white/95 p-4 shadow-sm ring-1 ring-white/70 sm:p-5">
              <h2 className="mb-4 text-[15px] font-semibold text-foreground">
                2. Ship to
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-[12.5px] font-medium text-foreground/80">
                    Full name
                  </span>
                  <Input
                    autoComplete="name"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                    className={cn(errors.fullName && "border-cta/60")}
                  />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-[12.5px] font-medium text-foreground/80">
                    Address
                  </span>
                  <Input
                    autoComplete="address-line1"
                    placeholder="Street address"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    aria-invalid={Boolean(errors.line1)}
                    className={cn(errors.line1 && "border-cta/60")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[12.5px] font-medium text-foreground/80">
                    City
                  </span>
                  <Input
                    autoComplete="address-level2"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={cn(errors.city && "border-cta/60")}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-[12.5px] font-medium text-foreground/80">
                      State
                    </span>
                    <Input
                      autoComplete="address-level1"
                      placeholder="CA"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className={cn(errors.region && "border-cta/60")}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[12.5px] font-medium text-foreground/80">
                      ZIP
                    </span>
                    <Input
                      autoComplete="postal-code"
                      placeholder="94105"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                      className={cn(errors.postal && "border-cta/60")}
                    />
                  </label>
                </div>
              </div>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Later: Stripe Address Element for autofill + validation.
              </p>
            </section>

            {/* Payment */}
            <section className="rounded-[1.35rem] border border-border/70 bg-white/95 p-4 shadow-sm ring-1 ring-white/70 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-foreground">
                  3. Pay
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Stripe
                </span>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-brand-mist/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm ring-1 ring-border/60">
                    <CreditCard className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">
                      Payment Element
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Card · wallets · Link — wired when Stripe keys land
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2.5">
                  <div className="h-11 rounded-xl border border-border/80 bg-white px-3.5 text-[13px] leading-[2.75rem] text-muted-foreground/70">
                    Card number · mock
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="h-11 rounded-xl border border-border/80 bg-white px-3.5 text-[13px] leading-[2.75rem] text-muted-foreground/70">
                      MM / YY
                    </div>
                    <div className="h-11 rounded-xl border border-border/80 bg-white px-3.5 text-[13px] leading-[2.75rem] text-muted-foreground/70">
                      CVC
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Order summary sticky */}
          <aside className="lg:sticky lg:top-[calc(var(--promo-h)+var(--nav-h)+1rem)]">
            <div className="rounded-[1.35rem] border border-border/70 bg-white/95 p-5 shadow-sm ring-1 ring-white/70 sm:p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your order
              </h2>

              <ul className="mt-4 max-h-[14rem] space-y-3 overflow-y-auto overscroll-contain pr-1">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-soft ring-1 ring-border/50">
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[12.5px] tabular-nums text-muted-foreground">
                        {formatMoney(item.price * item.quantity, item.currency)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <CartSummary totals={totals} className="mt-5" showProgress />

              <Button
                type="button"
                variant="default"
                size="lg"
                className="pressable mt-5 w-full"
                disabled={submitting}
                onClick={() => void placeOrder()}
              >
                {submitting ? (
                  "Placing order…"
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 opacity-90" />
                    Pay {formatMoney(totals.total, totals.currency)}
                  </>
                )}
              </Button>

              <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
                {[
                  "Guest checkout — no account wall",
                  "Payments secured by Stripe",
                  "Easy returns · calm support",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-[12px] leading-snug text-muted-foreground"
                  >
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                      strokeWidth={2.25}
                    />
                    {t}
                  </li>
                ))}
              </ul>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
                <ShieldCheck className="h-3.5 w-3.5" />
                Mock payment — no real charge yet
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
