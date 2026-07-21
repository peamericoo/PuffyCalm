"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  /** Short context label (e.g. Product, Collection, Store) */
  eyebrow?: string;
  title: string;
  description?: string;
  error?: Error & { digest?: string };
  /** Log prefix for console.error */
  logLabel?: string;
  reset?: () => void;
  /** Extra link when reset is primary (default: home) */
  homeHref?: string;
  homeLabel?: string;
  browseHref?: string;
  browseLabel?: string;
  className?: string;
}

/**
 * Shared empty/error panel for API failures — keeps layout intact.
 * Used by route error.tsx boundaries.
 */
export function ErrorState({
  eyebrow = "Something went wrong",
  title,
  description = "Please try again in a moment. Your cart and guest checkout are unaffected.",
  error,
  logLabel = "[storefront]",
  reset,
  homeHref = "/",
  homeLabel = "Back home",
  browseHref = "/category/all",
  browseLabel = "Browse products",
  className,
}: ErrorStateProps) {
  useEffect(() => {
    if (error) {
      console.error(logLabel, error);
    }
  }, [error, logLabel]);

  return (
    <section
      className={cn(
        "px-[var(--shell-gutter)] py-16 sm:px-5 sm:py-24",
        className,
      )}
      role="alert"
    >
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {reset ? (
            <Button type="button" onClick={reset} className="pressable">
              Try again
            </Button>
          ) : null}
          <Button
            asChild
            variant={reset ? "outline" : "default"}
            className="pressable"
          >
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
          {browseHref ? (
            <Button
              asChild
              variant={reset ? "ghost" : "outline"}
              className="pressable"
            >
              <Link href={browseHref}>{browseLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
