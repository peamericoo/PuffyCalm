"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {!isHome ? <Header variant="solid" /> : null}
      {children}
    </>
  );
}
