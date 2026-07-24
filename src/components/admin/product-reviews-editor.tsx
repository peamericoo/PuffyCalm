"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminReviewsApiError,
  createAdminProductReview,
  deleteAdminReview,
  fetchAdminProductReviews,
  type AdminReview,
} from "@/lib/api/admin-reviews";
import { revalidateCatalog } from "@/lib/admin/revalidate-catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productSlug?: string;
  googleIdToken?: string | null;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

/**
 * Manage PDP reviews for a product (replaces seed demo reviews).
 */
export function ProductReviewsEditor({
  productId,
  productSlug,
  googleIdToken,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const list = await fetchAdminProductReviews(productId);
      setReviews(list);
    } catch (e) {
      setError(
        e instanceof AdminReviewsApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao carregar avaliacoes.",
      );
    } finally {
      setLoading(false);
    }
  }, [googleIdToken, productId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const onAdd = async () => {
    if (!author.trim() || !body.trim()) {
      setMessage("Autor e comentario sao obrigatorios.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      await createAdminProductReview(productId, {
        author: author.trim(),
        title: title.trim(),
        body: body.trim(),
        rating,
        verified: true,
      });
      setAuthor("");
      setTitle("");
      setBody("");
      setRating(5);
      await load();
      if (productSlug) {
        await revalidateCatalog({ productSlugs: [productSlug] });
      }
      setMessage("Avaliacao adicionada. A nota do produto foi atualizada.");
    } catch (e) {
      setMessage(
        e instanceof AdminReviewsApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao criar avaliacao.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setMessage(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      await deleteAdminReview(id);
      await load();
      if (productSlug) {
        await revalidateCatalog({ productSlugs: [productSlug] });
      }
      setMessage("Avaliacao removida.");
    } catch (e) {
      setMessage(
        e instanceof AdminReviewsApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao remover avaliacao.",
      );
    }
  };

  return (
    <section className="mt-10 rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Avaliacoes
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Adicione avaliacoes reais ou editoriais para alimentar a nota e a lista da pagina do produto.
      </p>

      {message ? (
        <p
          className={cn(
            "mt-3 rounded-xl border px-3 py-2 text-sm",
            message.includes("Falha") || message.includes("obrigatorios")
              ? "border-destructive/30 text-destructive"
              : "border-brand/25 bg-brand-soft/40",
          )}
        >
          {message}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nenhuma avaliacao ainda.</li>
          ) : (
            reviews.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {r.author}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {r.rating}/5
                    </span>
                  </p>
                  {r.title ? (
                    <p className="text-sm text-foreground">{r.title}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {r.body}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() => void onDelete(r.id)}
                  aria-label="Remover avaliacao"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="mt-6 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Autor</span>
          <input
            className={inputClass}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Nome do cliente"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nota</span>
          <select
            className={inputClass}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} estrela{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Titulo (opcional)</span>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Comentario</span>
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={() => void onAdd()} disabled={saving}>
          {saving ? "Adicionando..." : "Adicionar avaliacao"}
        </Button>
      </div>
    </section>
  );
}
