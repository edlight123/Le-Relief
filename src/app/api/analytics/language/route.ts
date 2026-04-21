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

    const days = Math.max(1, Math.min(365, parseInt(daysParam, 10)));
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const metrics = await analyticsRepo.getLanguageMetrics(startDate, endDate);

    return NextResponse.json(
      {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
        usage: {
          frViewCount: metrics.frViewCount,
          enViewCount: metrics.enViewCount,
          frPercentage: parseFloat(metrics.frPercentage.toFixed(2)),
          enPercentage: parseFloat(metrics.enPercentage.toFixed(2)),
          total: metrics.frViewCount + metrics.enViewCount,
        },
        languageSwitches: metrics.languageSwitches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[analytics/language] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
