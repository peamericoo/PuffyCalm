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
        "group inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        className,
      )}
      aria-label="PuffyEasy home"
    >
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-[13px] font-semibold tracking-tight text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
        <span className="relative z-10">P</span>
        <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </span>
      <span className="font-display text-[1.15rem] font-medium tracking-tight text-foreground sm:text-xl">
        PuffyEasy
      </span>
    </Link>
  );
}
