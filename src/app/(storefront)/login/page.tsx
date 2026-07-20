import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PuffyCalm with Google. Guest checkout always available.",
};

type PageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallback(params.callbackUrl) ?? "/account";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthPanel
      mode="login"
      error={params.error ?? null}
      callbackUrl={callbackUrl}
    />
  );
}

function safeCallback(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return null;
}
