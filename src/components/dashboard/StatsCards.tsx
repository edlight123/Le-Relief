import Card, { CardContent } from "@/components/ui/Card";
import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={clsx(
                    "mt-1 text-xs font-medium",
                    stat.change.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : stat.change.startsWith("-")
                      ? "text-red-600 dark:text-red-400"
                      : "text-neutral-500"
                  )}
                >
                  {stat.change}
                </p>
              )}
            </div>
            {stat.icon && (
              <stat.icon className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
