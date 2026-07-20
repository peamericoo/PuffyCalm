import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/category";
import { getCatalogPage, listCatalogSlugs } from "@/lib/catalog/service";
import { isCatalogSort } from "@/lib/catalog/types";
import { siteConfig } from "@/lib/mock/site";

export async function generateStaticParams() {
  const slugs = await listCatalogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await searchParams;
  const data = await getCatalogPage({ categorySlug: slug });
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
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = isCatalogSort(sp.sort) ? sp.sort : "featured";

  const data = await getCatalogPage({ categorySlug: slug, sort });
  if (!data) notFound();

  return <CategoryView data={data} />;
}
