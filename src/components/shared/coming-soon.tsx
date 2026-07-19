import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({
  title,
  description = "This screen is next in the mock roadmap. The new editorial design system is already live on the homepage.",
}: ComingSoonProps) {
  return (
    <section className="py-20 sm:py-28">
      <Container className="max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Coming soon
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="default">
            <Link href="/">Back to homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/category/all">Browse products</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
