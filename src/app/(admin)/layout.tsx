import type { ReactNode } from "react";

/** Minimal shell for /admin — no storefront promo/nav chrome. */
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-workspace min-h-full">
      {children}
    </div>
  );
}
