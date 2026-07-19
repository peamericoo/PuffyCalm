import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { categories } from "@/lib/mock/categories";

export function CategoriesStrip() {
  const items = categories.filter((c) => c.slug !== "all");

  return (
    <section className="py-10 sm:py-12">
      <Container>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {items.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative min-h-[320px] overflow-hidden rounded-[1.5rem] sm:min-h-[360px] card-soft"
            >
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 sm:p-7">
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-medium tracking-tight text-white sm:text-[1.7rem]">
                    {category.name}
                  </h3>
                  <p className="max-w-[18rem] text-sm leading-relaxed text-white/85">
                    {category.tagline}
                  </p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition group-hover:bg-cream">
                    {category.ctaLabel}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
