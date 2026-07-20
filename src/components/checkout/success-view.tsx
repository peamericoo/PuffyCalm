"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
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

type Phase = "processing" | "confirmed";

/**
 * Realistic mock payment processing (step timeline) → confirmed order.
 */
export function SuccessView() {
  const params = useSearchParams();
  const order = params.get("order") ?? "PC-DEMO";
  const email = params.get("email");

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
        detail: `Order ${order}`,
        icon: Package,
      },
      {
        id: "receipt",
        label: "Sending your receipt",
        detail: email ? email : "To your inbox",
        icon: Mail,
      },
    ],
    [order, email],
  );

  const [phase, setPhase] = useState<Phase>("processing");
  /** Index of the step currently running; completed = all < activeCompleted */
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const STEP_MS = 720;
    const HOLD_MS = 380;

    processSteps.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setActiveIndex(i);
        }, i * STEP_MS),
      );
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setCompletedCount(i + 1);
        }, i * STEP_MS + HOLD_MS),
      );
    });

    const doneAt = processSteps.length * STEP_MS + HOLD_MS + 280;
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("confirmed");
      }, doneAt),
    );

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [processSteps]);

  const progressPct =
    phase === "confirmed"
      ? 100
      : Math.min(
          100,
          ((completedCount + (activeIndex >= completedCount ? 0.45 : 0)) /
            processSteps.length) *
            100,
        );

  if (phase === "processing") {
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
                Processing your payment
              </h1>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">
                Please keep this tab open — almost there.
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
                        done &&
                          "bg-success/15 text-success ring-success/20",
                        active &&
                          "bg-white text-brand-deep ring-brand/20",
                        pending &&
                          "bg-muted/60 text-muted-foreground ring-border/50",
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" strokeWidth={2.4} />
                      ) : active ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          strokeWidth={2}
                        />
                      ) : (
                        <step.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span
                        className={cn(
                          "block text-[13.5px] font-semibold leading-snug",
                          done && "text-foreground",
                          active && "text-foreground",
                          pending && "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted-foreground">
                        {step.detail}
                      </span>
                    </span>
                    {active ? (
                      <span className={cn(styles.pulseDot, "mt-2.5 shrink-0")} />
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Encrypted · Stripe mock · No real charge
            </p>
          </div>
        </Container>
      </section>
    );
  }

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
          ) : (
            <> A receipt is on its way to your inbox.</>
          )}
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
                {order}
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Mock order — tracking appears when fulfillment is live.
              </p>
            </div>
          </div>
        </div>

        {/* Completed timeline */}
        <div className="mt-4 rounded-[1.25rem] border border-border/60 bg-white/90 px-4 py-3.5 text-left ring-1 ring-white/70">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            What just happened
          </p>
          <ul className="space-y-2">
            {processSteps.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-2.5 text-[13px] text-foreground/90"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1 font-medium">{step.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-brand/20 bg-brand-soft/60 px-5 py-5 text-left ring-1 ring-brand/10">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep" />
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Save this order to your account
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                One tap with Google — track shipping, reorder faster, keep
                addresses. Optional, always.
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
