/**
 * Client-side and server-side analytics event tracking
 * Supports batching events for efficiency
 */

export type AnalyticsEventType =
  | "article_view"
  | "search_query"
  | "newsletter_signup"
  | "newsletter_conversion"
  | "language_switch"
  | "engagement_metric";

export interface AnalyticsEventPayload {
  type: AnalyticsEventType;
  locale: "fr" | "en";
  data: Record<string, unknown>;
}

interface PendingEvent {
  payload: AnalyticsEventPayload;
  timestamp: Date;
}

class AnalyticsClient {
  private static instance: AnalyticsClient;
  private pendingEvents: PendingEvent[] = [];
  private sessionId: string;
  private batchSize: number = 10;
  private batchTimeout: number = 30000; // 30 seconds
  private timeoutId: NodeJS.Timeout | null = null;
  private isClient: boolean = typeof window !== "undefined";

  private constructor() {
    this.sessionId = this.generateOrGetSessionId();

    if (this.isClient) {
      // Add page unload listener to flush events
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  static getInstance(): AnalyticsClient {
    if (!AnalyticsClient.instance) {
      AnalyticsClient.instance = new AnalyticsClient();
    }
    return AnalyticsClient.instance;
  }

  private generateOrGetSessionId(): string {
    if (!this.isClient) {
      // Server-side: generate a unique session ID
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // Client-side: use localStorage or generate new
    const stored = localStorage.getItem("analytics_session_id");
    if (stored) return stored;

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("analytics_session_id", sessionId);
    return sessionId;
  }

  /**
   * Track an article view event
   */
  trackArticleView(data: {
    articleId: string;
    title: string;
    slug: string;
    language: "fr" | "en";
    locale: "fr" | "en";
    category?: string;
    categoryId?: string;
    readingTime?: number;
    referrer?: string;
    referrerHost?: string;
    trafficSource?: "organic" | "direct" | "social" | "referral";
  }): void {
    this.track({
      type: "article_view",
      locale: data.locale,
      data,
    });
  }

  /**
   * Track a search query event
   */
  trackSearchQuery(data: {
    query: string;
    language?: "fr" | "en";
    categoryFilter?: string;
    resultCount: number;
    zeroResults: boolean;
  }): void {
    this.track({
      type: "search_query",
      locale: (data.language as "fr" | "en") || "fr",
      data,
    });
  }

  /**
   * Track a newsletter signup event
   */
  trackNewsletterSignup(data: {
    emailDomain: string;
    status: "success" | "failure";
    reason?: string;
    locale: "fr" | "en";
    source?: {
      path?: string;
      context?: string;
      referrer?: string;
    };
  }): void {
    this.track({
      type: "newsletter_signup",
      locale: data.locale,
      data,
    });
  }

  /**
   * Track a language switch event
   */
  trackLanguageSwitch(data: {
    fromLocale: "fr" | "en";
    toLocale: "fr" | "en";
    url: string;
  }): void {
    this.track({
      type: "language_switch",
      locale: data.toLocale,
      data,
    });
  }

  /**
   * Track an engagement metric (scroll depth, reading time, etc.)
   */
  trackEngagementMetric(data: {
    articleId?: string;
    scrollDepth?: number;
    readingCompletionEstimate?: number;
    timeOnPage?: number;
  }): void {
    this.track({
      type: "engagement_metric",
      locale: "fr",
      data,
    });
  }

  /**
   * Internal method to add event to queue
   */
  private track(payload: AnalyticsEventPayload): void {
    this.pendingEvents.push({
      payload,
      timestamp: new Date(),
    });

    // Flush if batch size reached
    if (this.pendingEvents.length >= this.batchSize) {
      this.flush();
    } else {
      // Schedule flush if not already scheduled
      if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this.flush(), this.batchTimeout);
      }
    }
  }

  /**
   * Submit pending events to the API
   */
  private async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const events = this.pendingEvents.splice(0);
    this.clearTimeout();

    try {
      const response = await fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: events.map((e) => ({
            type: e.payload.type,
            locale: e.payload.locale,
            data: e.payload.data,
            timestamp: e.timestamp.toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        console.warn("[analytics] Failed to flush events:", response.status);
      }
    } catch (error) {
      console.error("[analytics] Error flushing events:", error);
    }
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Manually trigger event submission
   */
  async submitEvents(): Promise<void> {
    return this.flush();
  }
}

// Export singleton instance
export const analyticsClient = AnalyticsClient.getInstance();

/**
 * Helper function for server-side event tracking
 */
export async function submitAnalyticsEvent(
  sessionId: string,
  event: {
    type: AnalyticsEventType;
    locale: "fr" | "en";
    data: Record<string, unknown>;
    timestamp: Date;
  }
): Promise<Response> {
  const res = await fetch("http://localhost:3000/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      events: [
        {
          type: event.type,
          locale: event.locale,
          data: event.data,
          timestamp: event.timestamp.toISOString(),
        },
      ],
    }),
  });

  return res;
}
