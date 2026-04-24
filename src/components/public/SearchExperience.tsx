"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Sparkles, TrendingUp } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { analyticsClient } from "@/lib/analytics-client";
import type { SearchDateRange, SearchSortOption } from "@/lib/search-ranking";

type SearchLanguageFilter = "fr" | "en" | "";

type SearchArticle = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageFirebaseUrl?: string | null;
  publishedAt: string | null;
  author: { id?: string | null; name: string | null } | null;
  category: { id?: string; name: string; slug: string } | null;
  contentTypeLabel?: string;
  readingTime?: number;
  language?: "fr" | "en";
};

type SearchCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  count?: number;
};

type SearchAuthor = {
  id: string;
  name: string | null;
  articleCount?: number;
};

type SuggestionsResponse = {
  articles: Array<{ id?: string; title: string; slug: string; language: "fr" | "en" }>;
  queries: string[];
  categories: SearchCategory[];
};

type SearchResponse = {
  articles: SearchArticle[];
  total: number;
  searchMeta?: {
    didYouMean: string | null;
    popularSearches: string[];
    relatedCategories: SearchCategory[];
  };
};

const CONTENT_TYPE_OPTIONS = [
  { value: "", fr: "Tous les formats", en: "All formats" },
  { value: "actualite", fr: "Actualité", en: "News" },
  { value: "analyse", fr: "Analyse", en: "Analysis" },
  { value: "opinion", fr: "Opinion", en: "Opinion" },
  { value: "editorial", fr: "Éditorial", en: "Editorial" },
  { value: "tribune", fr: "Tribune", en: "Op-ed" },
  { value: "dossier", fr: "Dossier", en: "Explainer" },
  { value: "fact_check", fr: "Fact-check", en: "Fact-check" },
  { value: "emission_speciale", fr: "Émission spéciale", en: "Special report" },
] as const;

const DATE_RANGE_OPTIONS: Array<{ value: SearchDateRange; fr: string; en: string }> = [
  { value: "all", fr: "Toute période", en: "All time" },
  { value: "week", fr: "7 derniers jours", en: "Last week" },
  { value: "month", fr: "30 derniers jours", en: "Last month" },
  { value: "quarter", fr: "3 derniers mois", en: "Last 3 months" },
];

const SORT_OPTIONS: Array<{ value: SearchSortOption; fr: string; en: string }> = [
  { value: "relevance", fr: "Pertinence", en: "Relevance" },
  { value: "recent", fr: "Plus récent", en: "Most recent" },
  { value: "most_viewed", fr: "Plus vus", en: "Most viewed" },
];

function parseLanguageFilter(value: string | null, locale: "fr" | "en"): SearchLanguageFilter {
  if (value === "fr" || value === "en") return value;
  if (value === "all") return "";
  return locale;
}

function parseSort(value: string | null, hasQuery: boolean): SearchSortOption {
  if (value === "recent" || value === "most_viewed" || value === "relevance") return value;
  return hasQuery ? "relevance" : "recent";
}

function parseDateRange(value: string | null): SearchDateRange {
  if (value === "week" || value === "month" || value === "quarter") return value;
  return "all";
}

