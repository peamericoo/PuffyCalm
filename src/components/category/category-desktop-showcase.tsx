"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryActiveChips } from "@/components/category/category-active-chips";
import { CatalogLink } from "@/components/category/catalog-link";
import { CategoryMobileFilters } from "@/components/category/category-mobile-filters";
import { CategorySortDropdown } from "@/components/category/category-sort-dropdown";
import { CategorySearchBox } from "@/components/category/category-search-box";
import { categoryDisplayImage } from "@/lib/catalog/category-image";
import type { CatalogFacets } from "@/lib/catalog/types";
import type { Category, Product } from "@/types/product";
import { getProductImages } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryDesktopHeroProps {
  category: Category;
  siblings: Category[];
  products: Product[];
  total: number;
  className?: string;
}

interface CategoryDesktopControlsProps {
  category: Category;
  siblings: Category[];
  facets: CatalogFacets;
  products: Product[];
  total: number;
  poolTotal: number;
  pending?: boolean;
  className?: string;
}

interface CategoryMobileControlsProps {
  category: Category;
  siblings: Category[];
  facets: CatalogFacets;
  products: Product[];
  total: number;
  pending?: boolean;
  className?: string;
}

function pieceLabel(total: number) {
  return `${total} piece${total === 1 ? "" : "s"}`;
}

function productLabel(total: number) {
  return `${total} product${total === 1 ? "" : "s"}`;
}

function getHeroImage(
  category: Category,
  products: Product[],
  siblings: Category[],
): { src: string; alt: string } | null {
  const categoryImage = categoryDisplayImage(category.imageUrl);
  if (categoryImage) return { src: categoryImage, alt: category.name };

  for (const product of products) {
    const [src] = getProductImages(product);
    if (src) return { src, alt: product.imageAlt || product.name };
  }

  for (const sibling of siblings) {
    const image = categoryDisplayImage(sibling.imageUrl);
    if (image) return { src: image, alt: sibling.name };
  }

  return null;
}

