"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { OrderCard } from "@/components/account/order-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  lookupOrderByCode,
  type OrderResult,
} from "@/lib/api/orders";

type Props = {
  /** Prefill from URL or signed-in email */
  defaultEmail?: string;
  defaultCode?: string;
};

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; message: string }
  | { status: "ok"; order: OrderResult };

export function GuestOrderLookup({ defaultEmail = "", defaultCode = "" }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState(defaultCode);
  const [state, setState] = useState<LookupState>({ status: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const eTrim = email.trim();
    const cTrim = code.trim();
    if (!eTrim || !cTrim) {
      setState({
        status: "error",
        message: "Enter the email used at checkout and your order code (e.g. PC-A1B2C3D4).",
      });
      return;
    }
    setState({ status: "loading" });
    try {
      const order = await lookupOrderByCode(eTrim, cTrim);
      setState({ status: "ok", order });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState({
          status: "empty",
          message:
            "No order matched that email and code. Check the confirmation email or success page.",
        });
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "Could not look up your order. Try again in a moment.";
      setState({ status: "error", message });
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white/90 p-5 shadow-[0_16px_40px_-28px_rgb(26_35_50/0.28)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
          <Search className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Track an order
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No account needed — use the email from checkout and the order code
            (starts with PC-).
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div>
          <label
            htmlFor="guest-order-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Email
          </label>
          <Input
            id="guest-order-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="guest-order-code"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Order code
          </label>
          <Input
            id="guest-order-code"
            type="text"
            autoComplete="off"
            placeholder="PC-A1B2C3D4"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Looking up…
            </>
          ) : (
            "Find order"
          )}
        </Button>
      </form>

      {state.status === "error" || state.status === "empty" ? (
        <p
          role="alert"
          className={
            state.status === "empty"
              ? "mt-4 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              : "mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "ok" ? (
        <div className="mt-5">
          <OrderCard order={state.order} defaultOpen />
        </div>
      ) : null}
    </div>
  );
}
