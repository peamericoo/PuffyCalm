"use client";

import { ErrorState } from "@/components/shared/error-state";

/**
 * Storefront-wide error boundary — API or render failures keep shell layout.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      eyebrow="Store"
      title="Something went wrong"
      description="We hit a temporary problem loading this page. Your cart is safe — try again or continue shopping."
      error={error}
      logLabel="[storefront] error"
      reset={reset}
    />
  );
}
