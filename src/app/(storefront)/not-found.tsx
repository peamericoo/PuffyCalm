import Link from "next/link";
import { Container } from "@/components/shared/container";
import { DisplayStack } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="px-3 py-16 sm:px-5 sm:py-24">
      <Container className="max-w-xl animate-fade-up text-center">
        <DisplayStack
          eyebrow="404"
          title="Page not found"
          description="That page doesn’t exist — or the link is off. Head home or browse the collection."
          as="h1"
          align="center"
          noReveal
          accentLast={false}
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
