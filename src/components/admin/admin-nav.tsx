import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Home", exact: true },
  { href: "/admin/orders", label: "Orders", exact: false },
] as const;

type Props = {
  /** Current pathname for active styles (pass from client or match on server). */
  activePath?: string;
  className?: string;
};

export function AdminNav({ activePath = "", className }: Props) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm",
        className,
      )}
      aria-label="Admin"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? activePath === link.href
          : activePath === link.href || activePath.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium transition-colors",
              active
                ? "bg-brand-deep text-white"
                : "text-muted-foreground hover:bg-brand-soft hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
