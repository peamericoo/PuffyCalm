"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import {
  AdminContentApiError,
  fetchAdminHomeContent,
  saveAdminHomeContent,
} from "@/lib/api/admin-content";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import { revalidateHome } from "@/lib/admin/revalidate-home";
import { AdminImageField } from "@/components/admin/admin-image-field";
import { AdminLivePreview } from "@/components/admin/admin-live-preview";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";
import { Button } from "@/components/ui/button";
import type {
  HeroSlide,
  HomeContent,
  LifestyleTile,
  PromoSettings,
} from "@/types/content";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

const textareaClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

const DEFAULT_PROMO_SETTINGS: PromoSettings = {
  speedSeconds: 32,
  color: "#3a7ca5",
};

function cleanPromoSpeed(value: number): number {
  return Number.isFinite(value)
    ? Math.min(120, Math.max(8, Math.round(value)))
    : DEFAULT_PROMO_SETTINGS.speedSeconds;
}

function cleanPromoColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : DEFAULT_PROMO_SETTINGS.color;
}

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
  const [promoSpeed, setPromoSpeed] = useState(
    DEFAULT_PROMO_SETTINGS.speedSeconds,
  );
  const [promoColor, setPromoColor] = useState(DEFAULT_PROMO_SETTINGS.color);
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
      setPromoSpeed(cleanPromoSpeed(data.promoSettings.speedSeconds));
      setPromoColor(cleanPromoColor(data.promoSettings.color));
      setSlides(data.heroSlides.map((s) => ({ ...s })));
      setLifestyle(data.lifestyleCollections.map((t) => ({ ...t })));
      setUpdatedAt(data.updatedAt ?? null);
    } catch (e) {
      const msg =
        e instanceof AdminContentApiError
          ? e.message
          : e instanceof Error
            ? e.message
        : "Falha ao carregar conteudo.";
      setError(msg);
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
      setMessage("Maximo de 8 slides no hero.");
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
    const promoSettings = {
      speedSeconds: cleanPromoSpeed(promoSpeed),
      color: cleanPromoColor(promoColor),
    };

    // Empty promo/hero/lifestyle is allowed. Present items must be complete.
    for (const s of slides) {
      if (!s.titleLine1.trim() || !s.titleLine2.trim()) {
        setMessage("Cada slide precisa das duas linhas de titulo.");
        return;
      }
      if (!s.imageUrl.trim()) {
        setMessage("Cada slide precisa de uma imagem.");
        return;
      }
    }
    for (const t of lifestyle) {
      if (!t.title.trim() || !t.href.trim() || !t.imageUrl.trim()) {
        setMessage("Cada bloco de colecao precisa de titulo, link e imagem.");
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const saved = await saveAdminHomeContent({
        promoMessages,
        promoSettings,
        heroSlides: slides.map((s) => ({
          ...s,
          titleAccent: s.titleAccent?.trim() || undefined,
          secondaryLabel: s.secondaryLabel?.trim() || undefined,
          secondaryHref: s.secondaryHref?.trim() || undefined,
        })),
        lifestyleCollections: lifestyle.map((t) => ({ ...t })),
      });
      setPromoText(saved.promoMessages.join("\n"));
      setPromoSpeed(cleanPromoSpeed(saved.promoSettings.speedSeconds));
      setPromoColor(cleanPromoColor(saved.promoSettings.color));
      setSlides(saved.heroSlides.map((s) => ({ ...s })));
      setLifestyle(saved.lifestyleCollections.map((t) => ({ ...t })));
      setUpdatedAt(saved.updatedAt ?? null);

      const rev = await revalidateHome();
      if (!rev.ok) {
        setMessage(
          `Salvo. A revalidacao falhou: ${rev.error ?? "erro desconhecido"}. A loja atualiza em ate 60s.`,
        );
      } else {
        setMessage("Conteudo da home salvo e loja revalidada.");
      }
    } catch (e) {
      const msg =
        e instanceof AdminContentApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha ao salvar.";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando conteudo da home...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">{error}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void load()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const previewSlides = slides.filter(
    (s) => s.imageUrl.trim() && s.titleLine1.trim() && s.titleLine2.trim(),
  );
  const previewLifestyle = lifestyle.filter(
    (t) => t.imageUrl.trim() && t.title.trim() && t.href.trim(),
  );
  const previewPromos = promoText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const promoPreviewStyle = {
    "--promo-base": cleanPromoColor(promoColor),
    "--promo-speed": `${cleanPromoSpeed(promoSpeed)}s`,
  } as CSSProperties;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Edite a barra promocional, o hero e as colecoes da home.
          {updatedAt ? (
            <>
              {" "}
              Ultimo salvamento:{" "}
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
              Salvando...
            </>
          ) : (
            "Salvar e atualizar loja"
          )}
        </Button>
      </div>

      {message ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.startsWith("Conteudo da home salvo") ||
              message.startsWith("Salvo.")
              ? "border-brand/25 bg-brand-soft/40 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="grid w-full min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] xl:items-start">
      <div className="min-w-0 max-w-full space-y-8">

      <section className="rounded-lg border border-border/70 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Barra promocional
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uma mensagem por linha. Aparece no topo da loja.
        </p>
        <Field label="Mensagens" className="mt-4">
          <textarea
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)}
            rows={8}
            className={cn(textareaClass, "font-mono text-[13px]")}
            placeholder={"Oferta de lancamento\nFrete gratis acima de $75"}
          />
        </Field>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="Cor base do degrade">
            <div className="flex h-10 items-center gap-3 rounded-xl border border-border bg-white px-3 shadow-sm">
              <input
                type="color"
                value={cleanPromoColor(promoColor)}
                onChange={(e) => setPromoColor(cleanPromoColor(e.target.value))}
                className="h-6 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Cor base do degrade da barra promocional"
              />
              <input
                value={promoColor}
                onChange={(e) => setPromoColor(e.target.value)}
                onBlur={(e) => setPromoColor(cleanPromoColor(e.target.value))}
                className="min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none"
                placeholder="#3a7ca5"
              />
            </div>
          </Field>
          <Field label={`Velocidade (${cleanPromoSpeed(promoSpeed)}s)`}>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 shadow-sm">
              <input
                type="range"
                min={8}
                max={120}
                step={1}
                value={cleanPromoSpeed(promoSpeed)}
                onChange={(e) => setPromoSpeed(Number(e.target.value))}
                className="min-w-0 flex-1 accent-brand"
                aria-label="Velocidade da barra promocional"
              />
              <input
                type="number"
                min={8}
                max={120}
                step={1}
                value={cleanPromoSpeed(promoSpeed)}
                onChange={(e) => setPromoSpeed(Number(e.target.value))}
                onBlur={(e) => setPromoSpeed(cleanPromoSpeed(Number(e.target.value)))}
                className="w-14 bg-transparent text-right text-sm font-semibold outline-none"
                aria-label="Segundos por volta"
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Slides do hero
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Carrossel principal da home. Maximo de 8 slides.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSlide}>
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar slide
          </Button>
        </div>

        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="rounded-lg border border-border/70 bg-white p-5 shadow-sm sm:p-6"
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
                  aria-label="Mover para cima"
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
                  aria-label="Mover para baixo"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeSlide(index)}
                  aria-label="Remover slide"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Titulo linha 1">
                <input
                  className={inputClass}
                  value={slide.titleLine1}
                  onChange={(e) =>
                    updateSlide(index, { titleLine1: e.target.value })
                  }
                />
              </Field>
              <Field label="Titulo linha 2">
                <input
                  className={inputClass}
                  value={slide.titleLine2}
                  onChange={(e) =>
                    updateSlide(index, { titleLine2: e.target.value })
                  }
                />
              </Field>
              <Field label="Destaque na linha 2 (opcional)">
                <input
                  className={inputClass}
                  value={slide.titleAccent ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { titleAccent: e.target.value })
                  }
                  placeholder="palavra destacada"
                />
              </Field>
              <Field label="Texto alternativo">
                <input
                  className={inputClass}
                  value={slide.imageAlt}
                  onChange={(e) =>
                    updateSlide(index, { imageAlt: e.target.value })
                  }
                />
              </Field>
              <Field label="Subtitulo" className="sm:col-span-2">
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
                label="Imagem do hero"
                value={slide.imageUrl}
                onChange={(url) => updateSlide(index, { imageUrl: url })}
                googleIdToken={googleIdToken}
                aspect="hero"
                help="Envie uma imagem ampla para o hero ou cole uma URL."
              />
              <Field label="Texto do botao principal">
                <input
                  className={inputClass}
                  value={slide.ctaLabel}
                  onChange={(e) =>
                    updateSlide(index, { ctaLabel: e.target.value })
                  }
                />
              </Field>
              <Field label="Link do botao principal">
                <input
                  className={cn(inputClass, "font-mono text-[13px]")}
                  value={slide.ctaHref}
                  onChange={(e) =>
                    updateSlide(index, { ctaHref: e.target.value })
                  }
                />
              </Field>
              <Field label="Texto do botao secundario (opcional)">
                <input
                  className={inputClass}
                  value={slide.secondaryLabel ?? ""}
                  onChange={(e) =>
                    updateSlide(index, { secondaryLabel: e.target.value })
                  }
                />
              </Field>
              <Field label="Link do botao secundario (opcional)">
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
              Colecoes da home
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mosaico visual abaixo do hero. Vazio = secao escondida.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (lifestyle.length >= 8) {
                setMessage("Maximo de 8 colecoes.");
                return;
              }
              setLifestyle((prev) => [...prev, emptyLife(prev.length + 1)]);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar bloco
          </Button>
        </div>

        {lifestyle.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-border/80 bg-white/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma colecao cadastrada. A loja esconde esta secao enquanto estiver vazia.
          </p>
        ) : null}

        {lifestyle.map((tile, index) => (
          <div
            key={tile.id}
            className="rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <p className="text-sm font-semibold">Bloco {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() =>
                  setLifestyle((prev) => prev.filter((_, i) => i !== index))
                }
                aria-label="Remover bloco"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Titulo">
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
              <Field label="Link">
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
                label="Imagem do bloco"
                value={tile.imageUrl}
                onChange={(url) =>
                  setLifestyle((prev) =>
                    prev.map((t, i) =>
                      i === index ? { ...t, imageUrl: url } : t,
                    ),
                  )
                }
                googleIdToken={googleIdToken}
                aspect="square"
              />
              <Field label="Formato">
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
                  <option value="tall">Alto</option>
                  <option value="wide">Largo</option>
                  <option value="square">Quadrado</option>
                </select>
              </Field>
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-end pb-4">
        <Button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Salvando..." : "Salvar e atualizar loja"}
        </Button>
      </div>
      </div>

      {/* Previews */}
      <div className="min-w-0 max-w-full space-y-4 lg:sticky lg:top-24 lg:self-start">
        <AdminLivePreview
          title="Barra promocional"
          description="Mesmo componente exibido no topo da loja."
        >
          {previewPromos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda.</p>
          ) : (
            <div
              className="promo-bar relative h-9 overflow-hidden rounded-lg text-white"
              style={promoPreviewStyle}
            >
              <div className="animate-marquee flex h-full w-max items-center gap-8 whitespace-nowrap px-3 text-[11px] font-medium">
                {[...previewPromos, ...previewPromos].map((t, i) => (
                  <span key={`${t}-${i}`} className="inline-flex items-center gap-8">
                    {t}
                    <span className="h-1 w-1 rounded-full bg-white/50" aria-hidden />
                  </span>
                ))}
              </div>
            </div>
          )}
        </AdminLivePreview>

        <AdminLivePreview
          title="Hero"
          description="Preview do componente principal da home."
        >
          {previewSlides.length === 0 ? (
            <p className="rounded-xl bg-white/80 px-3 py-8 text-center text-xs text-muted-foreground">
              Adicione um slide completo para visualizar.
            </p>
          ) : (
            <div className="max-h-[420px] overflow-auto overflow-x-hidden rounded-xl bg-white shadow-sm ring-1 ring-border/50 [&_section]:pb-0 [&_h1]:text-2xl! sm:[&_h1]:text-3xl!">
              <HeroCarousel slides={previewSlides} />
            </div>
          )}
        </AdminLivePreview>

        <AdminLivePreview
          title="Colecoes"
          description="Bloco visual da home. Fica oculto quando esta vazio."
        >
          {previewLifestyle.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum bloco ainda.</p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-border/50">
              <LifestyleCollections tiles={previewLifestyle} />
            </div>
          )}
        </AdminLivePreview>
      </div>
      </div>
    </div>
  );
}
