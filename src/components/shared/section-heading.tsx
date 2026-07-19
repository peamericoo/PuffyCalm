import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

type DisplaySize = "sm" | "md" | "lg";
type DisplayTone = "default" | "on-dark" | "on-brand";
type DisplayAlign = "left" | "center" | "right";

interface DisplayStackProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Accent the last word with brand gradient (default true) */
  accentLast?: boolean;
  /** Optional word/phrase to accent instead of last word */
  accent?: string;
  size?: DisplaySize;
  tone?: DisplayTone;
  align?: DisplayAlign;
  /** Soft floating aura behind the block */
  aura?: boolean;
  /** Draw underline mark under the title */
  mark?: boolean;
  as?: "h1" | "h2" | "h3";
  className?: string;
  descriptionClassName?: string;
  /** Skip outer Reveal (when parent already reveals) */
  noReveal?: boolean;
  delay?: number;
  href?: string;
  linkLabel?: string;
}

const titleSize: Record<DisplaySize, string> = {
  sm: "text-xl sm:text-2xl",
  md: "text-3xl sm:text-[2.35rem] md:text-[2.5rem]",
  lg: "text-[2.15rem] sm:text-5xl md:text-6xl",
};

const leadSize: Record<DisplaySize, string> = {
  sm: "text-xs sm:text-[13px]",
  md: "text-sm sm:text-base",
  lg: "text-base sm:text-lg",
};

function splitAccent(
  title: string,
  accentLast: boolean,
  accent?: string,
): { before: string; highlight: string; after: string } {
  if (accent) {
    const idx = title.toLowerCase().lastIndexOf(accent.toLowerCase());
    if (idx >= 0) {
      return {
        before: title.slice(0, idx),
        highlight: title.slice(idx, idx + accent.length),
        after: title.slice(idx + accent.length),
      };
    }
  }
  if (!accentLast) {
    return { before: title, highlight: "", after: "" };
  }
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) {
    return { before: "", highlight: title, after: "" };
  }
  const last = parts.pop()!;
  return {
    before: parts.join(" ") + " ",
    highlight: last,
    after: "",
  };
}

/**
 * Global display typography — eyebrow, accented title, lead.
 * Use for every section heading so motion/color stay consistent.
 */
export function DisplayStack({
  eyebrow,
  title,
  description,
  accentLast = true,
  accent,
  size = "md",
  tone = "default",
  align = "left",
  aura = true,
  mark = true,
  as: Tag = "h2",
  className,
  descriptionClassName,
  noReveal = false,
  delay = 0,
  href,
  linkLabel = "See more",
}: DisplayStackProps) {
  const { before, highlight, after } = splitAccent(title, accentLast, accent);

  const stack = (
    <div
      className={cn(
        "display-stack relative",
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "right" && "text-right",
        tone === "on-dark" && "display-stack--on-dark",
        tone === "on-brand" && "display-stack--on-brand",
        className,
      )}
    >
      {aura ? (
        <span className="display-aura" aria-hidden>
          <span className="display-aura-core" />
        </span>
      ) : null}

      {eyebrow ? (
        <p className="display-eyebrow">
          <span className="display-eyebrow-line" aria-hidden />
          <span className="display-eyebrow-label">{eyebrow}</span>
        </p>
      ) : null}

      <Tag
        className={cn(
          "display-title font-display font-medium tracking-tight",
          titleSize[size],
        )}
      >
        {before}
        {highlight ? (
          <span className="display-title-accent">{highlight}</span>
        ) : null}
        {after}
      </Tag>

      {mark ? <span className="display-mark" aria-hidden /> : null}

      {description ? (
        <p
          className={cn(
            "display-lead",
            leadSize[size],
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}

      {href ? (
        <div className={cn("pt-3", align === "center" && "flex justify-center")}>
          <Link
            href={href}
            className="pressable glass-btn inline-flex rounded-full px-5 py-2.5 text-sm font-medium text-brand-deep"
          >
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );

  if (noReveal) return stack;

  return (
    <Reveal delay={delay} className={cn(align === "center" && "w-full")}>
      {stack}
    </Reveal>
  );
}

/** @deprecated alias — prefer DisplayStack */
export function SectionHeading({
  title,
  description,
  href,
  linkLabel,
  className,
  align = "center",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <DisplayStack
      title={title}
      description={description}
      href={href}
      linkLabel={linkLabel}
      className={cn("mb-8 sm:mb-10", className)}
      align={align}
      size="md"
    />
  );
}
