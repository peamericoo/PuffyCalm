/**
 * Admin home content API (Phase J).
 * Browser-only: credentials: "include" for FastAPI HttpOnly cookies.
 */

import { getApiBaseUrl } from "@/lib/api/config";
import { normalizeHomeContent } from "@/lib/api/content";
import type { HeroSlide, HomeContent, LifestyleTile } from "@/types/content";

export type HomeContentInput = {
  promoMessages: string[];
  heroSlides: HeroSlide[];
  lifestyleCollections: LifestyleTile[];
};

export class AdminContentApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AdminContentApiError";
  }
}

async function parseError(res: Response): Promise<AdminContentApiError> {
  let message = `HTTP ${res.status}`;
  let code: string | undefined;
  try {
    const data = (await res.json()) as {
      detail?: string | { message?: string; code?: string };
      message?: string;
    };
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (data.detail && typeof data.detail === "object") {
      message = data.detail.message || message;
      code = data.detail.code;
    } else if (data.message) {
      message = data.message;
    }
  } catch {
    /* ignore */
  }
  return new AdminContentApiError(message, res.status, code);
}

export async function fetchAdminHomeContent(): Promise<HomeContent> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/content/home`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeHomeContent(data);
}

export async function saveAdminHomeContent(
  input: HomeContentInput,
): Promise<HomeContent> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/content/home`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      promoMessages: input.promoMessages,
      heroSlides: input.heroSlides.map((s) => ({
        id: s.id,
        titleLine1: s.titleLine1,
        titleLine2: s.titleLine2,
        titleAccent: s.titleAccent ?? null,
        subtitle: s.subtitle,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
        secondaryLabel: s.secondaryLabel ?? null,
        secondaryHref: s.secondaryHref ?? null,
        imageUrl: s.imageUrl,
        imageAlt: s.imageAlt,
      })),
      lifestyleCollections: input.lifestyleCollections.map((t) => ({
        id: t.id,
        title: t.title,
        href: t.href,
        imageUrl: t.imageUrl,
        span: t.span,
      })),
    }),
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeHomeContent(data);
}
