import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoriesEditorView } from "@/components/admin/categories-editor-view";

export const metadata: Metadata = {
  title: "Categorias · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
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
        title="Categorias"
        description="Organize vitrines, filtros e capas das colecoes."
        activePath="/admin/categories"
        backHref="/admin"
        backLabel="Inicio"
      />
      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CategoriesEditorView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
