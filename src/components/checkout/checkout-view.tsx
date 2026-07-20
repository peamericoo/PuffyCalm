"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Contact", "Shipping", "Payment"] as const;

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
 * Storefront checkout page — same shell as bag / category (no floating modal).
 * Steps: Contact → Shipping → Payment. Guest-first, Google optional.
 */
export function CheckoutView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totals = useCartTotals();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const prefillGoogle = () => {
    setEmail((e) => e || "alex@gmail.com");
    setFullName((n) => n || "Alex Rivera");
  };

  const prefillWallet = () => {
    prefillGoogle();
    setLine1((v) => v || "1 Market St");
    setCity((v) => v || "San Francisco");
    setRegion((v) => v || "CA");
    setPostal((v) => v || "94105");
  };

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email for your receipt";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Required";
    if (!line1.trim()) next.line1 = "Required";
    if (!city.trim()) next.city = "Required";
    if (!region.trim()) next.region = "Required";
    if (!postal.trim()) next.postal = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    }
  };

  const goBack = () => {
    setErrors({});
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const placeOrder = async () => {
    if (submitting || items.length === 0) return;
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
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
            Add something to your bag first, then come back here.
          </p>
          <Button asChild variant="default" className="pressable mt-8">
            <Link href="/category/all">Browse products</Link>
          </Button>
        </Container>
      </section>
    );
  }

  return (
    <section className="px-3 pb-20 pt-6 sm:px-5 sm:pb-24 sm:pt-8">
      <Container className="animate-fade-up">
        <header className="mb-6 sm:mb-8">
          <Link
            href="/cart"
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to bag
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            Checkout
          </p>
          <h1 className="font-display text-[1.65rem] font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            Complete your order
          </h1>
          <p className="mt-1.5 max-w-xl text-[14px] text-muted-foreground">
            Guest checkout by default. Google is optional and never required to
            pay.
          </p>
        </header>

        <nav
          aria-label="Checkout steps"
          className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8"
        >
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n;
            const active = step === n;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 ? (
                  <span
                    className="mx-0.5 hidden h-px w-6 bg-border sm:block"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                    active && "bg-brand-deep text-white shadow-sm",
                    done && "bg-success/12 text-success",
                    !active &&
                      !done &&
                      "bg-white/80 text-muted-foreground ring-1 ring-border/70",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                      active && "bg-white/20",
                      done && "bg-success/20",
                      !active && !done && "bg-muted",
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      n
                    )}
                  </span>
                  {label}
                </span>
              </div>
            );
          })}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-[1.35rem] border border-border/70 bg-white/95 p-5 shadow-sm ring-1 ring-white/70 sm:p-6 md:p-7">
            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Contact
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    We’ll send your receipt here. No account required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={prefillGoogle}
                  className="pressable flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-white text-[13.5px] font-semibold text-foreground shadow-sm transition-colors hover:bg-brand-soft"
                >
                  <GoogleMark className="h-4 w-4" />
                  Continue with Google
                </button>

                <div className="relative">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden
                  >
                    <div className="w-full border-t border-border/70" />
                  </div>
                  <p className="relative mx-auto w-fit bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    or email
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[12.5px] font-medium text-foreground/80">
                    Email
                  </span>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((x) => ({ ...x, email: "" }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        goNext();
                      }
                    }}
                    aria-invalid={Boolean(errors.email)}
                    className={cn(
                      errors.email && "border-cta/60 ring-2 ring-cta/15",
                    )}
                  />
                  {errors.email ? (
                    <span className="text-[12px] text-cta">{errors.email}</span>
                  ) : null}
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Shipping address
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Where should we deliver your order?
                  </p>
                </div>

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
                {Object.keys(errors).length > 0 ? (
                  <p className="text-[12px] text-cta">
                    Please fill in every shipping field.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Payment
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Express wallets or card — Stripe slot for production.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Express checkout
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={prefillWallet}
                      className="pressable flex h-12 items-center justify-center rounded-full bg-black text-[13px] font-semibold text-white"
                    >
                      Pay
                    </button>
                    <button
                      type="button"
                      onClick={prefillWallet}
                      className="pressable flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-[#f2f2f2] text-[13px] font-semibold"
                    >
                      <GoogleMark className="h-4 w-4" />
                      Pay
                    </button>
                    <button
                      type="button"
                      onClick={prefillWallet}
                      className="pressable flex h-12 items-center justify-center rounded-full bg-[#00c0f2] text-[13px] font-semibold text-white"
                    >
                      Link
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden
                  >
                    <div className="w-full border-t border-border/70" />
                  </div>
                  <p className="relative mx-auto w-fit bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    or card
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-brand-mist/50 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm ring-1 ring-border/60">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">
                        Payment Element
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        Card · wallets · Link — mock UI for now
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2.5">
                    <div className="h-11 rounded-full border border-border/80 bg-white px-4 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                      Card number
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="h-11 rounded-full border border-border/80 bg-white px-4 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                        MM / YY
                      </div>
                      <div className="h-11 rounded-full border border-border/80 bg-white px-4 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                        CVC
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-brand-soft/40 px-4 py-3 text-[12.5px] text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">
                      Receipt:
                    </span>{" "}
                    {email || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-foreground">
                      Ship to:
                    </span>{" "}
                    {[fullName, line1, city, region, postal]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="sm:min-w-[7rem]"
                  onClick={goBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  className="sm:min-w-[7rem]"
                >
                  <Link href="/cart">
                    <ArrowLeft className="h-4 w-4" />
                    Bag
                  </Link>
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  className="pressable w-full sm:w-auto sm:min-w-[12rem]"
                  onClick={goNext}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  className="pressable w-full sm:w-auto sm:min-w-[14rem]"
                  disabled={submitting}
                  onClick={() => void placeOrder()}
                >
                  {submitting ? (
                    "Starting payment…"
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Pay {formatMoney(totals.total, totals.currency)}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--promo-h)+var(--nav-h)+1rem)]">
            <div className="rounded-[1.35rem] border border-border/70 bg-white/95 p-5 shadow-sm ring-1 ring-white/70 sm:p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your order
              </h2>

              <ul className="mt-4 max-h-[16rem] space-y-3 overflow-y-auto overscroll-contain pr-1">
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
