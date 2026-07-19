import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {
  return (
    <section className="border-y border-border/70 bg-cream/50 py-14 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-deep">
            Stay in the calm
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Better living, delivered gently
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Join for product drops, recovery rituals, and practical upgrades —
            no noise, no spam.
          </p>
          <form className="mx-auto mt-7 flex max-w-md flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="you@email.com"
              aria-label="Email address"
              className="flex-1 bg-white"
            />
            <Button type="button" variant="brand" className="shrink-0">
              Get updates
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}
