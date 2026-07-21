"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      eyebrow="Product"
      title="We couldn’t load this product"
      description="The catalog is temporarily unavailable. Check your connection or try again in a moment."
      error={error}
      logLabel="[product] load failed"
      reset={reset}
      homeHref="/category/all"
      homeLabel="Browse collection"
      browseHref="/"
      browseLabel="Back home"
    />
  );
}
