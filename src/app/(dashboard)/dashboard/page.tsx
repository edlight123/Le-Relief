import { db } from "@/lib/db";
import { FileText, Eye, Users, PenSquare } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCards";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalArticles, publishedCount, draftCount, totalViews, totalUsers, recentArticles] =
    await Promise.all([
      db.article.count(),
      db.article.count({ where: { status: "published" } }),
      db.article.count({ where: { status: "draft" } }),
      db.article.aggregate({ _sum: { views: true } }),
      db.user.count(),
      db.article.findMany({
        include: { author: true, category: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "Total Articles", value: totalArticles, icon: FileText },
    { label: "Published", value: publishedCount, icon: FileText },
    { label: "Total Views", value: totalViews._sum.views || 0, icon: Eye },
    { label: "Users", value: totalUsers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <Link href="/dashboard/articles/new">
          <Button size="sm">
            <PenSquare className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      <StatsCards stats={stats} />

      {/* Recent articles */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Recent Articles
          </h2>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {recentArticles.length === 0 ? (
            <div className="px-6 py-8 text-center text-neutral-400">
              No articles yet.{" "}
              <Link
                href="/dashboard/articles/new"
                className="text-blue-600 hover:underline"
              >
                Create your first article
              </Link>
            </div>
          ) : (
            recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/dashboard/articles/${article.id}/edit`}
                className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white truncate">
                    {article.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {article.author?.name || "Unknown"} &middot;{" "}
                    {format(new Date(article.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge
                  variant={
                    article.status === "published" ? "success" : "warning"
                  }
                >
                  {article.status}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
