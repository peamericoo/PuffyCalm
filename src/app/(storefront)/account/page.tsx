import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Container } from "@/components/shared/container";
import { DisplayStack } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My account",
  description: "Your PuffyCalm account profile and orders.",
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  const { user } = session;
  const isAdmin = user.role === "admin";
  const isStaff = user.role === "staff" || isAdmin;

  return (
    <section className="px-3 py-14 sm:px-5 sm:py-20">
      <Container className="max-w-lg animate-fade-up">
        <DisplayStack
          eyebrow="Account"
          title="You’re signed in"
          description="Google account linked. Guest checkout still works for anyone shopping without an account."
          as="h1"
          align="center"
          noReveal
        />

        <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-white/90 p-6 shadow-[0_20px_50px_-28px_rgb(26_35_50/0.35)] sm:p-8">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-full border border-border object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand-deep">
                {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                {user.name ?? "PuffyCalm member"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                {user.role}
                {isAdmin ? " · full access" : null}
              </p>
            </div>
          </div>

          {isStaff ? (
            <p className="mt-5 rounded-2xl border border-brand/30 bg-brand-soft/60 px-4 py-3 text-sm text-brand-deep">
              This Google account is recognized as{" "}
              <strong>{user.role}</strong> for store operations.
              {isAdmin
                ? " You are the primary admin (paletot.business@gmail.com)."
                : null}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="default" className="flex-1">
              <Link href="/account/orders">View orders</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/category/all">Continue shopping</Link>
            </Button>
          </div>

          <div className="mt-4">
            <SignOutButton className="w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
