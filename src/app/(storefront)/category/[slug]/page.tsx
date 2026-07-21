import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/category";
import { getCatalogPage, listCatalogSlugs } from "@/lib/catalog/service";
import { siteConfig } from "@/lib/mock/site";

/**
 * Static category shells — no searchParams on the server.
 * Filters/sort live in the URL but are applied client-side only,
 * so changing them never re-runs RSC (keeps the UI fluid).
 *
 * Data: FastAPI catalog (Phase B). ISR revalidate 60s.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await listCatalogSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await getCatalogPage(slug);
    if (!data) {
      return { title: "Collection not found" };
    }
    return {
      title: data.category.name,
      description: data.category.description || data.category.tagline,
      openGraph: {
        title: `${data.category.name} · ${siteConfig.name}`,
        description: data.category.tagline,
        images: data.category.imageUrl
          ? [{ url: data.category.imageUrl }]
          : undefined,
      },
    };
  } catch {
    return { title: "Collection" };
  }
}

function CategoryFallback() {
  return (
    <div className="shop-stage min-h-[70vh] px-[var(--shell-gutter)] pt-6 sm:px-5">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 h-8 w-40 animate-pulse rounded-full bg-white/50" />
        <div className="mb-8 h-12 w-64 animate-pulse rounded-2xl bg-white/55" />
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="hidden h-80 animate-pulse rounded-[1.5rem] bg-white/50 lg:block" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-[1.2rem] bg-white/55"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCatalogPage(slug);
  if (!data) notFound();

  return (
    <Suspense fallback={<CategoryFallback />}>
      <CategoryView data={data} />
    </Suspense>
  );
}
