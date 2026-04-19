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
          "bg-[rgba(0,0,0,0.05)] text-muted border-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.1)]":
            variant === "default",
          "bg-[rgba(31,111,100,0.1)] text-accent-teal border-[rgba(31,111,100,0.25)]":
            variant === "success",
          "bg-[rgba(185,120,24,0.1)] text-accent-amber border-[rgba(185,120,24,0.25)]":
            variant === "warning",
          "bg-[rgba(177,18,38,0.1)] text-primary border-[rgba(177,18,38,0.25)]":
            variant === "danger",
          "bg-[rgba(35,90,124,0.1)] text-accent-blue border-[rgba(35,90,124,0.25)]":
            variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
