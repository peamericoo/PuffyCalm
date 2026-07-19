import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Light text for dark / taupe hero backgrounds */
  inverted?: boolean;
}

export function Logo({ className, inverted = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        className,
      )}
      aria-label="PuffyEasy home"
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tracking-tight ring-1",
          inverted
            ? "bg-white/15 text-cream-text ring-white/25"
            : "bg-accent text-white ring-accent/20",
        )}
      >
        P
      </span>
      <span
        className={cn(
          "font-display text-xl font-medium tracking-tight",
          inverted ? "text-cream-text" : "text-foreground",
        )}
      >
        PuffyEasy
      </span>
    </Link>
  );
}
