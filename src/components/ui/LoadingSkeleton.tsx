"use client";

import clsx from "clsx";

interface LoadingSkeletonProps {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Variant: "text" for lines, "card" for card-shaped blocks, "stat" for KPI stat cards */
  variant?: "text" | "card" | "stat";
  /** Optional className for the container */
  className?: string;
}

export default function LoadingSkeleton({
  rows = 3,
  variant = "text",
  className,
}: LoadingSkeletonProps) {
  const pulseBase = "animate-pulse rounded-none bg-surface-hover";

  if (variant === "stat") {
    return (
      <div
        className={clsx("grid gap-4 grid-cols-2 lg:grid-cols-5", className)}
        role="status"
        aria-label="Chargement des statistiques"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-none border border-border-subtle bg-surface p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className={clsx(pulseBase, "h-3 w-20")} />
                <div className={clsx(pulseBase, "h-10 w-16")} />
              </div>
              <div className={clsx(pulseBase, "h-10 w-10 rounded-sm")} />
            </div>
          </div>
        ))}
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={clsx("grid gap-4 grid-cols-1 lg:grid-cols-2", className)}
        role="status"
        aria-label="Chargement du contenu"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-none border border-border-subtle bg-surface p-5 space-y-4"
          >
            <div className={clsx(pulseBase, "h-5 w-32")} />
            <div className="space-y-2">
              <div className={clsx(pulseBase, "h-3 w-full")} />
              <div className={clsx(pulseBase, "h-3 w-3/4")} />
            </div>
          </div>
        ))}
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  // text variant (default)
  return (
    <div
      className={clsx("space-y-3", className)}
      role="status"
      aria-label="Chargement du contenu"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            pulseBase,
            "h-4 rounded-sm",
            i === rows - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}