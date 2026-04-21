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

    const days = Math.max(1, Math.min(365, parseInt(daysParam, 10)));
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const metrics = await analyticsRepo.getNewsletterMetrics(
      startDate,
      endDate,
      language || undefined
    );

    return NextResponse.json(
      {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
        summary: {
          signups: metrics.signups,
          failures: metrics.failures,
          conversionRate: parseFloat(metrics.conversionRate.toFixed(2)),
          total: metrics.signups + metrics.failures,
        },
        byEmailDomain: Object.fromEntries(metrics.byEmailDomain),
        bySource: Object.fromEntries(metrics.bySource),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[analytics/newsletter] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
