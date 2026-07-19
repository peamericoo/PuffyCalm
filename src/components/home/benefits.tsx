import { HeartHandshake, Leaf, PackageCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { trustPoints } from "@/lib/mock/site";

const icons = [Sparkles, PackageCheck, Leaf, HeartHandshake];

export function Benefits() {
  return (
    <section className="py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Why PuffyEasy"
          title="Premium calm, not dropshipping chaos"
          description="We obsess over selection, presentation, and a shopping experience that feels considered from the first click."
          align="center"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, index) => {
            const Icon = icons[index % icons.length];
            return (
              <div
                key={point.title}
                className="rounded-3xl border border-border/80 bg-card p-6 shadow-[0_1px_0_rgba(28,27,26,0.03)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium tracking-tight text-foreground">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
