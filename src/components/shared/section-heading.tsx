import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-2", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-deep">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand-deep"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
