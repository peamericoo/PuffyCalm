import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Container } from "@/components/shared/container";
import { DisplayStack } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

type AuthPanelProps = {
  mode: "login" | "register";
  error?: string | null;
  callbackUrl?: string;
};

const COPY = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in",
    description:
      "Use your Google account to access orders and saved preferences. Checkout as a guest anytime — no account required.",
    googleLabel: "Sign in with Google",
    alt: { href: "/register", label: "Create an account" },
  },
  register: {
    eyebrow: "Join PuffyCalm",
    title: "Create your account",
    description:
      "One tap with Google creates your storefront account. We’ll never block guest checkout — shop first, sign in later if you want.",
    googleLabel: "Create account with Google",
    alt: { href: "/login", label: "Already have an account? Sign in" },
  },
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Try again in a moment.",
  OAuthCallback: "Google returned an error. Please try again.",
  OAuthCreateAccount: "We couldn’t create your account. Try again.",
  Callback: "Sign-in callback failed. Please try again.",
  OAuthAccountNotLinked:
    "This email is already linked another way. Use Google with the same address.",
  AccessDenied: "Access denied. Use a verified Google account.",
  Configuration:
    "Google sign-in is not fully configured yet. If you’re the owner, check AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.",
  Default: "Something went wrong signing in. Please try again.",
};

export function AuthPanel({ mode, error, callbackUrl = "/account" }: AuthPanelProps) {
  const c = COPY[mode];
  const errorText =
    error != null
      ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
      : null;

  return (
    <section className="px-3 py-14 sm:px-5 sm:py-20">
      <Container className="max-w-md animate-fade-up">
        <DisplayStack
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          as="h1"
          align="center"
          noReveal
        />

        <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-white/90 p-6 shadow-[0_20px_50px_-28px_rgb(26_35_50/0.35)] backdrop-blur-sm sm:p-8">
          {errorText ? (
            <p
              role="alert"
              className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorText}
            </p>
          ) : null}

          <GoogleSignInButton
            label={c.googleLabel}
            callbackUrl={callbackUrl}
            variant="outline"
            size="lg"
          />

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            . Guest checkout stays available on every order.
          </p>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button asChild variant="soft" className="w-full">
            <Link href="/checkout">Continue as guest · checkout</Link>
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href={c.alt.href}
              className="font-medium text-brand-deep underline-offset-4 hover:underline"
            >
              {c.alt.label}
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Store staff?{" "}
            <Link
              href="/admin"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              Admin sign-in
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
