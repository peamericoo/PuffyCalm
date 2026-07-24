import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = {
  title: "Inicio · Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin home — ops dashboard (KPIs, charts, fulfillment queue).
 * Sign-in + Auth.js allowlist; data via FastAPI cookies after bridge.
 */
export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  const allowed = role === "admin" || role === "staff";

  if (session?.user && !allowed) {
    redirect("/account");
  }

  if (!session?.user) {
    return (
      <section className="px-3 py-16 sm:px-5 sm:py-24">
        <Container className="max-w-md">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Painel interno
          </p>
          <h1 className="mt-2 text-center font-display text-2xl font-semibold tracking-tight">
            Entrar no admin
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Use a conta Google autorizada (
            <span className="font-medium text-foreground">
              paletot.business@gmail.com
            </span>
            ). Clientes da loja usam{" "}
            <Link href="/login" className="underline-offset-2 hover:underline">
              /login
            </Link>
            .
          </p>
          <div className="mt-8 rounded-[1.35rem] border border-border/70 bg-white p-6 shadow-sm">
          <GoogleSignInButton
              label="Entrar com Google"
              callbackUrl="/admin"
            />
            <p className="mt-4 text-center text-xs text-muted-foreground">
            O acesso final e validado pela API com a mesma allowlist de{" "}
              <code className="text-[11px]">ADMIN_EMAILS</code> after bridge.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <div className="min-h-full">
      <AdminPageHeader
        title="Inicio"
        description="Resumo operacional, pedidos para preparar e saude do catalogo."
        activePath="/admin"
      />
      <AdminDashboardView
        googleIdToken={session.googleIdToken}
        operatorName={session.user.name}
        operatorEmail={session.user.email}
        role={role}
      />
    </div>
  );
}
