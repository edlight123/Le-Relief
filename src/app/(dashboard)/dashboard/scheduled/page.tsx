"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, List } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar, { FilterBarSection } from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";
import CalendarPublicationCard from "@/components/dashboard/CalendarPublicationCard";

interface ScheduledArticle {
  id: string;
  title: string;
  scheduledAt?: string | null;
  language?: string;
  category?: { name?: string } | null;
  isBreaking?: boolean;
}

export default function ScheduledPage() {
  const [articles, setArticles] = useState<ScheduledArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("calendar");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/articles?status=scheduled&take=200");
      const data = await res.json();
      setArticles(data.articles || []);
      setLoading(false);
    }

    void load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ScheduledArticle[]>();
    for (const article of articles) {
      const date = article.scheduledAt ? new Date(article.scheduledAt) : null;
      const key = date ? date.toISOString().slice(0, 10) : "sans-date";
      const list = map.get(key) || [];
      list.push(article);
      map.set(key, list);
    }

    return [...map.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) =>
          (a.scheduledAt || "").localeCompare(b.scheduledAt || ""),
        ),
      }));
  }, [articles]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Publishing Ops"
        title="Programmés"
        description="Vue calendrier et liste opérationnelle des publications futures, pensée pour un pilotage newsroom plus calme et plus lisible."
      />

      <FilterBar>
        <FilterBarSection>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`px-3 py-2 font-label text-xs font-bold uppercase ${
            view === "calendar" ? "bg-foreground text-background" : "border border-border-subtle text-muted"
          }`}
        >
          <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Calendar view
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`px-3 py-2 font-label text-xs font-bold uppercase ${
            view === "list" ? "bg-foreground text-background" : "border border-border-subtle text-muted"
          }`}
        >
          <List className="mr-1 inline h-3.5 w-3.5" /> List view
        </button>
        </FilterBarSection>
        <FilterBarSection>
          <span className="font-label text-xs uppercase text-muted">{articles.length} publication{articles.length > 1 ? "s" : ""}</span>
        </FilterBarSection>
      </FilterBar>

      {loading ? (
        <p className="font-label text-xs text-muted">Chargement...</p>
      ) : grouped.length === 0 ? (
        <EmptyState icon={Clock3} title="Aucune publication programmée" description="La file de publication est vide pour le moment." />
      ) : view === "list" ? (
        <div className="divide-y divide-border-subtle border border-border-subtle bg-surface">
          {articles.map((article) => (
            <Link key={article.id} href={`/dashboard/articles/${article.id}/edit`} className="flex items-center justify-between px-4 py-3 hover:bg-surface-newsprint">
              <div>
                <p className="font-body text-sm font-semibold text-foreground">{article.title}</p>
                <p className="font-label text-xs text-muted">
                  {article.category?.name || "Sans rubrique"} · {article.language || "fr"}
                </p>
              </div>
              <span className="font-label text-xs text-muted">
                {article.scheduledAt ? new Date(article.scheduledAt).toLocaleString("fr-FR") : "Sans date"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => (
            <section key={group.date} className="border border-border-subtle bg-surface">
              <header className="border-b border-border-subtle px-4 py-2">
                <p className="font-label text-xs font-extrabold uppercase text-foreground">
                  {group.date === "sans-date" ? "Sans date" : new Date(group.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </header>
              <ul className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((article) => (
                  <li key={article.id}>
                    <CalendarPublicationCard id={article.id} title={article.title} scheduledAt={article.scheduledAt} category={article.category?.name} language={article.language} isBreaking={article.isBreaking} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
