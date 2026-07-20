"use client";

import { useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
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

type CheckoutActions = NonNullable<
  Extract<ReturnType<typeof useCheckout>, { type: "success" }>["checkout"]
>;

type ConfirmResult = Awaited<ReturnType<CheckoutActions["confirm"]>>;

function stripeErrorMessage(result: ConfirmResult | null, fallback: string): string {
  if (result && result.type === "error") {
    const msg = result.error.message || fallback;
    // Sandbox only accepts Stripe test cards / test wallets — real cards always fail.
    if (/test mode|test card|4242/i.test(msg)) {
      return `${msg} Use test card 4242 4242 4242 4242 (any future expiry, any CVC).`;
    }
    return msg;
  }
  return fallback;
}

/**
 * Stripe Custom Checkout form — confirm via checkout.confirm (session clientSecret).
 *
 * Contract (do not break):
 * - Email is set server-side as `customer_email` — never pass email to confirm().
 * - `return_url` is set on Session.create — never pass returnUrl to confirm().
 * - Express Checkout (Link / Apple Pay / Google Pay) MUST pass
 *   `expressCheckoutConfirmEvent` from onConfirm, or Stripe rejects with
 *   "Invalid confirm() call…".
 * - Card / Link tabs use Payment Element + plain confirm({ redirect }).
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

  const runConfirm = async (
    opts?: Parameters<CheckoutActions["confirm"]>[0],
  ) => {
    return checkout.confirm({
      redirect: "if_required",
      ...opts,
    });
  };

  const finishConfirm = async (
    opts?: Parameters<CheckoutActions["confirm"]>[0],
  ) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await runConfirm(opts);
      if (result.type === "error") {
        setError(stripeErrorMessage(result, "Payment failed"));
        setSubmitting(false);
        return;
      }
      // Card success without redirect. Wallets/Link may navigate away first.
      onPaid(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setSubmitting(false);
    }
  };

  const onExpressConfirm = (
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    // Required by Custom Checkout + Express Checkout Element (Link / wallets).
    void finishConfirm({ expressCheckoutConfirmEvent: event });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-[12px] text-muted-foreground">
        Receipt email:{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="rounded-2xl border border-border/70 bg-white p-1 sm:p-2">
        <ExpressCheckoutElement onConfirm={onExpressConfirm} />
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
        Secured by Stripe · Test mode: use card{" "}
        <span className="font-mono text-foreground/80">4242 4242 4242 4242</span>
      </p>
    </div>
  );
}
