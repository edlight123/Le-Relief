import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { FileText, Eye, Users, PenSquare } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCards";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let totalArticles = 0, publishedCount = 0, draftCount = 0, totalViews = 0, totalUsers = 0;
  let recentArticles: Record<string, unknown>[] = [];
  try {
    [totalArticles, publishedCount, draftCount, totalViews, totalUsers] =
      await Promise.all([
        articlesRepo.countArticles(),
        articlesRepo.countArticles("published"),
        articlesRepo.countArticles("draft"),
        articlesRepo.sumViews(),
        usersRepo.countUsers(),
      ]);
    const rawRecentArticles = await articlesRepo.getRecentArticles(5);
    recentArticles = await Promise.all(
      rawRecentArticles.map(async (article) => {
        const author = article.authorId
          ? await usersRepo.getUser(article.authorId as string)
          : null;
        const category = article.categoryId
          ? await categoriesRepo.getCategory(article.categoryId as string)
          : null;
        return { ...article, author, category } as Record<string, unknown>;
      })
    );
  } catch {
    // Firestore queries may fail without indexes
  }

  const stats = [
    { label: "Articles", value: totalArticles, icon: FileText },
    { label: "Publiés", value: publishedCount, icon: FileText },
    { label: "Brouillons", value: draftCount, icon: FileText },
    { label: "Total Vues", value: totalViews, icon: Eye },
    { label: "Utilisateurs", value: totalUsers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between border-t-2 border-border-strong pt-4">
        <div>
          <p className="page-kicker mb-2">Bureau</p>
          <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
            Tableau de bord
          </h1>
        </div>
        <Link href="/dashboard/articles/new">
          <Button size="sm">
            <PenSquare className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        </Link>
      </div>

      <StatsCards stats={stats} />

      <div className="border border-border-subtle bg-surface">
        <div className="border-b border-border-strong px-6 py-4">
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Articles récents
          </h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {recentArticles.length === 0 ? (
            <div className="px-6 py-8 text-center font-body text-muted">
              Aucun article pour le moment.{" "}
              <Link
                href="/dashboard/articles/new"
                className="ink-link text-primary"
              >
                Créez votre premier article
              </Link>
            </div>
          ) : (
            recentArticles.map((article) => (
              <Link
                key={article.id as string}
                href={`/dashboard/articles/${article.id}/edit`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-newsprint"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-headline text-xl font-bold text-foreground">
                    {String(article.title)}
                  </p>
                  <p className="mt-1 font-label text-xs uppercase text-muted">
                    {String((article.author as Record<string, unknown>)?.name || "La rédaction")} &middot;{" "}
                    {article.updatedAt ? format(new Date((article.updatedAt as {toDate?: () => Date})?.toDate?.() ?? article.updatedAt as string), "d MMM yyyy", { locale: fr }) : ""}
                  </p>
                </div>
                <Badge
                  variant={
                    article.status === "published" ? "success" : "warning"
                  }
                >
                  {String(article.status)}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
