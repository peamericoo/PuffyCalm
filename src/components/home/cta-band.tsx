import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="px-2 pb-10 sm:px-4 sm:pb-14">
      <Reveal className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[1.75rem] brand-gradient px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:min-h-[200px] lg:items-center lg:justify-between lg:px-14">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-brand-deep/20 blur-3xl" />

        <div className="relative max-w-lg space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-deep">
            Ready when you are
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Feel better every day.
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Guest checkout · free shipping over $75.
          </p>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
          <Button asChild variant="default" size="lg" className="pressable">
            <Link href="/category/all">Shop now</Link>
          </Button>
          <Button asChild variant="light" size="lg" className="pressable">
            <Link href="/help">Need help?</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
