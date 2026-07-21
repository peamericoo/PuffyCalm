import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductFormView } from "@/components/admin/product-form-view";

export const metadata: Metadata = {
  title: "Edit product · Admin",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
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
        title="Edit product"
        description="Save updates, then publish or unpublish. Revalidates storefront cache tags on success."
        activePath="/admin/products"
        backHref="/admin/products"
        backLabel="Products"
      />
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
        <ProductFormView
          googleIdToken={session.googleIdToken}
          productId={id}
        />
      </div>
    </div>
  );
}
