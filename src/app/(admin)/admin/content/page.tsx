import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentEditorView } from "@/components/admin/content-editor-view";

export const metadata: Metadata = {
  title: "Conteudo da home · Admin",
  robots: { index: false, follow: false },
};

/**
 * Phase J — CMS-lite: promo ticker + hero slides.
 */
export default async function AdminContentPage() {
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
        title="Conteudo da home"
        description="Barra promocional, hero e colecoes da pagina inicial."
        activePath="/admin/content"
      />
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ContentEditorView googleIdToken={session.googleIdToken} />
      </div>
    </div>
  );
}
