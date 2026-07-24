import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShopFeelAutoRail } from "@/components/home/shop-feel-auto-rail";
import { HomeProductGrid } from "@/components/home/home-product-grid";
import { Reveal } from "@/components/shared/reveal";
import { categoryDisplayImage } from "@/lib/catalog/category-image";
import { getHomeProductRail, listCategories } from "@/lib/catalog/service";
import type { Category, Product } from "@/types/product";
import { cn } from "@/lib/utils";

type ShopCategory = {
  label: string;
  href: string;
  tagline: string;
  imageUrl?: string;
  count: string;
  accent: string;
};

const CATEGORY_ORDER = ["recovery", "comfort", "everyday"] as const;

const CATEGORY_COPY: Record<(typeof CATEGORY_ORDER)[number], string> = {
  recovery: "Relieve tension & recharge faster",
  comfort: "Support that feels like a hug",
  everyday: "Small rituals for a better day",
};

const CATEGORY_ACCENTS: Record<(typeof CATEGORY_ORDER)[number], string> = {
  recovery: "from-[#d9edf9] via-[#edf7fc] to-[#b8d5e8]",
  comfort: "from-[#e5f3fb] via-[#f7fbfd] to-[#c9e4f5]",
  everyday: "from-[#f6dfc2] via-[#f9ead8] to-[#d7edf7]",
};

function buildFallbackCategories(productTotal: number): ShopCategory[] {
  return CATEGORY_ORDER.map((slug) => ({
    label: slug === "everyday" ? "Everyday" : slug[0]!.toUpperCase() + slug.slice(1),
    href: `/category/${slug}`,
    tagline: CATEGORY_COPY[slug],
    count: productTotal > 0 ? String(productTotal) : "-",
    accent: CATEGORY_ACCENTS[slug],
  }));
}

function categoryToShopCard(category: Category, slug: (typeof CATEGORY_ORDER)[number]) {
  return {
    label: category.name,
    href: `/category/${category.slug}`,
    tagline: category.tagline || CATEGORY_COPY[slug],
    imageUrl: categoryDisplayImage(category.imageUrl) ?? undefined,
    count: String(category.productCount),
    accent: CATEGORY_ACCENTS[slug],
  } satisfies ShopCategory;
}

async function buildShopCategories(productTotal: number): Promise<ShopCategory[]> {
  try {
    const categories = await listCategories();
    const bySlug = new Map(categories.map((category) => [category.slug, category]));
    const cards = CATEGORY_ORDER.map((slug) => {
      const category = bySlug.get(slug);
      return category
        ? categoryToShopCard(category, slug)
        : buildFallbackCategories(productTotal).find((item) =>
            item.href.endsWith(slug),
          )!;
    });

    return cards;
  } catch {
    return buildFallbackCategories(productTotal);
  }
}

function CategoryCard({ category }: { category: ShopCategory }) {
  return (
    <Link
      href={category.href}
      prefetch={false}
      transitionTypes={["catalog"]}
      className={cn(
        "group relative min-h-[162px] overflow-hidden rounded-[1.15rem] border border-white/70 shadow-[0_18px_44px_-32px_rgb(26_35_50/0.3)] outline-none transition duration-300 sm:min-h-[178px] lg:min-h-[192px] xl:min-h-[206px]",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_rgb(26_35_50/0.34)] focus-visible:ring-2 focus-visible:ring-brand/35",
      )}
    >
      <span
        className={cn("absolute inset-0 bg-gradient-to-br", category.accent)}
        aria-hidden
      />

      {category.imageUrl ? (
        <Image
          src={category.imageUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 92vw, 33vw"
          quality={74}
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.045]"
        />
      ) : (
        <span className="absolute inset-0 brand-gradient opacity-85" />
      )}

      <span
        className="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_22_38/0.06)_0%,rgb(10_22_38/0.18)_58%,rgb(10_22_38/0.34)_100%)]"
        aria-hidden
      />
      <span
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_18%_18%,rgb(255_255_255/0.22),transparent_58%)]"
        aria-hidden
      />

      <span className="relative z-10 flex h-full min-h-[162px] w-full items-end justify-between gap-3 px-4 py-4 sm:min-h-[178px] sm:px-5 sm:py-5 lg:min-h-[192px] xl:min-h-[206px]">
        <span className="min-w-0 max-w-[72%]">
          <span className="block font-display text-[1.55rem] font-medium leading-none tracking-tight text-white drop-shadow-[0_2px_14px_rgb(10_22_38/0.35)] sm:text-[1.75rem] lg:text-[1.95rem]">
            {category.label}
          </span>
          <span className="mt-2 line-clamp-2 block max-w-[15rem] text-[12px] font-semibold leading-snug text-white/86 drop-shadow-[0_1px_10px_rgb(10_22_38/0.38)] sm:text-[13px]">
            {category.tagline}
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white drop-shadow-[0_1px_10px_rgb(10_22_38/0.38)]">
            {category.count} products
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </Link>
  );
}

function ShopByFeelSection({ categories }: { categories: ShopCategory[] }) {
  return (
    <Reveal delay={40} variant="soft" once={false}>
      <div className="mx-auto max-w-[1680px]" aria-label="Shop by feel">
        <ShopFeelAutoRail>
          <div className="shop-feel-rail flex w-max gap-3.5 pr-[var(--shell-gutter)] lg:grid lg:w-auto lg:grid-cols-3 lg:gap-5 lg:pr-0 xl:gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.href} category={category} />
            ))}
          </div>
        </ShopFeelAutoRail>
      </div>
    </Reveal>
  );
}

function CatalogEmpty({ isError }: { isError: boolean }) {
  return (
    <div
      className="mx-auto max-w-[760px] rounded-[1.25rem] border border-white/70 bg-white/58 px-6 py-10 text-center shadow-[0_18px_40px_-34px_rgb(26_35_50/0.25)]"
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Catalog
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">
        {isError ? "Catalog temporarily unavailable" : "No products published yet"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {isError
          ? "Please refresh in a moment. Your cart is unaffected."
          : "Add products in Admin, upload photos, then publish. They appear here automatically."}
      </p>
      <Link
        href={isError ? "/category/all" : "/admin/products"}
        prefetch={false}
        transitionTypes={isError ? ["catalog"] : undefined}
        className="mt-4 inline-flex text-sm font-semibold text-brand-deep underline-offset-4 hover:underline"
      >
        {isError ? "Try the collection" : "Open products admin"}
      </Link>
    </div>
  );
}

/**
 * Home shop stage.
 * Categories use Admin -> Categories cover images. Product order is controlled
 * by Admin -> Products -> Destaque, then falls back to the published catalog.
 */
export async function ShopNow() {
  let products: Product[] = [];
  let catalogError = false;

  try {
    products = await getHomeProductRail(8);
  } catch {
    catalogError = true;
  }

  const categories = await buildShopCategories(products.length);

  return (
    <section className="relative overflow-x-clip px-[var(--shell-gutter)] pb-10 pt-4 sm:px-5 sm:pb-14 sm:pt-5 lg:pb-16 lg:pt-6">
      <div className="mx-auto max-w-[1680px] space-y-6 sm:space-y-7">
        <ShopByFeelSection categories={categories} />

        {catalogError || products.length === 0 ? (
          <CatalogEmpty isError={catalogError} />
        ) : (
          <HomeProductGrid products={products} />
        )}
      </div>
    </section>
  );
}
