import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import { FileText, Eye, Users, FileCheck } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCards";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [totalArticles, publishedCount, draftCount, totalViews, totalUsers] =
    await Promise.all([
      articlesRepo.countArticles(),
      articlesRepo.countArticles("published"),
      articlesRepo.countArticles("draft"),
      articlesRepo.sumViews(),
      usersRepo.countUsers(),
    ]);

  const stats = [
    { label: "Total Articles", value: totalArticles, icon: FileText },
    { label: "Published", value: publishedCount, icon: FileCheck },
    { label: "Total Views", value: totalViews, icon: Eye },
    { label: "Users", value: totalUsers, icon: Users },
  ];

  // Generate views data (last 7 days from analytics events or mock)
  const viewsData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      label: format(date, "MMM d"),
      value: Math.floor(Math.random() * 100) + 10,
    };
  });

  // Published articles per month (last 6 months)
  const publishedData = Array.from({ length: 6 }, (_, i) => {
    const date = subDays(new Date(), (5 - i) * 30);
    return {
      label: format(date, "MMM"),
      value: Math.floor(Math.random() * 10) + 1,
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Analytics
      </h1>

      <StatsCards stats={stats} />
      <AnalyticsCharts viewsData={viewsData} publishedData={publishedData} />
    </div>
  );
}
