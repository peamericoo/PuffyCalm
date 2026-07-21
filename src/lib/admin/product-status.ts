/** Product lifecycle labels (mirrors BE ProductStatus). */

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;

export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const LIST_PRODUCT_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function productStatusLabel(status: string): string {
  return PRODUCT_STATUS_LABELS[status] ?? status;
}
