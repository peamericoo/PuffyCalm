import { buildFacets } from "@/lib/catalog/filter";
import type { CatalogPage } from "@/lib/catalog/types";
import { categories, getCategoryBySlug } from "@/lib/mock/categories";
import { getProductsByCategory } from "@/lib/mock/products";
import type { Category } from "@/types/product";

/**
 * Catalog data access.
 * Today: mock. Tomorrow: API with same CatalogPage shape.
 *
 * Returns the unfiltered category pool. Sort/filter run on the client
 * so URL query changes never re-run RSC (no freezes).
 */

const FALLBACK_ALL: Category = {
  id: "cat_all",
  slug: "all",
  name: "All products",
  description: "The full PuffyCalm collection of life-improving essentials.",
  tagline: "Everything we love right now",
  imageUrl:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
  ctaLabel: "Shop All",
  productCount: 0,
};

export async function getCatalogPage(
  categorySlug: string,
): Promise<CatalogPage | null> {
  const slug = categorySlug.trim().toLowerCase() || "all";

  const category =
    getCategoryBySlug(slug) ?? (slug === "all" ? FALLBACK_ALL : null);
  if (!category) return null;

  const pool = getProductsByCategory(slug);
  const facets = buildFacets(
    pool,
    categories.map((c) => ({ slug: c.slug, name: c.name })),
  );

  const siblings = categories.map((c) => ({
    ...c,
    productCount: getProductsByCategory(c.slug).length,
  }));

  return {
    category: {
      ...category,
      productCount: pool.length,
    },
    /** Unfiltered pool — client applies sort/filter */
    products: pool,
    siblings,
    sort: "featured",
    stock: "all",
    types: [],
    sale: false,
    total: pool.length,
    poolTotal: pool.length,
    facets,
  };
}

export async function listCatalogSlugs(): Promise<string[]> {
  return categories.map((c) => c.slug);
}
