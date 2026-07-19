import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-foreground/90 text-white",
        soft: "bg-accent-soft text-accent",
        muted: "bg-muted text-muted-foreground",
        sale: "bg-rose-100 text-rose-700",
        new: "bg-emerald-50 text-emerald-700",
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
