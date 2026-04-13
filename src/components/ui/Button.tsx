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
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all focus:ring-primary/50":
              variant === "primary",
            "bg-surface-elevated text-foreground hover:bg-primary/10 hover:text-primary focus:ring-primary/30":
              variant === "secondary",
            "border border-border-subtle bg-transparent text-foreground/80 hover:border-primary/40 hover:text-primary focus:ring-primary/30":
              variant === "outline",
            "bg-transparent text-foreground/70 hover:text-primary hover:bg-primary/5 focus:ring-primary/30":
              variant === "ghost",
            "bg-accent-coral text-white hover:bg-red-600 focus:ring-red-500":
              variant === "danger",
          },
          {
            "text-sm px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2": size === "md",
            "text-base px-6 py-3": size === "lg",
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
