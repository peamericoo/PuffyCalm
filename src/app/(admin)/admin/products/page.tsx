import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsListView } from "@/components/admin/products-list-view";

export const metadata: Metadata = {
  title: "Produtos · Admin",
  robots: { index: false, follow: false },
};

/**
 * Phase H — admin product list (GET /api/v1/admin/products).
 */
export default async function AdminProductsPage() {
  const session = await auth();
  const role = session?.user?.role;
  const allowed = role === "admin" || role === "staff";

  if (!session?.user) {
    redirect("/admin");
  }
  if (!allowed) {
    redirect("/account");
  }

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title="Produtos"
        description="Crie lancamentos, ajuste estoque e publique na loja."
        activePath="/admin/products"
      />
      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ProductsListView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
