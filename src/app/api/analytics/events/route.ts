import { NextRequest, NextResponse } from "next/server";
import * as analyticsRepo from "@/lib/repositories/analytics";

const MAX_EVENTS_PER_REQUEST = 50;

const ALLOWED_ORIGINS = [
  "https://lereliefhaiti.com",
  "https://www.lereliefhaiti.com",
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
].filter(Boolean);

function isValidOrigin(origin: string | null, referer: string | null): boolean {
  const candidate = origin || referer;
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    return ALLOWED_ORIGINS.some((allowed) => {
      try {
        return new URL(allowed!).origin === url.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

interface EventPayload {
  type: string;
  locale: "fr" | "en";
  data: Record<string, unknown>;
  timestamp: string;
}

interface RequestBody {
  sessionId: string;
  events: EventPayload[];
}

export async function POST(request: NextRequest) {
  try {
    // Basic abuse prevention: require valid origin or referer
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    if (!isValidOrigin(origin, referer)) {
      return NextResponse.json(
        { error: "Forbidden: invalid origin" },
        { status: 403 }
      );
    }

    const body: RequestBody = await request.json();
    const { sessionId, events } = body;

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: missing sessionId or events" },
        { status: 400 }
      );
    }

    // Rate-limit: cap events per request to prevent abuse
    if (events.length > MAX_EVENTS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many events: max ${MAX_EVENTS_PER_REQUEST} per request` },
        { status: 400 }
      );
    }

    const results = [];

    for (const event of events) {
      try {
        const timestamp = new Date(event.timestamp);

        switch (event.type) {
          case "article_view":
            await analyticsRepo.recordArticleView({
              articleId: (event.data.articleId as string) || "",
              title: (event.data.title as string) || "",
              slug: (event.data.slug as string) || "",
              language: (event.data.language as "fr" | "en") || "fr",
              locale: event.locale,
              category: event.data.category as string | undefined,
              categoryId: event.data.categoryId as string | undefined,
              authorId: event.data.authorId as string | undefined,
              readingTime: event.data.readingTime as number | undefined,
              referrer: event.data.referrer as string | undefined,
              referrerHost: event.data.referrerHost as string | undefined,
              trafficSource: event.data.trafficSource as
                | "organic"
                | "direct"
                | "social"
                | "referral"
                | undefined,
              timestamp,
              sessionId,
              userAgent: event.data.userAgent as string | undefined,
            });
            break;

          case "search_query":
            await analyticsRepo.recordSearchEvent({
              query: (event.data.query as string) || "",
              language: (event.data.language as "fr" | "en") || undefined,
              categoryFilter: event.data.categoryFilter as string | undefined,
              resultCount: (event.data.resultCount as number) || 0,
              zeroResults: (event.data.zeroResults as boolean) || false,
              timestamp,
              sessionId,
            });
            break;

          case "newsletter_signup":
            await analyticsRepo.recordNewsletterSignup({
              emailDomain: (event.data.emailDomain as string) || "",
              status: (event.data.status as "success" | "failure") || "failure",
              reason: event.data.reason as string | undefined,
              locale: event.locale,
              source: event.data.source as
                | {
                    path?: string;
                    context?: string;
                    referrer?: string;
                  }
                | undefined,
              timestamp,
              sessionId,
            });
            break;

          case "language_switch":
            await analyticsRepo.recordLanguageSwitch({
              fromLocale: (event.data.fromLocale as "fr" | "en") || "fr",
              toLocale: (event.data.toLocale as "fr" | "en") || "en",
              timestamp,
              sessionId,
              url: (event.data.url as string) || "",
            });
            break;

          case "engagement_metric":
            await analyticsRepo.recordEngagementMetric({
              articleId: event.data.articleId as string | undefined,
              scrollDepth: event.data.scrollDepth as number | undefined,
              readingCompletionEstimate: event.data
                .readingCompletionEstimate as number | undefined,
              timeOnPage: event.data.timeOnPage as number | undefined,
              timestamp,
              sessionId,
            });
            break;

          default:
            console.warn(`Unknown event type: ${event.type}`);
        }

        results.push({ type: event.type, success: true });
      } catch (error) {
        console.error(`Error processing event ${event.type}:`, error);
        results.push({
          type: event.type,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        processed: results.length,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[analytics] Error processing events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
