"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Lock,
  ShoppingBag,
} from "lucide-react";
import { CartSummary } from "@/components/cart/cart-summary";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./checkout.module.css";

type Step = 1 | 2 | 3;
type Direction = "forward" | "back";

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
 * Page-native checkout. Mobile: compact chrome, collapsible order,
 * sticky CTA, animated step transitions. Desktop: two-column roomy layout.
 */
export function CheckoutView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totals = useCartTotals();

  const [step, setStep] = useState<Step>(1);
  const [dir, setDir] = useState<Direction>("forward");
  const [animKey, setAnimKey] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goTo = (next: Step, direction: Direction) => {
    setDir(direction);
    setStep(next);
    setAnimKey((k) => k + 1);
    setErrors({});
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

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
      goTo(2, "forward");
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      goTo(3, "forward");
    }
  };

  const goBack = () => {
    if (step === 2) goTo(1, "back");
    else if (step === 3) goTo(2, "back");
  };

  const placeOrder = async () => {
    if (submitting || items.length === 0) return;
    if (!validateStep1()) {
      goTo(1, "back");
      return;
    }
    if (!validateStep2()) {
      goTo(2, "back");
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
      <section className="px-4 py-14 sm:px-5 sm:py-20">
        <Container className="max-w-lg animate-fade-up text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep ring-1 ring-brand/15">
            <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Nothing to checkout
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Add something to your bag first, then come back here.
          </p>
          <Button asChild variant="default" className="pressable mt-7">
            <Link href="/category/all">Browse products</Link>
          </Button>
        </Container>
      </section>
    );
  }

  const progressPct = (step / 3) * 100;
  const totalLabel = formatMoney(totals.total, totals.currency);

  const primaryCta =
    step < 3 ? (
      <Button
        type="button"
        variant="default"
        size="lg"
        className="pressable h-12 w-full flex-1 text-[14px] sm:h-12 sm:min-w-[11rem] sm:flex-none"
        onClick={goNext}
      >
        {step === 1 ? "Continue" : "Continue to payment"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    ) : (
      <Button
        type="button"
        variant="default"
        size="lg"
        className="pressable h-12 w-full flex-1 text-[14px] sm:h-12 sm:min-w-[13rem] sm:flex-none"
        disabled={submitting}
        onClick={() => void placeOrder()}
      >
        {submitting ? (
          "Starting payment…"
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            Pay {totalLabel}
          </>
        )}
      </Button>
    );

  return (
    <section className="px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-20 sm:pt-6 lg:pb-24 lg:pt-8">
      <Container className="animate-fade-up max-w-[1120px]">
        {/* Compact top bar */}
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
          <Link
            href="/cart"
            className="inline-flex h-9 items-center gap-1 rounded-full px-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="sm:hidden">Bag</span>
            <span className="hidden sm:inline">Back to bag</span>
          </Link>
          <p className="text-[11px] font-semibold tabular-nums text-muted-foreground sm:text-[12px]">
            <span className="text-foreground">{step}</span>
            <span className="mx-0.5 opacity-50">/</span>
            3
            <span className="ml-1.5 font-medium text-muted-foreground">
              · {STEP_LABELS[step - 1]}
            </span>
          </p>
        </div>

        {/* Title — tight on mobile */}
        <header className="mb-3 sm:mb-5">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 sm:block">
            Checkout
          </p>
          <h1 className="font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:mt-0.5 sm:text-[1.85rem] lg:text-[2rem]">
            {step === 1 && "Your contact"}
            {step === 2 && "Shipping address"}
            {step === 3 && "Payment"}
          </h1>
          <p className="mt-1 hidden max-w-lg text-[13.5px] text-muted-foreground sm:block">
            Guest checkout by default. Google is optional and never required to
            pay.
          </p>
        </header>

        {/* Segmented progress — numbers only on xs */}
        <div className="mb-4 sm:mb-6">
          <div className="mb-2 flex items-center justify-between gap-1">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as Step;
              const done = step > n;
              const active = step === n;
              return (
                <div
                  key={label}
                  className="flex min-w-0 flex-1 items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300 sm:h-8 sm:w-8 sm:text-[12px]",
                      active && "bg-brand-deep text-white shadow-sm",
                      done && "bg-success text-white",
                      !active &&
                        !done &&
                        "bg-white text-muted-foreground ring-1 ring-border/80",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : (
                      n
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-[12px] font-semibold sm:inline",
                      active && "text-foreground",
                      done && "text-success",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  {i < 2 ? (
                    <span
                      className={cn(
                        "mx-1 hidden h-px min-w-[0.75rem] flex-1 sm:block",
                        step > n ? "bg-success/50" : "bg-border",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div
            className="h-1 overflow-hidden rounded-full bg-border/70"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label="Checkout progress"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Mobile order strip — collapsed by default (unstacks the page) */}
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-white/95 px-3 py-2.5 text-left shadow-sm ring-1 ring-white/70"
            aria-expanded={summaryOpen}
          >
            <div className="flex -space-x-2">
              {items.slice(0, 3).map((item) => (
                <span
                  key={item.productId}
                  className="relative h-9 w-9 overflow-hidden rounded-lg bg-brand-soft ring-2 ring-white"
                >
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-muted-foreground">
                {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
                {totals.qualifiesForFreeShipping ? " · Free ship" : ""}
              </p>
              <p className="text-[14px] font-semibold tabular-nums text-foreground">
                {totalLabel}
              </p>
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-brand-deep">
              {summaryOpen ? "Hide" : "Details"}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  summaryOpen && "rotate-180",
                )}
              />
            </span>
          </button>

          {summaryOpen ? (
            <div
              className={cn(
                styles.summaryOpen,
                "mt-2 rounded-2xl border border-border/70 bg-white/95 p-3.5 shadow-sm ring-1 ring-white/70",
              )}
            >
              <ul className="max-h-40 space-y-2.5 overflow-y-auto overscroll-contain">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-2.5">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[12.5px] font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="text-[12px] tabular-nums text-muted-foreground">
                        ×{item.quantity} ·{" "}
                        {formatMoney(
                          item.price * item.quantity,
                          item.currency,
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <CartSummary
                totals={totals}
                className="mt-3 border-t border-border/50 pt-3"
                showProgress
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Form panel */}
          <div className="overflow-hidden rounded-[1.2rem] border border-border/70 bg-white/95 shadow-sm ring-1 ring-white/70 sm:rounded-[1.35rem]">
            <div
              key={animKey}
              className={cn(
                "px-4 py-4 sm:px-6 sm:py-6 md:px-7 md:py-7",
                dir === "forward"
                  ? styles.stepEnterForward
                  : styles.stepEnterBack,
              )}
            >
              {step === 1 ? (
                <div className="space-y-4 sm:space-y-5">
                  <p className="text-[13px] leading-snug text-muted-foreground sm:text-[13.5px]">
                    Receipt email — no account required.
                  </p>

                  <button
                    type="button"
                    onClick={prefillGoogle}
                    className="pressable flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-white text-[13px] font-semibold text-foreground shadow-sm transition-colors hover:bg-brand-soft sm:h-12 sm:text-[13.5px]"
                  >
                    <GoogleMark className="h-4 w-4" />
                    Continue with Google
                  </button>

                  <div className="relative py-0.5">
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
                    <span className="text-[12px] font-medium text-foreground/80 sm:text-[12.5px]">
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
                        if (errors.email)
                          setErrors((x) => ({ ...x, email: "" }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          goNext();
                        }
                      }}
                      aria-invalid={Boolean(errors.email)}
                      className={cn(
                        "h-11 sm:h-11",
                        errors.email && "border-cta/60 ring-2 ring-cta/15",
                      )}
                    />
                    {errors.email ? (
                      <span className="text-[12px] text-cta">
                        {errors.email}
                      </span>
                    ) : null}
                  </label>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-3.5 sm:space-y-4">
                  <p className="text-[13px] leading-snug text-muted-foreground">
                    Where should we deliver?
                  </p>

                  <label className="block space-y-1.5">
                    <span className="text-[12px] font-medium text-foreground/80">
                      Full name
                    </span>
                    <Input
                      autoComplete="name"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={cn(
                        "h-11",
                        errors.fullName && "border-cta/60",
                      )}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[12px] font-medium text-foreground/80">
                      Address
                    </span>
                    <Input
                      autoComplete="address-line1"
                      placeholder="Street address"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className={cn("h-11", errors.line1 && "border-cta/60")}
                    />
                  </label>

                  {/* City + State + ZIP share one row on wider phones */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 sm:gap-3">
                    <label className="col-span-2 block space-y-1.5 sm:col-span-3">
                      <span className="text-[12px] font-medium text-foreground/80">
                        City
                      </span>
                      <Input
                        autoComplete="address-level2"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={cn("h-11", errors.city && "border-cta/60")}
                      />
                    </label>
                    <label className="block space-y-1.5 sm:col-span-1">
                      <span className="text-[12px] font-medium text-foreground/80">
                        State
                      </span>
                      <Input
                        autoComplete="address-level1"
                        placeholder="CA"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className={cn(
                          "h-11",
                          errors.region && "border-cta/60",
                        )}
                      />
                    </label>
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className="text-[12px] font-medium text-foreground/80">
                        ZIP
                      </span>
                      <Input
                        autoComplete="postal-code"
                        placeholder="94105"
                        value={postal}
                        onChange={(e) => setPostal(e.target.value)}
                        className={cn(
                          "h-11",
                          errors.postal && "border-cta/60",
                        )}
                      />
                    </label>
                  </div>

                  {Object.keys(errors).length > 0 ? (
                    <p className="text-[12px] text-cta">
                      Please fill in every shipping field.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4 sm:space-y-5">
                  <p className="text-[13px] leading-snug text-muted-foreground">
                    Express pay or card — Stripe mock.
                  </p>

                  {/* Always 3-up — no vertical stack of wallets */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={prefillWallet}
                      className="pressable flex h-11 items-center justify-center rounded-xl bg-black text-[12px] font-semibold text-white sm:h-12 sm:rounded-full sm:text-[13px]"
                    >
                      Pay
                    </button>
                    <button
                      type="button"
                      onClick={prefillWallet}
                      className="pressable flex h-11 items-center justify-center gap-1 rounded-xl border border-border bg-[#f2f2f2] text-[12px] font-semibold sm:h-12 sm:gap-1.5 sm:rounded-full sm:text-[13px]"
                    >
                      <GoogleMark className="h-3.5 w-3.5" />
                      Pay
                    </button>
                    <button
                      type="button"
                      onClick={prefillWallet}
                      className="pressable flex h-11 items-center justify-center rounded-xl bg-[#00c0f2] text-[12px] font-semibold text-white sm:h-12 sm:rounded-full sm:text-[13px]"
                    >
                      Link
                    </button>
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

                  <div className="rounded-2xl border border-dashed border-border bg-brand-mist/40 p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep ring-1 ring-border/60">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">
                          Payment Element
                        </p>
                        <p className="text-[11.5px] text-muted-foreground">
                          Mock card fields
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="h-11 rounded-full border border-border/80 bg-white px-4 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                        Card number
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-11 rounded-full border border-border/80 bg-white px-4 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                          MM / YY
                        </div>
                        <div className="h-11 rounded-full border border-border/80 bg-white px-4 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                          CVC
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* One-line recap — not two stacked blocks */}
                  <p className="rounded-xl bg-brand-soft/50 px-3 py-2.5 text-[12px] leading-snug text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {email || "—"}
                    </span>
                    <span className="mx-1.5 opacity-40">·</span>
                    <span className="line-clamp-1">
                      {[fullName, city, region].filter(Boolean).join(", ") ||
                        "—"}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            {/* Desktop actions inside card (mobile uses sticky bar) */}
            <div className="hidden items-center justify-between gap-3 border-t border-border/60 px-6 py-4 lg:flex lg:px-7">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button asChild type="button" variant="ghost">
                  <Link href="/cart">
                    <ArrowLeft className="h-4 w-4" />
                    Bag
                  </Link>
                </Button>
              )}
              {primaryCta}
            </div>
          </div>

          {/* Desktop order summary */}
          <aside className="hidden lg:sticky lg:top-[calc(var(--promo-h)+var(--nav-h)+0.75rem)] lg:block">
            <div className="rounded-[1.35rem] border border-border/70 bg-white/95 p-5 shadow-sm ring-1 ring-white/70 xl:p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your order
              </h2>
              <ul className="mt-4 max-h-[15rem] space-y-3 overflow-y-auto overscroll-contain pr-0.5">
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
              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                Guest checkout · Stripe mock · Easy returns
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* Mobile sticky CTA — primary action always one thumb-reach */}
      <div className={styles.stickyBar}>
        <div className="mx-auto flex max-w-[1120px] items-center gap-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-12 shrink-0 rounded-full px-0"
              onClick={goBack}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-12 w-12 shrink-0 rounded-full px-0"
            >
              <Link href="/cart" aria-label="Back to bag">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {primaryCta}
        </div>
      </div>
    </section>
  );
}
