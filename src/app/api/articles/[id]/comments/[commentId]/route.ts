import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveComment } from "@/lib/repositories/editorial/comments";
import { logEditorialEvent } from "@/lib/repositories/editorial/audit";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

export async function PATCH(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id, commentId } = await params;
  const comment = await resolveComment(commentId, session.user.id);
  if (!comment) {
    return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
  }

  await logEditorialEvent({
    articleId: id,
    actorId: session.user.id,
    type: "comment_resolved",
    note: `Commentaire ${commentId} résolu`,
  });

  return NextResponse.json(comment);
}
