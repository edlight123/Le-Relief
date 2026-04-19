import { NextRequest, NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articles } = await articlesRepo.getArticles({ status: "scheduled" });
  const now = new Date();
  const toPublish = articles.filter(
    (a) => a.scheduledAt && new Date(a.scheduledAt as string) <= now,
  );

  await Promise.all(
    toPublish.map((a) =>
      articlesRepo.updateArticle(a.id as string, {
        status: "published",
        publishedAt: new Date(a.scheduledAt as string),
      }),
    ),
  );

  return NextResponse.json({ published: toPublish.length, checked: articles.length });
}
