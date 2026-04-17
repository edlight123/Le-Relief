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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-t-2 border-t-border-strong">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="font-label text-xs font-extrabold uppercase text-muted">
                {stat.label}
              </p>
              <p className="mt-2 font-headline text-4xl font-extrabold leading-none text-foreground">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={clsx(
                    "mt-2 font-label text-xs font-bold",
                    stat.change.startsWith("+")
                      ? "text-accent-teal"
                      : stat.change.startsWith("-")
                      ? "text-primary"
                      : "text-muted"
                  )}
                >
                  {stat.change}
                </p>
              )}
            </div>
            {stat.icon && (
              <stat.icon className="h-8 w-8 text-muted/40" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
