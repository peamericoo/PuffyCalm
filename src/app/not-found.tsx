import Link from "next/link";
import { DisplayStack } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <DisplayStack
        eyebrow="404"
        title="Page not found"
        description="We couldn’t find that page. Let’s get you back home."
        as="h1"
        align="center"
        noReveal
        className="max-w-md"
      />
      <Button asChild variant="default" className="mt-8">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
