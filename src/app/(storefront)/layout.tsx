import { Footer } from "@/components/layout/footer";
import { StorefrontShell } from "@/components/layout/storefront-shell";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StorefrontShell>{children}</StorefrontShell>
      <Footer />
    </div>
  );
}
