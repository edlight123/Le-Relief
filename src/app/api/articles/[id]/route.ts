import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { normalizeAuthor, normalizeCategory } from "@/lib/editorial";
import { validateSourceArticleReference } from "@/lib/validation";
import { canEditArticle, canTransitionStatus, normalizeEditorialStatus, normalizeWorkflowRole } from "@/lib/editorial-workflow";
import { validatePublishReadiness } from "@/lib/editorial-quality";
import { logEditorialEvent } from "@/lib/repositories/editorial/audit";
import * as notificationsRepo from "@/lib/repositories/notifications";
import { broadcastArticlePublished } from "@/lib/push";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const article = await articlesRepo.getArticle(id);

  if (!article) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Only allow non-published articles for authenticated admin/editor users
  if (article.status !== "published") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    const sessionRole = ((session.user as { role?: string }).role || "writer").toString();
    const normalizedRole = normalizeWorkflowRole(sessionRole);
    if (!hasRole(normalizedRole, "editor")) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
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
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle?.trim() || null;
  if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription?.trim() || null;
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

  // Auto-fill SEO fields so publishing never blocks on missing slug/seoTitle/metaDescription
  const effectiveTitle = (data.title as string | undefined) ?? (existing.title as string | undefined) ?? "";
  const effectiveExcerpt = (data.excerpt as string | undefined) ?? (existing.excerpt as string | undefined) ?? "";
  const effectiveBody = (data.body as string | undefined) ?? (existing.body as string | undefined) ?? "";
  const rawBodyText = effectiveBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!data.slug && !(existing.slug as string | undefined)?.trim()) {
    const { generateSlug } = await import("@/lib/slug");
    data.slug = generateSlug(effectiveTitle);
  }
  if (!data.seoTitle && !(existing.seoTitle as string | undefined)?.trim()) {
    data.seoTitle = effectiveTitle ? `${effectiveTitle} | Le Relief` : null;
  }
  if (!data.metaDescription && !(existing.metaDescription as string | undefined)?.trim()) {
    data.metaDescription = effectiveExcerpt.trim() || rawBodyText.slice(0, 155) || null;
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
  if (body.priorityLevel !== undefined) data.priorityLevel = body.priorityLevel || null;
  if (body.isBreaking !== undefined) data.isBreaking = Boolean(body.isBreaking);
  if (body.correction !== undefined) data.correction = body.correction || null;
  if (body.correctionDate !== undefined) data.correctionDate = body.correctionDate || null;
  if (body.isHomepagePinned !== undefined) data.isHomepagePinned = Boolean(body.isHomepagePinned);
  if (body.coAuthors !== undefined) {
    data.coAuthors = Array.isArray(body.coAuthors)
      ? body.coAuthors.map(String).filter(Boolean)
      : [];
  }
  if (body.assignedTo !== undefined && hasRole(normalizedRole, "editor")) {
    const newAssignedTo = body.assignedTo || null;
    const existingAssignedTo = (existing.assignedTo as string | null | undefined) ?? null;
    // Only update assignedTo if the value is actually changing to prevent
    // autosave from accidentally clearing an explicitly-set assignment
    if (newAssignedTo !== existingAssignedTo) {
      data.assignedTo = newAssignedTo;
    }
    // Always keep authorId in sync with the effective assignedTo so that
    // publishing reflects the assigned author's byline — even when the
    // request does not change assignedTo (e.g. publisher hits "Publish"
    // on an article that was assigned earlier but whose authorId still
    // points at whoever first created the record).
    const effectiveAssignedTo = newAssignedTo ?? existingAssignedTo;
    if (
      effectiveAssignedTo &&
      (existing.authorId as string | null | undefined) !== effectiveAssignedTo
    ) {
      data.authorId = effectiveAssignedTo;
    }
  }
  if (body.status !== undefined) {
    const _canPublish = hasRole(normalizedRole, "editor");
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
    const nextStatus = normalizedRequestedStatus;
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

    if (!article) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    // Propagate author/assignee changes to linked EN translations
    const isfrArticle = (existing.language as string | undefined) === "fr";
    const authorChanged = data.authorId !== undefined;
    const assignedChanged = data.assignedTo !== undefined;
    if (isfrArticle && (authorChanged || assignedChanged)) {
      const enTranslations = await articlesRepo.getArticlesBySourceId(id);
      const propagate: Record<string, unknown> = {};
      if (authorChanged) propagate.authorId = data.authorId;
      if (assignedChanged) propagate.assignedTo = data.assignedTo;
      await Promise.all(
        enTranslations.map((en) => articlesRepo.updateArticle(String(en.id), propagate)),
      );
    }

    const nextStatus = String((article as Record<string, unknown>).status || existing.status || "draft");
    if (nextStatus === "published") {
      const readiness = await validatePublishReadiness({
        articleId: id,
        title: String((article as Record<string, unknown>).title || ""),
        body: String((article as Record<string, unknown>).body || ""),
        excerpt: String((article as Record<string, unknown>).excerpt || ""),
        coverImage: String((article as Record<string, unknown>).coverImage || ""),
        categoryId: String((article as Record<string, unknown>).categoryId || ""),
        contentType: String((article as Record<string, unknown>).contentType || ""),
        slug: String((article as Record<string, unknown>).slug || ""),
        seoTitle: String((article as Record<string, unknown>).seoTitle || ""),
        metaDescription: String((article as Record<string, unknown>).metaDescription || ""),
      });

      if (!readiness.valid) {
        await articlesRepo.updateArticle(id, { status: "approved", publishedAt: null });
        return NextResponse.json(
          { error: `Publication bloquée: ${readiness.errors.join(", ")}` },
          { status: 422 },
        );
      }
    }

    const previousStatus = String(existing.status || "draft");
    if (previousStatus !== nextStatus) {
      const eventType =
        nextStatus === "in_review"
          ? "submitted_for_review"
          : nextStatus === "approved"
          ? "approved"
          : nextStatus === "revisions_requested"
          ? "revision_requested"
          : nextStatus === "rejected"
          ? "rejected"
          : nextStatus === "scheduled"
          ? "scheduled"
          : nextStatus === "published"
          ? "published"
          : nextStatus === "archived"
          ? "archived"
          : "article_updated";

      await logEditorialEvent({
        articleId: id,
        actorId: session.user.id,
        type: eventType,
        fromStatus: previousStatus,
        toStatus: nextStatus,
      });

      // Fire in-app notifications
      const articleTitle = String((article as Record<string, unknown>).title || "");
      const actorName = (session.user as { name?: string }).name || "Rédaction";
      const authorId = String((article as Record<string, unknown>).authorId || existing.authorId || "");

      if (nextStatus === "in_review" && authorId !== session.user.id) {
        // Notify editors that a new article is waiting for review
        const editors = await import("@/lib/repositories/users")
          .then((m) => m.getUsers())
          .then((users) =>
            users.filter((u) =>
              ["editor", "publisher", "admin"].includes(String(u.role || "")),
            ),
          );
        await Promise.all(
          editors.map((ed) =>
            notificationsRepo.createNotification({
              userId: String(ed.id),
              type: "article_submitted",
              articleId: id,
              articleTitle,
              actorName,
              message: `${actorName} a soumis « ${articleTitle} » pour review.`,
            }),
          ),
        );
      } else if (
        (nextStatus === "approved" ||
          nextStatus === "revisions_requested" ||
          nextStatus === "rejected" ||
          nextStatus === "published") &&
        authorId
      ) {
        const msgMap: Record<string, string> = {
          approved: `Votre article « ${articleTitle} » a été approuvé.`,
          revisions_requested: `Des révisions ont été demandées pour « ${articleTitle} ».`,
          rejected: `Votre article « ${articleTitle} » a été rejeté.`,
          published: `Votre article « ${articleTitle} » est maintenant publié !`,
        };
        const typeMap: Record<string, notificationsRepo.NotificationData["type"]> = {
          approved: "article_approved",
          revisions_requested: "revision_requested",
          rejected: "article_rejected",
          published: "article_published",
        };
        if (authorId !== session.user.id) {
          await notificationsRepo.createNotification({
            userId: authorId,
            type: typeMap[nextStatus]!,
            articleId: id,
            articleTitle,
            actorName,
            message: msgMap[nextStatus]!,
          });
        }
      }

      // Broadcast push notification to subscribed readers when an article is published
      if (nextStatus === "published") {
        const a = article as Record<string, unknown>;
        broadcastArticlePublished({
          id: String(a.id || id),
          title: String(a.title || ""),
          slug: String(a.slug || ""),
          excerpt: String(a.excerpt || ""),
          language: String(a.language || existing.language || "fr"),
          coverImage: String(a.coverImage || ""),
        });
      }
    } else {
      await logEditorialEvent({
        articleId: id,
        actorId: session.user.id,
        type: "metadata_updated",
        fromStatus: previousStatus,
        toStatus: nextStatus,
      });
    }

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
  await logEditorialEvent({
    articleId: id,
    actorId: session.user.id,
    type: "archived",
    fromStatus: String(article.status || "draft"),
    toStatus: "archived",
    note: "Article supprimé",
  });
  return NextResponse.json({ success: true });
}
