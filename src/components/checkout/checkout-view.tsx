"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Gift,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { CartSummary } from "@/components/cart/cart-summary";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/cart/constants";
import { useCartStore, useCartTotals } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./checkout-modal.module.css";

type CheckoutStep = "contact" | "shipping" | "reward" | "pay";

const STEPS: CheckoutStep[] = ["contact", "shipping", "reward", "pay"];

const STEP_META: Record<
  CheckoutStep,
  { label: string; icon: typeof Mail }
> = {
  contact: { label: "Contact", icon: Mail },
  shipping: { label: "Ship to", icon: MapPin },
  reward: { label: "Bonus", icon: Gift },
  pay: { label: "Pay", icon: CreditCard },
};

function faceProgress(step: CheckoutStep): number {
  if (step === "contact") return 1;
  if (step === "shipping") return 2;
  if (step === "reward") return 2;
  return 3;
}

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

const SPARKS = [
  { left: "12%", top: "22%", dx: "-18px", dy: "-28px", color: "#7eb8d4", delay: "0ms" },
  { left: "78%", top: "18%", dx: "22px", dy: "-24px", color: "#e07a5f", delay: "80ms" },
  { left: "22%", top: "68%", dx: "-14px", dy: "20px", color: "#3d9b7a", delay: "120ms" },
  { left: "70%", top: "72%", dx: "18px", dy: "16px", color: "#7eb8d4", delay: "40ms" },
  { left: "48%", top: "12%", dx: "4px", dy: "-32px", color: "#3a7ca5", delay: "160ms" },
  { left: "55%", top: "80%", dx: "-8px", dy: "24px", color: "#e07a5f", delay: "200ms" },
];

/**
 * Page-integrated step carousel: Contact → Ship → Reward → Pay.
 * No gray overlay — sits in the storefront like bag / category cards.
 */
