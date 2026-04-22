"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export interface ReviewQueueRow {
  id: string;
  title: string;
  author?: string;
  status?: string;
  warningCount?: number;
}

export default function ReviewQueueTable({ rows }: { rows: ReviewQueueRow[] }) {
  return (
    <Card>
      <div className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-semibold text-foreground">{row.title}</p>
              <p className="font-label text-xs text-muted">{row.author || "La rédaction"}</p>
            </div>
            <div className="flex items-center gap-2">
              {typeof row.warningCount === "number" && row.warningCount > 0 ? (
                <Badge variant="warning">{row.warningCount} alertes</Badge>
              ) : null}
              {row.status ? <Badge variant="info">{row.status}</Badge> : null}
              <Link
                href={`/dashboard/articles/${row.id}/edit`}
                className="rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
              >
                Ouvrir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
