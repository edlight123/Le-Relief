import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { matchesPrefix } from "@/lib/search-ranking";
import * as analyticsRepo from "@/lib/repositories/analytics";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";

export const revalidate = 300;

function normalizeLocale(value: string | null) {
  return value === "en" ? "en" : "fr";
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale"));
  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  const [articles, searchQueries, categories] = await Promise.all([
    articlesRepo.getPublishedArticles(120, locale),
    analyticsRepo.getTopSearchQueries(startDate, endDate, locale, 50).catch(() => []),
    categoriesRepo.getCategoriesWithCounts(true).catch(() => []),
  ]);

  const normalizedCategories = categories
    .map((category) => ({
      id: String(category.id || ""),
      name: String(category.name || ""),
      slug: String(category.slug || ""),
      description: (category.description as string | null | undefined) || null,
      count: (category._count as { articles: number } | undefined)?.articles || 0,
    }))
    .filter((category) => category.id && category.slug && category.name)
    .sort((left, right) => (right.count || 0) - (left.count || 0));

  const filteredArticles = articles
    .filter((article) => {
      if (!query) return true;
      return matchesPrefix(String(article.title || ""), query);
    })
    .slice(0, 6)
    .map((article) => ({
      id: String(article.id || ""),
      title: String(article.title || ""),
      slug: String(article.slug || ""),
      language: article.language === "en" ? "en" : "fr",
    }));

  const filteredQueries = searchQueries
    .map((item) => item.query)
    .filter((item) => (query ? matchesPrefix(item, query) : true))
    .slice(0, 8);

  const filteredCategories = normalizedCategories
    .filter((category) => (query ? matchesPrefix(category.name, query) : true))
    .slice(0, 6);

  return NextResponse.json(
    {
      articles: filteredArticles,
      queries: filteredQueries,
      categories: filteredCategories,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
