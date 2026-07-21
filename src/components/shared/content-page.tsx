import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { DisplayStack } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

interface ContentPageProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Last updated line under the title (optional) */
  updated?: string;
}

/**
 * Static trust / legal / help layout — clean reading column, no ComingSoon.
 */
export function ContentPage({
  eyebrow,
  title,
  description,
  children,
  className,
  updated,
}: ContentPageProps) {
  return (
    <section className={cn("px-3 py-12 sm:px-5 sm:py-16", className)}>
      <Container className="max-w-2xl animate-fade-up">
        <DisplayStack
          eyebrow={eyebrow}
          title={title}
          description={description}
          as="h1"
          align="left"
          size="md"
          noReveal
          accentLast={false}
        />
        {updated ? (
          <p className="mt-3 text-[12px] text-muted-foreground">{updated}</p>
        ) : null}
        <div className="content-prose mt-10 space-y-8 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>
      </Container>
    </section>
  );
}

export function ContentSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-muted-foreground [&_a]:font-medium [&_a]:text-brand-deep [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
