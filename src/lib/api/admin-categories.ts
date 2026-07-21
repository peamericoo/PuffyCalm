/**
 * Admin categories API — mood/filter cover images.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string;
  imageUrl: string;
  ctaLabel: string;
  isVirtual: boolean;
  sortOrder: number;
};

export type AdminCategoryUpdate = {
  name?: string;
  description?: string;
  tagline?: string;
  imageUrl?: string;
  ctaLabel?: string;
  sortOrder?: number;
};

export type AdminCategoryCreate = {
  slug: string;
  name: string;
  description?: string;
  tagline?: string;
  imageUrl?: string;
  ctaLabel?: string;
  isVirtual?: boolean;
};

export class AdminCategoriesApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AdminCategoriesApiError";
  }
}

async function parseError(res: Response): Promise<AdminCategoriesApiError> {
  let message = `HTTP ${res.status}`;
  let code: string | undefined;
  try {
    const data = (await res.json()) as {
      detail?: string | { message?: string; code?: string };
    };
    if (typeof data.detail === "string") message = data.detail;
    else if (data.detail && typeof data.detail === "object") {
      message = data.detail.message || message;
      code = data.detail.code;
    }
  } catch {
    /* ignore */
  }
  return new AdminCategoriesApiError(message, res.status, code);
}

function mapCat(raw: Record<string, unknown>): AdminCategory {
  return {
    id: String(raw.id ?? ""),
    slug: String(raw.slug ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    tagline: String(raw.tagline ?? ""),
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? ""),
    ctaLabel: String(raw.ctaLabel ?? raw.cta_label ?? "Shop"),
    isVirtual: Boolean(raw.isVirtual ?? raw.is_virtual),
    sortOrder: Number(raw.sortOrder ?? raw.sort_order ?? 0),
  };
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/categories`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map(mapCat);
}

export async function updateAdminCategory(
  id: string,
  patch: AdminCategoryUpdate,
): Promise<AdminCategory> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/admin/categories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) throw await parseError(res);
  return mapCat((await res.json()) as Record<string, unknown>);
}

export async function createAdminCategory(
  input: AdminCategoryCreate,
): Promise<AdminCategory> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/categories`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return mapCat((await res.json()) as Record<string, unknown>);
}
