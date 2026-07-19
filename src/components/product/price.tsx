import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  currency?: string;
  className?: string;
}

export function Price({
  price,
  compareAtPrice,
  currency = "USD",
  className,
}: PriceProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-base font-semibold tracking-tight text-foreground">
        {formatMoney(price, currency)}
      </span>
      {compareAtPrice && compareAtPrice > price ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatMoney(compareAtPrice, currency)}
        </span>
      ) : null}
    </div>
  );
}
