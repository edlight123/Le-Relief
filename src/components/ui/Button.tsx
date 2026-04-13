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
            "bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 transition-colors":
              variant === "primary",
            "bg-surface-elevated text-foreground hover:bg-border-subtle focus:ring-primary/30 transition-colors":
              variant === "secondary",
            "border border-border-subtle bg-transparent text-foreground hover:border-primary hover:text-primary focus:ring-primary/30 transition-colors":
              variant === "outline",
            "bg-transparent text-muted hover:text-foreground hover:bg-surface-elevated focus:ring-primary/30 transition-colors":
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
