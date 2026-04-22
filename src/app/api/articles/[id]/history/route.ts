import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticleHistory } from "@/lib/repositories/editorial/audit";
import * as usersRepo from "@/lib/repositories/users";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const events = await getArticleHistory(id);

  const actorIds = [...new Set(events.map((event) => String(event.actorId || "")).filter(Boolean))];
  const users = await Promise.all(actorIds.map((actorId) => usersRepo.getUser(actorId)));
  const userMap = new Map(users.filter(Boolean).map((user) => [String(user!.id), user]));

  const hydrated = events.map((event) => ({
    ...event,
    actor: userMap.get(String(event.actorId || "")) || null,
  }));

  return NextResponse.json({ events: hydrated });
}
