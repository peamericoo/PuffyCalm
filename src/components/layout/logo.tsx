import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/40",
        className,
      )}
      aria-label="PuffyEasy home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-soft via-white to-cream shadow-sm ring-1 ring-border/70 transition-transform group-hover:scale-[1.03]">
        <span className="text-lg leading-none" aria-hidden>
          🐱
        </span>
      </span>
      {!compact ? (
        <span className="font-display text-lg font-medium tracking-tight text-foreground sm:text-xl">
          Puffy<span className="text-brand-deep">Easy</span>
        </span>
      ) : null}
    </Link>
  );
}
