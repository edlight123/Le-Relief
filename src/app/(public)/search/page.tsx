"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import { useDebounce } from "@/hooks/useDebounce";
import { analyticsClient } from "@/lib/analytics-client";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("categoryId") || "";
  const initialLanguage = searchParams.get("language") || "";

  const [query, setQuery] = useState(initialQ);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [language, setLanguage] = useState(initialLanguage);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [results, setResults] = useState<
    {
      id?: string;
      title: string;
      slug: string;
      excerpt: string | null;
      coverImage: string | null;
      coverImageFirebaseUrl?: string | null;
      publishedAt: string | null;
      author: { name: string | null } | null;
      category: { name: string; slug: string } | null;
      contentTypeLabel?: string;
      readingTime?: number;
      language?: "fr" | "en";
    }[]
  >([]);
  const [resolvedQuery, setResolvedQuery] = useState("");

  const debouncedQuery = useDebounce(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const filterKey = `${trimmedQuery}|${categoryId}|${language}`;
  const isSearching = !!trimmedQuery && resolvedQuery !== filterKey;
  const visibleResults = resolvedQuery === filterKey ? results : [];

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories?public=true")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCategories(data.categories || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const term = debouncedQuery.trim();
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (categoryId) params.set("categoryId", categoryId);
    if (language) params.set("language", language);

    if (!term) {
      router.replace(params.size ? `/search?${params.toString()}` : "/search");
      return;
    }

    let cancelled = false;
    const apiParams = new URLSearchParams({
      search: term,
      status: "published",
      take: "30",
    });
    if (categoryId) apiParams.set("categoryId", categoryId);
    if (language) apiParams.set("language", language);

    fetch(`/api/articles?${apiParams.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const articles = data.articles || [];
        setResults(articles);
        setResolvedQuery(filterKey);

        // Track search event
        try {
          analyticsClient.trackSearchQuery({
            query: term,
            language: language as "fr" | "en" | undefined,
            categoryFilter: categoryId || undefined,
            resultCount: articles.length,
            zeroResults: articles.length === 0,
          });
        } catch (error) {
          console.error("[analytics] Failed to track search:", error);
        }
      });

    router.replace(`/search?${params.toString()}`);
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedQuery, filterKey, language, router]);

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-8 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Archives</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          Recherche
        </h1>
      </header>

      <div className="relative mb-6 max-w-3xl border-y border-border-strong py-4">
        <SearchIcon className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher des articles"
          className="w-full border-0 bg-transparent py-3 pl-10 pr-4 font-body text-base sm:text-lg sm:text-2xl text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="mb-12 grid gap-3 border-b border-border-subtle pb-5 sm:grid-cols-2">
          {/* Mobile: stack selects vertically (grid-cols-1), Tablet/Desktop: 2 columns */}
        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          Rubrique
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Toutes les rubriques</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          Langue
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Toutes les langues</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
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
        <>
          <p className="mb-5 font-label text-xs font-bold uppercase text-muted">
            {visibleResults.length} résultat{visibleResults.length > 1 ? "s" : ""} pour &ldquo;{trimmedQuery}&rdquo;
          </p>
          <div className="divide-y divide-border-subtle border-t border-border-strong">
            {visibleResults.map((article) => (
              <ArticleCard key={article.id || article.slug} article={article} variant="list" />
            ))}
          </div>
        </>
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
