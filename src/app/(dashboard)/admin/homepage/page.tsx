"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Home, CheckCircle2, AlertTriangle } from "lucide-react";

interface HomepageSettings {
  heroArticleId?: string | null;
  autoHero?: boolean;
  secondaryArticleIds?: string[];
}

interface ArticleOption {
  id: string;
  title: string;
  status: string;
  language?: string;
}

export default function AdminHomepagePage() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [candidates, setCandidates] = useState<ArticleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [settingsRes, articlesRes] = await Promise.all([
          fetch("/api/homepage"),
          fetch("/api/articles?status=published&take=100"),
        ]);
        const settingsData = await settingsRes.json();
        const articlesData = await articlesRes.json();
        setSettings(settingsData.settings ?? { heroArticleId: null, autoHero: true, secondaryArticleIds: [] });
        setCandidates(articlesData.articles ?? []);
      } catch {
        setError("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Publication" title="Curation de la une" description="Chargement…" />
        <div className="h-64 animate-pulse border border-border-subtle bg-surface" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Publication"
        title="Curation de la une"
        description="Définissez l'article hero et les articles secondaires affichés en page d'accueil."
      />

      {error && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Configuration sauvegardée.
        </div>
      )}

      <Card>
        <CardHeader>
          <p className="font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            Configuration Hero
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings?.autoHero ?? true}
              onChange={(e) =>
                setSettings((prev) => prev ? { ...prev, autoHero: e.target.checked } : prev)
              }
              className="h-4 w-4 rounded border-border-subtle"
            />
            <span className="font-label text-sm text-foreground">Hero automatique (dernier article publié)</span>
          </label>

          {!settings?.autoHero && (
            <div>
              <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">Article Hero</label>
              <select
                value={settings?.heroArticleId || ""}
                onChange={(e) =>
                  setSettings((prev) => prev ? { ...prev, heroArticleId: e.target.value || null } : prev)
                }
                className="w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
              >
                <option value="">Aucun article</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            Articles secondaires
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx}>
              <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">
                Slot {idx + 1}
              </label>
              <select
                value={settings?.secondaryArticleIds?.[idx] || ""}
                onChange={(e) => {
                  setSettings((prev) => {
                    if (!prev) return prev;
                    const ids = [...(prev.secondaryArticleIds || [])];
                    while (ids.length <= idx) ids.push("");
                    ids[idx] = e.target.value;
                    return { ...prev, secondaryArticleIds: ids.filter(Boolean) };
                  });
                }}
                className="w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
              >
                <option value="">Aucun article</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Sauvegarde…" : "Publier la configuration"}
        </button>
        {settings?.heroArticleId && (
          <Badge variant="info">
            Hero: {candidates.find((c) => c.id === settings.heroArticleId)?.title || settings.heroArticleId}
          </Badge>
        )}
      </div>
    </div>
  );
}
