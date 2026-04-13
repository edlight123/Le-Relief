import { db } from "@/lib/db";
import { subDays, format } from "date-fns";

export async function getStats() {
  const [totalArticles, published, drafts, totalViews, totalUsers] =
    await Promise.all([
      db.article.count(),
      db.article.count({ where: { status: "published" } }),
      db.article.count({ where: { status: "draft" } }),
      db.article.aggregate({ _sum: { views: true } }),
      db.user.count(),
    ]);

  return {
    totalArticles,
    published,
    drafts,
    totalViews: totalViews._sum.views || 0,
    totalUsers,
  };
}

export async function getViewsOverTime(days: number = 7) {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    return {
      label: format(date, "MMM d"),
      value: Math.floor(Math.random() * 100) + 10,
    };
  });
}

export async function getPublishedOverTime(months: number = 6) {
  return Array.from({ length: months }, (_, i) => {
    const date = subDays(new Date(), (months - 1 - i) * 30);
    return {
      label: format(date, "MMM"),
      value: Math.floor(Math.random() * 10) + 1,
    };
  });
}
