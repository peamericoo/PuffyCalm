import { buildFacets, filterProducts } from "@/lib/catalog/filter";
import { sortProducts } from "@/lib/catalog/sort";
import type {
  CatalogPage,
  CatalogQuery,
  CatalogSort,
  StockFilter,
} from "@/lib/catalog/types";
import { categories, getCategoryBySlug } from "@/lib/mock/categories";
import { getProductsByCategory } from "@/lib/mock/products";
import type { Category } from "@/types/product";

/**
 * Catalog data access.
 * Today: mock. Tomorrow: API with same CatalogPage shape.
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

function normalizeTypes(types: string[] | undefined): string[] {
  if (!types?.length) return [];
  const unique = [...new Set(types.map((t) => t.trim().toLowerCase()))];
  return unique.filter((t) => t && t !== "all");
}

export async function getCatalogPage(
  query: CatalogQuery,
): Promise<CatalogPage | null> {
  const slug = query.categorySlug.trim().toLowerCase() || "all";
  const sort: CatalogSort = query.sort ?? "featured";
  const stock: StockFilter = query.stock ?? "all";
  const types = normalizeTypes(query.types);
  const sale = Boolean(query.sale);

  const category =
    getCategoryBySlug(slug) ?? (slug === "all" ? FALLBACK_ALL : null);
  if (!category) return null;

  const pool = getProductsByCategory(slug);
  const facets = buildFacets(
    pool,
    categories.map((c) => ({ slug: c.slug, name: c.name })),
  );

  const filtered = filterProducts(pool, { stock, types, sale });
  const products = sortProducts(filtered, sort);

  const siblings = categories.map((c) => ({
    ...c,
    productCount: getProductsByCategory(c.slug).length,
  }));

  return {
    category: {
      ...category,
      productCount: products.length,
    },
    products,
    siblings,
    sort,
    stock,
    types,
    sale,
    total: products.length,
    poolTotal: pool.length,
    facets,
  };
}

export async function listCatalogSlugs(): Promise<string[]> {
  return categories.map((c) => c.slug);
}
