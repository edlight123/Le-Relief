"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocaleContext } from "@/hooks/useLocaleContext";

type SearchLanguageFilter = "fr" | "en" | "";

function parseLanguageFilter(value: string | null, locale: "fr" | "en"): SearchLanguageFilter {
  if (value === "all") return "";
  if (value === "fr" || value === "en") return value;
  return locale;
}

function SearchContent() {
  const locale = useLocaleContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("categoryId") || "";
  const initialLanguage = parseLanguageFilter(searchParams.get("language"), locale);

  const [query, setQuery] = useState(initialQ);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [language, setLanguage] = useState<SearchLanguageFilter>(initialLanguage);
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
  const [resolvedFilterKey, setResolvedFilterKey] = useState("");

  const debouncedQuery = useDebounce(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const filterKey = `${trimmedQuery}|${categoryId}|${language}`;
  const isLoading = resolvedFilterKey !== filterKey;
  const visibleResults = resolvedFilterKey === filterKey ? results : [];

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories?public=true")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCategories(data.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const term = trimmedQuery;
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (categoryId) params.set("categoryId", categoryId);
    if (language === "") {
      params.set("language", "all");
    } else if (language !== locale) {
      params.set("language", language);
    }

    const apiParams = new URLSearchParams({
      status: "published",
      take: term ? "30" : "18",
    });
    if (term) apiParams.set("search", term);
    if (categoryId) apiParams.set("categoryId", categoryId);
    if (language) apiParams.set("language", language);

    const controller = new AbortController();

    fetch(`/api/articles?${apiParams.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setResults(data.articles || []);
        setResolvedFilterKey(filterKey);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResults([]);
        setResolvedFilterKey(filterKey);
      });

    router.replace(params.size ? `/${locale}/search?${params.toString()}` : `/${locale}/search`);

    return () => {
      controller.abort();
    };
  }, [categoryId, filterKey, language, locale, router, trimmedQuery]);

  const clearFilters = () => {
    setQuery("");
    setCategoryId("");
    setLanguage(locale);
  };

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-8 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">{locale === "fr" ? "Archives" : "Archive"}</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          {locale === "fr" ? "Recherche" : "Search"}
        </h1>
      </header>

      <div className="relative mb-6 max-w-3xl border-y border-border-strong py-4">
        <SearchIcon className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === "fr" ? "Rechercher des articles" : "Search articles"}
          className="w-full border-0 bg-transparent py-3 pl-10 pr-4 font-body text-xl font-bold text-foreground placeholder:text-muted focus:outline-none sm:text-2xl"
        />
      </div>

      <div className="mb-12 grid gap-3 border-b border-border-subtle pb-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Rubrique" : "Category"}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{locale === "fr" ? "Toutes les rubriques" : "All categories"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Langue" : "Language"}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SearchLanguageFilter)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{locale === "fr" ? "Toutes les langues" : "All languages"}</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="h-10 border border-border-subtle px-4 font-label text-xs font-bold uppercase text-muted transition-colors hover:text-foreground"
        >
          {locale === "fr" ? "Effacer les filtres" : "Clear filters"}
        </button>
      </div>

      {isLoading && (
        <p className="font-body text-lg text-muted">
          {locale === "fr" ? "Chargement des articles..." : "Loading articles..."}
        </p>
      )}

      {!isLoading && trimmedQuery && visibleResults.length === 0 && (
        <p className="font-body text-lg text-muted">
          {locale === "fr"
            ? `Aucun résultat pour « ${trimmedQuery} ».`
            : `No results for “${trimmedQuery}”.`}
        </p>
      )}

      {!isLoading && !trimmedQuery && visibleResults.length === 0 && (
        <p className="font-body text-lg text-muted">
          {locale === "fr"
            ? "Aucun article récent avec ces filtres."
            : "No recent articles found for these filters."}
        </p>
      )}

      {visibleResults.length > 0 && (
        <>
          <p className="mb-5 font-label text-xs font-bold uppercase text-muted">
            {trimmedQuery
              ? locale === "fr"
                ? `${visibleResults.length} résultat${visibleResults.length > 1 ? "s" : ""} pour « ${trimmedQuery} »`
                : `${visibleResults.length} result${visibleResults.length > 1 ? "s" : ""} for “${trimmedQuery}”`
              : locale === "fr"
              ? "Derniers articles"
              : "Latest articles"}
          </p>
          <div className="divide-y divide-border-subtle border-t border-border-strong">
            {visibleResults.map((article) => (
              <ArticleCard key={article.id || article.slug} article={article} variant="list" locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LocalizedSearchPage() {
  return (
    <Suspense fallback={<div className="newspaper-shell py-16" />}>
      <SearchContent />
    </Suspense>
  );
}
