import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase";

const EVENTS_COLLECTION = "analytics_events";

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | "article_view"
  | "search_query"
  | "newsletter_signup"
  | "newsletter_conversion"
  | "language_switch"
  | "engagement_metric";

/**
 * Article view event data
 */
export interface ArticleViewEvent {
  articleId: string;
  title: string;
  slug: string;
  language: "fr" | "en";
  locale: "fr" | "en";
  category?: string;
  categoryId?: string;
  authorId?: string;
  readingTime?: number;
  referrer?: string;
  referrerHost?: string;
  trafficSource?: "organic" | "direct" | "social" | "referral";
  timestamp: Date;
  sessionId: string;
  userAgent?: string;
}

/**
 * Search event data
 */
export interface SearchEvent {
  query: string;
  language?: "fr" | "en";
  categoryFilter?: string;
  resultCount: number;
  zeroResults: boolean;
  timestamp: Date;
  sessionId: string;
}

/**
 * Newsletter signup event data
 */
export interface NewsletterSignupEvent {
  emailDomain: string;
  status: "success" | "failure";
  reason?: string;
  locale: "fr" | "en";
  source?: {
    path?: string;
    context?: string;
    referrer?: string;
  };
  timestamp: Date;
  sessionId: string;
}

/**
 * Language switch event data
 */
export interface LanguageSwitchEvent {
  fromLocale: "fr" | "en";
  toLocale: "fr" | "en";
  timestamp: Date;
  sessionId: string;
  url: string;
}

/**
 * Engagement metric event data
 */
export interface EngagementMetricEvent {
  articleId?: string;
  scrollDepth?: number;
  readingCompletionEstimate?: number;
  timeOnPage?: number;
  timestamp: Date;
  sessionId: string;
}

/**
 * Generic analytics event stored in Firestore
 */
export interface StoredAnalyticsEvent {
  id?: string;
  type: AnalyticsEventType;
  locale: "fr" | "en";
  timestamp: Timestamp;
  sessionId: string;
  data: Record<string, unknown>;
}

/**
 * Summary metrics
 */
export interface SummaryMetrics {
  period: "day" | "week" | "month";
  date: Date;
  locale: "fr" | "en" | "all";
  totalViews: number;
  uniqueSessions: number;
  articleViews: Map<string, number>;
  searchQueries: Map<string, number>;
  zeroResultSearches: number;
  newsletterSignups: number;
  newsletterConversions: number;
  languageSwitches: number;
}

/**
 * Store an article view event
 */
export async function recordArticleView(
  event: ArticleViewEvent
): Promise<string> {
  const db = getDb();
  const docRef = await db.collection(EVENTS_COLLECTION).add({
    type: "article_view",
    locale: event.locale,
    timestamp: Timestamp.fromDate(event.timestamp),
    sessionId: event.sessionId,
    data: {
      articleId: event.articleId,
      title: event.title,
      slug: event.slug,
      language: event.language,
      category: event.category,
      categoryId: event.categoryId,
      authorId: event.authorId,
      readingTime: event.readingTime,
      referrer: event.referrer,
      referrerHost: event.referrerHost,
      trafficSource: event.trafficSource,
      userAgent: event.userAgent,
    },
  } as StoredAnalyticsEvent);

  return docRef.id;
}

/**
 * Store a search event
 */
export async function recordSearchEvent(event: SearchEvent): Promise<string> {
  const db = getDb();
  const docRef = await db.collection(EVENTS_COLLECTION).add({
    type: "search_query",
    locale: event.language || "fr",
    timestamp: Timestamp.fromDate(event.timestamp),
    sessionId: event.sessionId,
    data: {
      query: event.query,
      language: event.language,
      categoryFilter: event.categoryFilter,
      resultCount: event.resultCount,
      zeroResults: event.zeroResults,
    },
  } as StoredAnalyticsEvent);

  return docRef.id;
}

/**
 * Store a newsletter signup event
 */
export async function recordNewsletterSignup(
  event: NewsletterSignupEvent
): Promise<string> {
  const db = getDb();
  const docRef = await db.collection(EVENTS_COLLECTION).add({
    type: "newsletter_signup",
    locale: event.locale,
    timestamp: Timestamp.fromDate(event.timestamp),
    sessionId: event.sessionId,
    data: {
      emailDomain: event.emailDomain,
      status: event.status,
      reason: event.reason,
      source: event.source,
    },
  } as StoredAnalyticsEvent);

  return docRef.id;
}

/**
 * Store a language switch event
 */
export async function recordLanguageSwitch(
  event: LanguageSwitchEvent
): Promise<string> {
  const db = getDb();
  const docRef = await db.collection(EVENTS_COLLECTION).add({
    type: "language_switch",
    locale: event.toLocale,
    timestamp: Timestamp.fromDate(event.timestamp),
    sessionId: event.sessionId,
    data: {
      fromLocale: event.fromLocale,
      toLocale: event.toLocale,
      url: event.url,
    },
  } as StoredAnalyticsEvent);

  return docRef.id;
}

