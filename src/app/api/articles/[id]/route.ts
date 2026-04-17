import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const article = await articlesRepo.getArticle(id);

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const author = article.authorId
    ? await usersRepo.getUser(article.authorId as string)
    : null;
  const category = article.categoryId
    ? await categoriesRepo.getCategory(article.categoryId as string)
    : null;

  return NextResponse.json({ ...article, author, category });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await articlesRepo.getArticle(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle || null;
  if (body.body !== undefined) data.body = body.body;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt || null;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
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
    const nextStatus =
      body.status === "published" && !canPublish
        ? "pending_review"
        : body.status;
    data.status = nextStatus;
    if (nextStatus === "published" && !existing.publishedAt) {
      data.publishedAt = new Date();
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await articlesRepo.deleteArticle(id);
  return NextResponse.json({ success: true });
}
