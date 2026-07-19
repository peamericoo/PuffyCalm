import { ComingSoon } from "@/components/shared/coming-soon";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ComingSoon
      title="Product detail"
      description={`PDP mock for “${slug}” will be built next. Data already lives in lib/mock/products.`}
    />
  );
}
