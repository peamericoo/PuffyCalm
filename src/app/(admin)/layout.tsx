import type { ReactNode } from "react";

/** Minimal shell for /admin — no storefront promo/nav chrome. */
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[color-mix(in_oklab,var(--background)_92%,white)]">
      {children}
    </div>
  );
}
