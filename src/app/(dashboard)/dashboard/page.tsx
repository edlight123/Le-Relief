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
    { label: "Total Articles", value: totalArticles, icon: FileText },
    { label: "Publiés", value: publishedCount, icon: FileText },
    { label: "Total Vues", value: totalViews, icon: Eye },
    { label: "Utilisateurs", value: totalUsers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Tableau de Bord
        </h1>
        <Link href="/dashboard/articles/new">
          <Button size="sm">
            <PenSquare className="h-4 w-4 mr-2" />
            Nouvel Article
          </Button>
        </Link>
      </div>

      <StatsCards stats={stats} />

      {/* Recent articles */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Articles Récents
          </h2>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {recentArticles.length === 0 ? (
            <div className="px-6 py-8 text-center text-neutral-400">
              Aucun article pour le moment.{" "}
              <Link
                href="/dashboard/articles/new"
                className="text-blue-600 hover:underline"
              >
                Créez votre premier article
              </Link>
            </div>
          ) : (
            recentArticles.map((article) => (
              <Link
                key={article.id as string}
                href={`/dashboard/articles/${article.id}/edit`}
                className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white truncate">
                    {String(article.title)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {String((article.author as Record<string, unknown>)?.name || "Unknown")} &middot;{" "}
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
