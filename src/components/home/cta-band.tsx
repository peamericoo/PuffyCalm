import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="relative overflow-hidden px-[var(--shell-gutter)] pb-12 pt-4 sm:px-5 sm:pb-16 lg:pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgb(218_239_250/0)_0%,rgb(196_230_246/0.55)_34%,rgb(151_206_232/0.58)_100%)]"
        aria-hidden
      />
      <Reveal
        variant="soft"
        once={false}
        className="relative mx-auto grid max-w-[1500px] gap-7 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:items-end lg:gap-12 lg:py-10"
      >
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-44 w-[34rem] rounded-full bg-white/22 blur-3xl"
          aria-hidden
        />

        <div className="relative min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep/82 sm:text-xs">
            Ready when you are
          </p>
          <h2 className="mt-3 max-w-[13ch] font-display text-[3rem] font-normal leading-[0.92] tracking-normal text-foreground sm:text-[4.25rem] lg:text-[5rem] xl:text-[5.65rem]">
            Small relief, shipped fast.
          </h2>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg lg:text-xl">
            Pick the tool that fits the ache, check out without an account, and
            get clear totals before payment.
          </p>
        </div>

        <div className="relative min-w-0 lg:pb-2">
          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            <CtaPoint icon={PackageCheck} label="Curated comfort tools" />
            <CtaPoint icon={ShieldCheck} label="Stripe-secure checkout" />
            <CtaPoint icon={CheckCircle2} label="Guest checkout available" />
          </div>
          <div className="mt-6 flex">
            <Button
              asChild
              variant="default"
              size="lg"
              className="pressable h-12 px-7 text-sm sm:h-[52px] sm:px-8 sm:text-[15px]"
            >
              <Link href="/category/all" transitionTypes={["catalog"]}>
                Shop the catalog
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function CtaPoint({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex min-h-12 items-center gap-3 rounded-full border border-white/55 bg-white/34 px-4 text-sm font-semibold text-brand-deep shadow-[0_10px_24px_-18px_rgb(26_35_50/0.25)] backdrop-blur-sm sm:text-[15px]">
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
      {label}
    </span>
  );
}
