import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { roleForEmail } from "@/lib/auth/constants";

/**
 * Auth.js (NextAuth v5) — storefront customer auth via Google OAuth.
 * Guest checkout stays fully available (no global middleware lock).
 *
 * Session: JWT in HttpOnly cookie (Auth.js default) — free, no DB adapter required.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/account",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Google only; require verified email
      if (account?.provider !== "google") return false;
      const email = profile?.email;
      if (!email) return false;
      // Google profile may include email_verified
      const verified =
        (profile as { email_verified?: boolean } | undefined)?.email_verified !==
        false;
      return verified;
    },
    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        token.id =
          (profile as { sub?: string }).sub ??
          user?.id ??
          token.sub ??
          token.id;
        token.email = profile.email ?? token.email;
        token.name = profile.name ?? token.name;
        token.picture =
          (profile as { picture?: string }).picture ?? token.picture;
      }
      if (user?.id) token.id = user.id;
      token.role = roleForEmail(
        (token.email as string | undefined) ?? user?.email,
      );
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        const role = token.role;
        session.user.role =
          role === "admin" || role === "staff" || role === "customer"
            ? role
            : "customer";
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        /* ignore */
      }
      return baseUrl;
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