export default function SearchExperience() {
  const locale = useLocaleContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("categoryId") || "";
  const initialAuthor = searchParams.get("authorId") || "";
  const initialContentType = searchParams.get("contentType") || "";
  const initialLanguage = parseLanguageFilter(searchParams.get("language"), locale);
  const initialDateRange = parseDateRange(searchParams.get("dateRange"));
  const initialSort = parseSort(searchParams.get("sortBy"), Boolean(initialQuery.trim()));

  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [authorId, setAuthorId] = useState(initialAuthor);
  const [contentType, setContentType] = useState(initialContentType);
  const [language, setLanguage] = useState<SearchLanguageFilter>(initialLanguage);
  const [dateRange, setDateRange] = useState<SearchDateRange>(initialDateRange);
  const [sortBy, setSortBy] = useState<SearchSortOption>(initialSort);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [authors, setAuthors] = useState<SearchAuthor[]>([]);
  const [results, setResults] = useState<SearchArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [searchMeta, setSearchMeta] = useState<SearchResponse["searchMeta"]>();
  const [suggestions, setSuggestions] = useState<SuggestionsResponse>({
    articles: [],
    queries: [],
    categories: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolvedFilterKey, setResolvedFilterKey] = useState("");

  const debouncedQuery = useDebounce(query, 250);
  const trimmedQuery = debouncedQuery.trim();
  const filterKey = `${trimmedQuery}|${categoryId}|${authorId}|${contentType}|${language}|${dateRange}|${sortBy}`;
  const isLoading = resolvedFilterKey !== filterKey;
  const visibleResults = resolvedFilterKey === filterKey ? results : [];
  const popularSearches = useMemo(
    () => searchMeta?.popularSearches || suggestions.queries,
    [searchMeta?.popularSearches, suggestions.queries],
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/categories?public=true").then((response) => response.json()),
      fetch("/api/users?public=true").then((response) => response.json()),
      fetch(`/api/search/suggestions?locale=${locale}`).then((response) => response.json()),
    ])
      .then(([categoryData, userData, suggestionData]) => {
        if (cancelled) return;
        setCategories(categoryData.categories || []);
        setAuthors(userData.users || []);
        setSuggestions({
          articles: suggestionData.articles || [],
          queries: suggestionData.queries || [],
          categories: suggestionData.categories || [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
        setAuthors([]);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmedQuery)}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        setSuggestions({
          articles: data.articles || [],
          queries: data.queries || [],
          categories: data.categories || [],
        });
        setShowSuggestions(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions((current) => ({ ...current, articles: [], categories: [] }));
        }
      });

    return () => controller.abort();
  }, [locale, trimmedQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (categoryId) params.set("categoryId", categoryId);
    if (authorId) params.set("authorId", authorId);
    if (contentType) params.set("contentType", contentType);
    if (dateRange !== "all") params.set("dateRange", dateRange);
    if (language === "") params.set("language", "all");
    else if (language !== locale) params.set("language", language);
    if (sortBy !== (trimmedQuery ? "relevance" : "recent")) params.set("sortBy", sortBy);

    const apiParams = new URLSearchParams({
      status: "published",
      take: trimmedQuery ? "30" : "18",
    });

    if (trimmedQuery) apiParams.set("search", trimmedQuery);
    if (categoryId) apiParams.set("categoryId", categoryId);
    if (authorId) apiParams.set("authorId", authorId);
    if (contentType) apiParams.set("contentType", contentType);
    if (dateRange !== "all") apiParams.set("dateRange", dateRange);
    if (language) apiParams.set("language", language);
    if (sortBy) apiParams.set("sortBy", sortBy);

    const controller = new AbortController();

    fetch(`/api/articles?${apiParams.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: SearchResponse) => {
        setResults(data.articles || []);
        setTotal(data.total || 0);
        setSearchMeta(data.searchMeta);
        setResolvedFilterKey(filterKey);

        if (trimmedQuery) {
          analyticsClient.trackSearchQuery({
            query: trimmedQuery,
            language: language || locale,
            categoryFilter: categoryId || undefined,
            resultCount: data.total || 0,
            zeroResults: (data.total || 0) === 0,
          });
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResults([]);
        setTotal(0);
        setSearchMeta(undefined);
        setResolvedFilterKey(filterKey);
      });

    router.replace(params.size ? `/search?${params.toString()}` : "/search", {
      scroll: false,
    });

    return () => controller.abort();
  }, [authorId, categoryId, contentType, dateRange, filterKey, language, locale, router, sortBy, trimmedQuery]);

  const clearFilters = () => {
    setQuery("");
    setCategoryId("");
    setAuthorId("");
    setContentType("");
    setLanguage(locale);
    setDateRange("all");
    setSortBy("recent");
    setShowSuggestions(false);
  };

  const applySuggestion = (value: string) => {
    setQuery(value);
    setShowSuggestions(false);
  };

  return (
    <div className="newspaper-shell py-6 sm:py-10">
      <header className="mb-6 border-y-2 border-border-strong py-6 text-center sm:py-9">
        <p className="page-kicker mb-3" style={{ letterSpacing: "1.4px" }}>
          {locale === "fr" ? "Archives" : "Archive"}
        </p>
        <h1 className="editorial-title mx-auto max-w-3xl text-4xl text-foreground sm:text-6xl">
          {locale === "fr" ? "Recherche avancée" : "Advanced search"}
        </h1>
        <p className="editorial-deck mx-auto mt-3 max-w-2xl font-body text-base sm:text-lg">
          {locale === "fr"
            ? "Suggestions instantanées, filtres éditoriaux, tri par pertinence, date ou popularité."
            : "Instant suggestions, editorial filters, sort by relevance, date or popularity."}
        </p>
      </header>

      <div className="relative mb-6 max-w-4xl border-y border-border-strong py-4">
        <SearchIcon className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onFocus={() => setShowSuggestions(trimmedQuery.length >= 2)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={locale === "fr" ? "Rechercher un sujet, une rubrique ou un auteur" : "Search for a topic, category or author"}
          className="w-full border-0 bg-transparent py-3 pl-10 pr-4 font-body text-xl font-bold text-foreground placeholder:text-muted focus:outline-none sm:text-2xl"
          aria-label={locale === "fr" ? "Rechercher" : "Search"}
        />

        {showSuggestions && trimmedQuery.length >= 2 && (suggestions.articles.length > 0 || suggestions.queries.length > 0 || suggestions.categories.length > 0) ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 border border-border-subtle bg-background shadow-2xl">
            {suggestions.queries.length > 0 ? (
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="mb-2 flex items-center gap-2 font-label text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {locale === "fr" ? "Recherches populaires" : "Popular searches"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.queries.slice(0, 6).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={() => applySuggestion(term)}
                      className="border border-border-subtle px-2 py-1 font-label text-[11px] font-bold uppercase text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {suggestions.articles.length > 0 ? (
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="mb-2 font-label text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  {locale === "fr" ? "Articles suggérés" : "Suggested articles"}
                </p>
                <div className="space-y-2">
                  {suggestions.articles.slice(0, 4).map((article) => (
                    <button
                      key={`${article.language}-${article.slug}`}
                      type="button"
                      onMouseDown={() => applySuggestion(article.title)}
                      className="block w-full text-left font-body text-sm text-foreground transition-colors hover:text-primary"
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {suggestions.categories.length > 0 ? (
              <div className="px-4 py-3">
                <p className="mb-2 flex items-center gap-2 font-label text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  <Sparkles className="h-3.5 w-3.5" />
                  {locale === "fr" ? "Rubriques liées" : "Related categories"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.categories.slice(0, 4).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onMouseDown={() => {
                        setCategoryId(category.id);
                        setShowSuggestions(false);
                      }}
                      className="border border-border-subtle px-2 py-1 font-label text-[11px] font-bold uppercase text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mb-12 grid gap-3 border-b border-border-subtle pb-5 sm:grid-cols-2 xl:grid-cols-4">
        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Rubrique" : "Category"}
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
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
          {locale === "fr" ? "Auteur" : "Author"}
          <select
            value={authorId}
            onChange={(event) => setAuthorId(event.target.value)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{locale === "fr" ? "Tous les auteurs" : "All authors"}</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name || (locale === "fr" ? "Sans nom" : "Unnamed")}
                {author.articleCount ? ` (${author.articleCount})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Format" : "Content type"}
          <select
            value={contentType}
            onChange={(event) => setContentType(event.target.value)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {locale === "fr" ? option.fr : option.en}
              </option>
            ))}
          </select>
        </label>

        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Langue" : "Language"}
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as SearchLanguageFilter)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{locale === "fr" ? "Toutes les langues" : "All languages"}</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Période" : "Date range"}
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value as SearchDateRange)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {locale === "fr" ? option.fr : option.en}
              </option>
            ))}
          </select>
        </label>

        <label className="font-label text-xs font-extrabold uppercase text-foreground">
          {locale === "fr" ? "Trier par" : "Sort by"}
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SearchSortOption)}
            className="mt-2 w-full border border-border-subtle bg-surface px-3 py-3 font-label text-base text-foreground focus:border-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {locale === "fr" ? option.fr : option.en}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-[44px] w-full border border-border-subtle px-4 font-label text-xs font-bold uppercase text-muted transition-colors hover:text-foreground"
          >
            {locale === "fr" ? "Effacer les filtres" : "Clear filters"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="font-body text-lg text-muted">
          {locale === "fr" ? "Chargement des articles..." : "Loading articles..."}
        </p>
      ) : null}

      {!isLoading && trimmedQuery && visibleResults.length === 0 ? (
        <div className="space-y-6 border-t border-border-strong py-8">
          <div>
            <p className="font-body text-lg text-foreground">
              {locale === "fr"
                ? `Aucun résultat pour « ${trimmedQuery} ».`
                : `No results for “${trimmedQuery}”.`}
            </p>
            {searchMeta?.didYouMean ? (
              <button
                type="button"
                onClick={() => applySuggestion(searchMeta.didYouMean || "")}
                className="mt-3 font-label text-xs font-bold uppercase text-primary transition-colors hover:text-foreground"
              >
                {locale === "fr" ? `Vouliez-vous dire : ${searchMeta.didYouMean}` : `Did you mean: ${searchMeta.didYouMean}`}
              </button>
            ) : null}
          </div>

          {popularSearches.length > 0 ? (
            <section>
              <p className="mb-3 font-label text-xs font-bold uppercase text-muted">
                {locale === "fr" ? "Recherches populaires" : "Popular searches"}
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.slice(0, 6).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => applySuggestion(term)}
                    className="border border-border-subtle px-3 py-2 font-label text-[11px] font-bold uppercase text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {searchMeta?.relatedCategories?.length ? (
            <section>
              <p className="mb-3 font-label text-xs font-bold uppercase text-muted">
                {locale === "fr" ? "Rubriques associées" : "Related categories"}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {searchMeta.relatedCategories.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className="border border-border-subtle p-4 text-left transition-colors hover:border-primary"
                  >
                    <p className="font-headline text-xl font-bold text-foreground">{category.name}</p>
                    {category.description ? (
                      <p className="mt-2 font-body text-sm leading-relaxed text-muted">
                        {category.description}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !trimmedQuery && visibleResults.length === 0 ? (
        <div className="space-y-4 border-t border-border-strong py-8">
          <p className="font-body text-lg text-muted">
            {locale === "fr"
              ? "Aucun article récent avec ces filtres."
              : "No recent articles found for these filters."}
          </p>
          {popularSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {popularSearches.slice(0, 6).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => applySuggestion(term)}
                  className="border border-border-subtle px-3 py-2 font-label text-[11px] font-bold uppercase text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {term}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {visibleResults.length > 0 ? (
        <>
          <p className="mb-5 font-label text-xs font-bold uppercase text-muted">
            {trimmedQuery
              ? locale === "fr"
                ? `${total} résultat${total > 1 ? "s" : ""} pour « ${trimmedQuery} »`
                : `${total} result${total > 1 ? "s" : ""} for “${trimmedQuery}”`
              : locale === "fr"
                ? "Derniers articles"
                : "Latest articles"}
          </p>
          <div className="divide-y divide-border-subtle border-t border-border-strong">
            {visibleResults.map((article) => (
              <ArticleCard
                key={article.id || article.slug}
                article={article}
                variant="list"
                locale={locale}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
