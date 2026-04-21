import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticles } from "@/lib/repositories/articles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "admin" && role !== "publisher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || undefined;
  const language = searchParams.get("language") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const authorId = searchParams.get("authorId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const take = parseInt(searchParams.get("take") || "20", 10);
  const skip = (page - 1) * take;
  const orderBy = searchParams.get("orderBy") || "publishedAt";

  try {
    const { articles, total } = await getArticles({
      status,
      language,
      categoryId,
      authorId,
      take,
      skip,
      orderBy,
    });
    return NextResponse.json({ articles, total, page, take });
  } catch (err) {
    console.error("[editorial/articles]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
