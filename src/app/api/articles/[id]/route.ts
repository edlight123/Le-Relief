import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import { normalizeAuthor, normalizeCategory } from "@/lib/editorial";

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
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
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
    const sessionRole = (session.user as { role?: "reader" | "publisher" | "admin" }).role;
    const canPublish = hasRole(
      sessionRole || "reader",
      "publisher"
    );
    const scheduledAt = (data.scheduledAt as string) ?? (existing.scheduledAt as string) ?? null;
    const scheduledInPast = scheduledAt && new Date(scheduledAt) <= new Date();
    const requestedStatus =
      body.status === "scheduled" && scheduledInPast ? "published" : body.status;
    const nextStatus =
      requestedStatus === "published" && !canPublish ? "pending_review" : requestedStatus;
    data.status = nextStatus;
    if (nextStatus === "published" && !existing.publishedAt) {
      data.publishedAt = scheduledInPast ? new Date(scheduledAt!) : new Date();
    } else if (nextStatus === "scheduled") {
      data.publishedAt = null;
    } else if (nextStatus !== "published") {
      data.publishedAt = null;
    }
  }

  const article = await articlesRepo.updateArticle(id, data);
  return NextResponse.json(article);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  await articlesRepo.deleteArticle(id);
  return NextResponse.json({ success: true });
}
