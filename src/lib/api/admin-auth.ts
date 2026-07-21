/**
 * Admin backend auth (Phase E / E1).
 * All browser calls use credentials: "include" so FastAPI HttpOnly cookies stick.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type AdminRole = "admin" | "staff";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole | string;
  isActive: boolean;
};

export type AdminSession = {
  user: AdminUser;
  accessToken?: string | null;
  tokenType?: string;
  authVia?: string;
};

export type AdminPing = {
  status: string;
  userId: string;
  role: string;
  message: string;
};

function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from admin API (${res.status})`);
  }
}

function mapUser(raw: Record<string, unknown>): AdminUser {
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    fullName: String(raw.fullName ?? raw.full_name ?? ""),
    role: String(raw.role ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
  };
}

/**
 * Exchange Google OpenID ID token for FastAPI admin cookies (pc_access / pc_refresh).
 */
export async function exchangeGoogleIdToken(
  idToken: string,
): Promise<AdminSession> {
  const res = await fetch(apiUrl("/api/v1/auth/google-exchange"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) {
    const detail =
      typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`;
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const userRaw = (data.user ?? {}) as Record<string, unknown>;
  return {
    user: mapUser(userRaw),
    accessToken: (data.accessToken as string | undefined) ?? null,
    tokenType: data.tokenType as string | undefined,
    authVia: data.authVia as string | undefined,
  };
}

/** Refresh admin JWT cookies using pc_refresh. */
export async function refreshAdminSession(): Promise<AdminSession> {
  const res = await fetch(apiUrl("/api/v1/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) {
    const err = new Error(
      typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`,
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return {
    user: mapUser((data.user ?? {}) as Record<string, unknown>),
    accessToken: (data.accessToken as string | undefined) ?? null,
    authVia: data.authVia as string | undefined,
  };
}

export async function fetchAdminMe(): Promise<AdminUser> {
  const res = await fetch(apiUrl("/api/v1/auth/me"), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) {
    const err = new Error(
      typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`,
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return mapUser(data);
}

/** GET /admin/ping — staff or admin. */
export async function fetchAdminPing(): Promise<AdminPing> {
  const res = await fetch(apiUrl("/api/v1/admin/ping"), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) {
    const err = new Error(
      typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`,
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return {
    status: String(data.status ?? "ok"),
    userId: String(data.userId ?? data.user_id ?? ""),
    role: String(data.role ?? ""),
    message: String(data.message ?? ""),
  };
}

/** Best-effort BE logout (clears pc_* cookies on API host). */
export async function logoutAdminBackend(): Promise<void> {
  try {
    await fetch(apiUrl("/api/v1/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    /* ignore network */
  }
}

/**
 * Ensure BE admin session: ping → refresh → google-exchange (if idToken).
 * Returns ping result or throws with status 401/403.
 */
export async function ensureAdminBackendSession(opts: {
  googleIdToken?: string | null;
}): Promise<AdminPing> {
  try {
    return await fetchAdminPing();
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status !== 401) throw e;
  }

  try {
    await refreshAdminSession();
    return await fetchAdminPing();
  } catch {
    /* fall through to Google exchange */
  }

  const idToken = opts.googleIdToken?.trim();
  if (!idToken) {
    const err = new Error(
      "Backend admin session missing — sign in again with Google",
    ) as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  await exchangeGoogleIdToken(idToken);
  return fetchAdminPing();
}
