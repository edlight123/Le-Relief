"use client";

import { useState } from "react";
import ArticleCard from "@/components/public/ArticleCard";

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
  pageSize?: number;
}

const PAGE_SIZE = 8;

export default function LatestArticlesFeed({
  initialArticles,
  pageSize = PAGE_SIZE,
}: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "published",
        take: String(pageSize),
        skip: String(articles.length),
      });
      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      const next: Article[] = data.articles || [];

      if (next.length === 0) {
        setExhausted(true);
        return;
      }

      const existingIds = new Set(articles.map((a) => a.id));
      const fresh = next.filter((a) => !existingIds.has(a.id));
      setArticles((prev) => [...prev, ...fresh]);

      if (next.length < pageSize) setExhausted(true);
    } catch {
      // silently fail — the existing list stays intact
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="divide-y divide-border-subtle border-t border-border-subtle">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="list" />
        ))}
      </div>

      {!exhausted && (
        <div className="mt-8 border-t border-border-subtle pt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group flex items-center gap-3 font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            <span className="h-px w-8 bg-border-strong transition-all group-hover:w-12 group-hover:bg-primary" />
            {loading ? "Chargement…" : "Charger plus d'articles"}
          </button>
        </div>
      )}

      {exhausted && articles.length > initialArticles.length && (
        <p className="mt-8 border-t border-border-subtle pt-6 font-label text-[11px] font-bold uppercase text-muted">
          Tous les articles sont affichés.
        </p>
      )}
    </div>
  );
}
