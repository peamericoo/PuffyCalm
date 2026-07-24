import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/category";
import { getCatalogPage, listCatalogSlugs } from "@/lib/catalog/service";
import { siteConfig } from "@/lib/site";

/**
 * Static category shells — no searchParams on the server.
 * Filters/sort live in the URL but are applied client-side only,
 * so changing them never re-runs RSC (keeps the UI fluid).
 *
 * Data: FastAPI catalog (Phase B). Dynamic to avoid stale App Router payloads
 * after direct admin/API product publishes.
 */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)]">
          <div>
            <div className="mb-6 h-8 w-44 animate-pulse rounded-full bg-white/50" />
            <div className="mb-5 h-20 w-72 animate-pulse rounded-2xl bg-white/55 lg:h-24 lg:w-96" />
            <div className="h-8 w-80 max-w-full animate-pulse rounded-full bg-white/45" />
          </div>
          <div className="hidden min-h-[18rem] animate-pulse rounded-[2rem] bg-white/50 lg:block" />
        </div>
        <div className="my-6 h-14 animate-pulse rounded-[1.15rem] bg-white/55 lg:my-7" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 xl:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-[1.2rem] bg-white/55"
            />
          ))}
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
