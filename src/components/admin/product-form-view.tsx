"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminProductsApiError,
  createAdminProduct,
  getAdminProduct,
  publishAdminProduct,
  unpublishAdminProduct,
  updateAdminProduct,
  type AdminProductDetail,
  type AdminProductStatus,
} from "@/lib/api/admin-products";
import {
  AdminMediaApiError,
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  uploadAdminMedia,
} from "@/lib/api/admin-media";
import { revalidateCatalog } from "@/lib/admin/revalidate-catalog";
import { ProductStatusBadge } from "@/components/admin/product-status-badge";
import { Button } from "@/components/ui/button";
import { ProductReviewsEditor } from "@/components/admin/product-reviews-editor";
import { fetchCategories } from "@/lib/api/catalog";
import type { Category } from "@/types/product";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
  /** Omit for create mode. */
  productId?: string;
};

type FormState = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  imageUrl: string;
  imageAlt: string;
  /** One URL per line — order = gallery order */
  imagesText: string;
  categorySlugs: string[];
  categoryLabel: string;
  badgesText: string;
  featuresText: string;
  /** label|value per line */
  specsText: string;
  inStock: boolean;
  featured: boolean;
  status: AdminProductStatus;
  maxQuantityPerOrder: string;
};

function emptyForm(): FormState {
  return {
    id: "",
    slug: "",
    name: "",
    shortDescription: "",
    description: "",
    price: "49.00",
    compareAtPrice: "",
    imageUrl: "",
    imageAlt: "",
    imagesText: "",
    categorySlugs: [],
    categoryLabel: "",
    badgesText: "",
    featuresText: "",
    specsText: "",
    inStock: true,
    featured: false,
    status: "draft",
    maxQuantityPerOrder: "9",
  };
}

