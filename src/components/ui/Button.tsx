import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-sm font-label font-extrabold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
          {
            "border border-border-strong bg-foreground text-background hover:bg-primary hover:text-white":
              variant === "primary",
            "border border-border-subtle bg-surface-elevated text-foreground hover:border-border-strong":
              variant === "secondary",
            "border border-border-strong bg-transparent text-foreground hover:bg-foreground hover:text-background":
              variant === "outline",
            "border border-transparent bg-transparent text-muted hover:border-border-subtle hover:text-foreground":
              variant === "ghost",
            "border border-primary bg-primary text-white hover:bg-primary-dark":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-xs": size === "md",
            "px-6 py-3 text-sm": size === "lg",
          },
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

export default Button;
