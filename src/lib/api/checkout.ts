/**
 * Dumb checkout client — productId + qty only; server owns prices.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type CheckoutLine = {
  productId: string;
  quantity: number;
};

export type CheckoutShipping = {
  fullName: string;
  line1: string;
  city: string;
  region: string;
  postal: string;
  country?: string;
};

export type CreateCheckoutSessionResult = {
  orderId: string;
  publicCode: string;
  clientSecret: string;
  totalCents: number;
  currency: "USD";
  status: string;
};

export type OrderItem = {
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string;
};

export type OrderResult = {
  id: string;
  publicCode: string;
  email: string;
  status: string;
  currency: "USD";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingAddress: Record<string, unknown>;
  items: OrderItem[];
  paidAt: string | null;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  let code = "request_failed";
  try {
    const body = (await res.json()) as {
      detail?: { message?: string; code?: string } | string;
    };
    if (typeof body.detail === "string") {
      message = body.detail;
    } else if (body.detail && typeof body.detail === "object") {
      message = body.detail.message ?? message;
      code = body.detail.code ?? code;
    }
  } catch {
    /* ignore */
  }
  return new ApiError(message, code, res.status);
}

export async function createCheckoutSession(input: {
  email: string;
  lines: CheckoutLine[];
  shipping: CheckoutShipping;
}): Promise<CreateCheckoutSessionResult> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/checkout/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email: input.email,
      lines: input.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
      shipping: {
        fullName: input.shipping.fullName,
        line1: input.shipping.line1,
        city: input.shipping.city,
        region: input.shipping.region,
        postal: input.shipping.postal,
        country: input.shipping.country ?? "US",
      },
    }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<CreateCheckoutSessionResult>;
}

export async function getOrder(
  orderId: string,
  email: string,
  options?: { sync?: boolean },
): Promise<OrderResult> {
  const url = new URL(`${getApiBaseUrl()}/api/v1/orders/${orderId}`);
  url.searchParams.set("email", email);
  if (options?.sync) {
    url.searchParams.set("sync", "true");
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<OrderResult>;
}
