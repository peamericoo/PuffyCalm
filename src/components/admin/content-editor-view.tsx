"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import {
  AdminContentApiError,
  fetchAdminHomeContent,
  saveAdminHomeContent,
} from "@/lib/api/admin-content";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import { revalidateHome } from "@/lib/admin/revalidate-home";
import { AdminImageField } from "@/components/admin/admin-image-field";
import { Button } from "@/components/ui/button";
import type { HeroSlide, HomeContent, LifestyleTile } from "@/types/content";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

const textareaClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function emptySlide(index: number): HeroSlide {
  return {
    id: `slide_${Date.now().toString(36)}_${index}`,
    titleLine1: "",
    titleLine2: "",
    titleAccent: "",
    subtitle: "",
    ctaLabel: "Shop now",
    ctaHref: "/category/all",
    secondaryLabel: "Browse all",
    secondaryHref: "/category/all",
    imageUrl: "",
    imageAlt: "",
  };
}

function emptyLife(index: number): LifestyleTile {
  return {
    id: `life_${Date.now().toString(36)}_${index}`,
    title: "",
    href: "/category/all",
    imageUrl: "",
    span: index === 0 ? "tall" : index === 1 ? "wide" : "square",
  };
}

export function ContentEditorView({ googleIdToken }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [promoText, setPromoText] = useState("");
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [lifestyle, setLifestyle] = useState<LifestyleTile[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const data: HomeContent = await fetchAdminHomeContent();
      setPromoText(data.promoMessages.join("\n"));
      setSlides(data.heroSlides.map((s) => ({ ...s })));
      setLifestyle(data.lifestyleCollections.map((t) => ({ ...t })));
      setUpdatedAt(data.updatedAt ?? null);
    } catch (e) {
      const msg =
        e instanceof AdminContentApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load content";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [googleIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    setSlides((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const addSlide = () => {
    if (slides.length >= 8) {
      setMessage("Maximum 8 hero slides.");
      return;
    }
    setMessage(null);
    setSlides((prev) => [...prev, emptySlide(prev.length + 1)]);
  };

  const onSave = async () => {
    const promoMessages = promoText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Empty promo/hero/lifestyle is allowed. Present items must be complete.
    for (const s of slides) {
      if (!s.titleLine1.trim() || !s.titleLine2.trim()) {
        setMessage("Each slide needs title lines.");
        return;
      }
      if (!s.imageUrl.trim()) {
        setMessage("Each slide needs an image URL (upload via Media, paste /media/… or https).");
        return;
      }
    }
    for (const t of lifestyle) {
      if (!t.title.trim() || !t.href.trim() || !t.imageUrl.trim()) {
        setMessage("Each lifestyle tile needs title, link, and image URL.");
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const saved = await saveAdminHomeContent({
        promoMessages,
        heroSlides: slides.map((s) => ({
          ...s,
          titleAccent: s.titleAccent?.trim() || undefined,
          secondaryLabel: s.secondaryLabel?.trim() || undefined,
          secondaryHref: s.secondaryHref?.trim() || undefined,
        })),
        lifestyleCollections: lifestyle.map((t) => ({ ...t })),
      });
      setPromoText(saved.promoMessages.join("\n"));
      setSlides(saved.heroSlides.map((s) => ({ ...s })));
      setLifestyle(saved.lifestyleCollections.map((t) => ({ ...t })));
      setUpdatedAt(saved.updatedAt ?? null);

      const rev = await revalidateHome();
      if (!rev.ok) {
        setMessage(
          `Saved. Cache revalidate skipped: ${rev.error ?? "unknown"} (ISR ≤60s fallback).`,
        );
      } else {
        setMessage("Home content saved — storefront revalidated.");
      }
    } catch (e) {
      const msg =
        e instanceof AdminContentApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Save failed";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading home content…
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Promo (all pages), home hero, and lifestyle tiles. Leave empty for a
          clean storefront — fill when ready to launch.
          {updatedAt ? (
            <>
              {" "}
              Last saved:{" "}
              <time dateTime={updatedAt}>
                {new Date(updatedAt).toLocaleString()}
              </time>
            </>
          ) : null}
        </p>
        <Button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save & revalidate home"
          )}
        </Button>
      </div>

      {message ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.startsWith("Home content saved") ||
              message.startsWith("Saved.")
              ? "border-brand/25 bg-brand-soft/40 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <section className="rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Promo ticker
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One message per line. Loops in the top bar site-wide. Max 20 lines, 200
          chars each.
        </p>
        <Field label="Messages" className="mt-4">
          <textarea
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)}
            rows={8}
            className={cn(textareaClass, "font-mono text-[13px]")}
            placeholder={"🎉 Launch offer…\n🚚 Free shipping $75+"}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Hero slides
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Homepage carousel only. Upload images or paste URLs. Max 8 slides.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSlide}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add slide
          </Button>
        </div>

        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <p className="text-sm font-semibold">
                Slide {index + 1}
                <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                  {slide.id}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => moveSlide(index, -1)}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === slides.length - 1}
                  onClick={() => moveSlide(index, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeSlide(index)}
                  aria-label="Remove slide"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Title line 1">
                <input
                  className={inputClass}
                  value={slide.titleLine1}
                  onChange={(e) =>
                    updateSlide(index, { titleLine1: e.target.value })
                  }
                />
              </Field>
              <Field label="Title line 2">
                <input
                  className={inputClass}
                  value={slide.titleLine2}
                  onChange={(e) =>
                    updateSlide(index, { titleLine2: e.target.value })
                  }
                />
              </Field>
              <Field label="Accent on line 2 (optional)">
                <input
                  className={inputClass}
                  value={slide.titleAccent ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { titleAccent: e.target.value })
                  }
                  placeholder="word at end of line 2"
                />
              </Field>
              <Field label="Image alt">
                <input
                  className={inputClass}
                  value={slide.imageAlt}
                  onChange={(e) =>
                    updateSlide(index, { imageAlt: e.target.value })
                  }
                />
              </Field>
              <Field label="Subtitle" className="sm:col-span-2">
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={slide.subtitle}
                  onChange={(e) =>
                    updateSlide(index, { subtitle: e.target.value })
                  }
                />
              </Field>
              <AdminImageField
                className="sm:col-span-2"
                label="Hero image"
                value={slide.imageUrl}
                onChange={(url) => updateSlide(index, { imageUrl: url })}
                googleIdToken={googleIdToken}
                help="Upload a photo or paste a URL. Saved as public /media/… on the API."
              />
              <Field label="CTA label">
                <input
                  className={inputClass}
                  value={slide.ctaLabel}
                  onChange={(e) =>
                    updateSlide(index, { ctaLabel: e.target.value })
                  }
                />
              </Field>
              <Field label="CTA href">
                <input
                  className={cn(inputClass, "font-mono text-[13px]")}
                  value={slide.ctaHref}
                  onChange={(e) =>
                    updateSlide(index, { ctaHref: e.target.value })
                  }
                />
              </Field>
              <Field label="Secondary label (optional)">
                <input
                  className={inputClass}
                  value={slide.secondaryLabel ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { secondaryLabel: e.target.value })
                  }
                />
              </Field>
              <Field label="Secondary href (optional)">
                <input
                  className={cn(inputClass, "font-mono text-[13px]")}
                  value={slide.secondaryHref ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { secondaryHref: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Lifestyle tiles
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Home “Made for real days” mosaic. Empty = section hidden. Max 8.
              Upload images directly or paste a URL.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (lifestyle.length >= 8) {
                setMessage("Maximum 8 lifestyle tiles.");
                return;
              }
              setLifestyle((prev) => [...prev, emptyLife(prev.length + 1)]);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add tile
          </Button>
        </div>

        {lifestyle.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-border/80 bg-white/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No lifestyle tiles — storefront hides this block until you add some.
          </p>
        ) : null}

        {lifestyle.map((tile, index) => (
          <div
            key={tile.id}
            className="rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <p className="text-sm font-semibold">Tile {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() =>
                  setLifestyle((prev) => prev.filter((_, i) => i !== index))
                }
                aria-label="Remove tile"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={tile.title}
                  onChange={(e) =>
                    setLifestyle((prev) =>
                      prev.map((t, i) =>
                        i === index ? { ...t, title: e.target.value } : t,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Link href">
                <input
                  className={cn(inputClass, "font-mono text-[13px]")}
                  value={tile.href}
                  onChange={(e) =>
                    setLifestyle((prev) =>
                      prev.map((t, i) =>
                        i === index ? { ...t, href: e.target.value } : t,
                      ),
                    )
                  }
                  placeholder="/category/recovery"
                />
              </Field>
              <AdminImageField
                className="sm:col-span-2"
                label="Tile image"
                value={tile.imageUrl}
                onChange={(url) =>
                  setLifestyle((prev) =>
                    prev.map((t, i) =>
                      i === index ? { ...t, imageUrl: url } : t,
                    ),
                  )
                }
                googleIdToken={googleIdToken}
              />
              <Field label="Layout span">
                <select
                  className={inputClass}
                  value={tile.span}
                  onChange={(e) =>
                    setLifestyle((prev) =>
                      prev.map((t, i) =>
                        i === index
                          ? {
                              ...t,
                              span: e.target.value as LifestyleTile["span"],
                            }
                          : t,
                      ),
                    )
                  }
                >
                  <option value="tall">tall</option>
                  <option value="wide">wide</option>
                  <option value="square">square</option>
                </select>
              </Field>
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-end pb-8">
        <Button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save & revalidate home"}
        </Button>
      </div>
    </div>
  );
}
