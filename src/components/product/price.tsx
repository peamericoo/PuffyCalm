import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  currency?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Price({
  price,
  compareAtPrice,
  currency = "USD",
  className,
  size = "md",
}: PriceProps) {
  const sizeClass =
    size === "sm"
      ? "text-sm"
      : size === "lg"
        ? "text-xl sm:text-2xl"
        : "text-base";

  return (
    <div className={cn("flex items-baseline gap-2", sizeClass, className)}>
      <span className="font-medium tracking-tight text-foreground">
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
