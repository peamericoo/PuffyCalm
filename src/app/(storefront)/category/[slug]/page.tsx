import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/category";
import { getCatalogPage, listCatalogSlugs } from "@/lib/catalog/service";
import {
  isCatalogSort,
  isStockFilter,
} from "@/lib/catalog/types";
import { parseTypesParam } from "@/lib/catalog/url";
import { siteConfig } from "@/lib/mock/site";

export async function generateStaticParams() {
  const slugs = await listCatalogSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    stock?: string;
    types?: string;
    sale?: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const sort = isCatalogSort(sp.sort) ? sp.sort : "featured";
  const stock = isStockFilter(sp.stock) ? sp.stock : "all";
  const types = parseTypesParam(sp.types);
  const sale = sp.sale === "1" || sp.sale === "true";

  const data = await getCatalogPage({
    categorySlug: slug,
    sort,
    stock,
    types,
    sale,
  });
  if (!data) notFound();

  return <CategoryView data={data} />;
}
