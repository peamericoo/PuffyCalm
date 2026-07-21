/**
 * Invalidate home content cache after CMS-lite save (Phase J).
 * Tags: `home`, `content` · path `/`
 */

export type RevalidateHomeResult = {
  ok: boolean;
  revalidated?: { tags: string[]; paths: string[] };
  error?: string;
};

export async function revalidateHome(): Promise<RevalidateHomeResult> {
  try {
    const res = await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ home: true }),
    });
    const data = (await res.json().catch(() => ({}))) as RevalidateHomeResult & {
      message?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || data.message || `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      revalidated: data.revalidated,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Revalidate request failed",
    };
  }
}
