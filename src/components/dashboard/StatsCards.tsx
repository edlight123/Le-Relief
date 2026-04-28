import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";

export interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  color?: "red" | "teal" | "blue" | "amber";
}

interface StatsCardsProps {
  stats: Stat[];
  /** Show skeleton loading placeholders instead of values */
  loading?: boolean;
}

const colorStyles: Record<string, { bg: string; icon: string }> = {
  red:   { bg: "bg-primary/10",       icon: "text-primary" },
  teal:  { bg: "bg-accent-teal/10",   icon: "text-accent-teal" },
  blue:  { bg: "bg-accent-blue/10",   icon: "text-accent-blue" },
  amber: { bg: "bg-accent-amber/10",  icon: "text-accent-amber" },
};

const defaultColors = ["blue", "teal", "amber", "red", "teal"];

export default function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div
        className={clsx(
          "grid gap-4",
          stats.length >= 5
            ? "grid-cols-2 lg:grid-cols-5"
            : "grid-cols-2 lg:grid-cols-4",
        )}
        role="status"
        aria-label="Chargement des statistiques"
      >
        {Array.from({ length: stats.length || 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-none border border-border-subtle bg-surface p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-3 w-20 animate-pulse rounded-none bg-surface-hover" />
                <div className="h-10 w-16 animate-pulse rounded-none bg-surface-hover" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-sm bg-surface-hover" />
            </div>
          </div>
        ))}
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "grid gap-4",
        stats.length >= 5
          ? "grid-cols-2 lg:grid-cols-5"
          : "grid-cols-2 lg:grid-cols-4",
      )}
      role="region"
      aria-label="Statistiques"
    >
      {stats.map((stat, i) => {
        const colorKey = stat.color ?? defaultColors[i % defaultColors.length] ?? "blue";
        const colors = colorStyles[colorKey] ?? colorStyles.blue!;
        return (
          <div
            key={stat.label}
            className="rounded-none border border-border-subtle bg-surface p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
            style={{ boxShadow: "var(--shadow-dashboard)" }}
            role="status"
            aria-label={`${stat.label}: ${typeof stat.value === "number" ? stat.value.toLocaleString("fr-FR") : stat.value}`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
                <p className="mt-2 font-headline text-4xl font-extrabold leading-none tabular-nums text-foreground">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString("fr-FR")
                    : stat.value}
                </p>
                {stat.change ? (
                  <p className={clsx(
                    "mt-2 font-label text-xs font-bold",
                    stat.change.startsWith("+") ? "text-accent-teal" :
                    stat.change.startsWith("-") ? "text-primary" : "text-muted",
                  )}>
                    {stat.change}
                  </p>
                ) : null}
              </div>
              {stat.icon ? (
                <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-sm", colors.bg)}>
                  <stat.icon className={clsx("h-4 w-4", colors.icon)} aria-hidden="true" />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
