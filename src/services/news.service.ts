import { NewsArticle, GNewsResponse } from "@/types/news";

const GNEWS_BASE = "https://gnews.io/api/v4";
const API_KEY = process.env.GNEWS_API_KEY;

// Cache per topic for 30 minutes to stay within free tier (100 req/day)
const cache = new Map<string, { data: NewsArticle[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCached(key: string): NewsArticle[] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: NewsArticle[]) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Convert GNews format to our unified NewsArticle format
function toNewsArticle(g: GNewsResponse["articles"][number]): NewsArticle {
  return {
    source: { id: null, name: g.source.name },
    author: null,
    title: g.title,
    description: g.description,
    url: g.url,
    urlToImage: g.image,
    publishedAt: g.publishedAt,
    content: g.content,
  };
}

export async function getHaitiNews(pageSize = 10): Promise<NewsArticle[]> {
  const cacheKey = "haiti-news";
  const cached = getCached(cacheKey);
  if (cached) return cached.slice(0, pageSize);

  if (!API_KEY) {
    console.warn("GNEWS_API_KEY not set — skipping live news fetch");
    return [];
  }

  try {
    // Search for Haiti news in English (more results available)
    const searchParams = new URLSearchParams({
      q: "Haiti",
      max: String(Math.min(pageSize, 10)),
      lang: "en",
      apikey: API_KEY,
    });

    const res = await fetch(`${GNEWS_BASE}/search?${searchParams}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data: GNewsResponse = await res.json();
      if (data.articles && data.articles.length > 0) {
        const articles = data.articles.map(toNewsArticle);
        setCache(cacheKey, articles);
        return articles.slice(0, pageSize);
      }
    }

    // Fallback: French top headlines
    const fallbackParams = new URLSearchParams({
      max: String(Math.min(pageSize, 10)),
      lang: "fr",
      apikey: API_KEY,
    });

    const fallbackRes = await fetch(`${GNEWS_BASE}/top-headlines?${fallbackParams}`, {
      cache: "no-store",
    });

    if (fallbackRes.ok) {
      const fallbackData: GNewsResponse = await fallbackRes.json();
      const articles = fallbackData.articles.map(toNewsArticle);
      setCache(cacheKey, articles);
      return articles.slice(0, pageSize);
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

// Fetch news for a specific category topic
export async function getNewsByCategory(
  category: string,
  pageSize = 10
): Promise<NewsArticle[]> {
  const cacheKey = `category-${category}`;
  const cached = getCached(cacheKey);
  if (cached) return cached.slice(0, pageSize);

  if (!API_KEY) {
    return [];
  }

  // Map site categories to GNews topics
  const topicMap: Record<string, string> = {
    world: "world",
    technology: "technology",
    business: "business",
    science: "science",
    culture: "entertainment",
    opinion: "nation",
  };

  const topic = topicMap[category];
  if (!topic) return getHaitiNews(pageSize);

  try {
    const params = new URLSearchParams({
      max: String(Math.min(pageSize, 10)),
      lang: "fr",
      topic,
      apikey: API_KEY,
    });

    const res = await fetch(`${GNEWS_BASE}/top-headlines?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("GNews category error:", res.status, await res.text());
      return [];
    }

    const data: GNewsResponse = await res.json();
    const articles = data.articles.map(toNewsArticle);

    setCache(cacheKey, articles);
    return articles.slice(0, pageSize);
  } catch (error) {
    console.error("Failed to fetch category news:", error);
    return [];
  }
}

export async function getTopHeadlines(
  category?: string,
  pageSize = 10
): Promise<NewsArticle[]> {
  if (category) return getNewsByCategory(category, pageSize);

  const cacheKey = "headlines";
  const cached = getCached(cacheKey);
  if (cached) return cached.slice(0, pageSize);

  if (!API_KEY) {
    console.warn("GNEWS_API_KEY not set — skipping headlines fetch");
    return [];
  }

  try {
    const params = new URLSearchParams({
      max: String(Math.min(pageSize, 10)),
      lang: "fr",
      apikey: API_KEY,
    });

    const res = await fetch(`${GNEWS_BASE}/top-headlines?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("GNews headlines error:", res.status, await res.text());
      return [];
    }

    const data: GNewsResponse = await res.json();
    const articles = data.articles.map(toNewsArticle);
    setCache(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error("Failed to fetch headlines:", error);
    return [];
  }
}

// Find a cached news article by its base64-encoded URL
export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  try {
    const url = Buffer.from(slug, "base64url").toString("utf-8");

    // Search all caches first
    for (const entry of cache.values()) {
      const found = entry.data.find((a) => a.url === url);
      if (found) return found;
    }

    // If not in cache, refetch to populate
    await getHaitiNews(10);
    for (const entry of cache.values()) {
      const found = entry.data.find((a) => a.url === url);
      if (found) return found;
    }

    return null;
  } catch {
    return null;
  }
}

// Generate a URL-safe slug from an article URL
export function encodeNewsSlug(articleUrl: string): string {
  return Buffer.from(articleUrl).toString("base64url");
}
