import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { homepageHero } from "@/lib/mock/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 bg-soft-grid" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <Container className="relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="space-y-7 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-brand-deep shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {homepageHero.eyebrow}
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {homepageHero.title}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {homepageHero.subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" variant="brand">
              <Link href={homepageHero.primaryCta.href}>
                {homepageHero.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={homepageHero.secondaryCta.href}>
                {homepageHero.secondaryCta.label}
              </Link>
            </Button>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-border/70 pt-6 sm:max-w-md">
            <div>
              <dt className="text-xs text-muted-foreground">Curated picks</dt>
              <dd className="mt-1 font-display text-2xl font-medium tracking-tight">
                8+
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Avg. rating</dt>
              <dd className="mt-1 font-display text-2xl font-medium tracking-tight">
                4.7
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Markets</dt>
              <dd className="mt-1 font-display text-2xl font-medium tracking-tight">
                4
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-brand-soft via-white to-cream shadow-[0_30px_80px_-40px_rgba(74,143,186,0.55)] sm:max-w-lg lg:ml-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_45%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/80 text-6xl shadow-sm ring-1 ring-border/60 sm:h-32 sm:w-32 sm:text-7xl">
                🐱
              </div>
              <p className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                Calm by design
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Our soft blue mascot vibe — cozy, premium, and a little playful.
              </p>
            </div>

            {/* Floating product chips */}
            <div className="absolute left-4 top-6 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-left shadow-lg backdrop-blur sm:left-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Bestseller
              </p>
              <p className="text-sm font-medium">Mini Massage Gun</p>
            </div>
            <div className="absolute bottom-6 right-4 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-left shadow-lg backdrop-blur sm:right-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                From
              </p>
              <p className="text-sm font-medium">$39 – $55</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
