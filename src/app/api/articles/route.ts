import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { hasRole } from "@/lib/permissions";
import { normalizeArticle } from "@/lib/editorial";
import { validateSourceArticleReference } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const authorId = searchParams.get("authorId") || undefined;
  const language = searchParams.get("language") || undefined;
  const sourceArticleId = searchParams.get("sourceArticleId") || undefined;
  const take = parseInt(searchParams.get("take") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");
  const before = searchParams.get("before") || undefined;

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

  // Batch-fetch unique authors and categories to avoid N×2 Firestore reads
  const authorIds = [...new Set(articles.map((a) => a.authorId as string).filter(Boolean))];
  const categoryIds = [...new Set(articles.map((a) => a.categoryId as string).filter(Boolean))];

  const [authorsArr, categoriesArr] = await Promise.all([
    Promise.all(authorIds.map((id) => usersRepo.getUser(id))),
    Promise.all(categoryIds.map((id) => categoriesRepo.getCategory(id))),
  ]);

  const authorMap = new Map(authorsArr.filter(Boolean).map((u) => [u!.id as string, u]));
  const categoryMap = new Map(categoriesArr.filter(Boolean).map((c) => [c!.id as string, c]));

  const hydrated = articles.map((article) =>
    normalizeArticle(
      article,
      authorMap.get(article.authorId as string) ?? null,
      categoryMap.get(article.categoryId as string) ?? null,
    )
  );

  return NextResponse.json({ articles: hydrated, total });
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
