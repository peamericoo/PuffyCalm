"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminImageField } from "@/components/admin/admin-image-field";
import { Button } from "@/components/ui/button";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminCategoriesApiError,
  fetchAdminCategories,
  updateAdminCategory,
  type AdminCategory,
} from "@/lib/api/admin-categories";
import { revalidateCatalog } from "@/lib/admin/revalidate-catalog";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
};

const inputClass =
  "h-10 w-full rounded-md border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

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
      for (const category of list) {
        d[category.id] = {
          name: category.name,
          tagline: category.tagline,
          description: category.description,
          imageUrl: category.imageUrl,
          ctaLabel: category.ctaLabel,
        };
      }
      setDrafts(d);
    } catch (e) {
      setError(
        e instanceof AdminCategoriesApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao carregar categorias.",
      );
    } finally {
      setLoading(false);
    }
  }, [googleIdToken]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const patchDraft = (id: string, patch: Partial<AdminCategory>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const onSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setMessage(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const updated = await updateAdminCategory(id, {
        name: draft.name,
        tagline: draft.tagline,
        description: draft.description,
        imageUrl: draft.imageUrl ?? "",
        ctaLabel: draft.ctaLabel,
      });
      setCats((prev) => prev.map((category) => (category.id === id ? updated : category)));
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
      setMessage(`Categoria "${updated.name}" salva e loja revalidada.`);
    } catch (e) {
      setMessage(
        e instanceof AdminCategoriesApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao salvar categoria.",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-white py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando categorias...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void load()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {message ? (
        <p
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            message.includes("salva")
              ? "border-brand/25 bg-brand-soft/40"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {cats.map((category) => {
          const draft = drafts[category.id] ?? category;
          return (
            <article
              key={category.id}
              className="rounded-lg border border-border/70 bg-white p-5 shadow-sm"
            >
              <div className="grid gap-5 md:grid-cols-[9rem_minmax(0,1fr)]">
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-soft ring-1 ring-border/60">
                    {draft.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={draft.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Sem imagem
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                    {category.slug}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Nome</span>
                    <input
                      className={inputClass}
                      value={draft.name ?? ""}
                      onChange={(event) =>
                        patchDraft(category.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Chamada curta</span>
                    <input
                      className={inputClass}
                      value={draft.tagline ?? ""}
                      onChange={(event) =>
                        patchDraft(category.id, { tagline: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Descricao</span>
                    <textarea
                      className="min-h-[84px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                      value={draft.description ?? ""}
                      onChange={(event) =>
                        patchDraft(category.id, {
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                  <AdminImageField
                    label="Imagem da categoria"
                    value={draft.imageUrl ?? ""}
                    onChange={(url) => {
                      patchDraft(category.id, { imageUrl: url });
                      setMessage("Imagem pronta. Salve a categoria para publicar.");
                    }}
                    googleIdToken={googleIdToken}
                    aspect="square"
                    help="Envie uma imagem quadrada ou cole uma URL. Vazio usa o fundo padrao da marca."
                    showFramePreview={false}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  onClick={() => void onSave(category.id)}
                  disabled={savingId === category.id}
                >
                  {savingId === category.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar categoria"
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
