import { statusLabel, statusPillClass } from "@/lib/admin/order-status";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  className?: string;
};

export function OrderStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        statusPillClass(status),
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
