import Link from "next/link";
import { Boxes, LayoutDashboard, PanelsTopLeft, ReceiptText, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Visao geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Pedidos", icon: ReceiptText, exact: false },
  { href: "/admin/products", label: "Produtos", icon: Boxes, exact: false },
  { href: "/admin/categories", label: "Categorias", icon: Tags, exact: false },
  { href: "/admin/content", label: "Vitrine", icon: PanelsTopLeft, exact: false },
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
        "flex min-w-0 items-center gap-1 overflow-x-auto pb-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="Painel admin"
    >
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active = link.exact
          ? activePath === link.href
          : activePath === link.href || activePath.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
              active
                ? "bg-brand-deep text-white shadow-sm"
                : "text-muted-foreground hover:bg-white hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
