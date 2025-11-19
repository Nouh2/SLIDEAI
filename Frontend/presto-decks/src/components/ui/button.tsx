import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-glow hover:shadow-glow-hover hover:scale-105",
        destructive: "bg-[var(--danger)] text-white hover:opacity-90 hover:scale-105",
        outline: "border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--primary)] hover:scale-105",
        secondary: "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)]/80 hover:scale-105",
        ghost: "text-[var(--text)] hover:bg-[var(--surface)] hover:scale-105",
        link: "text-[var(--primary)] underline-offset-4 hover:underline hover:text-[var(--secondary)]",
        solid: "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-glow hover:shadow-glow-hover hover:scale-105 font-semibold",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
