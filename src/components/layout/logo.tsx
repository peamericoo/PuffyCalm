import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex min-w-0 items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:gap-2",
        className,
      )}
      aria-label="PuffCalm home"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full brand-gradient text-[13px] font-semibold tracking-tight text-brand-deep shadow-sm ring-1 ring-brand/25 transition-transform duration-300 group-hover:scale-105">
        <span className="relative z-10">🐱</span>
      </span>
      <span className="truncate font-display text-[1.05rem] font-medium tracking-tight text-foreground sm:text-xl">
        Puff<span className="text-brand-deep">Calm</span>
      </span>
    </Link>
  );
}
