"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Header account icon — routes to account when signed in, login otherwise. */
export function HeaderAccountButton({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;
  const href = signedIn ? "/account" : "/login";
  const label = signedIn
    ? `Account, ${session.user?.name ?? session.user?.email ?? "signed in"}`
    : "Sign in";

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn("nav-icon nav-icon--user pressable h-9 w-9", className)}
    >
      <Link href={href} aria-label={label} title={label}>
        {signedIn && session.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="nav-icon-svg h-[17px] w-[17px]" />
        )}
      </Link>
    </Button>
  );
}
