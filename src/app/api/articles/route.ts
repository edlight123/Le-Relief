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
import { canTransitionStatus, normalizeEditorialStatus, normalizeWorkflowRole } from "@/lib/editorial-workflow";
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
import type { Role } from "@/types/user";
import { validatePublishReadiness } from "@/lib/editorial-quality";
import { logEditorialEvent } from "@/lib/repositories/editorial/audit";
import { broadcastArticlePublished } from "@/lib/push";

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
  const session = await auth();
  const sessionRole = ((session?.user as { role?: Role } | undefined)?.role || "writer") as Role;
  const normalizedRole = normalizeWorkflowRole(sessionRole);

  const { searchParams } = new URL(req.url);
  let status = normalizeOptionalFilter(searchParams.get("status"));
  const search = normalizeOptionalFilter(searchParams.get("search"));
  const categoryId = normalizeOptionalFilter(searchParams.get("categoryId"));
  let authorId = normalizeOptionalFilter(searchParams.get("authorId"));
  const language = normalizeLanguageFilter(searchParams.get("language"));
  const sourceArticleId = normalizeOptionalFilter(searchParams.get("sourceArticleId"));
  const take = parseBoundedInt(searchParams.get("take"), 20, 1, 100);
  const skip = parseBoundedInt(searchParams.get("skip"), 0, 0, 5000);
  const before = normalizeOptionalFilter(searchParams.get("before"));
  const contentType = normalizeContentType(searchParams.get("contentType"));
  const dateRange = normalizeDateRange(searchParams.get("dateRange"));
  const sortBy = normalizeSortBy(searchParams.get("sortBy"), Boolean(search));

  if (!session?.user?.id) {
    status = "published";
    authorId = undefined;
  } else if (normalizedRole === "writer") {
    const requestedStatus = normalizeEditorialStatus(status || "draft");
    if (requestedStatus !== "published" && !authorId) {
      authorId = session.user.id;
    }
  }

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
    const paginated = ranked.slice(skip, skip + take).map((item) => {
      const article = { ...item } as SearchRouteArticle & { _score?: number };
      delete article._score;
      return article;
    });
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
    const sessionRole = ((session.user as { role?: string }).role || "writer").toString();
    const normalizedRole = normalizeWorkflowRole(sessionRole);

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
    const requestedStatus = body.status || "draft";
    const normalizedRequestedStatus = normalizeEditorialStatus(requestedStatus);
    const transitionCheck = canTransitionStatus({
      role: normalizedRole,
      fromStatus: "draft",
      toStatus: normalizedRequestedStatus,
      isOwner: true,
    });
    if (!transitionCheck.allowed) {
      return NextResponse.json({ error: transitionCheck.reason }, { status: 403 });
    }

    const canPublish = hasRole(normalizedRole, "editor");
    const status = normalizedRequestedStatus === "published" && !canPublish
      ? "in_review"
      : normalizedRequestedStatus;

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

    const workflowDates: Record<string, unknown> = {};
    if (resolvedStatus === "in_review") {
      workflowDates.submittedForReviewAt = new Date();
    }
    if (resolvedStatus === "approved") {
      workflowDates.approvedAt = new Date();
      workflowDates.approvedBy = session.user.id;
    }
    if (resolvedStatus === "revisions_requested") {
      workflowDates.revisionRequestedAt = new Date();
      workflowDates.revisionRequestedBy = session.user.id;
    }
    if (resolvedStatus === "rejected") {
      workflowDates.rejectedAt = new Date();
      workflowDates.rejectedBy = session.user.id;
    }
    if (resolvedStatus === "published") {
      workflowDates.publishedBy = session.user.id;
    }

    // Auto-generate SEO fields when not provided
    const resolvedExcerpt = body.excerpt?.trim() || null;
    const autoSeoTitle = body.title?.trim()
      ? `${body.title.trim()} | Le Relief`
      : null;
    const rawBodyText = (body.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const autoMetaDescription = resolvedExcerpt || (rawBodyText.slice(0, 155) || null);

    // When an editor/publisher/admin creates an article on behalf of someone
    // else (via the "Assigner à" field), that user should own the byline —
    // not the staff member who happens to be logged in.
    const requestedAssignedTo =
      typeof body.assignedTo === "string" && body.assignedTo.trim()
        ? body.assignedTo.trim()
        : null;
    const resolvedAuthorId =
      requestedAssignedTo && hasRole(normalizedRole, "editor")
        ? requestedAssignedTo
        : session.user.id;

    const article = await articlesRepo.createArticle({
      title: body.title,
      subtitle: body.subtitle || null,
      slug: body.slug || slug,
      body: body.body,
      excerpt: resolvedExcerpt,
      seoTitle: body.seoTitle?.trim() || autoSeoTitle,
      metaDescription: body.metaDescription?.trim() || autoMetaDescription,
      canonicalUrl: body.canonicalUrl || null,
      coverImage: body.coverImage || null,
      coverImageCaption: body.coverImageCaption || null,
      tags: Array.isArray(body.tags)
        ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : [],
      status: resolvedStatus,
      featured: body.featured || false,
      priorityLevel: body.priorityLevel || null,
      isBreaking: Boolean(body.isBreaking),
      isHomepagePinned: Boolean(body.isHomepagePinned),
      authorId: resolvedAuthorId,
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
      coAuthors: Array.isArray(body.coAuthors)
        ? body.coAuthors.map(String).filter(Boolean)
        : [],
      assignedTo: body.assignedTo || null,
      ...workflowDates,
    });

    if (resolvedStatus === "published") {
      const readiness = await validatePublishReadiness({
        articleId: String(article.id),
        title: String(article.title || ""),
        body: String(article.body || ""),
        excerpt: String(article.excerpt || ""),
        coverImage: String(article.coverImage || ""),
        categoryId: String(article.categoryId || ""),
        contentType: String(article.contentType || ""),
        slug: String(article.slug || ""),
        seoTitle: String(article.seoTitle || ""),
        metaDescription: String(article.metaDescription || ""),
      });

      if (!readiness.valid) {
        await articlesRepo.updateArticle(String(article.id), {
          status: "approved",
          publishedAt: null,
        });
        return NextResponse.json(
          { error: `Publication bloquée: ${readiness.errors.join(", ")}` },
          { status: 422 },
        );
      }
    }

    await logEditorialEvent({
      articleId: String(article.id),
      actorId: session.user.id,
      type: "article_created",
      toStatus: String(article.status || "draft"),
    });

    if (resolvedStatus === "in_review") {
      await logEditorialEvent({
        articleId: String(article.id),
        actorId: session.user.id,
        type: "submitted_for_review",
        toStatus: "in_review",
      });
    }
    if (resolvedStatus === "approved") {
      await logEditorialEvent({
        articleId: String(article.id),
        actorId: session.user.id,
        type: "approved",
        toStatus: "approved",
      });
    }
    if (resolvedStatus === "revisions_requested") {
      await logEditorialEvent({
        articleId: String(article.id),
        actorId: session.user.id,
        type: "revision_requested",
        toStatus: "revisions_requested",
      });
    }
    if (resolvedStatus === "rejected") {
      await logEditorialEvent({
        articleId: String(article.id),
        actorId: session.user.id,
        type: "rejected",
        toStatus: "rejected",
      });
    }
    if (resolvedStatus === "scheduled") {
      await logEditorialEvent({
        articleId: String(article.id),
        actorId: session.user.id,
        type: "scheduled",
        toStatus: "scheduled",
      });
    }
    if (resolvedStatus === "published") {
      await logEditorialEvent({
        articleId: String(article.id),
        actorId: session.user.id,
        type: "published",
        toStatus: "published",
      });
      broadcastArticlePublished({
        id: String(article.id),
        title: String(article.title || ""),
        slug: String(article.slug || ""),
        excerpt: String(article.excerpt || ""),
        language: String(article.language || "fr"),
        coverImage: String(article.coverImage || ""),
      });
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de créer l'article";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
