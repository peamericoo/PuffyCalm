import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="page-offset flex-1">{children}</main>
      <Footer />
    </div>
  );
}
