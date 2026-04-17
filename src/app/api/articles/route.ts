import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { hasRole } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const take = parseInt(searchParams.get("take") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");

  const { articles, total } = await articlesRepo.getArticles({
    status: status !== "all" ? status : undefined,
    search,
    take,
    skip,
  });

  // Hydrate author and category
  const hydrated = await Promise.all(
    articles.map(async (article) => {
      const author = article.authorId
        ? await usersRepo.getUser(article.authorId as string)
        : null;
      const category = article.categoryId
        ? await categoriesRepo.getCategory(article.categoryId as string)
        : null;
      return { ...article, author, category } as Record<string, unknown>;
    })
  );

  return NextResponse.json({ articles: hydrated, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
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

    const article = await articlesRepo.createArticle({
      title: body.title,
      subtitle: body.subtitle || null,
      slug,
      body: body.body,
      excerpt: body.excerpt || null,
      coverImage: body.coverImage || null,
      tags: Array.isArray(body.tags)
        ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : [],
      status,
      featured: body.featured || false,
      authorId: session.user.id,
      categoryId: body.categoryId || null,
      publishedAt: status === "published" ? new Date() : null,
    });

    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
