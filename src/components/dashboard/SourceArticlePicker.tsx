"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SourceArticle {
  id: string;
  title: string;
  slug?: string;
  publishedAt?: string | null;
  category?: { id: string; name: string } | null;
  allowTranslation?: boolean;
  isCanonicalSource?: boolean;
}

interface TranslationArticle {
  id: string;
  sourceArticleId?: string | null;
}

interface SourceArticlePickerProps {
  value: string;
  onChange: (articleId: string) => void;
  onArticleSelected?: (article: SourceArticle | null) => void;
  currentArticleId?: string;
  error?: string;
}

export default function SourceArticlePicker({
  value,
  onChange,
  onArticleSelected,
  currentArticleId,
  error,
}: SourceArticlePickerProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceArticle[]>([]);
  const [translations, setTranslations] = useState<TranslationArticle[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch(`/api/articles?status=published&language=fr&take=200&search=${encodeURIComponent(debouncedQuery)}`).then((res) => res.json()),
      fetch("/api/articles?language=en&take=1000").then((res) => res.json()),
    ])
      .then(([frData, enData]) => {
        if (!mounted) return;
        setSources(Array.isArray(frData.articles) ? frData.articles : []);
        setTranslations(Array.isArray(enData.articles) ? enData.articles : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedQuery]);

  const translatedSourceIds = useMemo(() => {
    return new Set(
      translations
        .filter((item) => item.id !== currentArticleId)
        .map((item) => item.sourceArticleId)
        .filter((id): id is string => Boolean(id)),
    );
  }, [translations, currentArticleId]);

  const eligibleSources = useMemo(() => {
    return sources.filter(
      (article) =>
        article.allowTranslation === true &&
        article.isCanonicalSource === true &&
        (!translatedSourceIds.has(article.id) || article.id === value),
    );
  }, [sources, translatedSourceIds, value]);

  const selected = eligibleSources.find((item) => item.id === value) || null;

  return (
    <div className="space-y-3 border border-border-subtle p-4">
      <div className="space-y-2">
        <label className="block font-label text-xs font-extrabold uppercase text-foreground">
          Source Article (FR) <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setLoading(true);
            setQuery(e.target.value);
          }}
          placeholder="Rechercher un article FR publié..."
          className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <select
        value={value}
        onChange={(e) => {
          const nextValue = e.target.value;
          onChange(nextValue);
          if (!onArticleSelected) return;
          const found = eligibleSources.find((article) => article.id === nextValue) || null;
          onArticleSelected(found);
        }}
        className={`w-full border bg-surface px-4 py-3 font-label text-sm text-foreground focus:outline-none ${
          error ? "border-primary" : "border-border-subtle focus:border-primary"
        }`}
      >
        <option value="">Sélectionner la source FR</option>
        {eligibleSources.map((article) => (
          <option key={article.id} value={article.id}>
            {article.title}
          </option>
        ))}
      </select>

      {loading && <p className="font-label text-xs text-muted">Chargement des sources...</p>}
      {!loading && eligibleSources.length === 0 && (
        <p className="font-label text-xs text-muted">Aucune source FR éligible trouvée.</p>
      )}

      {error && <p className="font-label text-xs text-primary">{error}</p>}

      {selected && (
        <div className="border border-border-subtle bg-surface-newsprint px-3 py-2 font-label text-xs text-muted">
          <p className="font-bold text-foreground">{selected.title}</p>
          <p>
            {selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString("fr-FR") : "Date inconnue"}
            {selected.category?.name ? ` · ${selected.category.name}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
