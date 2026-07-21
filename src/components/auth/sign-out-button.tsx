"use client";

import { signOut } from "next-auth/react";
import { logoutAdminBackend } from "@/lib/api/admin-auth";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() => {
        void logoutAdminBackend().finally(() => {
          void signOut({ callbackUrl: "/" });
        });
      }}
    >
      Sign out
    </Button>
  );
}
