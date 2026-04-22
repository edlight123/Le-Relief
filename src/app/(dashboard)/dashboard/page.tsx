import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { FileText, Eye, Users, PenSquare, BarChart3, ArrowRight } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCards";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getEditorialStatusLabel,
  getEditorialStatusVariant,
  normalizeEditorialStatus,
} from "@/lib/editorial-workflow";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let totalArticles = 0, publishedCount = 0, draftCount = 0, inReviewCount = 0, approvedCount = 0, scheduledCount = 0, totalViews = 0, totalUsers = 0;
  let recentArticles: Record<string, unknown>[] = [];

  try {
    [totalArticles, publishedCount, draftCount, inReviewCount, approvedCount, scheduledCount, totalViews, totalUsers] = await Promise.all([
      articlesRepo.countArticles(),
      articlesRepo.countArticles("published"),
      articlesRepo.countArticles("draft"),
      Promise.all([
        articlesRepo.countArticles("in_review"),
        articlesRepo.countArticles("pending_review"),
      ]).then(([inReview, pendingReview]) => inReview + pendingReview),
      articlesRepo.countArticles("approved"),
      articlesRepo.countArticles("scheduled"),
      articlesRepo.sumViews(),
      usersRepo.countUsers(),
    ]);
    const rawRecent = await articlesRepo.getRecentArticles(6);
    recentArticles = await Promise.all(
      rawRecent.map(async (article) => {
        const [author, category] = await Promise.all([
          article.authorId ? usersRepo.getUser(article.authorId as string) : null,
          article.categoryId ? categoriesRepo.getCategory(article.categoryId as string) : null,
        ]);
        return { ...article, author, category } as Record<string, unknown>;
      }),
    );
  } catch {
    // non-fatal
  }

  const stats = [
    { label: "Publiés", value: publishedCount, icon: FileText, color: "teal" as const },
    { label: "Brouillons", value: draftCount, icon: FileText, color: "amber" as const },
    { label: "En revue", value: inReviewCount, icon: FileText, color: "blue" as const },
    { label: "Approuvés", value: approvedCount, icon: FileText, color: "blue" as const },
    { label: "Programmés", value: scheduledCount, icon: FileText, color: "red" as const },
    { label: "Total vues", value: totalViews, icon: Eye, color: "blue" as const },
    { label: "Utilisateurs", value: totalUsers, icon: Users, color: "blue" as const },
    { label: "Articles", value: totalArticles, icon: FileText, color: "red" as const },
  ];

  const quickActions = [
    { label: "Nouvel article", href: "/dashboard/articles/new", icon: PenSquare, desc: "Rédiger et publier" },
    { label: "Mes brouillons", href: "/dashboard/my-drafts", icon: PenSquare, desc: "Reprendre mes articles" },
    { label: "Review queue", href: "/dashboard/review", icon: FileText, desc: "Traiter les validations" },
    { label: "File approuvée", href: "/dashboard/approved", icon: FileText, desc: "Préparer la publication" },
    { label: "Programmés", href: "/dashboard/scheduled", icon: FileText, desc: "Piloter le calendrier" },
    { label: "Analytiques", href: "/dashboard/analytics", icon: BarChart3, desc: "Consulter les stats" },
    { label: "Utilisateurs", href: "/dashboard/users", icon: Users, desc: "Gérer l'équipe" },
    { label: "Tous les articles", href: "/dashboard/articles", icon: FileText, desc: "Gérer le contenu" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold leading-none text-foreground">
            Tableau de bord
          </h1>
          <p className="mt-1 font-label text-xs text-muted">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <Link
          href="/dashboard/articles/new"
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
        >
          <PenSquare className="h-3.5 w-3.5" />
          Nouvel article
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col gap-3 rounded-sm border border-border-subtle bg-surface p-4 transition-all hover:border-border-strong hover:shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-elevated transition-colors group-hover:bg-primary/10">
              <action.icon className="h-4 w-4 text-muted transition-colors group-hover:text-primary" />
            </div>
            <div>
              <p className="font-label text-sm font-extrabold text-foreground">{action.label}</p>
              <p className="font-label text-xs text-muted">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent articles */}
      <div className="rounded-sm border border-border-subtle bg-surface">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
          <h2 className="font-label text-xs font-extrabold uppercase tracking-wider text-foreground">
            Articles récents
          </h2>
          <Link
            href="/dashboard/articles"
            className="flex items-center gap-1 font-label text-xs font-bold text-muted transition-colors hover:text-primary"
          >
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border-subtle">
          {recentArticles.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-body text-sm text-muted">Aucun article pour le moment.</p>
              <Link
                href="/dashboard/articles/new"
                className="mt-3 inline-flex items-center gap-1.5 font-label text-xs font-bold text-primary hover:underline"
              >
                <PenSquare className="h-3.5 w-3.5" /> Créer le premier article
              </Link>
            </div>
          ) : (
            recentArticles.map((article) => {
              const status = normalizeEditorialStatus(article.status as string);
              return (
                <Link
                  key={article.id as string}
                  href={`/dashboard/articles/${article.id as string}/edit`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-newsprint"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-semibold text-foreground">
                      {String(article.title)}
                    </p>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {String((article.author as Record<string, unknown>)?.name ?? "La rédaction")}
                      {article.updatedAt ? (
                        <> · {format(new Date(article.updatedAt as string), "d MMM yyyy", { locale: fr })}</>
                      ) : null}
                    </p>
                  </div>
                  <Badge
                    variant={getEditorialStatusVariant(status)}
                  >
                    {getEditorialStatusLabel(status)}
                  </Badge>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