function detailToForm(d: AdminProductDetail): FormState {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    shortDescription: d.shortDescription,
    description: d.description,
    price: String(d.price),
    compareAtPrice: d.compareAtPrice != null ? String(d.compareAtPrice) : "",
    imageUrl: d.imageUrl,
    imageAlt: d.imageAlt,
    imagesText: d.images.map((i) => i.url).join("\n"),
    categorySlugs: d.categorySlugs,
    categoryLabel: d.categoryLabel ?? "",
    badgesText: (d.badges || []).join(", "),
    featuresText: (d.features || []).join("\n"),
    specsText: (d.specs || [])
      .map((s) => `${s.label}|${s.value}`)
      .join("\n"),
    inStock: d.inStock,
    featured: d.featured,
    status: (d.status as AdminProductStatus) || "draft",
    maxQuantityPerOrder: String(d.maxQuantityPerOrder ?? 9),
  };
}

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseCommaList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSpecs(text: string): { label: string; value: string }[] {
  return parseLines(text)
    .map((line) => {
      const pipe = line.indexOf("|");
      if (pipe === -1) {
        const colon = line.indexOf(":");
        if (colon === -1) return { label: "Detail", value: line };
        return {
          label: line.slice(0, colon).trim(),
          value: line.slice(colon + 1).trim(),
        };
      }
      return {
        label: line.slice(0, pipe).trim(),
        value: line.slice(pipe + 1).trim(),
      };
    })
    .filter((s) => s.label && s.value);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ProductFormView({ googleIdToken, productId }: Props) {
  const router = useRouter();
  const isCreate = !productId;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setAuthError(null);
    setLoading(true);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      // Categories for M2M checkboxes (public catalog endpoint is fine)
      try {
        const cats = await fetchCategories();
        setCategories(cats.filter((c) => c.slug !== "all"));
      } catch {
        setCategories([]);
      }
      if (productId) {
        const detail = await getAdminProduct(productId);
        setForm(detailToForm(detail));
        setLoadedSlug(detail.slug);
      }
    } catch (e) {
      const err = e as Error & { status?: number };
      const http =
        err.status ??
        (e instanceof AdminProductsApiError ? e.status : undefined);
      if (http === 401 || http === 403) {
        setAuthError(err.message || "Backend admin session missing.");
      } else {
        setLoadError(err.message || "Failed to load product");
      }
    } finally {
      setLoading(false);
    }
  }, [googleIdToken, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (slug: string) => {
    setForm((prev) => {
      const has = prev.categorySlugs.includes(slug);
      return {
        ...prev,
        categorySlugs: has
          ? prev.categorySlugs.filter((s) => s !== slug)
          : [...prev.categorySlugs, slug],
      };
    });
  };

  const payloadFromForm = useMemo(() => {
    return () => {
      const price = Number(form.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Price must be a positive number");
      }
      const compareRaw = form.compareAtPrice.trim();
      const compareAtPrice =
        compareRaw === "" ? null : Number(compareRaw);
      if (
        compareRaw !== "" &&
        (!Number.isFinite(compareAtPrice) || (compareAtPrice as number) <= 0)
      ) {
        throw new Error("Compare-at price must be positive or empty");
      }
      const images = parseLines(form.imagesText).map((url) => ({ url }));
      const imageUrl =
        form.imageUrl.trim() || (images[0]?.url ?? "");
      return {
        slug: form.slug.trim().toLowerCase(),
        name: form.name.trim(),
        shortDescription: form.shortDescription,
        description: form.description,
        price,
        compareAtPrice,
        imageUrl,
        imageAlt: form.imageAlt || form.name.trim(),
        images,
        categorySlugs: form.categorySlugs,
        categoryLabel: form.categoryLabel.trim() || null,
        badges: parseCommaList(form.badgesText),
        features: parseLines(form.featuresText),
        specs: parseSpecs(form.specsText),
        inStock: form.inStock,
        featured: form.featured,
        maxQuantityPerOrder: Math.max(
          1,
          Math.min(99, Number(form.maxQuantityPerOrder) || 9),
        ),
      };
    };
  }, [form]);

  const afterMutate = async (
    product: AdminProductDetail,
    prevSlug?: string | null,
  ) => {
    const slugs = [product.slug];
    if (prevSlug && prevSlug !== product.slug) slugs.push(prevSlug);
    const rev = await revalidateCatalog({
      productSlugs: slugs,
      categorySlugs: product.categorySlugs,
    });
    if (!rev.ok) {
      setMessage(
        (m) =>
          `${m ?? "Saved."} Cache revalidate skipped: ${rev.error ?? "unknown"} (ISR ≤60s fallback).`,
      );
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const body = payloadFromForm();
      if (!body.slug || !body.name) {
        throw new Error("Name and slug are required");
      }
      if (isCreate) {
        const createBody = {
          ...body,
          status: form.status,
          ...(form.id.trim() ? { id: form.id.trim() } : {}),
        };
        const created = await createAdminProduct(createBody);
        await afterMutate(created);
        setMessage("Product created.");
        router.push(`/admin/products/${created.id}`);
        router.refresh();
        return;
      }
      const prev = loadedSlug;
      const updated = await updateAdminProduct(productId!, body);
      setForm(detailToForm(updated));
      setLoadedSlug(updated.slug);
      await afterMutate(updated, prev);
      setMessage("Product saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    if (!productId) return;
    setError(null);
    setMessage(null);
    setLifecycleBusy(true);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      // Save current form first so published content matches UI
      const body = payloadFromForm();
      await updateAdminProduct(productId, body);
      const published = await publishAdminProduct(productId);
      setForm(detailToForm(published));
      setLoadedSlug(published.slug);
      await afterMutate(published);
      setMessage("Published — product is visible on the storefront.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setLifecycleBusy(false);
    }
  };

  const onUnpublish = async () => {
    if (!productId) return;
    setError(null);
    setMessage(null);
    setLifecycleBusy(true);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const unpublished = await unpublishAdminProduct(productId);
      setForm(detailToForm(unpublished));
      await afterMutate(unpublished);
      setMessage("Unpublished — removed from public catalog.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unpublish failed");
    } finally {
      setLifecycleBusy(false);
    }
  };

  const onUploadFiles = async (
    fileList: FileList | null,
    opts: { setCover: boolean },
  ) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const files = Array.from(fileList);
      const urls: string[] = [];
      let coverUrl: string | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        if (file.size > MEDIA_MAX_BYTES) {
          throw new Error(
            `${file.name} exceeds ${MEDIA_MAX_BYTES / (1024 * 1024)} MiB limit`,
          );
        }
        const wantCover = opts.setCover && i === 0;
        const uploaded = await uploadAdminMedia({
          file,
          productId: productId || undefined,
          setCover: wantCover && Boolean(productId),
        });
        urls.push(uploaded.url);
        if (wantCover) coverUrl = uploaded.url;
      }

      setForm((prev) => {
        const existing = parseLines(prev.imagesText);
        const merged = [...existing, ...urls];
        const nextCover =
          coverUrl ||
          (opts.setCover ? urls[0] : null) ||
          prev.imageUrl ||
          merged[0] ||
          "";
        return {
          ...prev,
          imagesText: merged.join("\n"),
          imageUrl: nextCover,
        };
      });

      // If product already exists, gallery was appended server-side; revalidate storefront
      if (productId) {
        const detail = await getAdminProduct(productId);
        setForm(detailToForm(detail));
        await afterMutate(detail);
        setMessage(
          urls.length === 1
            ? "Image uploaded and linked to product."
            : `${urls.length} images uploaded and linked.`,
        );
      } else {
        setMessage(
          urls.length === 1
            ? "Image uploaded — save product to persist gallery."
            : `${urls.length} images uploaded — save product to persist gallery.`,
        );
      }
    } catch (err) {
      const msg =
        err instanceof AdminMediaApiError || err instanceof Error
          ? err.message
          : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-[1.35rem] border border-border/70 bg-white p-8 text-center text-sm text-muted-foreground shadow-sm"
        role="status"
      >
        Loading…
      </div>
    );
  }

  if (authError) {
    return (
      <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-6 text-sm shadow-sm">
        <p className="font-medium text-amber-950">Auth required</p>
        <p className="mt-1 text-amber-900/80">{authError}</p>
        <Link
          href="/admin"
          className="mt-3 inline-block text-sm font-medium text-brand-deep hover:underline"
        >
          Open admin bridge
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-[1.35rem] border border-red-200 bg-red-50/80 p-6 text-sm shadow-sm">
        <p className="font-medium text-red-950">{loadError}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSave(e)} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {!isCreate ? <ProductStatusBadge status={form.status} /> : null}
          {form.id ? (
            <span className="font-mono text-xs text-muted-foreground">
              id: {form.id}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isCreate && form.status !== "published" ? (
            <Button
              type="button"
              size="sm"
              onClick={() => void onPublish()}
              disabled={lifecycleBusy || saving}
            >
              Publish
            </Button>
          ) : null}
          {!isCreate && form.status === "published" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onUnpublish()}
              disabled={lifecycleBusy || saving}
            >
              Unpublish
            </Button>
          ) : null}
          {!isCreate && form.status === "published" ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/product/${form.slug}`} target="_blank">
                View storefront
              </Link>
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={saving || lifecycleBusy}>
            {saving ? "Saving…" : isCreate ? "Create draft" : "Save"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Basics</h2>
          {isCreate ? (
            <Field label="Product id (SKU-like, optional)">
              <input
                value={form.id}
                onChange={(e) => setField("id", e.target.value)}
                placeholder="auto-generated if empty"
                className={inputClass}
              />
            </Field>
          ) : null}
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug:
                    isCreate && (!prev.slug || prev.slug === slugify(prev.name))
                      ? slugify(name)
                      : prev.slug,
                }));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Slug *">
            <input
              required
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value.toLowerCase())}
              className={inputClass}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="lowercase alphanumeric with hyphens"
            />
          </Field>
          <Field label="Short description">
            <textarea
              value={form.shortDescription}
              onChange={(e) => setField("shortDescription", e.target.value)}
              rows={2}
              className={textareaClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={5}
              className={textareaClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD) *">
              <input
                required
                type="number"
                min={0.01}
                step={0.01}
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Compare at">
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={form.compareAtPrice}
                onChange={(e) => setField("compareAtPrice", e.target.value)}
                className={inputClass}
                placeholder="optional"
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setField("inStock", e.target.checked)}
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField("featured", e.target.checked)}
              />
              Featured
            </label>
          </div>
          {isCreate ? (
            <Field label="Initial status">
              <select
                value={form.status}
                onChange={(e) =>
                  setField("status", e.target.value as AdminProductStatus)
                }
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          ) : null}
          <Field label="Max qty per order">
            <input
              type="number"
              min={1}
              max={99}
              value={form.maxQuantityPerOrder}
              onChange={(e) => setField("maxQuantityPerOrder", e.target.value)}
              className={inputClass}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-[1.35rem] border border-border/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Media & taxonomy</h2>
          <p className="text-xs text-muted-foreground">
            Upload JPEG/PNG/WebP/GIF (max 5 MiB). Files go to object storage;
            URLs are stored on the product. First gallery URL becomes cover if
            primary is empty.
          </p>

          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Upload images
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept={MEDIA_ACCEPT}
                  multiple
                  disabled={uploading || saving || lifecycleBusy}
                  className="sr-only"
                  onChange={(e) => {
                    void onUploadFiles(e.target.files, { setCover: false });
                    e.target.value = "";
                  }}
                />
                <span
                  className={cn(
                    "inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-sm font-medium shadow-sm",
                    uploading
                      ? "pointer-events-none opacity-60"
                      : "hover:bg-muted",
                  )}
                >
                  {uploading ? "Uploading…" : "Add to gallery"}
                </span>
              </label>
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept={MEDIA_ACCEPT}
                  disabled={uploading || saving || lifecycleBusy}
                  className="sr-only"
                  onChange={(e) => {
                    void onUploadFiles(e.target.files, { setCover: true });
                    e.target.value = "";
                  }}
                />
                <span
                  className={cn(
                    "inline-flex h-9 items-center rounded-xl border border-brand-deep/30 bg-brand-deep/5 px-3 text-sm font-medium text-brand-deep shadow-sm",
                    uploading
                      ? "pointer-events-none opacity-60"
                      : "hover:bg-brand-deep/10",
                  )}
                >
                  Upload as cover
                </span>
              </label>
            </div>
            {!productId ? (
              <p className="text-xs text-muted-foreground">
                New product: uploads are stored immediately; save the draft to
                attach URLs to the product record.
              </p>
            ) : null}
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary remote URL
              <img
                src={form.imageUrl}
                alt={form.imageAlt || form.name || "Cover preview"}
                className="mt-1 h-28 w-28 rounded-lg border border-border object-cover"
              />
            ) : null}
          </div>

          <Field label="Primary image URL">
            <input
              value={form.imageUrl}
              onChange={(e) => setField("imageUrl", e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </Field>
          <Field label="Image alt">
            <input
              value={form.imageAlt}
              onChange={(e) => setField("imageAlt", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Gallery URLs (one per line, order preserved)">
            <textarea
              value={form.imagesText}
              onChange={(e) => setField("imagesText", e.target.value)}
              rows={4}
              className={textareaClass}
              placeholder={"https://…/1.jpg\nhttps://…/2.jpg"}
            />
          </Field>
          <Field label="Categories">
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  No categories loaded
                </span>
              ) : (
                categories.map((c) => {
                  const on = form.categorySlugs.includes(c.slug);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.slug)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        on
                          ? "border-brand-deep bg-brand-deep text-white"
                          : "border-border bg-white text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })
              )}
            </div>
          </Field>
          <Field label="Category label (display)">
            <input
              value={form.categoryLabel}
              onChange={(e) => setField("categoryLabel", e.target.value)}
              className={inputClass}
              placeholder="e.g. Recovery"
            />
          </Field>
          <Field label="Badges (comma-separated)">
            <input
              value={form.badgesText}
              onChange={(e) => setField("badgesText", e.target.value)}
              className={inputClass}
              placeholder="bestseller, new, sale, limited"
            />
          </Field>
          <Field label="Features (one per line)">
            <textarea
              value={form.featuresText}
              onChange={(e) => setField("featuresText", e.target.value)}
              rows={3}
              className={textareaClass}
            />
          </Field>
          <Field label="Specs (label|value per line)">
            <textarea
              value={form.specsText}
              onChange={(e) => setField("specsText", e.target.value)}
              rows={4}
              className={textareaClass}
              placeholder={"Weight|1.2 kg\nPower|USB-C"}
            />
          </Field>
        </section>
      </div>

      {productId ? (
        <ProductReviewsEditor
          productId={productId}
          productSlug={form.slug || undefined}
          googleIdToken={googleIdToken}
        />
      ) : null}
    </form>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

const textareaClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
