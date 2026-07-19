"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PromoBar } from "@/components/layout/promo-bar";
import { cn } from "@/lib/utils";

/**
 * On homepage: no main offset — hero is full-bleed under the floating bars.
 * On all other pages: page-offset keeps content clear of the fixed chrome.
 */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="app-grain flex min-h-screen w-full max-w-[100%] flex-col overflow-x-clip">
      <PromoBar />
      <Header />
      <main
        className={cn(
          "min-w-0 w-full max-w-[100%] flex-1 overflow-x-clip",
          !isHome && "page-offset",
        )}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
