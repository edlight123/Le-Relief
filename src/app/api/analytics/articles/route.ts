import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/permissions";
import * as analyticsRepo from "@/lib/repositories/analytics";
import { subDays } from "date-fns";
import type { Role } from "@/types/user";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    const userRole = (session?.user as unknown as { role?: Role })?.role;
    if (!userRole || !canAccessDashboard(userRole)) {
      return NextResponse.json(
        { error: "Unauthorized: dashboard access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get("days") || "30";
    const language = searchParams.get("language") as "fr" | "en" | null;
    const takeParam = searchParams.get("take") || "20";
    const skipParam = searchParams.get("skip") || "0";

    const days = Math.max(1, Math.min(365, parseInt(daysParam, 10)));
    const take = Math.max(1, Math.min(100, parseInt(takeParam, 10)));
    const skip = Math.max(0, parseInt(skipParam, 10));

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const articles = await analyticsRepo.getTopArticles(
      startDate,
      endDate,
      language || undefined,
      take + skip
    );

    const paginatedArticles = articles.slice(skip, skip + take);

    return NextResponse.json(
      {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
        pagination: {
          skip,
          take,
          total: articles.length,
        },
        articles: paginatedArticles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[analytics/articles] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
