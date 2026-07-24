/**
 * Same-origin proxy for admin image uploads.
 *
 * WHY: The browser blocks cross-origin cookie transmission (SameSite=Lax),
 * so a direct browser → FastAPI POST with credentials:"include" always 401s
 * once the in-memory Google ID token expires.
 *
 * HOW: The browser posts multipart to THIS Next.js route (same-origin, no CORS).
 * The server reads the Auth.js session, exchanges the Google ID token for a
 * FastAPI Bearer token server-to-server (no CORS barrier), then forwards the
 * multipart body to FastAPI with Authorization: Bearer <token>.
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getApiBaseUrl } from "@/lib/api/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Exchange Google ID token → FastAPI access token (server-side, no CORS). */
async function getBackendAccessToken(googleIdToken: string): Promise<string> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/auth/google-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken: googleIdToken }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend auth exchange failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const token =
    (data.accessToken as string | undefined) ??
    (data.access_token as string | undefined) ??
    "";
  if (!token) throw new Error("Backend exchange returned no access token");
  return token;
}

export async function POST(request: NextRequest) {
  // 1. Verify Auth.js session server-side (no CORS, no cookie issue)
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "admin" && role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get a valid FastAPI Bearer token via server-to-server exchange
  const googleIdToken = session.googleIdToken?.trim() ?? "";
  if (!googleIdToken) {
    return NextResponse.json(
      {
        error:
          "No Google ID token in session — sign out and sign in again to refresh.",
      },
      { status: 401 },
    );
  }

  let accessToken: string;
  try {
    accessToken = await getBackendAccessToken(googleIdToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Backend auth failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // 3. Forward the raw multipart body to FastAPI
  //    We must NOT re-parse the multipart — just pipe the raw bytes + boundary.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const base = getApiBaseUrl();
  const body = await request.arrayBuffer();

  let apiRes: Response;
  try {
    apiRes = await fetch(`${base}/api/v1/admin/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType, // preserve boundary
      },
      body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return NextResponse.json(
      { error: `Failed to reach API: ${msg}` },
      { status: 502 },
    );
  }

  // 4. Return FastAPI's JSON response (success or error) as-is
  const responseText = await apiRes.text();
  return new NextResponse(responseText, {
    status: apiRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
