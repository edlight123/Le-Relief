import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getRecentEditorialEvents } from "@/lib/repositories/editorial/audit";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EVENT_LABELS: Record<string, string> = {
  article_created: "Article créé",
  article_updated: "Article modifié",
  submitted_for_review: "Soumis en révision",
  revision_requested: "Révisions demandées",
  approved: "Approuvé",
  rejected: "Rejeté",
  scheduled: "Programmé",
  published: "Publié",
  unpublished: "Dépublié",
  archived: "Archivé",
  homepage_assigned: "Mis à la une",
  metadata_updated: "Métadonnées modifiées",
  comment_added: "Commentaire ajouté",
  comment_resolved: "Commentaire résolu",
};

const EVENT_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  article_created: "info",
  article_updated: "default",
  submitted_for_review: "info",
  revision_requested: "warning",
  approved: "success",
  rejected: "danger",
  scheduled: "info",
  published: "success",
  unpublished: "warning",
  archived: "default",
  homepage_assigned: "success",
  metadata_updated: "default",
  comment_added: "default",
  comment_resolved: "success",
};

export default async function AdminAuditPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/audit");
  }
  if (role !== "admin") {
    redirect("/admin/access-denied");
  }

  let events: Record<string, unknown>[] = [];
  try {
    events = await getRecentEditorialEvents(150);
  } catch {
    events = [];
  }

  const articleIds = Array.from(
    new Set(events.map((e) => e.articleId as string).filter(Boolean)),
  );
  const actorIds = Array.from(
    new Set(events.map((e) => e.actorId as string).filter(Boolean)),
  );

  const [articleMap, actorMap] = await Promise.all([
    Promise.all(
      articleIds.map(async (id) => {
        try {
          const a = await articlesRepo.getArticle(id);
          return [id, a] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    ).then((rows) => new Map(rows)),
    Promise.all(
      actorIds.map(async (id) => {
        try {
          const u = await usersRepo.getUser(id);
          return [id, u] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    ).then((rows) => new Map(rows)),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Newsroom governance"
        title="Journal d'audit"
        description="Historique des évènements éditoriaux récents"
      />

      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase tracking-wider text-foreground">
            {events.length} évènements récents
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="px-5 py-10 text-center font-body text-sm text-muted">
              Aucun évènement enregistré.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {events.map((event) => {
                const id = event.id as string;
                const type = event.type as string;
                const articleId = event.articleId as string;
                const actorId = event.actorId as string;
                const article = articleId ? articleMap.get(articleId) : null;
                const actor = actorId ? actorMap.get(actorId) : null;
                const createdAt = event.createdAt as string | null;
                const note = event.note as string | null;
                const fromStatus = event.fromStatus as string | null;
                const toStatus = event.toStatus as string | null;

                return (
                  <div
                    key={id}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="w-44 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted">
                      {createdAt
                        ? format(new Date(createdAt), "d MMM yyyy · HH:mm", { locale: fr })
                        : "—"}
                    </div>
                    <Badge variant={EVENT_VARIANTS[type] ?? "default"}>
                      {EVENT_LABELS[type] ?? type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      {article ? (
                        <Link
                          href={`/admin/articles/${articleId}/edit`}
                          className="block truncate font-body text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {String((article as Record<string, unknown>).title ?? articleId)}
                        </Link>
                      ) : (
                        <span className="font-body text-sm text-muted">
                          {articleId || "Système"}
                        </span>
                      )}
                      {(fromStatus || toStatus) && (
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                          {fromStatus ?? "—"} → {toStatus ?? "—"}
                        </p>
                      )}
                      {note && (
                        <p className="mt-1 font-body text-xs text-muted">{note}</p>
                      )}
                    </div>
                    <div className="w-44 shrink-0 truncate font-label text-xs text-muted">
                      {actor
                        ? String(
                            (actor as Record<string, unknown>).name ??
                              (actor as Record<string, unknown>).email ??
                              actorId,
                          )
                        : actorId || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
