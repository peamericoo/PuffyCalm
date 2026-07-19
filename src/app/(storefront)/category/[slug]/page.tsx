import { ComingSoon } from "@/components/shared/coming-soon";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ComingSoon
      title={`Collection: ${slug}`}
      description="Category page mock is next after the homepage. Product fixtures are already ready in lib/mock."
    />
  );
}
