import { clsx } from "clsx";
import type { ReactNode } from "react";

interface AlertBannerProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function AlertBanner({
  variant = "info",
  title,
  children,
  action,
}: AlertBannerProps) {
  return (
    <div
      className={clsx("border px-4 py-3", {
        "border-accent-blue/25 bg-accent-blue/8 text-accent-blue": variant === "info",
        "border-accent-teal/25 bg-accent-teal/8 text-accent-teal": variant === "success",
        "border-accent-amber/25 bg-accent-amber/8 text-accent-amber": variant === "warning",
        "border-primary/25 bg-primary/8 text-primary": variant === "danger",
      })}
    >
      {title ? <p className="font-label text-xs font-extrabold uppercase">{title}</p> : null}
      <div className={clsx("font-body text-sm", title ? "mt-1" : "")}>{children}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}