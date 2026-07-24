import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductFormView } from "@/components/admin/product-form-view";

export const metadata: Metadata = {
  title: "Editar produto · Admin",
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
        title="Editar produto"
        description="Ajuste dados, estoque, midia e publicacao."
        activePath="/admin/products"
        backHref="/admin/products"
        backLabel="Produtos"
      />
      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ProductFormView
          googleIdToken={session.googleIdToken}
          productId={id}
        />
      </div>
    </div>
  );
}
