"use client";

import { useEffect } from "react";
import { analyticsClient } from "@/lib/analytics-client";

interface ArticleViewTrackerProps {
  articleId: string;
  title: string;
  slug: string;
  language: "fr" | "en";
  locale: "fr" | "en";
  category?: string;
  categoryId?: string;
  readingTime?: number;
}

/**
 * Client-side component to track article view events
 * Renders nothing, just tracks the event on mount
 */
export default function ArticleViewTracker({
  articleId,
  title,
  slug,
  language,
  locale,
  category,
  categoryId,
  readingTime,
}: ArticleViewTrackerProps) {
  useEffect(() => {
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const referrerHost = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : undefined;
    const trafficSource = (() => {
      if (!referrerHost) return "direct" as const;
      if (["google.com", "bing.com", "duckduckgo.com", "search.yahoo.com", "ecosia.org"].some((host) => referrerHost.includes(host))) {
        return "organic" as const;
      }
      if (["facebook.com", "instagram.com", "x.com", "twitter.com", "t.co", "linkedin.com"].some((host) => referrerHost.includes(host))) {
        return "social" as const;
      }
      return "referral" as const;
    })();

    try {
      analyticsClient.trackArticleView({
        articleId,
        title,
        slug,
        language,
        locale,
        category,
        categoryId,
        readingTime,
        referrer: referrer || undefined,
        referrerHost,
        trafficSource,
      });
    } catch (error) {
      console.error("[analytics] Failed to track article view:", error);
    }
  }, [articleId, title, slug, language, locale, category, categoryId, readingTime]);

  return null;
}
