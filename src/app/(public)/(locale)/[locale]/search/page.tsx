"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import ArticleCard from "@/components/public/ArticleCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocaleContext } from "@/hooks/useLocaleContext";

function SearchContent() {
  const locale = useLocaleContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
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

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const term = debouncedQuery.trim();
    const params = new URLSearchParams();
    if (term) params.set("q", term);

    if (!term) {
      router.replace(params.size ? `/${locale}/search?${params.toString()}` : `/${locale}/search`);
      return;
    }

    const apiParams = new URLSearchParams({
      search: term,
      status: "published",
      take: "30",
      language: locale,
    });

    fetch(`/api/articles?${apiParams.toString()}`)
      .then((r) => r.json())
      .then((data) => setResults(data.articles || []));

    router.replace(`/${locale}/search?${params.toString()}`);
  }, [debouncedQuery, locale, router]);

  const visibleResults = debouncedQuery.trim() ? results : [];

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

      {visibleResults.length > 0 && (
        <div className="divide-y divide-border-subtle border-t border-border-strong">
          {visibleResults.map((article) => (
            <ArticleCard key={article.id || article.slug} article={article} variant="list" locale={locale} />
          ))}
        </div>
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
