import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const take = parseInt(searchParams.get("take") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { body: { contains: search } },
      { excerpt: { contains: search } },
    ];
  }

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      include: { author: { select: { id: true, name: true, image: true } }, category: true },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    }),
    db.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const slug = generateSlug(body.title);

    const article = await db.article.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        slug,
        body: body.body,
        excerpt: body.excerpt || null,
        coverImage: body.coverImage || null,
        status: body.status || "draft",
        featured: body.featured || false,
        authorId: session.user.id,
        categoryId: body.categoryId || null,
        publishedAt: body.status === "published" ? new Date() : null,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
