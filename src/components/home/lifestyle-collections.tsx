import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { lifestyleCollections } from "@/lib/mock/site";
import { cn } from "@/lib/utils";

export function LifestyleCollections() {
  return (
    <section className="pb-14 pt-4 sm:pb-20 sm:pt-6">
      <Container>
        <SectionHeading
          title="Most Recommended For You"
          description="Lifestyle moments we designed PuffyEasy around — calmer workdays, softer recovery, better everyday flow."
        />

        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:auto-rows-[240px] lg:grid-cols-4">
          {lifestyleCollections.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group relative overflow-hidden rounded-[1.35rem] card-soft",
                index === 0 && "row-span-2",
                index === 1 && "col-span-1 lg:col-span-2",
                index === 2 && "col-span-1",
                index === 3 && "col-span-1",
              )}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="font-display text-xl font-medium tracking-tight text-white sm:text-2xl">
                  {item.title}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
                  View collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
