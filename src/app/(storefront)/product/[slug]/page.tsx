import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import {
  getProductDetail,
  listProductSlugs,
} from "@/lib/catalog/service";
import { siteConfig } from "@/lib/mock/site";

/** ISR — catalog from API with short revalidate. */
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await listProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getProductDetail(slug, 0);
    if (!detail) {
      return { title: "Product not found" };
    }
    const { product } = detail;
    return {
      title: product.name,
      description: product.shortDescription,
      openGraph: {
        title: `${product.name} · ${siteConfig.name}`,
        description: product.shortDescription,
        images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getProductDetail(slug, 4);
  if (!detail) notFound();

  return (
    <ProductDetail product={detail.product} related={detail.related} />
  );
}
