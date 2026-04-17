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
      coverImageFirebaseUrl?: string | null;
      publishedAt: string | null;
      author: { name: string | null } | null;
      category: { name: string; slug: string } | null;
    }[]
  >([]);
  const [resolvedQuery, setResolvedQuery] = useState("");

  const debouncedQuery = useDebounce(query, 400);
  const trimmedQuery = debouncedQuery.trim();
  const isSearching = !!trimmedQuery && resolvedQuery !== trimmedQuery;
  const visibleResults = resolvedQuery === trimmedQuery ? results : [];

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!term) {
      router.replace("/search");
      return;
    }

    let cancelled = false;
    fetch(`/api/articles?search=${encodeURIComponent(term)}&status=published`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.articles || []);
        setResolvedQuery(term);
      });

    router.replace(`/search?q=${encodeURIComponent(term)}`);
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, router]);

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-8 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Archives</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          Recherche
        </h1>
      </header>

      <div className="relative mb-12 max-w-3xl border-y border-border-strong py-4">
        <SearchIcon className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher des articles..."
          className="w-full border-0 bg-transparent py-3 pl-10 pr-4 font-headline text-3xl font-bold text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>

      {isSearching && (
        <p className="font-body text-lg text-muted">Recherche en cours...</p>
      )}

      {!isSearching && trimmedQuery && visibleResults.length === 0 && (
        <p className="font-body text-lg text-muted">
          Aucun résultat pour &ldquo;{trimmedQuery}&rdquo;
        </p>
      )}

      {visibleResults.length > 0 && (
        <div className="divide-y divide-border-subtle border-t border-border-strong">
          {visibleResults.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="newspaper-shell py-16"><p className="font-body text-lg text-muted">Chargement...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
