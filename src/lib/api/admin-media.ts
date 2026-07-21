/**
 * Admin media API (Phase I).
 * Browser-only: credentials: "include" for FastAPI HttpOnly cookies.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type AdminMediaUploadResult = {
  key: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  productId: string | null;
  sortOrder: number | null;
  setCover: boolean;
};

export type AdminMediaDeleteResult = {
  deleted: boolean;
  key: string | null;
  url: string | null;
  storageDeleted: boolean;
  imagesRemoved: number;
  productsTouched: number;
};

export class AdminMediaApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminMediaApiError";
    this.status = status;
    this.code = code;
  }
}

function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new AdminMediaApiError(
      `Invalid JSON from admin media API (${res.status})`,
      res.status,
    );
  }
}

function errorFromResponse(
  res: Response,
  data: Record<string, unknown>,
): AdminMediaApiError {
  const detail = data.detail;
  if (typeof detail === "string") {
    return new AdminMediaApiError(detail, res.status);
  }
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const d = detail as Record<string, unknown>;
    const msg =
      typeof d.message === "string"
        ? d.message
        : `HTTP ${res.status}`;
    const code = typeof d.code === "string" ? d.code : undefined;
    return new AdminMediaApiError(msg, res.status, code);
  }
  return new AdminMediaApiError(`HTTP ${res.status}`, res.status);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** POST /api/v1/admin/media (multipart) */
export async function uploadAdminMedia(options: {
  file: File;
  productId?: string;
  setCover?: boolean;
}): Promise<AdminMediaUploadResult> {
  const form = new FormData();
  form.append("file", options.file);
  if (options.productId) {
    form.append("productId", options.productId);
  }
  if (options.setCover) {
    form.append("setCover", "true");
  }

  const res = await fetch(apiUrl("/api/v1/admin/media"), {
    method: "POST",
    credentials: "include",
    // Do not set Content-Type — browser sets multipart boundary
    body: form,
  });
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);

  return {
    key: asString(data.key),
    url: asString(data.url),
    contentType: asString(data.contentType ?? data.content_type),
    sizeBytes: asNumber(data.sizeBytes ?? data.size_bytes),
    productId:
      data.productId != null || data.product_id != null
        ? asString(data.productId ?? data.product_id)
        : null,
    sortOrder:
      data.sortOrder != null || data.sort_order != null
        ? asNumber(data.sortOrder ?? data.sort_order)
        : null,
    setCover: Boolean(data.setCover ?? data.set_cover),
  };
}

/** DELETE /api/v1/admin/media */
export async function deleteAdminMedia(options: {
  key?: string;
  url?: string;
}): Promise<AdminMediaDeleteResult> {
  const res = await fetch(apiUrl("/api/v1/admin/media"), {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: options.key ?? null,
      url: options.url ?? null,
    }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);

  return {
    deleted: Boolean(data.deleted),
    key:
      data.key != null ? asString(data.key) : null,
    url: data.url != null ? asString(data.url) : null,
    storageDeleted: Boolean(data.storageDeleted ?? data.storage_deleted),
    imagesRemoved: asNumber(data.imagesRemoved ?? data.images_removed),
    productsTouched: asNumber(data.productsTouched ?? data.products_touched),
  };
}

/** Client-side preflight limits (mirror BE defaults). */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
