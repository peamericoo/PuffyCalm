import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { DisplayStack } from "@/components/shared/section-heading";
import { lifestyleCollections } from "@/lib/mock/site";
import { cn } from "@/lib/utils";

export function LifestyleCollections() {
  return (
    <section className="px-3 py-8 sm:px-5 sm:py-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 grid items-end gap-4 lg:mb-8 lg:grid-cols-12">
          <DisplayStack
            eyebrow="Lifestyle"
            title="Designed around how you actually live"
            accent="live"
            motion="soft"
            wrapperClassName="min-w-0 lg:col-span-7"
            className="max-w-2xl"
          />
          <Reveal
            delay={100}
            variant="slide"
            once={false}
            className="min-w-0 lg:col-span-5"
          >
            <p className="text-sm leading-relaxed text-muted-foreground lg:ml-auto lg:max-w-md lg:text-right">
              From desk reset to evening unwind — collections that fill the page
              with intent, not empty scroll.
            </p>
          </Reveal>
        </div>

        <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 lg:auto-rows-[220px] lg:grid-cols-4">
          {lifestyleCollections.map((item, index) => (
            <Reveal
              key={item.id}
              delay={80 + index * 60}
              className={cn(
                index === 0 && "col-span-2 row-span-2 lg:col-span-2",
                index === 1 && "col-span-2 lg:col-span-2",
                index === 2 && "col-span-1",
                index === 3 && "col-span-1",
              )}
            >
              <Link
                href={item.href}
                className="group relative block h-full min-h-[160px] overflow-hidden rounded-[1.35rem] card-soft sm:min-h-[200px] lg:min-h-full"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 40vw"
                  className="object-cover img-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                  <div>
                    <p className="font-display text-xl font-medium tracking-tight text-white sm:text-2xl">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-white/75 sm:text-sm">
                      Explore the edit
                    </p>
                  </div>
                  <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 translate-y-2 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    View
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
