import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoriesEditorView } from "@/components/admin/categories-editor-view";

export const metadata: Metadata = {
  title: "Categories · Admin",
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
        title="Categories"
        description="Covers for Shop by mood, Filters collections, and category pages. Upload or paste media URLs."
        activePath="/admin/categories"
        backHref="/admin"
        backLabel="Admin"
      />
      <div className="mx-auto max-w-3xl px-3 py-6 sm:px-5 sm:py-8">
        <CategoriesEditorView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
