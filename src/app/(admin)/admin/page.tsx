import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Minimal admin entry — Google session with role admin/staff.
 * Full ops UI (orders/products live) is still roadmap phase 8.
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
            Operations
          </p>
          <h1 className="mt-2 text-center font-display text-2xl font-semibold tracking-tight">
            Admin sign-in
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Use the owner Google account (
            <span className="font-medium text-foreground">
              paletot.business@gmail.com
            </span>
            ). Storefront customers use{" "}
            <Link href="/login" className="underline-offset-2 hover:underline">
              /login
            </Link>
            .
          </p>
          <div className="mt-8 rounded-[1.35rem] border border-border/70 bg-white p-6 shadow-sm">
            <GoogleSignInButton
              label="Sign in with Google"
              callbackUrl="/admin"
            />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Only accounts with admin/staff role can open this area.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="px-3 py-14 sm:px-5 sm:py-20">
      <Container className="max-w-lg">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Admin · {role}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name ?? "operator"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You’re signed in as{" "}
          <span className="font-medium text-foreground">
            {session.user.email}
          </span>
          . Full order desk / live sales UI ships in the next admin phase —
          API + JWT admin already exist on the backend.
        </p>

        <div className="mt-8 space-y-3 rounded-[1.35rem] border border-border/70 bg-white p-6 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Quick links
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link className="text-brand-deep hover:underline" href="/">
                Storefront home
              </Link>
            </li>
            <li>
              <Link className="text-brand-deep hover:underline" href="/account">
                My account (storefront)
              </Link>
            </li>
            <li>
              <span className="text-muted-foreground">
                Orders API:{" "}
                <code className="text-xs">GET /api/v1/admin/*</code> (FastAPI)
              </span>
            </li>
          </ul>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild variant="default" className="flex-1">
              <Link href="/category/all">View catalog</Link>
            </Button>
            <SignOutButton className="flex-1" />
          </div>
        </div>
      </Container>
    </section>
  );
}
