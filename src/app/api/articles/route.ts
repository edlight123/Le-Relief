import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import * as articlesRepo from "@/lib/repositories/articles";
import * as analyticsRepo from "@/lib/repositories/analytics";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { hasRole } from "@/lib/permissions";
import { normalizeArticle } from "@/lib/editorial";
import {
  filterByDateRange,
  findDidYouMean,
  rankSearchResults,
  sortSearchResults,
  type SearchDateRange,
  type SearchSortOption,
  type SearchableArticle,
} from "@/lib/search-ranking";
import { validateSourceArticleReference } from "@/lib/validation";

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeLanguageFilter(value: string | null): "fr" | "en" | undefined {
  if (value === "fr" || value === "en") return value;
  return undefined;
}

function normalizeOptionalFilter(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeDateRange(value: string | null): SearchDateRange {
  if (value === "week" || value === "month" || value === "quarter") return value;
  return "all";
}

function normalizeSortBy(value: string | null, hasSearch: boolean): SearchSortOption {
  if (value === "recent" || value === "most_viewed" || value === "relevance") return value;
  return hasSearch ? "relevance" : "recent";
}

function normalizeContentType(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

type SearchRouteArticle = Record<string, unknown> & SearchableArticle;

async function hydrateArticles(articles: Record<string, unknown>[]) {
  const authorIds = [...new Set(articles.map((a) => a.authorId as string).filter(Boolean))];
  const categoryIds = [...new Set(articles.map((a) => a.categoryId as string).filter(Boolean))];

  const [authorsArr, categoriesArr] = await Promise.all([
    Promise.all(authorIds.map((id) => usersRepo.getUser(id))),
    Promise.all(categoryIds.map((id) => categoriesRepo.getCategory(id))),
  ]);

  const authorMap = new Map(authorsArr.filter(Boolean).map((u) => [u!.id as string, u]));
  const categoryMap = new Map(categoriesArr.filter(Boolean).map((c) => [c!.id as string, c]));

  return articles.map((article) =>
    normalizeArticle(
      article,
      authorMap.get(article.authorId as string) ?? null,
      categoryMap.get(article.categoryId as string) ?? null,
    ),
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = normalizeOptionalFilter(searchParams.get("status"));
  const search = normalizeOptionalFilter(searchParams.get("search"));
  const categoryId = normalizeOptionalFilter(searchParams.get("categoryId"));
  const authorId = normalizeOptionalFilter(searchParams.get("authorId"));
  const language = normalizeLanguageFilter(searchParams.get("language"));
  const sourceArticleId = normalizeOptionalFilter(searchParams.get("sourceArticleId"));
  const take = parseBoundedInt(searchParams.get("take"), 20, 1, 100);
  const skip = parseBoundedInt(searchParams.get("skip"), 0, 0, 5000);
  const before = normalizeOptionalFilter(searchParams.get("before"));
  const contentType = normalizeContentType(searchParams.get("contentType"));
  const dateRange = normalizeDateRange(searchParams.get("dateRange"));
  const sortBy = normalizeSortBy(searchParams.get("sortBy"), Boolean(search));

  const needsAdvancedSearch = Boolean(search || contentType || dateRange !== "all" || sortBy !== "recent");

  if (needsAdvancedSearch) {
    const baseTake = Math.min(500, Math.max(150, (take + skip) * 8));
    const { articles } = await articlesRepo.getArticles({
      status: status !== "all" ? status : undefined,
      categoryId,
      authorId,
      language,
      sourceArticleId,
      take: baseTake,
      skip: 0,
      before,
      orderBy: sortBy === "most_viewed" ? "views" : "publishedAt",
    });

    let filtered = articles as SearchRouteArticle[];

    if (contentType) {
      filtered = filtered.filter((article) => article.contentType === contentType);
    }

    if (dateRange !== "all") {
      filtered = filterByDateRange<SearchRouteArticle>(filtered, dateRange);
    }

    const ranked = search
      ? rankSearchResults<SearchRouteArticle>(filtered, {
          query: search,
          selectedCategoryId: categoryId,
          sortBy,
        })
      : sortSearchResults(
          filtered.map((article) => ({ ...article, _score: 0 })),
          sortBy,
        );

    const total = ranked.length;
    const paginated = ranked.slice(skip, skip + take).map(({ _score: _ignored, ...article }) => article);
    const hydrated = await hydrateArticles(paginated as Record<string, unknown>[]);

    let searchMeta:
      | {
          didYouMean: string | null;
          popularSearches: string[];
          relatedCategories: Array<{ id: string; name: string; slug: string; description: string | null }>;
        }
      | undefined;

    if (search && hydrated.length === 0) {
      const [topQueries, rawCategories] = await Promise.all([
        analyticsRepo.getTopSearchQueries(subDays(new Date(), 30), new Date(), language || undefined, 50).catch(() => []),
        categoriesRepo.getCategories().catch(() => []),
      ]);

      const candidateTerms = [
        ...topQueries.map((item) => item.query),
        ...filtered.map((article) => String(article.title || "")),
        ...rawCategories.map((category) => String(category.name || "")),
      ].filter(Boolean);

      const loweredSearch = search.toLowerCase();
      searchMeta = {
        didYouMean: findDidYouMean(search, candidateTerms),
        popularSearches: topQueries.slice(0, 6).map((item) => item.query),
        relatedCategories: rawCategories
          .filter((category) => {
            const name = String(category.name || "").toLowerCase();
            const description = String(category.description || "").toLowerCase();
            return name.includes(loweredSearch) || description.includes(loweredSearch);
          })
          .slice(0, 4)
          .map((category) => ({
            id: String(category.id || ""),
            name: String(category.name || ""),
            slug: String(category.slug || ""),
            description: (category.description as string | null | undefined) || null,
          })),
      };
    }

    return NextResponse.json({
      articles: hydrated,
      total,
      searchMeta,
    });
  }

  const { articles, total } = await articlesRepo.getArticles({
    status: status !== "all" ? status : undefined,
    search,
    categoryId,
    authorId,
    language,
    sourceArticleId,
    take,
    skip: before ? 0 : skip,
    before,
  });
  const hydrated = await hydrateArticles(articles as Record<string, unknown>[]);

  return NextResponse.json({
    articles: hydrated,
    total,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const language = body.language || "fr";
    const sourceArticleId = body.sourceArticleId || null;
    const sourceValidation = await validateSourceArticleReference(language, sourceArticleId);
    if (!sourceValidation.valid) {
      return NextResponse.json(
        { error: sourceValidation.error || "Référence source invalide" },
        { status: 400 },
      );
    }

    const slug = generateSlug(body.title);
    const sessionRole = (session.user as { role?: "reader" | "publisher" | "admin" }).role;
    const requestedStatus = body.status || "draft";
    const canPublish = hasRole(
      sessionRole || "reader",
      "publisher"
    );
    const status =
      requestedStatus === "published" && !canPublish
        ? "pending_review"
        : requestedStatus;

    const scheduledAt = body.scheduledAt || null;
    const publishedAt =
      status === "published"
        ? new Date()
        : status === "scheduled" && scheduledAt && new Date(scheduledAt) <= new Date()
        ? new Date(scheduledAt)
        : null;
    const resolvedStatus =
      status === "scheduled" && publishedAt
        ? "published"
        : status;

    const article = await articlesRepo.createArticle({
      title: body.title,
      subtitle: body.subtitle || null,
      slug,
      body: body.body,
      excerpt: body.excerpt || null,
      coverImage: body.coverImage || null,
      coverImageCaption: body.coverImageCaption || null,
      tags: Array.isArray(body.tags)
        ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : [],
      status: resolvedStatus,
      featured: body.featured || false,
      authorId: session.user.id,
      categoryId: body.categoryId || null,
      contentType: body.contentType || "actualite",
      language,
      translationStatus: language === "fr" ? "not_applicable" : body.translationStatus || "not_started",
      isCanonicalSource: language === "fr",
      sourceArticleId,
      alternateLanguageSlug: body.alternateLanguageSlug || null,
      allowTranslation: language === "fr" ? Boolean(body.allowTranslation) : false,
      translationPriority: body.translationPriority || null,
      publishedAt,
      scheduledAt,
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de créer l'article";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
