import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import { FileText, Eye, Users, FileCheck, TrendingUp } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCards";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { format, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [totalArticles, publishedCount, draftCount, totalViews, totalUsers, topArticles, allPublished] =
    await Promise.all([
      articlesRepo.countArticles(),
      articlesRepo.countArticles("published"),
      articlesRepo.countArticles("draft"),
      articlesRepo.sumViews(),
      usersRepo.countUsers(),
      articlesRepo.getTopArticlesByViews(10),
      articlesRepo.getPublishedArticles(500),
    ]);

  const stats = [
    { label: "Articles", value: totalArticles, icon: FileText },
    { label: "Publiés", value: publishedCount, icon: FileCheck },
    { label: "Brouillons", value: draftCount, icon: FileText },
    { label: "Vues", value: totalViews, icon: Eye },
    { label: "Utilisateurs", value: totalUsers, icon: Users },
  ];

  // Published articles per month (last 6 months) — real data
  const now = new Date();
  const publishedData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(month, -1));
    const count = allPublished.filter((a) => {
      const d = new Date((a.publishedAt as string) || 0);
      return d >= start && d < end;
    }).length;
    return { label: format(month, "MMM", { locale: fr }), value: count };
  });

  // Views chart — kept as placeholder since we don't track per-day views yet
  const viewsBase = Math.max(1, Math.ceil(totalViews / 7));
  const viewsData = Array.from({ length: 7 }, (_, i) => ({
    label: format(new Date(Date.now() - (6 - i) * 86400000), "d MMM", { locale: fr }),
    value: Math.max(0, viewsBase + Math.round((i - 3) * viewsBase * 0.15)),
  }));

  return (
    <div className="space-y-8">
      <header className="border-t-2 border-border-strong pt-4">
        <p className="page-kicker mb-2">Mesure</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Analytiques
        </h1>
      </header>

      <StatsCards stats={stats} />
      <AnalyticsCharts viewsData={viewsData} publishedData={publishedData} />

      {topArticles.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
                Articles les plus lus
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ol>
              {topArticles.map((article, index) => (
                <li
                  key={article.id as string}
                  className="flex items-center gap-4 border-b border-border-subtle px-6 py-3 last:border-0"
                >
                  <span className="w-6 font-label text-xs font-extrabold text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/articles/${article.slug as string}`}
                      target="_blank"
                      className="block truncate font-body text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {article.title as string}
                    </Link>
                  </div>
                  <span className="flex items-center gap-1 font-label text-xs font-bold text-muted">
                    <Eye className="h-3 w-3" />
                    {(article.views as number).toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
