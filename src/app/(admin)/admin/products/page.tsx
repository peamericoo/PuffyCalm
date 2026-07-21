import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsListView } from "@/components/admin/products-list-view";

export const metadata: Metadata = {
  title: "Products · Admin",
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
        title="Products"
        description="Create drafts, edit catalog fields, publish to the storefront. Image URLs only until Phase I."
        activePath="/admin/products"
      />
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
        <ProductsListView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
