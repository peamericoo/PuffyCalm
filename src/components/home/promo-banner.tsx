import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { homepagePromo } from "@/lib/mock/site";

export function PromoBanner() {
  return (
    <section className="py-6 sm:py-8">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-brand-deep via-[#5fa0c9] to-sky-300 px-6 py-10 text-white shadow-[0_24px_60px_-36px_rgba(74,143,186,0.7)] sm:px-10 sm:py-14">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-cream/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                {homepagePromo.eyebrow}
              </p>
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                {homepagePromo.title}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                {homepagePromo.description}
              </p>
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              <Button
                asChild
                size="lg"
                className="bg-white text-brand-deep hover:bg-white/95"
              >
                <Link href={homepagePromo.cta.href}>
                  {homepagePromo.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
