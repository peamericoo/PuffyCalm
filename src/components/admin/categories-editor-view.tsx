"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminCategoriesApiError,
  fetchAdminCategories,
  updateAdminCategory,
  type AdminCategory,
} from "@/lib/api/admin-categories";
import { revalidateCatalog } from "@/lib/admin/revalidate-catalog";
import { AdminImageField } from "@/components/admin/admin-image-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

/**
 * Edit category names + cover images for Shop by Mood / Filters.
 */
export function CategoriesEditorView({ googleIdToken }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<AdminCategory>>>(
    {},
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const list = await fetchAdminCategories();
      setCats(list);
      const d: Record<string, Partial<AdminCategory>> = {};
      for (const c of list) {
        d[c.id] = {
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          imageUrl: c.imageUrl,
          ctaLabel: c.ctaLabel,
        };
      }
      setDrafts(d);
    } catch (e) {
      setError(
        e instanceof AdminCategoriesApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, [googleIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchDraft = (id: string, patch: Partial<AdminCategory>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const onSave = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    setMessage(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const updated = await updateAdminCategory(id, {
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        imageUrl: d.imageUrl ?? "",
        ctaLabel: d.ctaLabel,
      });
      setCats((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          name: updated.name,
          tagline: updated.tagline,
          description: updated.description,
          imageUrl: updated.imageUrl,
          ctaLabel: updated.ctaLabel,
        },
      }));
      await revalidateCatalog({ categorySlugs: [updated.slug, "all"] });
      setMessage(`Saved “${updated.name}” — catalog cache revalidated.`);
    } catch (e) {
      setMessage(
        e instanceof AdminCategoriesApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Save failed",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading categories…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">{error}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        These covers power <strong>Shop by mood</strong>, category Filters
        “Collections”, and the mood rail. Empty image = brand gradient (no
        demo stock photos).
      </p>

      {message ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.startsWith("Saved") || message.includes("uploaded")
              ? "border-brand/25 bg-brand-soft/40"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
          role="status"
        >
          {message}
        </p>
      ) : null}

      {cats.map((c) => {
        const d = drafts[c.id] ?? c;
        return (
          <article
            key={c.id}
            className="rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {c.slug}
                  {c.isVirtual ? " · virtual" : ""}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
                  {d.name || c.name}
                </h2>
              </div>
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-brand-soft ring-1 ring-border/60">
                {d.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    no image
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Name</span>
                <input
                  className={inputClass}
                  value={d.name ?? ""}
                  onChange={(e) => patchDraft(c.id, { name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Tagline</span>
                <input
                  className={inputClass}
                  value={d.tagline ?? ""}
                  onChange={(e) => patchDraft(c.id, { tagline: e.target.value })}
                />
              </label>
              <AdminImageField
                className="sm:col-span-2"
                label="Cover image"
                value={d.imageUrl ?? ""}
                onChange={(url) => {
                  patchDraft(c.id, { imageUrl: url });
                  setMessage(
                    "Image set — click Save category to apply on the storefront.",
                  );
                }}
                googleIdToken={googleIdToken}
                aspect="square"
                help="Upload & frame to square (mood thumbs + filters). Empty = brand gradient."
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => void onSave(c.id)}
                disabled={savingId === c.id}
              >
                {savingId === c.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save category"
                )}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
