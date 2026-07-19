import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-cta text-white shadow-sm hover:bg-cta-hover",
        brand:
          "rounded-full bg-brand-deep text-white shadow-sm hover:bg-brand-deep/90",
        dark: "rounded-full bg-foreground text-white shadow-sm hover:bg-foreground/90",
        light:
          "rounded-full bg-white text-foreground shadow-sm hover:bg-white/95",
        outline:
          "rounded-full border border-border bg-white text-foreground hover:bg-brand-soft",
        ghost: "rounded-full hover:bg-brand-soft text-foreground",
        soft: "rounded-full bg-brand-soft text-brand-deep hover:bg-brand/25",
        link: "rounded-none px-0 text-brand-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-[15px]",
        xl: "h-13 px-9 text-base",
        icon: "h-10 w-10 rounded-full",
        pill: "h-10 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
