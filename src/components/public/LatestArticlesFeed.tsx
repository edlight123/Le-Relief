"use client";

import { useState, useRef, useCallback } from "react";
import ArticleCard from "@/components/public/ArticleCard";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageFirebaseUrl?: string | null;
  publishedAt: string | null;
  author?: { id?: string | null; name: string | null } | null;
  category?: { name: string; slug: string } | null;
  contentTypeLabel?: string;
  readingTime?: number;
  language?: "fr" | "en";
}

interface Props {
  initialArticles: Article[];
  categoryId?: string;
  authorId?: string;
  variant?: "feed" | "grid";
  pageSize?: number;
  locale?: Locale;
}

const PAGE_SIZE = 10;

export default function LatestArticlesFeed({
  initialArticles,
  categoryId,
  authorId,
  variant = "feed",
  pageSize = PAGE_SIZE,
  locale = "fr",
}: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialArticles.length < pageSize);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const PULL_THRESHOLD = 72; // px before triggering refresh

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        status: "published",
        take: String(pageSize),
      });
      if (categoryId) params.set("categoryId", categoryId);
      if (authorId) params.set("authorId", authorId);
      params.set("language", locale);

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      const fresh: Article[] = data.articles || [];
      if (fresh.length > 0) {
        setArticles(fresh);
        setExhausted(fresh.length < pageSize);
      }
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, pageSize, categoryId, authorId, locale]);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0]!.clientY;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = e.touches[0]!.clientY - touchStartY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullY(Math.min(delta * 0.4, PULL_THRESHOLD + 20));
    }
  }

  function onTouchEnd() {
    if (pullY >= PULL_THRESHOLD) {
      void refresh();
    }
    touchStartY.current = null;
    setPullY(0);
  }

  const pulling = pullY > 0;
  const readyToRefresh = pullY >= PULL_THRESHOLD;
  // ── end pull-to-refresh ────────────────────────────────────────────────────

  function getCursor(list: Article[]) {
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const publishedAt = list[index]?.publishedAt;
      if (publishedAt) return publishedAt;
    }
    return null;
  }

  async function loadMore() {
    if (loading || exhausted) return;

    setLoading(true);
    const cursor = getCursor(articles);
    try {
      const params = new URLSearchParams({
        status: "published",
        take: String(pageSize),
      });
      if (cursor) params.set("before", cursor);
      if (categoryId) params.set("categoryId", categoryId);
      if (authorId) params.set("authorId", authorId);
      params.set("language", locale);

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      const next: Article[] = data.articles || [];

      if (next.length === 0) {
        setExhausted(true);
        return;
      }

      const existingIds = new Set(articles.map((a) => a.id));
      const fresh = next.filter((a) => !existingIds.has(a.id));
      if (fresh.length > 0) {
        setArticles((prev) => [...prev, ...fresh]);
      }

      if (next.length < pageSize || fresh.length === 0) {
        setExhausted(true);
      }
    } catch {
      // silently fail — the existing list stays intact
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        aria-hidden
        style={{
          height: pulling || refreshing ? (refreshing ? 48 : pullY) : 0,
          overflow: "hidden",
          transition: pulling ? "none" : "height 0.25s ease",
        }}
        className="flex items-center justify-center"
      >
        <span
          style={{
            opacity: refreshing ? 1 : readyToRefresh ? 1 : pullY / PULL_THRESHOLD,
            transform: refreshing
              ? "none"
              : `rotate(${pullY * 3}deg)`,
          }}
          className={`inline-block h-5 w-5 rounded-full border-2 border-primary border-t-transparent ${refreshing ? "animate-spin" : ""}`}
        />
      </div>

      {variant === "grid" ? (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0 border-t border-border-subtle sm:grid-cols-2">
          {articles.map((article, index) => (
            <div
              key={article.id}
              className={`
                border-b border-border-subtle
                ${index % 2 === 0 ? "sm:border-r sm:border-border-subtle" : ""}
              `}
            >
              <ArticleCard article={article} variant="text" locale={locale} />
            </div>
          ))}
        </div>
      )}

      {!exhausted && (
        <div className="mt-8 border-t border-border-subtle pt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group flex items-center gap-3 font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            <span className="h-px w-8 bg-border-strong transition-all group-hover:w-12 group-hover:bg-primary" />
            {loading ? t(locale, "loading") : t(locale, "loadMore")}
          </button>
        </div>
      )}

      {exhausted && articles.length > initialArticles.length && (
        <p className="mt-8 border-t border-border-subtle pt-6 font-label text-[11px] font-bold uppercase text-muted">
          {t(locale, "allShown")}
        </p>
      )}
    </div>
  );
}
