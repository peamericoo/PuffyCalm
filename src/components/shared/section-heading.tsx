import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  description,
  href,
  linkLabel = "See More Collections",
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "mb-8 space-y-3 sm:mb-10",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-[2.5rem]">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
      {href ? (
        <div className={cn(align === "center" && "pt-1")}>
          <Link
            href={href}
            className="inline-flex rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </Reveal>
  );
}
