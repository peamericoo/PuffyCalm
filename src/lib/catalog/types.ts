import type { Category, Product } from "@/types/product";

/** Sort keys the catalog UI and future API share. */
export type CatalogSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating";

export type StockFilter = "all" | "in" | "out";

export type CatalogQuery = {
  categorySlug: string;
  sort?: CatalogSort;
  /** Availability filter */
  stock?: StockFilter;
  /**
   * Extra type refine (collection slugs, never `all`).
   * Used when browsing `all` or cross-filtering.
   */
  types?: string[];
  /** Only discounted items */
  sale?: boolean;
};

export type CatalogFacets = {
  stock: { in: number; out: number };
  types: { slug: string; name: string; count: number }[];
  sale: number;
};

export type CatalogPage = {
  category: Category;
  products: Product[];
  /** Mood rail collections (includes `all`) */
  siblings: Category[];
  sort: CatalogSort;
  stock: StockFilter;
  types: string[];
  sale: boolean;
  /** Count after filters */
  total: number;
  /** Unfiltered category size (for “6 of 30” style) */
  poolTotal: number;
  facets: CatalogFacets;
};

export const CATALOG_SORT_OPTIONS: {
  value: CatalogSort;
  label: string;
}[] = [
  { value: "featured", label: "Relevance" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price · low" },
  { value: "price-desc", label: "Price · high" },
];

export function isCatalogSort(value: string | undefined): value is CatalogSort {
  return (
    value === "featured" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "rating"
  );
}

export function isStockFilter(value: string | undefined): value is StockFilter {
  return value === "all" || value === "in" || value === "out";
}