/**
 * Store an engagement metric event
 */
export async function recordEngagementMetric(
  event: EngagementMetricEvent
): Promise<string> {
  const db = getDb();
  const docRef = await db.collection(EVENTS_COLLECTION).add({
    type: "engagement_metric",
    locale: "fr",
    timestamp: Timestamp.fromDate(event.timestamp),
    sessionId: event.sessionId,
    data: {
      articleId: event.articleId,
      scrollDepth: event.scrollDepth,
      readingCompletionEstimate: event.readingCompletionEstimate,
      timeOnPage: event.timeOnPage,
    },
  } as StoredAnalyticsEvent);

  return docRef.id;
}

/**
 * Get analytics summary for a date range
 */
export async function getSummary(
  startDate: Date,
  endDate: Date,
  locale?: "fr" | "en" | "all"
): Promise<{
  totalViews: number;
  uniqueSessions: Set<string>;
  viewsByLanguage: { fr: number; en: number };
  totalSearches: number;
  zeroResultSearches: number;
  newsletterSignups: number;
  newsletterConversions: number;
  languageSwitches: number;
}> {
  const db = getDb();
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  let query = db
    .collection(EVENTS_COLLECTION)
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  if (locale && locale !== "all") {
    query = query.where("locale", "==", locale);
  }

  const snapshot = await query.get();
  const events = snapshot.docs.map((doc) => ({
    ...(doc.data() as StoredAnalyticsEvent),
    id: doc.id,
  }));

  const uniqueSessions = new Set<string>();
  let totalViews = 0;
  const viewsByLanguage = { fr: 0, en: 0 };
  let totalSearches = 0;
  let zeroResultSearches = 0;
  let newsletterSignups = 0;
  let newsletterConversions = 0;
  let languageSwitches = 0;

  for (const event of events) {
    uniqueSessions.add(event.sessionId);

    if (event.type === "article_view") {
      totalViews++;
      const lang = (event.data.language as "fr" | "en") || "fr";
      viewsByLanguage[lang]++;
    } else if (event.type === "search_query") {
      totalSearches++;
      if (event.data.zeroResults) zeroResultSearches++;
    } else if (event.type === "newsletter_signup") {
      if (event.data.status === "success") {
        newsletterSignups++;
        newsletterConversions++;
      }
    } else if (event.type === "language_switch") {
      languageSwitches++;
    }
  }

  return {
    totalViews,
    uniqueSessions,
    viewsByLanguage,
    totalSearches,
    zeroResultSearches,
    newsletterSignups,
    newsletterConversions,
    languageSwitches,
  };
}

/**
 * Get top articles by view count
 */
export async function getTopArticles(
  startDate: Date,
  endDate: Date,
  locale?: "fr" | "en",
  limit: number = 10
): Promise<
  {
    articleId: string;
    title: string;
    slug: string;
    language: "fr" | "en";
    category?: string;
    viewCount: number;
  }[]
