"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      eyebrow="Collection"
      title="We couldn’t load this collection"
      description="The catalog service is temporarily unavailable. You can retry or return home."
      error={error}
      logLabel="[category] load failed"
      reset={reset}
      homeHref="/"
      homeLabel="Back home"
      browseHref="/category/all"
      browseLabel="Browse all"
    />
  );
}
