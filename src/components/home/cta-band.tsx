import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="px-2 pb-10 sm:px-4 sm:pb-14">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[1.75rem] brand-gradient px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:min-h-[220px] lg:items-center lg:justify-between lg:px-14 animate-scale-in">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-brand-deep/20 blur-3xl" />

        <div className="relative max-w-xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-deep">
            Launch week
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Your desk, your recovery, your everyday — upgraded.
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Guest checkout. Tracked shipping. Launch prices while they last.
          </p>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
          <Button asChild variant="default" size="lg" className="pressable">
            <Link href="/category/all">Shop the sale</Link>
          </Button>
          <Button asChild variant="light" size="lg" className="pressable">
            <Link href="/help">Need help?</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
