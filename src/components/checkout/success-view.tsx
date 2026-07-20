"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { ApiError, getOrder, type OrderResult } from "@/lib/api/checkout";
import { useCartStore } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./success.module.css";

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

type ProcessStep = {
  id: string;
  label: string;
  detail: string;
  icon: typeof CreditCard;
};

type Phase = "loading" | "processing" | "confirmed" | "failed" | "missing";

const POLL_MS = 1500;
const MAX_POLLS = 24; // ~36s

/**
 * Success — polls BE for order status (webhook is source of paid).
 */
export function SuccessView() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const email = params.get("email") ?? "";
  const clearCart = useCartStore((s) => s.clearCart);
  const cleared = useRef(false);

  const [phase, setPhase] = useState<Phase>(
    orderId && email ? "loading" : "missing",
  );
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollTick, setPollTick] = useState(0);

  const publicCode = order?.publicCode;
  const processSteps = useMemo<ProcessStep[]>(
    () => [
      {
        id: "validate",
        label: "Validating payment details",
        detail: "Checking card & fraud signals",
        icon: ShieldCheck,
      },
      {
        id: "charge",
        label: "Charging securely",
        detail: "Stripe · encrypted connection",
        icon: CreditCard,
      },
      {
        id: "confirm",
        label: "Confirming your order",
        detail: publicCode
          ? `Order ${publicCode}`
          : orderId
            ? `Order ${orderId.slice(0, 12)}…`
            : "Creating order",
        icon: Package,
      },
      {
        id: "receipt",
        label: "Sending your receipt",
        detail: email || "To your inbox",
        icon: Mail,
      },
    ],
    [publicCode, orderId, email],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!orderId || !email) return;
    let cancelled = false;
    let polls = 0;

    const tick = async () => {
      try {
        // Mid/late polls: ask API to reconcile with Stripe if webhook lag.
        const useSync = polls >= 2;
        const data = await getOrder(orderId, email, { sync: useSync });
        if (cancelled) return;
        setOrder(data);
        if (data.status === "paid") {
          setPhase("confirmed");
          if (!cleared.current) {
            cleared.current = true;
            clearCart();
          }
          return;
        }
        if (data.status === "failed" || data.status === "cancelled") {
          setPhase("failed");
          return;
        }
        setPhase("processing");
        polls += 1;
        setPollTick(polls);
        if (polls < MAX_POLLS) {
          window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } else {
          // Final attempt with forced Stripe sync
          try {
            const last = await getOrder(orderId, email, { sync: true });
            if (cancelled) return;
            setOrder(last);
            if (last.status === "paid") {
              setPhase("confirmed");
              if (!cleared.current) {
                cleared.current = true;
                clearCart();
              }
              return;
            }
          } catch {
            /* fall through */
          }
          setError(
            "Payment is still processing. Refresh this page in a moment, or check your email for a receipt.",
          );
        }
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load order";
        // Keep processing if transient; after first load fail hard if 404
        if (e instanceof ApiError && e.status === 404) {
          setError(msg);
          setPhase("missing");
          return;
        }
        setPhase("processing");
        polls += 1;
        setPollTick(polls);
        if (polls < MAX_POLLS) {
          window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } else {
          setError(msg);
        }
      }
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [orderId, email, clearCart]);

  // Soft step animation while processing
  useEffect(() => {
    if (phase !== "processing" && phase !== "loading") return;
    const n = processSteps.length;
    let i = 0;
    const id = window.setInterval(() => {
      i = Math.min(i + 1, n);
      setActiveIndex(Math.min(i, n - 1));
      setCompletedCount(Math.min(i, n));
    }, 700);
    return () => window.clearInterval(id);
  }, [phase, processSteps.length]);

  if (phase === "missing") {
    return (
      <section className="px-3 py-14 sm:px-5 sm:py-20">
        <Container className="max-w-md animate-fade-up text-center">
          <XCircle className="mx-auto h-12 w-12 text-cta" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
            Order not found
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {error ||
              "Open this page from checkout, or check the link in your email."}
          </p>
          <Button asChild variant="default" className="pressable mt-6">
            <Link href="/category/all">Continue shopping</Link>
          </Button>
        </Container>
      </section>
    );
  }

  if (phase === "failed") {
    return (
      <section className="px-3 py-14 sm:px-5 sm:py-20">
        <Container className="max-w-md animate-fade-up text-center">
          <XCircle className="mx-auto h-12 w-12 text-cta" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
            Payment didn’t go through
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            No charge was kept. You can try checkout again.
          </p>
          {order?.publicCode ? (
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {order.publicCode}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="default" className="pressable">
              <Link href="/checkout">Try again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cart">Back to bag</Link>
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  if (phase === "loading" || phase === "processing") {
    const progressPct = Math.min(
      95,
      ((completedCount + 0.4) / processSteps.length) * 100,
    );
    return (
      <section className="px-3 py-12 sm:px-5 sm:py-16">
        <Container className="max-w-md animate-fade-up">
          <div className="rounded-[1.35rem] border border-border/70 bg-white/96 p-6 shadow-sm ring-1 ring-white/70 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className={styles.ring} aria-hidden>
                <span className={styles.ringTrack} />
                <span className={styles.ringSpin} />
                <span className="absolute inset-0 flex items-center justify-center text-brand-deep">
                  <LockIcon />
                </span>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                Secure payment
              </p>
              <h1 className="mt-1.5 font-display text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.65rem]">
                {phase === "loading"
                  ? "Loading your order…"
                  : "Confirming with Stripe"}
              </h1>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">
                Please keep this tab open
                {pollTick > 0 ? ` · checking…` : ""}
              </p>
              <div className={cn(styles.progressBar, "mt-5 w-full")}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <ol className="mt-7 space-y-2.5" aria-live="polite">
              {processSteps.map((step, i) => {
                const done = i < completedCount;
                const active = i === activeIndex && !done;
                const pending = i > activeIndex && !done;
                return (
                  <li
                    key={step.id}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-300",
                      done && "border-success/20 bg-success/[0.06]",
                      done && styles.stepIn,
                      active &&
                        "border-brand/30 bg-brand-soft/70 ring-1 ring-brand/15",
                      pending && "border-border/50 bg-white/50 opacity-55",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1",
                        done && "bg-success/15 text-success ring-success/20",
                        active && "bg-white text-brand-deep ring-brand/20",
                        pending &&
                          "bg-muted/60 text-muted-foreground ring-border/50",
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" strokeWidth={2.4} />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <step.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[13.5px] font-semibold">
                        {step.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted-foreground">
                        {step.detail}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {error ? (
              <p className="mt-4 text-center text-[12px] text-cta">{error}</p>
            ) : null}

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Waiting for server confirmation · webhook + poll
            </p>
          </div>
        </Container>
      </section>
    );
  }

  // confirmed
  const totalLabel = order
    ? formatMoney(order.totalCents / 100, order.currency)
    : null;

  return (
    <section className="px-3 py-12 sm:px-5 sm:py-16">
      <Container className="max-w-lg animate-fade-up text-center">
        <span
          className={cn(
            styles.checkPop,
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success ring-1 ring-success/25",
          )}
        >
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
        </span>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Payment successful
        </p>
        <h1 className="mt-1.5 font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
          You’re all set
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
          Thanks for shopping PuffyCalm.
          {email ? (
            <>
              {" "}
              A receipt is on its way to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : null}
        </p>

        <div className="mt-6 rounded-[1.25rem] border border-border/70 bg-white/95 px-5 py-4 text-left shadow-sm ring-1 ring-white/70">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep ring-1 ring-brand/15">
              <Package className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Order number
              </p>
              <p className="mt-0.5 font-mono text-[15px] font-semibold tracking-wide text-foreground">
                {order?.publicCode ?? orderId}
              </p>
              {totalLabel ? (
                <p className="mt-1 text-[13px] font-semibold tabular-nums text-brand-deep">
                  {totalLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {order?.items?.length ? (
          <ul className="mt-4 space-y-2 rounded-[1.25rem] border border-border/60 bg-white/90 px-4 py-3 text-left ring-1 ring-white/70">
            {order.items.map((item) => (
              <li
                key={item.productId + item.quantity}
                className="flex justify-between gap-2 text-[13px]"
              >
                <span className="min-w-0 truncate font-medium text-foreground">
                  {item.productName}{" "}
                  <span className="text-muted-foreground">×{item.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatMoney(item.lineTotalCents / 100, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 rounded-[1.25rem] border border-brand/20 bg-brand-soft/60 px-5 py-5 text-left ring-1 ring-brand/10">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep" />
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Save this order to your account
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                One tap with Google — track shipping, reorder faster. Optional.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="pressable mt-4 w-full border-border bg-white"
          >
            <Link href="/login">
              <GoogleMark className="h-4 w-4" />
              Continue with Google
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="default" className="pressable">
            <Link href="/category/all">Continue shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function LockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
