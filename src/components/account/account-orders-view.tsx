import Link from "next/link";
import { Package, LogIn } from "lucide-react";
import { GuestOrderLookup } from "@/components/account/guest-order-lookup";
import { OrderCard } from "@/components/account/order-card";
import { Container } from "@/components/shared/container";
import { DisplayStack } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import type { CustomerOrderListItem } from "@/lib/api/orders";

type Props = {
  /** Auth.js session email when signed in with Google */
  sessionEmail: string | null;
  sessionName?: string | null;
  /** Prefetched list for session email (server) */
  sessionOrders: CustomerOrderListItem[] | null;
  sessionOrdersError: string | null;
  /** URL prefill for guest form */
  prefillEmail?: string;
  prefillCode?: string;
};

export function AccountOrdersView({
  sessionEmail,
  sessionName,
  sessionOrders,
  sessionOrdersError,
  prefillEmail = "",
  prefillCode = "",
}: Props) {
  const hasSessionList =
    sessionEmail != null && sessionOrders != null && !sessionOrdersError;
  const emptySession =
    hasSessionList && sessionOrders !== null && sessionOrders.length === 0;

  return (
    <section className="px-3 py-12 sm:px-5 sm:py-16">
      <Container className="max-w-xl animate-fade-up">
        <DisplayStack
          eyebrow="Orders"
          title="My orders"
          description="Track a guest order with email + code, or sign in with Google to see every order placed with that email."
          as="h1"
          align="center"
          noReveal
        />

        <div className="mt-8 space-y-8">
          {/* Google-linked section */}
          {sessionEmail ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Orders for your account
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {sessionName ? `${sessionName} · ` : null}
                  {sessionEmail}
                </p>
              </div>

              {sessionOrdersError ? (
                <div
                  role="alert"
                  className="rounded-[1.35rem] border border-red-200 bg-red-50 px-5 py-6 text-center"
                >
                  <p className="text-sm font-medium text-red-900">
                    Couldn’t load your orders
                  </p>
                  <p className="mt-1 text-sm text-red-800/90">
                    {sessionOrdersError}
                  </p>
                  <p className="mt-3 text-xs text-red-700/80">
                    You can still track any order below with email + code.
                  </p>
                </div>
              ) : emptySession ? (
                <div className="rounded-[1.35rem] border border-dashed border-border bg-white/80 px-5 py-10 text-center">
                  <Package
                    className="mx-auto h-9 w-9 text-muted-foreground/70"
                    aria-hidden
                  />
                  <p className="mt-3 font-medium text-foreground">
                    No orders for this email yet
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    When you checkout with <strong>{sessionEmail}</strong>,
                    those orders show up here. Guest checkout with another email
                    still works — use track below.
                  </p>
                  <Button asChild variant="outline" className="mt-5">
                    <Link href="/category/all">Continue shopping</Link>
                  </Button>
                </div>
              ) : hasSessionList && sessionOrders ? (
                <ul className="space-y-3">
                  {sessionOrders.map((order) => (
                    <li key={order.id}>
                      <OrderCard order={order} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-border/70 bg-brand-soft/40 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-deep shadow-sm">
                    <LogIn className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Signed in? See all orders at once
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Google sign-in lists every order placed with that email.
                      Guest checkout never requires an account.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                  <Link href="/login?callbackUrl=/account/orders">
                    Sign in with Google
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Guest lookup — always available */}
          <GuestOrderLookup
            defaultEmail={prefillEmail || sessionEmail || ""}
            defaultCode={prefillCode}
          />

          <p className="text-center text-xs text-muted-foreground">
            Buying never requires login.{" "}
            <Link
              href="/checkout"
              className="font-medium text-brand-deep underline-offset-2 hover:underline"
            >
              Checkout as guest
            </Link>
            {" · "}
            <Link
              href="/category/all"
              className="font-medium text-brand-deep underline-offset-2 hover:underline"
            >
              Shop
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
