"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import { useDebounce } from "@/hooks/useDebounce";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<
    {
      title: string;
      slug: string;
      excerpt: string | null;
      coverImage: string | null;
      publishedAt: string | null;
      author: { name: string | null } | null;
      category: { name: string; slug: string } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    fetch(`/api/articles?search=${encodeURIComponent(debouncedQuery)}&status=published`)
      .then((r) => r.json())
      .then((data) => setResults(data.articles || []))
      .finally(() => setLoading(false));

    router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`);
  }, [debouncedQuery, router]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in-up">
        Search
      </h1>

      <div className="section-divider mb-8" />

      <div className="relative mb-12">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-subtle bg-surface text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading && (
        <p className="text-neutral-500 dark:text-neutral-400">Searching...</p>
      )}

      {!loading && debouncedQuery && results.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">
          No results found for &ldquo;{debouncedQuery}&rdquo;
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-16"><p className="text-neutral-500">Loading...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
