import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductDetail } from "@/lib/catalog/service";
import { siteConfig } from "@/lib/site";

/** Product data is admin-driven and must not serve stale pre-publish payloads. */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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
  let detail: Awaited<ReturnType<typeof getProductDetail>> = null;
  try {
    detail = await getProductDetail(slug, 4);
  } catch {
    // Unreachable API during SSG/build — never crash next build
    notFound();
  }
  if (!detail) notFound();

  return (
    <ProductDetail product={detail.product} related={detail.related} />
  );
}
