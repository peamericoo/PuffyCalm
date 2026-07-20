import { sortProducts } from "@/lib/catalog/sort";
import type { CatalogPage, CatalogQuery, CatalogSort } from "@/lib/catalog/types";
import { categories, getCategoryBySlug } from "@/lib/mock/categories";
import { getProductsByCategory } from "@/lib/mock/products";
import type { Category } from "@/types/product";

/**
 * Catalog data access.
 * Today: mock fixtures. Tomorrow: fetch(`/api/catalog?...`) — same return shape.
 * UI imports only this module (or types), never `lib/mock/*` directly.
 */

const FALLBACK_ALL: Category = {
  id: "cat_all",
  slug: "all",
  name: "All products",
  description: "The full PuffyEasy collection of life-improving essentials.",
  tagline: "Everything we love right now",
  imageUrl:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
  ctaLabel: "Shop All",
  productCount: 0,
};

export async function getCatalogPage(
  query: CatalogQuery,
): Promise<CatalogPage | null> {
  const slug = query.categorySlug.trim().toLowerCase() || "all";
  const sort: CatalogSort = query.sort ?? "featured";

  const category = getCategoryBySlug(slug) ?? (slug === "all" ? FALLBACK_ALL : null);
  if (!category) return null;

  // Future:
  // const res = await fetch(`/api/catalog?slug=${slug}&sort=${sort}`);
  // if (res.status === 404) return null;
  // return res.json();

  const raw = getProductsByCategory(slug);
  const products = sortProducts(raw, sort);

  const liveCount = products.length;
  const resolved: Category = {
    ...category,
    productCount: liveCount,
  };

  const siblings = categories.map((c) => ({
    ...c,
    productCount:
      c.slug === slug
        ? liveCount
        : getProductsByCategory(c.slug).length,
  }));

  return {
    category: resolved,
    products,
    siblings,
    sort,
    total: liveCount,
  };
}

export async function listCatalogSlugs(): Promise<string[]> {
  return categories.map((c) => c.slug);
}
