"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Eye } from "lucide-react";

interface PublishedArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  publishedAt?: string | null;
  updatedAt: string;
  slug?: string;
  views?: number;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

export default function AdminMyPublishedPage() {
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<PublishedArticle[]>([]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => setAuthorId(data?.id ?? data?.uid ?? null))
      .catch(() => setAuthorId(null))
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!authorId) return;
    startTransition(() => setLoading(true));
    fetch(`/api/articles?status=published&authorId=${authorId}&take=100`)
      .then((r) => r.json())
      .then((data) => {
        const rows: PublishedArticle[] = (data.articles || []).sort(
          (a: PublishedArticle, b: PublishedArticle) => {
            const aDate = new Date(a.publishedAt || a.updatedAt).getTime();
            const bDate = new Date(b.publishedAt || b.updatedAt).getTime();
            return bDate - aDate;
          },
        );
        setArticles(rows);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [authorId]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Rédaction"
        title="Mes publications"
        description="Vos articles publiés sur le site."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading || loadingUser ? "—" : articles.length} article{articles.length !== 1 ? "s" : ""} publié{articles.length !== 1 ? "s" : ""}
        </span>
        <Badge variant="success">Publié</Badge>
      </div>

      {loading || loadingUser ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucune publication"
          description="Vos articles publiés apparaîtront ici."
          actionHref="/admin/articles/new"
          actionLabel="Créer un article"
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="success">Publié</Badge>
                    </div>
                    <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">
                      {article.title}
                    </h3>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {article.category?.name || "Sans rubrique"}
                      {" · "}
                      {article.language === "en" ? "EN" : "FR"}
                      {" · "}
                      publié {formatDistanceToNow(new Date(article.publishedAt || article.updatedAt), { locale: fr, addSuffix: true })}
                      {article.views != null && <> · {article.views} vue{article.views !== 1 ? "s" : ""}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                    >
                      <Eye className="h-3 w-3" /> Voir
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