export function CheckoutView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totals = useCartTotals();
  const titleId = useId();
  const descId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);

  const [step, setStep] = useState<CheckoutStep>("contact");
  const stepIndex = STEPS.indexOf(step);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const face = faceProgress(step);
  const progressPct = (face / 3) * 100;
  const canPay = items.length > 0;

  useEffect(() => {
    const t = window.setTimeout(() => continueRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [step]);

  const mockGooglePrefill = () => {
    setEmail((e) => e || "alex@gmail.com");
    setFullName((n) => n || "Alex Rivera");
  };

  const mockWallet = () => {
    mockGooglePrefill();
    setLine1((v) => v || "1 Market St");
    setCity((v) => v || "San Francisco");
    setRegion((v) => v || "CA");
    setPostal((v) => v || "94105");
  };

  const validateContact = () => {
    const next: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email for your receipt";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateShipping = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Name is required";
    if (!line1.trim()) next.line1 = "Address is required";
    if (!city.trim()) next.city = "City is required";
    if (!region.trim()) next.region = "State is required";
    if (!postal.trim()) next.postal = "ZIP is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === "contact") {
      if (!validateContact()) return;
      setStep("shipping");
      return;
    }
    if (step === "shipping") {
      if (!validateShipping()) return;
      setStep("reward");
      return;
    }
    if (step === "reward") {
      setRewardClaimed(true);
      setStep("pay");
    }
  };

  const goBack = () => {
    setErrors({});
    if (step === "shipping") setStep("contact");
    else if (step === "reward") setStep("shipping");
    else if (step === "pay") setStep(rewardClaimed ? "reward" : "shipping");
  };

  const placeOrder = async () => {
    if (!canPay || submitting) return;
    if (!validateContact() || !validateShipping()) {
      setStep(!email.trim() ? "contact" : "shipping");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    const orderId = `PC-${Date.now().toString(36).toUpperCase()}`;
    clearCart();
    router.push(
      `/success?order=${orderId}&email=${encodeURIComponent(email.trim())}&reward=${rewardClaimed ? "1" : "0"}`,
    );
  };

  const miniTotal = useMemo(
    () => formatMoney(totals.total, totals.currency),
    [totals.total, totals.currency],
  );

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
            Add something to your bag first — then finish in a calm few steps.
          </p>
          <Button asChild variant="default" className="pressable mt-8">
            <Link href="/category/all">Browse products</Link>
          </Button>
        </Container>
      </section>
    );
  }

  return (
    <section className="px-3 pb-20 pt-5 sm:px-5 sm:pb-24 sm:pt-8">
      <Container className="animate-fade-up">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
          <div>
            <Link
              href="/cart"
              className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-brand-deep"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to bag
            </Link>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              Checkout
            </p>
            <h1 className="font-display text-[1.55rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
              A few calm steps
            </h1>
          </div>
          <p className="rounded-full bg-brand-soft/80 px-3 py-1.5 text-[12px] font-medium text-brand-deep ring-1 ring-brand/12">
            Guest checkout · Stripe ready
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Step panel */}
          <div
            className={styles.panel}
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <header className="shrink-0 border-b border-border/50 px-4 pb-3 pt-3.5 sm:px-5 sm:pt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                {step === "contact" ? (
                  <span className="text-[12.5px] font-medium text-muted-foreground">
                    Step {face} of 3
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-deep"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
                  {STEP_META[step].label}
                </p>
                <span className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secure
                </span>
              </div>

              <div className="mb-2.5 flex items-center gap-1.5">
                {(["contact", "shipping", "pay"] as const).map((s, i) => {
                  const n = i + 1;
                  const done = face > n;
                  const active = face === n;
                  return (
                    <span
                      key={s}
                      className={cn(
                        styles.stepDot,
                        active && styles.stepDotActive,
                        done && styles.stepDotDone,
                      )}
                      aria-hidden
                    />
                  );
                })}
              </div>

              <div className={styles.progressTrack} aria-hidden>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    id={descId}
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    {step === "reward"
                      ? "A little something for you"
                      : STEP_META[step].label}
                  </p>
                  <h2
                    id={titleId}
                    className="font-display text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.4rem]"
                  >
                    {step === "contact" && "Where should we send the receipt?"}
                    {step === "shipping" && "Where should it land?"}
                    {step === "reward" && "You unlocked a calm bonus"}
                    {step === "pay" && "Pay & you’re done"}
                  </h2>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep ring-1 ring-brand/15">
                  {(() => {
                    const Icon = STEP_META[step].icon;
                    return <Icon className="h-4 w-4" strokeWidth={1.9} />;
                  })()}
                </span>
              </div>
            </header>

            <div className={styles.viewport}>
              <div
                className={styles.track}
                style={{
                  transform: `translate3d(-${stepIndex * 100}%, 0, 0)`,
                }}
              >
                {/* Contact */}
                <div className={styles.slide} aria-hidden={step !== "contact"}>
                  <div className="space-y-3.5 pb-1">
                    <button
                      type="button"
                      onClick={mockGooglePrefill}
                      className="pressable flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-white text-[13.5px] font-semibold text-foreground shadow-sm transition-colors hover:bg-brand-soft"
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
                      <span className="text-[12.5px] font-medium text-foreground/80">
                        Email for receipt
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
                          "rounded-2xl",
                          errors.email && "border-cta/60 ring-2 ring-cta/15",
                        )}
                      />
                      {errors.email ? (
                        <span className="text-[12px] text-cta">
                          {errors.email}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">
                          Guest checkout — no account required
                        </span>
                      )}
                    </label>

                    <div className="rounded-2xl bg-brand-soft/70 px-3.5 py-3 ring-1 ring-brand/10">
                      <p className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/85">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-deep" />
                        Finish the next step and we’ll unlock a little packing
                        bonus for this order.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className={styles.slide} aria-hidden={step !== "shipping"}>
                  <div className="grid gap-3 pb-1">
                    <label className="block space-y-1.5">
                      <span className="text-[12.5px] font-medium text-foreground/80">
                        Full name
                      </span>
                      <Input
                        autoComplete="name"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={cn(
                          "rounded-2xl",
                          errors.fullName && "border-cta/60",
                        )}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[12.5px] font-medium text-foreground/80">
                        Address
                      </span>
                      <Input
                        autoComplete="address-line1"
                        placeholder="Street address"
                        value={line1}
                        onChange={(e) => setLine1(e.target.value)}
                        className={cn(
                          "rounded-2xl",
                          errors.line1 && "border-cta/60",
                        )}
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
                        className={cn(
                          "rounded-2xl",
                          errors.city && "border-cta/60",
                        )}
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
                          className={cn(
                            "rounded-2xl",
                            errors.region && "border-cta/60",
                          )}
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
                          className={cn(
                            "rounded-2xl",
                            errors.postal && "border-cta/60",
                          )}
                        />
                      </label>
                    </div>
                    {(errors.fullName ||
                      errors.line1 ||
                      errors.city ||
                      errors.region ||
                      errors.postal) && (
                      <p className="text-[12px] text-cta">
                        Fill in every shipping field to continue.
                      </p>
                    )}
                  </div>
                </div>

                {/* Reward */}
                <div
                  className={cn(styles.slide, styles.rewardStage)}
                  aria-hidden={step !== "reward"}
                >
                  {step === "reward" ? (
                    <div className={styles.rewardBurst} aria-hidden>
                      {SPARKS.map((s, i) => (
                        <span
                          key={i}
                          className={styles.spark}
                          style={
                            {
                              left: s.left,
                              top: s.top,
                              background: s.color,
                              animationDelay: s.delay,
                              "--dx": s.dx,
                              "--dy": s.dy,
                            } as CSSProperties
                          }
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="relative flex flex-col items-center px-1 pb-2 pt-3 text-center">
                    <span
                      className={cn(
                        styles.rewardIcon,
                        "flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-brand-soft to-white text-brand-deep shadow-sm ring-1 ring-brand/20",
                      )}
                    >
                      <Gift className="h-7 w-7" strokeWidth={1.7} />
                    </span>

                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
                      Reward unlocked
                    </p>
                    <h3 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.03em] text-foreground">
                      Calm Packing is on us
                    </h3>
                    <p className="mt-2 max-w-[18rem] text-[13.5px] leading-relaxed text-muted-foreground">
                      Your order gets a care note, soft wrap, and priority
                      hand-off. No code needed.
                    </p>

                    <ul className="mt-5 w-full space-y-2 text-left">
                      {[
                        {
                          icon: Gift,
                          title: "Complimentary care note",
                          body: "A quiet thank-you in the box",
                        },
                        {
                          icon: Truck,
                          title: totals.qualifiesForFreeShipping
                            ? "Free shipping locked in"
                            : "Priority packing lane",
                          body: totals.qualifiesForFreeShipping
                            ? `You’re over ${formatMoney(FREE_SHIPPING_THRESHOLD)} — shipping is free`
                            : `Add ${formatMoney(totals.amountToFreeShipping)} more later for free ship`,
                        },
                        {
                          icon: ShieldCheck,
                          title: "Easy returns still apply",
                          body: "Calm support if it’s not quite right",
                        },
                      ].map((row) => (
                        <li
                          key={row.title}
                          className="flex items-start gap-3 rounded-2xl border border-border/60 bg-brand-mist/60 px-3 py-2.5"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep ring-1 ring-brand/12">
                            <row.icon className="h-3.5 w-3.5" strokeWidth={2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-foreground">
                              {row.title}
                            </span>
                            <span className="block text-[12px] text-muted-foreground">
                              {row.body}
                            </span>
                          </span>
                          <Check
                            className="mt-1 h-4 w-4 shrink-0 text-success"
                            strokeWidth={2.25}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pay */}
                <div className={styles.slide} aria-hidden={step !== "pay"}>
                  <div className="space-y-3.5 pb-1">
                    {rewardClaimed ? (
                      <div className="flex items-center gap-2.5 rounded-2xl border border-success/25 bg-success/8 px-3 py-2.5">
                        <Gift className="h-4 w-4 shrink-0 text-success" />
                        <p className="text-[12.5px] font-medium leading-snug text-foreground/90">
                          Calm Packing applied — care note + priority hand-off
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Express
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={mockWallet}
                          className="pressable flex h-11 items-center justify-center rounded-xl bg-black text-[12.5px] font-semibold text-white"
                        >
                          Pay
                        </button>
                        <button
                          type="button"
                          onClick={mockWallet}
                          className="pressable flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-[#f2f2f2] text-[12.5px] font-semibold"
                        >
                          <GoogleMark className="h-3.5 w-3.5" />
                          Pay
                        </button>
                        <button
                          type="button"
                          onClick={mockWallet}
                          className="pressable flex h-11 items-center justify-center rounded-xl bg-[#00c0f2] text-[12.5px] font-semibold text-white"
                        >
                          Link
                        </button>
                      </div>
                    </div>

                    <div className="relative py-0.5">
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

                    <div className="rounded-2xl border border-dashed border-border bg-brand-mist/40 p-3.5">
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-deep ring-1 ring-border/60">
                          <CreditCard className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            Payment Element
                          </p>
                          <p className="text-[11.5px] text-muted-foreground">
                            Stripe slot · mock only
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <div className="h-11 rounded-xl border border-border/80 bg-white px-3.5 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                          Card number
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-11 rounded-xl border border-border/80 bg-white px-3.5 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                            MM / YY
                          </div>
                          <div className="h-11 rounded-xl border border-border/80 bg-white px-3.5 text-[13px] leading-[2.75rem] text-muted-foreground/65">
                            CVC
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile-only mini total (desktop uses aside) */}
                    <div className="rounded-2xl border border-border/60 bg-white px-3 py-2.5 lg:hidden">
                      <div className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="text-muted-foreground">
                          {totals.itemCount} item
                          {totals.itemCount === 1 ? "" : "s"}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {miniTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="shrink-0 border-t border-border/50 bg-white/95 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
              {step === "pay" ? (
                <Button
                  ref={continueRef}
                  type="button"
                  variant="default"
                  size="lg"
                  className="pressable w-full"
                  disabled={submitting}
                  onClick={() => void placeOrder()}
                >
                  {submitting ? (
                    "Starting payment…"
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 opacity-90" />
                      Pay {miniTotal}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  ref={continueRef}
                  type="button"
                  variant="default"
                  size="lg"
                  className="pressable w-full"
                  onClick={goNext}
                >
                  {step === "contact" && (
                    <>
                      Continue to shipping
                      <ArrowRight className="h-4 w-4 opacity-90" />
                    </>
                  )}
                  {step === "shipping" && (
                    <>
                      Unlock my bonus
                      <Sparkles className="h-4 w-4 opacity-90" />
                    </>
                  )}
                  {step === "reward" && (
                    <>
                      Claim & continue to pay
                      <ArrowRight className="h-4 w-4 opacity-90" />
                    </>
                  )}
                </Button>
              )}
              <p className="mt-2.5 text-center text-[11px] leading-snug text-muted-foreground">
                {step === "pay"
                  ? "You’ll see payment processing next · Stripe mock"
                  : "You can go back anytime · No account required"}
              </p>
            </footer>
          </div>

          {/* Order summary — desktop sticky; mobile above/under via natural flow on small? only lg+ */}
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
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
