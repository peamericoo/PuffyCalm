import { productStatusLabel } from "@/lib/admin/product-status";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  archived: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
};

type Props = {
  status: string;
  className?: string;
};

export function ProductStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {productStatusLabel(status)}
    </span>
  );
}
