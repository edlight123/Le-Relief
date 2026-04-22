import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as commentsRepo from "@/lib/repositories/editorial/comments";
import * as usersRepo from "@/lib/repositories/users";
import { logEditorialEvent } from "@/lib/repositories/editorial/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const comments = await commentsRepo.getCommentsByArticle(id);

  const authorIds = [...new Set(comments.map((comment) => String(comment.authorId || "")).filter(Boolean))];
  const authors = await Promise.all(authorIds.map((authorId) => usersRepo.getUser(authorId)));
  const authorMap = new Map(authors.filter(Boolean).map((author) => [String(author!.id), author]));

  const hydrated = comments.map((comment) => ({
    ...comment,
    author: authorMap.get(String(comment.authorId || "")) || null,
  }));

  return NextResponse.json({ comments: hydrated });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const type = body.type === "blocking" || body.type === "revision_note" ? body.type : "comment";
  const commentBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!commentBody) {
    return NextResponse.json({ error: "Commentaire requis" }, { status: 400 });
  }

  const comment = await commentsRepo.addComment({
    articleId: id,
    authorId: session.user.id,
    type,
    body: commentBody,
  });

  await logEditorialEvent({
    articleId: id,
    actorId: session.user.id,
    type: "comment_added",
    note: `${type}: ${commentBody.slice(0, 160)}`,
  });

  return NextResponse.json(comment, { status: 201 });
}
