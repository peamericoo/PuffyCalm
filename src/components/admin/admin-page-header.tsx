import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
  backLabel = "Voltar",
  className,
  children,
}: Props) {
  return (
    <header className={cn("admin-page-header sticky top-0 z-40 border-b border-[#d9e5ed]", className)}>
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[#e6eef3]">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/admin" className="shrink-0 font-display text-lg font-semibold tracking-tight text-foreground">
              PuffyCalm <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-brand-deep">Ops</span>
            </Link>
            <AdminNav activePath={activePath} className="hidden lg:flex" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              target="_blank"
            >
              Loja <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <SignOutButton className="h-8 px-3 text-xs" />
          </div>
        </div>
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            {backHref ? (
              <Link
                href={backHref}
                className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-deep hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
              </Link>
            ) : null}
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </div>
        <AdminNav activePath={activePath} className="-mx-1 px-1 pb-3 lg:hidden" />
      </div>
    </header>
  );
}
