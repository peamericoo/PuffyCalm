import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({
  title,
  description = "This screen is next. The floating nav and design system already match the rest of the store.",
}: ComingSoonProps) {
  return (
    <section className="px-3 py-16 sm:px-5 sm:py-24">
      <Container className="max-w-xl text-center animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Coming soon
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="default" className="pressable">
            <Link href="/">Back to homepage</Link>
          </Button>
          <Button asChild variant="outline" className="pressable">
            <Link href="/category/all">Browse products</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
