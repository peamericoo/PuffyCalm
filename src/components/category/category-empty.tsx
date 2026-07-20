import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryEmptyProps {
  categoryName: string;
  className?: string;
}

export function CategoryEmpty({ categoryName, className }: CategoryEmptyProps) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-[1.5rem] px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/25 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-white/80">
        <SearchX className="h-5 w-5 text-brand-deep" strokeWidth={2} />
      </div>
      <h2 className="relative mt-4 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        No matches in {categoryName}
      </h2>
      <p className="relative mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        Try clearing filters — or browse the full edit while we restock this
        mood.
      </p>
      <Link
        href="/category/all"
        className="pressable glass-btn-cta relative mt-6 inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-[13px] font-semibold text-white"
      >
        Browse all products
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
