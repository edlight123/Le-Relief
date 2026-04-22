import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import Card, { CardContent } from "@/components/ui/Card";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon: LucideIcon;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-14 text-center">
        <Icon className="mx-auto mb-3 h-8 w-8 text-muted" />
        <p className="font-label text-sm font-bold text-foreground">{title}</p>
        {description ? <p className="mt-1 font-body text-xs text-muted">{description}</p> : null}
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="mt-4 inline-flex font-label text-xs font-bold text-primary hover:underline">
            {actionLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}