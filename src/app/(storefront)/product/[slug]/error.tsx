"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[product] load failed", error);
  }, [error]);

  return (
    <section className="px-[var(--shell-gutter)] py-16 sm:px-5 sm:py-24">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Product
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          We couldn’t load this product
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The catalog is temporarily unavailable. Check your connection or try
          again in a moment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset} className="pressable">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/category/all">Browse collection</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
