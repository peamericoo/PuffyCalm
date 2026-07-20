"use client";

import { useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
  orderId: string;
  /** Receipt display only — locked on the Checkout Session as customer_email. */
  email: string;
  totalCents: number;
  currency?: string;
  onPaid: (orderId: string) => void;
  className?: string;
}

type ConfirmResult = Awaited<
  ReturnType<
    NonNullable<
      Extract<ReturnType<typeof useCheckout>, { type: "success" }>["checkout"]
    >["confirm"]
  >
>;

function stripeErrorMessage(result: ConfirmResult | null, fallback: string): string {
  if (result && result.type === "error") {
    return result.error.message || fallback;
  }
  return fallback;
}

/**
 * Stripe Custom Checkout form — confirm via checkout.confirm (session clientSecret).
 *
 * Contract (do not break):
 * - Email is set server-side as `customer_email` — never pass email to confirm().
 * - `return_url` is set on Session.create — never pass returnUrl to confirm()
 *   or Stripe rejects with "You cannot provide returnUrl to confirm()…".
 * - Only pass redirect: "if_required" so card stays on-page; wallets/Link may redirect.
 */
export function PaymentForm({
  orderId,
  email,
  totalCents,
  currency = "USD",
  onPaid,
  className,
}: PaymentFormProps) {
  const checkoutState = useCheckout();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (checkoutState.type === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading secure payment…
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <p className="rounded-2xl border border-cta/30 bg-cta/5 px-4 py-3 text-[13px] text-cta">
        {checkoutState.error.message || "Could not load payment form."}
      </p>
    );
  }

  const checkout = checkoutState.checkout;

  const runConfirm = async () => {
    // return_url + customer_email already on the Session — pass neither here.
    return checkout.confirm({
      redirect: "if_required",
    });
  };

  const finishConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await runConfirm();
      if (result.type === "error") {
        setError(stripeErrorMessage(result, "Payment failed"));
        setSubmitting(false);
        return;
      }
      // Card success without redirect. Link/wallets may navigate away first.
      onPaid(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-[12px] text-muted-foreground">
        Receipt email:{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="rounded-2xl border border-border/70 bg-white p-1 sm:p-2">
        <ExpressCheckoutElement
          onConfirm={() => {
            void finishConfirm();
          }}
        />
      </div>

      <div className="relative py-0.5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border/70" />
        </div>
        <p className="relative mx-auto w-fit bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          or card / Link
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white px-3 py-3 sm:px-4">
        <PaymentElement
          options={{
            layout: "tabs",
            // Billing email field is redundant — locked on the Session.
            fields: {
              billingDetails: {
                email: "never",
              },
            },
          }}
        />
      </div>

      {error ? (
        <p className="text-[13px] font-medium text-cta" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="default"
        size="lg"
        className="pressable h-12 w-full"
        disabled={submitting}
        onClick={() => void finishConfirm()}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            Pay {formatMoney(totalCents / 100, currency)}
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Secured by Stripe · Guest checkout
      </p>
    </div>
  );
}
