import clsx from "clsx";

interface SectionLabelProps {
  label: string;
  variant?: "category" | "type" | "kicker";
  className?: string;
}

export default function SectionLabel({
  label,
  variant = "category",
  className,
}: SectionLabelProps) {
  if (variant === "kicker") {
    return <span className={clsx("page-kicker", className)}>{label}</span>;
  }

  return (
    <span
      className={clsx(
        "font-label text-[11px] font-bold uppercase tracking-[1px]",
        variant === "category" ? "text-primary" : "text-muted",
        className,
      )}
    >
      {label}
    </span>
  );
}
