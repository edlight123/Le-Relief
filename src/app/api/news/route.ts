import { NextResponse } from "next/server";
import { getHaitiNews, getTopHeadlines } from "@/services/news.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "haiti";
  const category = searchParams.get("category") || undefined;
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") || "12", 10),
    50
  );

  const hasKey = !!process.env.GNEWS_API_KEY;

  try {
    const articles =
      type === "headlines"
        ? await getTopHeadlines(category, pageSize)
        : await getHaitiNews(pageSize);

    return NextResponse.json({ articles, total: articles.length, hasKey });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
