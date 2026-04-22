import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import { auth } from "@/lib/auth";
import { canManageUsers, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";

export async function GET(request: NextRequest) {
  const publicOnly = request.nextUrl.searchParams.get("public") === "true";

  if (publicOnly) {
    const users = await usersRepo.getUsers();
    const publishedArticles = await articlesRepo.getPublishedArticles(500).catch(() => []);
    const counts = new Map<string, number>();

    for (const article of publishedArticles) {
      const authorId = typeof article.authorId === "string" ? article.authorId : "";
      if (!authorId) continue;
      counts.set(authorId, (counts.get(authorId) || 0) + 1);
    }

    const publicUsers = users
      .map((user) => ({
        id: String(user.id || ""),
        name: (user.name as string | null | undefined) || null,
        image: (user.image as string | null | undefined) || null,
        role: (user.role as string | undefined) || "reader",
        articleCount: counts.get(String(user.id || "")) || 0,
      }))
      .filter((user) => user.id && user.articleCount > 0)
      .sort((left, right) => right.articleCount - left.articleCount)
      .slice(0, 25);

    return NextResponse.json({ users: publicUsers });
  }

  const session = await auth();
  const userRole = (session?.user as { role?: Role } | undefined)?.role;
  if (!userRole || !canManageUsers(normalizeRole(userRole))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await usersRepo.getUsers();

  return NextResponse.json({ users });
}
