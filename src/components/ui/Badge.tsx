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
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 font-label text-[11px] font-bold uppercase",
        {
          "border-border-subtle bg-surface-elevated text-foreground/70":
            variant === "default",
          "border-accent-teal/30 bg-accent-teal/10 text-accent-teal":
            variant === "success",
          "border-accent-amber/30 bg-accent-amber/10 text-accent-amber":
            variant === "warning",
          "border-primary/30 bg-primary/10 text-primary":
            variant === "danger",
          "border-accent-blue/30 bg-accent-blue/10 text-accent-blue":
            variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
