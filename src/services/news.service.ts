import { NewsAPIResponse, NewsArticle } from "@/types/news";

const NEWS_API_BASE = "https://newsapi.org/v2";
const API_KEY = process.env.NEWS_API_KEY;

// Cache news for 30 minutes to avoid hitting rate limits
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

export async function getHaitiNews(pageSize = 12): Promise<NewsArticle[]> {
  const cached = getCachedNews();
  if (cached) return cached.slice(0, pageSize);

  if (!API_KEY) {
    console.warn("NEWS_API_KEY not set — skipping live news fetch");
    return [];
  }

  try {
    // Search for Haiti and Caribbean news
    const queries = [
      "Haiti",
      "Caribbean",
      "Port-au-Prince",
      "Haïti",
    ];
    const query = queries.join(" OR ");

    const params = new URLSearchParams({
      q: query,
      pageSize: String(Math.min(pageSize, 100)),
      sortBy: "publishedAt",
      language: "en",
      apiKey: API_KEY,
    });

    const res = await fetch(`${NEWS_API_BASE}/everything?${params}`, {
      next: { revalidate: 1800 }, // ISR: revalidate every 30 min
    });

    if (!res.ok) {
      console.error("NewsAPI error:", res.status, await res.text());
      return [];
    }

    const data: NewsAPIResponse = await res.json();

    // Filter out removed articles
    const articles = data.articles.filter(
      (a) => a.title !== "[Removed]" && a.description !== "[Removed]"
    );

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
    console.warn("NEWS_API_KEY not set — skipping headlines fetch");
    return [];
  }

  try {
    const params = new URLSearchParams({
      // Use US headlines as fallback since Haiti isn't a supported country
      country: "us",
      pageSize: String(Math.min(pageSize, 100)),
      apiKey: API_KEY,
    });

    if (category) {
      params.set("category", category);
    }

    const res = await fetch(`${NEWS_API_BASE}/top-headlines?${params}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error("NewsAPI headlines error:", res.status, await res.text());
      return [];
    }

    const data: NewsAPIResponse = await res.json();

    return data.articles.filter(
      (a) => a.title !== "[Removed]" && a.description !== "[Removed]"
    );
  } catch (error) {
    console.error("Failed to fetch headlines:", error);
    return [];
  }
}
