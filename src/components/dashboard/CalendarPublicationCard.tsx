import Link from "next/link";
import PriorityFlag from "@/components/ui/PriorityFlag";

interface CalendarPublicationCardProps {
  id: string;
  title: string;
  scheduledAt?: string | null;
  category?: string | null;
  language?: string | null;
  isBreaking?: boolean;
}

export default function CalendarPublicationCard({
  id,
  title,
  scheduledAt,
  category,
  language,
  isBreaking,
}: CalendarPublicationCardProps) {
  return (
    <Link
      href={`/dashboard/articles/${id}/edit`}
      className="block border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-newsprint"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-body text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 font-label text-[11px] uppercase text-muted">
            {category || "Sans rubrique"} · {(language || "fr").toUpperCase()}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isBreaking ? <PriorityFlag kind="breaking" /> : null}
          <span className="font-label text-xs text-muted">
            {scheduledAt
              ? new Date(scheduledAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--"}
          </span>
        </div>
      </div>
    </Link>
  );
}