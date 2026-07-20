import type { Category, Product } from "@/types/product";

/** Sort keys the catalog UI and future API share. */
export type CatalogSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating";

export type CatalogQuery = {
  categorySlug: string;
  sort?: CatalogSort;
};

export type CatalogPage = {
  category: Category;
  products: Product[];
  /** Other collections for the pill rail (includes `all`) */
  siblings: Category[];
  sort: CatalogSort;
  total: number;
};

export const CATALOG_SORT_OPTIONS: {
  value: CatalogSort;
  label: string;
}[] = [
  { value: "featured", label: "Featured" },
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
