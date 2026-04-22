import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { normalizeAuthor, normalizeCategory } from "@/lib/editorial";
import { validateSourceArticleReference } from "@/lib/validation";
import { canEditArticle, canTransitionStatus, normalizeEditorialStatus, normalizeWorkflowRole } from "@/lib/editorial-workflow";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const article = await articlesRepo.getArticle(id);

  if (!article) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const author = article.authorId
    ? await usersRepo.getUser(article.authorId as string)
    : null;
  const category = article.categoryId
    ? await categoriesRepo.getCategory(article.categoryId as string)
    : null;

  return NextResponse.json({
    ...article,
    author: normalizeAuthor(author),
    category: normalizeCategory(category),
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await articlesRepo.getArticle(id);
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const sessionRole = ((session.user as { role?: string }).role || "writer").toString();
  const normalizedRole = normalizeWorkflowRole(sessionRole);
  const isOwner = existing.authorId === session.user.id;

  if (!canEditArticle(normalizedRole, isOwner, existing.status as string)) {
    return NextResponse.json({ error: "Permissions insuffisantes pour modifier cet article." }, { status: 403 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug || null;
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle || null;
  if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription || null;
  if (body.canonicalUrl !== undefined) data.canonicalUrl = body.canonicalUrl || null;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle || null;
  if (body.body !== undefined) data.body = body.body;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt || null;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
  if (body.coverImageCaption !== undefined) data.coverImageCaption = body.coverImageCaption || null;
  if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt || null;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
  if (body.contentType !== undefined) data.contentType = body.contentType || "actualite";
  if (body.language !== undefined) data.language = body.language || "fr";
  if (body.translationStatus !== undefined) {
    data.translationStatus = body.translationStatus || "not_started";
  }
  if (body.isCanonicalSource !== undefined) {
    data.isCanonicalSource = Boolean(body.isCanonicalSource);
  }
  if (body.sourceArticleId !== undefined) {
    data.sourceArticleId = body.sourceArticleId || null;
  }
  if (body.alternateLanguageSlug !== undefined) {
    data.alternateLanguageSlug = body.alternateLanguageSlug || null;
  }
  if (body.allowTranslation !== undefined) {
    data.allowTranslation = Boolean(body.allowTranslation);
  }
  if (body.translationPriority !== undefined) {
    data.translationPriority = body.translationPriority || null;
  }
  if (body.tags !== undefined) {
    data.tags = Array.isArray(body.tags)
      ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
  }
  if (body.featured !== undefined) data.featured = body.featured;
  if (body.status !== undefined) {
    const canPublish = hasRole(normalizedRole, "publisher");
    const scheduledAt = (data.scheduledAt as string) ?? (existing.scheduledAt as string) ?? null;
    const scheduledInPast = scheduledAt && new Date(scheduledAt) <= new Date();
    const requestedStatus =
      body.status === "scheduled" && scheduledInPast ? "published" : body.status;
    const normalizedRequestedStatus = normalizeEditorialStatus(requestedStatus);
    const transitionCheck = canTransitionStatus({
      role: normalizedRole,
      fromStatus: existing.status as string,
      toStatus: normalizedRequestedStatus,
      isOwner,
    });
    if (!transitionCheck.allowed) {
      return NextResponse.json({ error: transitionCheck.reason }, { status: 403 });
    }
    const nextStatus =
      normalizedRequestedStatus === "published" && !canPublish
        ? "in_review"
        : normalizedRequestedStatus;
    data.status = nextStatus;
    if (nextStatus === "published" && !existing.publishedAt) {
      data.publishedAt = scheduledInPast ? new Date(scheduledAt!) : new Date();
    } else if (nextStatus === "scheduled") {
      data.publishedAt = null;
    } else if (nextStatus !== "published") {
      data.publishedAt = null;
    }

    if (nextStatus === "in_review") {
      data.submittedForReviewAt = new Date();
    }
    if (nextStatus === "approved") {
      data.approvedAt = new Date();
      data.approvedBy = session.user.id;
    }
    if (nextStatus === "revisions_requested") {
      data.revisionRequestedAt = new Date();
      data.revisionRequestedBy = session.user.id;
    }
    if (nextStatus === "rejected") {
      data.rejectedAt = new Date();
      data.rejectedBy = session.user.id;
    }
    if (nextStatus === "published") {
      data.publishedBy = session.user.id;
    }
  }

  const nextLanguage = (data.language as string | undefined) ?? (existing.language as string) ?? "fr";
  const nextSourceArticleId =
    data.sourceArticleId !== undefined
      ? (data.sourceArticleId as string | null)
      : (existing.sourceArticleId as string | null | undefined) ?? null;

  if (existing.language === "fr" && nextLanguage === "en" && !nextSourceArticleId) {
    return NextResponse.json(
      { error: "Un article EN requiert sourceArticleId (FR → EN refusé sans source)." },
      { status: 409 },
    );
  }

  if (body.language !== undefined || body.sourceArticleId !== undefined) {
    const sourceValidation = await validateSourceArticleReference(nextLanguage, nextSourceArticleId);
    if (!sourceValidation.valid) {
      return NextResponse.json(
        { error: sourceValidation.error || "Référence source invalide" },
        { status: 400 },
      );
    }
  }

  try {
    const article = await articlesRepo.updateArticle(id, data);
    return NextResponse.json(article);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de mettre à jour l'article";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const article = await articlesRepo.getArticle(id);
  if (!article) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const sessionRole = ((session.user as { role?: string }).role || "writer").toString();
  const normalizedRole = normalizeWorkflowRole(sessionRole);
  const isOwner = article.authorId === session.user.id;
  if (!hasRole(normalizedRole, "editor") && !(normalizedRole === "writer" && isOwner)) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  if (article.language === "fr") {
    const dependents = await articlesRepo.getArticlesBySourceId(id);
    if (dependents.length > 0) {
      return NextResponse.json(
        {
          error: "Remove EN translations first",
          dependentTranslations: dependents.map((dep) => ({
            id: dep.id,
            title: dep.title,
            slug: dep.slug,
            status: dep.status,
          })),
        },
        { status: 409 },
      );
    }
  }

  await articlesRepo.deleteArticle(id);
  return NextResponse.json({ success: true });
}
