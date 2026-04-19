"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import type { HomepageSettings } from "@/types/homepage";

interface ArticleOption {
  id: string;
  title: string;
  publishedAt: string | null;
  featured: boolean;
  language: "fr" | "en";
  imageSrc?: string | null;
  coverImage?: string | null;
  coverImageFirebaseUrl?: string | null;
  category?: { name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  count?: number;
}

const emptySettings: HomepageSettings = {
  id: "homepage",
  heroArticleId: null,
  secondaryArticleIds: [],
  highlightedCategoryIds: [],
  showNewsletter: true,
  showEnglishSelection: true,
};

function hasImage(article: ArticleOption) {
  return Boolean(
    article.imageSrc || article.coverImageFirebaseUrl || article.coverImage,
  );
}

function formatDate(value: string | null) {
  if (!value) return "Sans date";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function setSlotValue(values: string[], index: number, nextValue: string) {
  const next = [...values];
  next[index] = nextValue;
  return [...new Set(next.filter(Boolean))].slice(0, 3);
}

export default function HomepageDashboardPage() {
  const [settings, setSettings] = useState<HomepageSettings>(emptySettings);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [settingsRes, articlesRes, categoriesRes] = await Promise.all([
          fetch("/api/homepage"),
          fetch("/api/articles?status=published&take=80"),
          fetch("/api/categories?public=true"),
        ]);

        const [settingsData, articlesData, categoriesData] = await Promise.all([
          settingsRes.json(),
          articlesRes.json(),
          categoriesRes.json(),
        ]);

        if (!active) return;

        if (settingsData.settings) setSettings(settingsData.settings);
        setArticles(articlesData.articles || []);
        setCategories(categoriesData.categories || []);
      } catch {
        if (active) setMessage("Impossible de charger la configuration.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const imageReadyArticles = useMemo(
    () => articles.filter(hasImage),
    [articles],
  );
  const selectedHero = articles.find(
    (article) => article.id === settings.heroArticleId,
  );
  const selectedSecondary = settings.secondaryArticleIds
    .map((id) => articles.find((article) => article.id === id))
    .filter((article): article is ArticleOption => Boolean(article));

  function updateSettings(next: Partial<HomepageSettings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  function toggleCategory(id: string) {
    setSettings((current) => {
      const exists = current.highlightedCategoryIds.includes(id);
      const highlightedCategoryIds = exists
        ? current.highlightedCategoryIds.filter((categoryId) => categoryId !== id)
        : [...current.highlightedCategoryIds, id].slice(0, 12);
      return { ...current, highlightedCategoryIds };
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/homepage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroArticleId: settings.heroArticleId,
        secondaryArticleIds: settings.secondaryArticleIds,
        highlightedCategoryIds: settings.highlightedCategoryIds,
        showNewsletter: settings.showNewsletter,
        showEnglishSelection: settings.showEnglishSelection,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setSettings(data.settings);
      setMessage("Une de la homepage enregistrée.");
    } else {
      setMessage(data.error || "Impossible d'enregistrer la une.");
    }

    setSaving(false);
  }

  return (
    <div className="max-w-6xl space-y-8">
      <header className="border-t-2 border-border-strong pt-4">
        <p className="page-kicker mb-2">Curation</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Une de la homepage
        </h1>
        <p className="mt-4 max-w-3xl font-body text-lg leading-relaxed text-muted">
          Choisissez les histoires qui structurent l&apos;édition publique sans
          dépendre uniquement du dernier article publié.
        </p>
      </header>

      {message ? (
        <p className="font-label text-sm font-bold text-accent-teal">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
                Article principal
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor="homepage-hero"
                className="block font-label text-xs font-extrabold uppercase text-foreground"
              >
                À la une
              </label>
              <select
                id="homepage-hero"
                value={settings.heroArticleId || ""}
                onChange={(e) =>
                  updateSettings({ heroArticleId: e.target.value || null })
                }
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Automatique: dernier article avec image</option>
                {imageReadyArticles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </select>
              <p className="font-body text-sm leading-relaxed text-muted">
                La liste privilégie les articles publiés avec image afin
                d&apos;éviter un bloc hero vide.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
                Titres secondaires
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2].map((slot) => (
                <div key={slot}>
                  <label
                    htmlFor={`homepage-secondary-${slot}`}
                    className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
                  >
                    Position {slot + 1}
                  </label>
                  <select
                    id={`homepage-secondary-${slot}`}
                    value={settings.secondaryArticleIds[slot] || ""}
                    onChange={(e) =>
                      updateSettings({
                        secondaryArticleIds: setSlotValue(
                          settings.secondaryArticleIds,
                          slot,
                          e.target.value,
                        ),
                      })
                    }
                    className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Automatique</option>
                    {imageReadyArticles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.title}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
                Rubriques mises en avant
              </h2>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center justify-between gap-3 border border-border-subtle px-3 py-2 font-label text-xs font-bold uppercase text-foreground"
                >
                  <span>
                    {category.name}
                    <span className="ml-2 text-muted">
                      {category.count ?? 0}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.highlightedCategoryIds.includes(
                      category.id,
                    )}
                    onChange={() => toggleCategory(category.id)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
                Modules
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 font-label text-xs font-extrabold uppercase text-foreground">
                <input
                  type="checkbox"
                  checked={settings.showNewsletter}
                  onChange={(e) =>
                    updateSettings({ showNewsletter: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
                Afficher la newsletter
              </label>
              <label className="flex items-center gap-3 font-label text-xs font-extrabold uppercase text-foreground">
                <input
                  type="checkbox"
                  checked={settings.showEnglishSelection}
                  onChange={(e) =>
                    updateSettings({ showEnglishSelection: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
                Afficher la sélection anglaise
              </label>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving || loading}>
              Enregistrer la une
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSettings(emptySettings)}
              disabled={saving || loading}
            >
              Revenir à l&apos;automatique
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
                Aperçu éditorial
              </h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="page-kicker mb-2">Hero</p>
                <p className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                  {selectedHero?.title || "Sélection automatique"}
                </p>
                {selectedHero ? (
                  <p className="mt-2 font-label text-[11px] font-bold uppercase text-muted">
                    {selectedHero.category?.name || "Sans rubrique"} /{" "}
                    {formatDate(selectedHero.publishedAt)}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-border-subtle pt-4">
                <p className="page-kicker mb-2">À suivre</p>
                {selectedSecondary.length > 0 ? (
                  <ol className="space-y-3">
                    {selectedSecondary.map((article, index) => (
                      <li
                        key={article.id}
                        className="grid grid-cols-[1.5rem_1fr] gap-2"
                      >
                        <span className="font-label text-[10px] font-extrabold uppercase text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-headline text-lg font-bold leading-snug text-foreground">
                          {article.title}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="font-body text-sm text-muted">
                    Les positions non choisies seront remplies
                    automatiquement.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
