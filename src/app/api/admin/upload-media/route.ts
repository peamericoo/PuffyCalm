/**
 * Same-origin proxy for admin image uploads.
 *
 * WHY THIS EXISTS:
 * The browser cannot send FastAPI HttpOnly cookies cross-origin (SameSite=Lax
 * blocks web-*.railway.app → api-*.railway.app), so a direct browser fetch
 * always fails with 401 / "Failed to fetch" after ~1 h when the Google ID
 * token expires.
 *
 * HOW IT WORKS:
 * 1. Browser POSTs multipart to /api/admin/upload-media (same-origin, no CORS).
 * 2. This handler validates the Auth.js session server-side (no cookie issues).
 * 3. It forwards the raw multipart to FastAPI using:
 *    - URL: Railway internal network (http://api.railway.internal) in production,
 *      or NEXT_PUBLIC_API_URL on dev — resolved from API_INTERNAL_URL env var.
 *    - Auth: X-Internal-Upload-Key shared secret (INTERNAL_UPLOAD_KEY env var).
 *      No Google token, no JWT, no expiry, no CORS.
 *
 * NEVER returns 401 to the browser (would trigger middleware redirect to login).
 * Auth failures are returned as 403 so the admin page shows an error in-place.
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resolve the internal API base URL.
 * - In production Railway: use http://api.railway.internal (private network, no TLS overhead, no public egress)
 * - Locally / fallback: use the public API URL from env
 */
function getInternalApiBase(): string {
  // Explicit internal URL override (e.g. set API_INTERNAL_URL=http://api.railway.internal on web service)
  const explicit = process.env.API_INTERNAL_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  // Fallback: use NEXT_PUBLIC_API_URL (works locally and as a safe fallback)
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");

  return "http://localhost:8080";
}

export async function POST(request: NextRequest) {
  // 1. Validate Auth.js session server-side — no cookies, no CORS, always works.
  const session = await auth();
  const role = session?.user?.role;

  // Return 403 (not 401) so Next.js middleware does NOT redirect to /login.
  if (!session?.user || (role !== "admin" && role !== "staff")) {
    return NextResponse.json(
      { detail: { message: "Admin session required", code: "unauthorized" } },
      { status: 403 },
    );
  }

  // 2. Validate content-type before consuming the body.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json(
      { detail: { message: "Expected multipart/form-data", code: "bad_request" } },
      { status: 400 },
    );
  }

  // 3. Get shared secret — must be configured on both web + api Railway services.
  const internalKey = process.env.INTERNAL_UPLOAD_KEY?.trim() ?? "";
  if (!internalKey) {
    return NextResponse.json(
      {
        detail: {
          message:
            "Upload proxy not configured — INTERNAL_UPLOAD_KEY missing on web service.",
          code: "not_configured",
        },
      },
      { status: 503 },
    );
  }

  // 4. Read body ONCE (streams can only be consumed once).
  let body: ArrayBuffer;
  try {
    body = await request.arrayBuffer();
  } catch {
    return NextResponse.json(
      { detail: { message: "Failed to read request body", code: "body_error" } },
      { status: 400 },
    );
  }

  // 5. Forward raw multipart to FastAPI internal endpoint.
  const base = getInternalApiBase();
  const targetUrl = `${base}/api/v1/admin/media/internal`;

  let apiRes: Response;
  try {
    apiRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType, // MUST preserve multipart boundary
        "X-Internal-Upload-Key": internalKey,
      },
      body,
      // Explicit timeout via AbortSignal (Node 18+)
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-media] fetch to API failed:", msg, "url:", targetUrl);
    return NextResponse.json(
      { detail: { message: `API unreachable: ${msg}`, code: "api_unreachable" } },
      { status: 502 },
    );
  }

  // 6. Pipe FastAPI's response back as-is.
  const responseText = await apiRes.text();
  return new NextResponse(responseText, {
    status: apiRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
