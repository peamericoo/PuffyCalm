import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { categories } from "@/lib/mock/categories";
import { cn } from "@/lib/utils";

export function CategoriesStrip() {
  const items = categories.filter((c) => c.slug !== "all");

  return (
    <section className="py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Collections"
          title="Shop by how you want to feel"
          description="Recovery after long days, comfort for deep work, and everyday upgrades that just work."
        />

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {items.map((category, index) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br p-6 card-lift sm:min-h-[240px] sm:p-7",
                category.imageGradient,
              )}
            >
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                    {category.productCount} products
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-transform group-hover:rotate-12">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-brand-deep">
                    0{index + 1}
                  </p>
                  <h3 className="font-display text-2xl font-medium tracking-tight text-foreground">
                    {category.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {category.tagline}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
