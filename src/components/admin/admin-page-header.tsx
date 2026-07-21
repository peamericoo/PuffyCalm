import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  activePath?: string;
  /** Optional back link (e.g. orders detail → list). */
  backHref?: string;
  backLabel?: string;
  className?: string;
  children?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  activePath,
  backHref,
  backLabel = "Back",
  className,
  children,
}: Props) {
  return (
    <header className={cn("border-b border-border/60 bg-white/80", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              PuffyCalm Admin
            </Link>
            <AdminNav activePath={activePath} />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Storefront
            </Link>
            <SignOutButton className="h-8 px-3 text-xs" />
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {backHref ? (
              <Link
                href={backHref}
                className="mb-1 inline-block text-xs font-medium text-brand-deep hover:underline"
              >
                ← {backLabel}
              </Link>
            ) : null}
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </header>
  );
}
