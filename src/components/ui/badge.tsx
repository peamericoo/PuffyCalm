import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-foreground/90 text-white",
        soft: "bg-brand-soft text-brand-deep",
        muted: "bg-muted text-muted-foreground",
        /** Promo / sale — calm success green (brand-aligned) */
        sale: "bg-success/15 text-success ring-1 ring-success/25",
        new: "bg-brand-soft text-brand-deep ring-1 ring-brand/20",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
