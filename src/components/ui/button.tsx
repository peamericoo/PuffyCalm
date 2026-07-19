import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-accent text-white shadow-sm hover:bg-accent-hover",
        dark: "rounded-full bg-foreground text-white shadow-sm hover:bg-foreground/90",
        light:
          "rounded-full bg-white text-foreground shadow-sm hover:bg-white/90",
        outline:
          "rounded-full border border-border bg-white text-foreground hover:bg-muted",
        ghost: "rounded-full hover:bg-muted text-foreground",
        soft: "rounded-full bg-accent-soft text-accent hover:bg-accent-soft/80",
        link: "rounded-none px-0 text-accent underline-offset-4 hover:underline",
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
