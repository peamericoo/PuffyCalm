import { StorefrontShell } from "@/components/layout/storefront-shell";
import { getHomeContent } from "@/lib/api/content";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getHomeContent();
  return (
    <StorefrontShell
      promoMessages={content.promoMessages}
      promoSettings={content.promoSettings}
    >
      {children}
    </StorefrontShell>
  );
}