function getCollectionChips(category: Category, siblings: Category[]) {
  const seen = new Set<string>();
  return [category, ...siblings.filter((c) => c.slug !== category.slug)].filter(
    (item) => {
      if (!item.slug || seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    },
  );
}

export function CategoryDesktopHero({
  category,
  siblings,
  products,
  total,
  className,
}: CategoryDesktopHeroProps) {
  const isAll = category.slug === "all";
  const title = isAll ? "All products" : category.name;
  const eyebrow = isAll ? "Shop the edit" : "Collection";
  const lead = isAll
    ? `${pieceLabel(total)} · Small upgrades. Better days.`
    : `${pieceLabel(total)} · ${category.tagline || "Small upgrades. Better days."}`;
  const heroImage = getHeroImage(category, products, siblings);

  return (
    <section
      className={cn(
        "grid grid-cols-[minmax(0,0.95fr)_minmax(8.25rem,0.88fr)] items-center gap-3 sm:grid-cols-[minmax(0,0.95fr)_minmax(11rem,0.88fr)] sm:gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(20rem,0.92fr)] lg:gap-5",
        className,
      )}
    >
      <div className="min-w-0 pt-1">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground sm:mb-4 sm:gap-2 sm:text-[13px]"
        >
          <Link
            href="/"
            prefetch={false}
            transitionTypes={["nav-back"]}
            className="transition hover:text-foreground"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-40" aria-hidden />
          <Link
            href="/category/all"
            prefetch={false}
            transitionTypes={["catalog"]}
            scroll={false}
            className={cn(
              "transition hover:text-foreground",
              isAll && "font-semibold text-foreground/80",
            )}
          >
            Shop
          </Link>
          {!isAll ? (
            <>
              <ChevronRight
                className="h-3.5 w-3.5 opacity-40"
                aria-hidden
              />
              <span className="font-semibold text-foreground/80">
                {category.name}
              </span>
            </>
          ) : null}
        </nav>

        <p className="mb-2 text-[11px] font-bold uppercase text-brand-deep sm:mb-3 sm:text-[12px]">
          {eyebrow}
        </p>
        <h1 className="font-display text-[2.05rem] font-normal leading-none text-foreground sm:text-[2.45rem] lg:text-[2.75rem] xl:text-[3rem] 2xl:text-[3.25rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-5 text-muted-foreground sm:text-base sm:leading-6 lg:mt-2.5 xl:text-lg">
          {lead}
        </p>
      </div>

      <div className="relative h-[5.9rem] w-full max-w-[12.5rem] justify-self-end overflow-hidden rounded-[1.15rem] border border-white/70 bg-white/45 shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_12px_30px_-28px_rgb(26_35_50/0.35)] sm:h-[7rem] sm:max-w-[16rem] lg:h-[8.5rem] lg:max-w-[34rem] lg:rounded-[1.35rem] xl:h-[9.25rem] xl:max-w-[38rem] 2xl:h-[10rem] 2xl:max-w-[42rem]">
        {heroImage ? (
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            sizes="(min-width: 1536px) 680px, (min-width: 1024px) 48vw, 100vw"
            className="object-cover object-center"
          />
        ) : (
          <span className="absolute inset-0 brand-gradient opacity-90" />
        )}
        <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent" />
      </div>
    </section>
  );
}

export function CategoryMobileControls({
  category,
  siblings,
  facets,
  products,
  total,
  pending,
  className,
}: CategoryMobileControlsProps) {
  return (
    <section
      aria-label="Catalog controls"
      className={cn(
        "rounded-[1.65rem] border border-white/72 bg-white/72 p-3 shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_16px_36px_-30px_rgb(26_35_50/0.26)] backdrop-blur-md",
        pending && "opacity-75 transition-opacity duration-150",
        className,
      )}
    >
      <div className="grid min-h-12 grid-cols-[1fr_auto_auto] items-center gap-2">
        <p className="min-w-0 pl-1 text-[13px] font-medium text-muted-foreground sm:text-[14px]">
          <span className="font-semibold text-foreground tabular-nums">
            {total}
          </span>{" "}
          {total === 1 ? "product" : "products"}
        </p>

        <CategoryMobileFilters
          facets={facets}
          siblings={siblings}
          products={products}
          activeSlug={category.slug}
          resultCount={total}
          display="all"
          label="Filter"
          triggerVariant="toolbar"
          className="shrink-0"
        />

        <CategorySortDropdown compact className="shrink-0" />
      </div>

      <CategorySearchBox compact className="mt-3" />

      <CategoryActiveChips
        facets={facets}
        display="all"
        className="mt-3 border-t border-white/60 pt-3"
      />
    </section>
  );
}

export function CategoryDesktopControls({
  category,
  siblings,
  facets,
  products,
  total,
  poolTotal,
  pending,
  className,
}: CategoryDesktopControlsProps) {
  const chips = getCollectionChips(category, siblings);
  const countText =
    poolTotal > total
      ? `${total} of ${productLabel(poolTotal)}`
      : productLabel(total);

  return (
    <section
      aria-label="Catalog controls"
      className={cn(
        "rounded-[1.15rem] border border-white/70 bg-white/72 p-3 shadow-[0_1px_0_rgb(255_255_255/0.88)_inset,0_18px_40px_-30px_rgb(26_35_50/0.28)] backdrop-blur-md",
        pending && "opacity-75 transition-opacity duration-150",
        className,
      )}
    >
      <div className="flex min-h-12 items-center gap-3">
        <CategoryMobileFilters
          facets={facets}
          siblings={siblings}
          products={products}
          activeSlug={category.slug}
          resultCount={total}
          display="all"
          label="Filter"
          panelSize="desktop"
          triggerVariant="toolbar"
          className="shrink-0"
        />

        <nav
          aria-label="Collections"
          className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pr-1"
        >
          {chips.map((chip) => {
            const active = chip.slug === category.slug;
            return (
              <CatalogLink
                key={chip.id || chip.slug}
                slug={chip.slug}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center rounded-full border px-5 text-[13px] font-semibold transition",
                  active
                    ? "border-brand/35 bg-brand-soft/80 text-brand-deep shadow-[0_1px_0_rgb(255_255_255/0.8)_inset]"
                    : "border-white/70 bg-white/58 text-muted-foreground hover:bg-white hover:text-foreground",
                )}
              >
                {chip.name}
              </CatalogLink>
            );
          })}
        </nav>

        <p className="hidden shrink-0 text-[13px] font-medium text-muted-foreground xl:block">
          {countText}
        </p>

        <CategorySearchBox className="hidden shrink-0 lg:block" />

        <div className="ml-auto flex shrink-0 items-center">
          <CategorySortDropdown className="shrink-0" />
        </div>
      </div>

      <CategoryActiveChips
        facets={facets}
        display="all"
        className="mt-3 border-t border-white/60 pt-3"
      />
    </section>
  );
}
