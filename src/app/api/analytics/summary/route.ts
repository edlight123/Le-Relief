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
    const language = (searchParams.get("language") || "all") as
      | "fr"
      | "en"
      | "all";

    const days = Math.max(1, Math.min(365, parseInt(daysParam, 10)));
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const summary = await analyticsRepo.getSummary(
      startDate,
      endDate,
      language !== "all" ? language : undefined
    );

    const languageMetrics = await analyticsRepo.getLanguageMetrics(
      startDate,
      endDate
    );

    return NextResponse.json(
      {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
        summary: {
          totalViews: summary.totalViews,
          uniqueSessions: summary.uniqueSessions.size,
          viewsByLanguage: summary.viewsByLanguage,
          totalSearches: summary.totalSearches,
          zeroResultSearches: summary.zeroResultSearches,
          zeroResultRate:
            summary.totalSearches > 0
              ? (summary.zeroResultSearches / summary.totalSearches) * 100
              : 0,
          newsletterSignups: summary.newsletterSignups,
          newsletterConversions: summary.newsletterConversions,
          languageSwitches: summary.languageSwitches,
        },
        language: {
          frViewCount: languageMetrics.frViewCount,
          enViewCount: languageMetrics.enViewCount,
          frPercentage: languageMetrics.frPercentage,
          enPercentage: languageMetrics.enPercentage,
          languageSwitches: languageMetrics.languageSwitches,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[analytics/summary] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
