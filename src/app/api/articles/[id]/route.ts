import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle || null;
  if (body.body !== undefined) data.body = body.body;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt || null;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
  if (body.featured !== undefined) data.featured = body.featured;
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "published") {
      data.publishedAt = new Date();
    }
  }

  const article = await db.article.update({ where: { id }, data });
  return NextResponse.json(article);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.article.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
