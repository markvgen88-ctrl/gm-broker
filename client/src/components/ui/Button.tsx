import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "px-4 py-2 text-xs",
          size === "md" && "px-7 py-3.5 text-sm",
          size === "lg" && "px-9 py-4.5 text-base",
          variant === "primary" &&
            "bg-gradient-to-r from-[#f4e5b3] via-gold to-gold-deep bg-[length:200%_auto] bg-left text-[#1a1400] shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] hover:bg-right hover:shadow-[0_14px_48px_-8px_rgba(212,175,55,0.65)] active:scale-[0.98]",
          variant === "secondary" &&
            "metal-border text-silver hover:border-gold/60 hover:text-gold active:scale-[0.98]",
          variant === "ghost" &&
            "text-metal hover:text-gold underline-offset-4 hover:underline",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
