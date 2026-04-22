import { clsx } from "clsx";
import type { ReactNode } from "react";

export default function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-3 border border-border-subtle bg-surface px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterBarSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}