> {
  const db = getDb();
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  let query = db
    .collection(EVENTS_COLLECTION)
    .where("type", "==", "article_view")
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  if (locale) {
    query = query.where("locale", "==", locale);
  }

  const snapshot = await query.get();
  const events = snapshot.docs.map((doc) => doc.data() as StoredAnalyticsEvent);

  const articleMap = new Map<
    string,
    {
      articleId: string;
      title: string;
      slug: string;
      language: "fr" | "en";
      category?: string;
      viewCount: number;
    }
  >();

  for (const event of events) {
    const articleId = event.data.articleId as string;
    if (!articleId) continue;

    if (!articleMap.has(articleId)) {
      articleMap.set(articleId, {
        articleId,
        title: (event.data.title as string) || "",
        slug: (event.data.slug as string) || "",
        language: (event.data.language as "fr" | "en") || "fr",
        category: event.data.category as string | undefined,
        viewCount: 0,
      });
    }

    const entry = articleMap.get(articleId)!;
    entry.viewCount++;
  }

  return Array.from(articleMap.values())
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

/**
 * Get top search queries
 */
export async function getTopSearchQueries(
  startDate: Date,
  endDate: Date,
  locale?: "fr" | "en",
  limit: number = 20
): Promise<
  {
    query: string;
    count: number;
    zeroResultCount: number;
  }[]
> {
  const db = getDb();
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  let query = db
    .collection(EVENTS_COLLECTION)
    .where("type", "==", "search_query")
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  if (locale) {
    query = query.where("locale", "==", locale);
  }

  const snapshot = await query.get();
  const events = snapshot.docs.map((doc) => doc.data() as StoredAnalyticsEvent);

  const queryMap = new Map<
    string,
    {
      query: string;
      count: number;
      zeroResultCount: number;
    }
  >();

  for (const event of events) {
    const searchQuery = (event.data.query as string) || "";
    if (!searchQuery) continue;

    if (!queryMap.has(searchQuery)) {
      queryMap.set(searchQuery, {
        query: searchQuery,
        count: 0,
        zeroResultCount: 0,
      });
    }

    const entry = queryMap.get(searchQuery)!;
    entry.count++;
    if (event.data.zeroResults) entry.zeroResultCount++;
  }

  return Array.from(queryMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get newsletter conversion metrics
 */
export async function getNewsletterMetrics(
  startDate: Date,
  endDate: Date,
  locale?: "fr" | "en"
): Promise<{
  signups: number;
  failures: number;
  conversionRate: number;
  byEmailDomain: Map<string, number>;
  bySource: Map<string, number>;
}> {
  const db = getDb();
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  let query = db
    .collection(EVENTS_COLLECTION)
    .where("type", "==", "newsletter_signup")
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  if (locale) {
    query = query.where("locale", "==", locale);
  }

  const snapshot = await query.get();
  const events = snapshot.docs.map((doc) => doc.data() as StoredAnalyticsEvent);

  let signups = 0;
  let failures = 0;
  const byEmailDomain = new Map<string, number>();
  const bySource = new Map<string, number>();

  for (const event of events) {
    const status = event.data.status as string;
    const domain = (event.data.emailDomain as string) || "unknown";

    if (status === "success") {
      signups++;
      byEmailDomain.set(domain, (byEmailDomain.get(domain) || 0) + 1);
    } else {
      failures++;
    }

    const sourceContext = (event.data.source as Record<string, unknown>)?.context as
      | string
      | undefined;
    if (sourceContext) {
      bySource.set(sourceContext, (bySource.get(sourceContext) || 0) + 1);
    }
  }

  const conversionRate =
    signups + failures > 0 ? (signups / (signups + failures)) * 100 : 0;

  return {
    signups,
    failures,
    conversionRate,
    byEmailDomain,
    bySource,
  };
}

/**
 * Get language usage metrics
 */
export async function getLanguageMetrics(
  startDate: Date,
  endDate: Date
): Promise<{
  frViewCount: number;
  enViewCount: number;
  frPercentage: number;
  enPercentage: number;
  languageSwitches: number;
}> {
  const db = getDb();
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  const viewQuery = db
    .collection(EVENTS_COLLECTION)
    .where("type", "==", "article_view")
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  const viewSnapshot = await viewQuery.get();
  const viewEvents = viewSnapshot.docs.map((doc) => doc.data() as StoredAnalyticsEvent);

  let frViewCount = 0;
  let enViewCount = 0;

  for (const event of viewEvents) {
    const lang = (event.data.language as "fr" | "en") || "fr";
    if (lang === "fr") frViewCount++;
    else enViewCount++;
  }

  const totalViews = frViewCount + enViewCount;

  const switchQuery = db
    .collection(EVENTS_COLLECTION)
    .where("type", "==", "language_switch")
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  const switchSnapshot = await switchQuery.get();
  const languageSwitches = switchSnapshot.size;

  return {
    frViewCount,
    enViewCount,
    frPercentage: totalViews > 0 ? (frViewCount / totalViews) * 100 : 0,
    enPercentage: totalViews > 0 ? (enViewCount / totalViews) * 100 : 0,
    languageSwitches,
  };
}

/**
 * Get views over time (for charting)
 */
export async function getViewsOverTime(
  startDate: Date,
  endDate: Date,
  locale?: "fr" | "en",
  granularity: "hour" | "day" | "week" = "day"
): Promise<
  {
    date: string;
    frViews: number;
    enViews: number;
    total: number;
  }[]
> {
  const db = getDb();
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  let query = db
    .collection(EVENTS_COLLECTION)
    .where("type", "==", "article_view")
    .where("timestamp", ">=", startTs)
    .where("timestamp", "<=", endTs);

  if (locale) {
    query = query.where("locale", "==", locale);
  }

  const snapshot = await query.get();
  const events = snapshot.docs.map((doc) => doc.data() as StoredAnalyticsEvent);

  const timeMap = new Map<
    string,
    {
      date: string;
      frViews: number;
      enViews: number;
      total: number;
    }
  >();

  for (const event of events) {
    const eventDate = event.timestamp.toDate();
    let dateKey: string;

    if (granularity === "hour") {
      dateKey = eventDate.toISOString().slice(0, 13);
    } else if (granularity === "week") {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - d.getDay());
      dateKey = d.toISOString().split("T")[0];
    } else {
      // day
      dateKey = eventDate.toISOString().split("T")[0];
    }

    if (!timeMap.has(dateKey)) {
      timeMap.set(dateKey, {
        date: dateKey,
        frViews: 0,
        enViews: 0,
        total: 0,
      });
    }

    const entry = timeMap.get(dateKey)!;
    const lang = (event.data.language as "fr" | "en") || "fr";
    if (lang === "fr") entry.frViews++;
    else entry.enViews++;
    entry.total++;
  }

  return Array.from(timeMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
