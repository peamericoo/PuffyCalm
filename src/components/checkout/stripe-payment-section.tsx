"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { Loader2 } from "lucide-react";
import { PaymentForm } from "@/components/checkout/payment-form";
import {
  ApiError,
  createCheckoutSession,
  type CreateCheckoutSessionResult,
} from "@/lib/api/checkout";
import { getStripe } from "@/lib/stripe/client";
import { cn } from "@/lib/utils";

export type PaymentContact = {
  email: string;
  fullName: string;
  line1: string;
  city: string;
  region: string;
  postal: string;
  country?: string;
};

export type PaymentLine = {
  productId: string;
  quantity: number;
};

interface StripePaymentSectionProps {
  contact: PaymentContact;
  lines: PaymentLine[];
  /** Bump to force a new Checkout Session (cart/shipping change). */
  sessionKey: string;
  onPaid: (orderId: string, email: string) => void;
  /** Fired once when server session is ready (authoritative money totals). */
  onSessionReady?: (session: CreateCheckoutSessionResult) => void;
  className?: string;
}

const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#3a7ca5",
    colorBackground: "#ffffff",
    colorText: "#1a2332",
    colorDanger: "#e07a5f",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "12px",
  },
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; session: CreateCheckoutSessionResult };

/**
 * Creates server Checkout Session once per sessionKey, then mounts custom Elements.
 *
 * Remount policy: parent must pass a stable `sessionKey`. This inner component
 * mounts once (key=sessionKey) and creates exactly one Session — do not re-run
 * create on every parent re-render (that wiped Payment Element / Link mid-pay).
 */
export function StripePaymentSection({
  contact,
  lines,
  sessionKey,
  onPaid,
  onSessionReady,
  className,
}: StripePaymentSectionProps) {
  return (
    <StripePaymentInner
      key={sessionKey}
      contact={contact}
      lines={lines}
      onPaid={onPaid}
      onSessionReady={onSessionReady}
      className={className}
    />
  );
}

function StripePaymentInner({
  contact,
  lines,
  onPaid,
  onSessionReady,
  className,
}: Omit<StripePaymentSectionProps, "sessionKey">) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const stripePromise = useMemo(() => getStripe(), []);

  // Capture contact/lines at mount — key={sessionKey} is the only recreate path.
  const contactAtMount = contact;
  const linesAtMount = lines;

  useEffect(() => {
    let cancelled = false;

    void createCheckoutSession({
      email: contactAtMount.email,
      lines: linesAtMount,
      shipping: {
        fullName: contactAtMount.fullName,
        line1: contactAtMount.line1,
        city: contactAtMount.city,
        region: contactAtMount.region,
        postal: contactAtMount.postal,
        country: contactAtMount.country ?? "US",
      },
    })
      .then((session) => {
        if (cancelled) return;
        setState({ status: "ready", session });
        onSessionReady?.(session);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not start payment";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once; remount via key
  }, []);

  if (state.status === "loading") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-brand-deep" />
        Starting secure checkout…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-cta/25 bg-cta/5 px-4 py-4 text-[13.5px] text-cta",
          className,
        )}
        role="alert"
      >
        <p className="font-semibold">Could not start payment</p>
        <p className="mt-1 text-cta/90">{state.message}</p>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Check that the API is running and products match the catalog seed.
        </p>
      </div>
    );
  }

  const { session } = state;

  return (
    <div className={className}>
      <CheckoutElementsProvider
        stripe={stripePromise}
        options={{
          clientSecret: session.clientSecret,
          elementsOptions: { appearance },
          // Do NOT set defaultValues.email — Session was created with
          // customer_email; re-setting it triggers Stripe update_email errors.
        }}
      >
        <PaymentForm
          orderId={session.orderId}
          email={contactAtMount.email}
          totalCents={session.totalCents}
          currency={session.currency}
          onPaid={(id) => onPaid(id, contactAtMount.email)}
        />
      </CheckoutElementsProvider>
    </div>
  );
}
