import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-surface-elevated text-foreground/70":
            variant === "default",
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400":
            variant === "success",
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-accent-amber":
            variant === "warning",
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-accent-coral":
            variant === "danger",
          "bg-primary/10 text-primary":
            variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
