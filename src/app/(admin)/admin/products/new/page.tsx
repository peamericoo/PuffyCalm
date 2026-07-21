import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductFormView } from "@/components/admin/product-form-view";

export const metadata: Metadata = {
  title: "New product · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNewProductPage() {
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
        title="New product"
        description="Starts as draft unless you choose Published. Publish when ready for the storefront."
        activePath="/admin/products"
        backHref="/admin/products"
        backLabel="Products"
      />
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
        <ProductFormView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
