import { NewsArticle, GNewsResponse } from "@/types/news";

const GNEWS_BASE = "https://gnews.io/api/v4";
const API_KEY = process.env.GNEWS_API_KEY;

// Cache news for 30 minutes to stay within free tier (100 req/day)
let cachedNews: { data: NewsArticle[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCachedNews(): NewsArticle[] | null {
  if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_DURATION) {
    return cachedNews.data;
  }
  return null;
}

function setCachedNews(data: NewsArticle[]) {
  cachedNews = { data, timestamp: Date.now() };
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

export async function getHaitiNews(pageSize = 12): Promise<NewsArticle[]> {
  const cached = getCachedNews();
  if (cached) return cached.slice(0, pageSize);

  if (!API_KEY) {
    console.warn("GNEWS_API_KEY not set — skipping live news fetch");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: "Haiti OR Caribbean OR Port-au-Prince",
      max: String(Math.min(pageSize, 10)), // GNews free tier: max 10 per request
      lang: "en",
      apikey: API_KEY,
    });

    const res = await fetch(`${GNEWS_BASE}/search?${params}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error("GNews error:", res.status, await res.text());
      return [];
    }

    const data: GNewsResponse = await res.json();
    const articles = data.articles.map(toNewsArticle);

    setCachedNews(articles);
    return articles.slice(0, pageSize);
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

export async function getTopHeadlines(
  category?: string,
  pageSize = 10
): Promise<NewsArticle[]> {
  if (!API_KEY) {
    console.warn("GNEWS_API_KEY not set — skipping headlines fetch");
    return [];
  }

  try {
    const params = new URLSearchParams({
      max: String(Math.min(pageSize, 10)),
      lang: "en",
      apikey: API_KEY,
    });

    if (category) {
      params.set("topic", category);
    }

    const res = await fetch(`${GNEWS_BASE}/top-headlines?${params}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error("GNews headlines error:", res.status, await res.text());
      return [];
    }

    const data: GNewsResponse = await res.json();
    return data.articles.map(toNewsArticle);
  } catch (error) {
    console.error("Failed to fetch headlines:", error);
    return [];
  }
}
