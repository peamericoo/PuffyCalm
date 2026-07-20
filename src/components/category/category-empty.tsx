import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryEmptyProps {
  categoryName: string;
  className?: string;
}

export function CategoryEmpty({ categoryName, className }: CategoryEmptyProps) {
  return (
    <div
      className={cn(
        "border border-dashed border-border/80 bg-[#fafcfd] px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Empty shelf
      </p>
      <h2 className="mt-2 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Nothing in {categoryName} yet
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        Try another collection — or browse the full edit while we restock this
        mood.
      </p>
      <Link
        href="/category/all"
        className="mt-6 inline-flex h-11 items-center justify-center bg-foreground px-5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-success"
      >
        Browse all products
      </Link>
    </div>
  );
}
