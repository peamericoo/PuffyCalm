import type { DefaultSession } from "next-auth";

export type AppRole = "customer" | "admin" | "staff";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
    /** Present for admin/staff only — used once to bridge → FastAPI cookies (Phase E). */
    googleIdToken?: string;
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    /** Google OpenID ID token from last OAuth; short-lived. */
    googleIdToken?: string;
  }
}
