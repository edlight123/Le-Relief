"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface ScheduledArticle {
  id: string;
  title: string;
  scheduledAt?: string | null;
  language?: string;
  category?: { name?: string } | null;
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
      <header>
        <p className="page-kicker mb-2">Publishing Ops</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">Programmés</h1>
        <p className="mt-3 font-body text-sm text-muted">
          Vue calendrier et liste opérationnelle des publications futures.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`px-3 py-2 font-label text-xs font-bold uppercase ${
            view === "calendar" ? "bg-foreground text-background" : "border border-border-subtle text-muted"
          }`}
        >
          Calendar view
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`px-3 py-2 font-label text-xs font-bold uppercase ${
            view === "list" ? "bg-foreground text-background" : "border border-border-subtle text-muted"
          }`}
        >
          List view
        </button>
      </div>

      {loading ? (
        <p className="font-label text-xs text-muted">Chargement...</p>
      ) : grouped.length === 0 ? (
        <p className="font-label text-sm text-muted">Aucune publication programmée pour le moment.</p>
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
              <Badge variant="info">
                {article.scheduledAt ? new Date(article.scheduledAt).toLocaleString("fr-FR") : "Sans date"}
              </Badge>
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
              <ul className="divide-y divide-border-subtle">
                {group.items.map((article) => (
                  <li key={article.id}>
                    <Link href={`/dashboard/articles/${article.id}/edit`} className="flex items-center justify-between px-4 py-3 hover:bg-surface-newsprint">
                      <span className="font-body text-sm text-foreground">{article.title}</span>
                      <span className="font-label text-xs text-muted">
                        {article.scheduledAt ? new Date(article.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </span>
                    </Link>
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
