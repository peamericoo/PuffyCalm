"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PromoBar } from "@/components/layout/promo-bar";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** CMS-lite promo ticker messages (Phase J). */
  promoMessages: string[];
};

/**
 * Storefront chrome + page frame.
 *
 * Home: no top offset — hero is full-bleed under the floating bars.
 * Internal pages: `page-offset` is padding-only (never a painted surface).
 *
 * Do not put `overflow-x-clip` on <main>: single-axis clip forces the other
 * axis to auto, which creates a scroll container and breaks the body’s fixed
 * ambient background — that was the “lighter box” under the TopBar on
 * Product / Wishlist / Checkout / etc. Horizontal clip stays on the shell.
 */
export function StorefrontShell({ children, promoMessages }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hasPromo = promoMessages.length > 0;

  return (
    <div
      className={cn(
        "app-grain flex min-h-screen w-full max-w-[100%] flex-col overflow-x-clip",
        !hasPromo && "promo-bar-collapsed",
      )}
    >
      <PromoBar messages={promoMessages} />
      <Header />
      <main
        className={cn(
          /* Transparent — ambient body gradient must show through continuously */
          "min-w-0 w-full max-w-[100%] flex-1 bg-transparent",
          !isHome && "page-offset",
        )}
      >
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
