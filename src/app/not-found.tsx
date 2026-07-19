import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        We couldn’t find that page. Let’s get you back home.
      </p>
      <Button asChild variant="default" className="mt-8">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
