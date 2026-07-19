import Link from "next/link";
import { Container } from "@/components/shared/container";
import { DisplayStack } from "@/components/shared/section-heading";
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
      <Container className="max-w-xl animate-fade-up">
        <DisplayStack
          eyebrow="Coming soon"
          title={title}
          description={description}
          as="h1"
          align="center"
          noReveal
        />
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
