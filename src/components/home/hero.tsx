import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { homepageHero } from "@/lib/mock/site";

export function Hero() {
  return (
    <section className="pt-3 sm:pt-4">
      <Container>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-hero shadow-[0_30px_80px_-40px_rgba(42,33,28,0.45)] sm:rounded-[2rem]">
          {/* Overlay nav — matches editorial retail reference */}
          <Header variant="overlay" />

          <div className="relative grid min-h-[520px] items-end lg:min-h-[600px] lg:grid-cols-12 lg:items-center">
            {/* Soft wash */}
            <div className="absolute inset-0 bg-gradient-to-r from-hero-deep via-hero/90 to-hero/40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.12),transparent_45%)]" />

            {/* Lifestyle image */}
            <div className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
              <Image
                src={homepageHero.imageUrl}
                alt={homepageHero.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-[center_20%] opacity-90 lg:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-hero via-hero/55 to-transparent lg:from-hero-deep/95 lg:via-hero/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-hero-deep/70 via-transparent to-transparent lg:hidden" />
            </div>

            {/* Copy */}
            <div className="relative z-10 px-6 pb-10 pt-24 sm:px-10 sm:pb-14 sm:pt-28 lg:col-span-6 lg:px-12 lg:py-16">
              <h1 className="font-display text-[2.6rem] font-medium leading-[1.05] tracking-tight text-cream-text sm:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]">
                <span className="block">{homepageHero.titleLine1}</span>
                <span className="block">{homepageHero.titleLine2}</span>
                <span className="block">{homepageHero.titleLine3}</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-text/80 sm:text-base">
                {homepageHero.subtitle}
              </p>
              <div className="mt-8">
                <Button asChild variant="light" size="lg">
                  <Link href={homepageHero.primaryCta.href}>
                    {homepageHero.primaryCta.label}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Decorative carousel controls (visual only for mock) */}
            <div className="absolute bottom-6 right-6 z-10 hidden items-center gap-2 sm:flex">
              <button
                type="button"
                aria-label="Previous slide"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
