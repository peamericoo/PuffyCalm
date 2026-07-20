"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Sparkles } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

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

/**
 * Order success + soft Google account CTA (never blocked purchase).
 */
export function SuccessView() {
  const params = useSearchParams();
  const order = params.get("order") ?? "PC-DEMO";
  const email = params.get("email");

  return (
    <section className="px-3 py-14 sm:px-5 sm:py-20">
      <Container className="max-w-lg animate-fade-up text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success ring-1 ring-success/25">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
        </span>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Order confirmed
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

        {/* Soft account — after purchase only */}
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
