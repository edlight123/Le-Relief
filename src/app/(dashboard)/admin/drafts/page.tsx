"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, PenSquare, Plus } from "lucide-react";

interface DraftArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  updatedAt: string;
  category?: { name: string } | null;
}

export default function AdminDraftsPage() {
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<DraftArticle[]>([]);

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
    fetch(`/api/articles?status=draft&authorId=${authorId}&take=100`)
      .then((r) => r.json())
      .then((data) => {
        const rows: DraftArticle[] = (data.articles || []).sort(
          (a: DraftArticle, b: DraftArticle) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
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
        title="Mes brouillons"
        description="Articles en cours de rédaction, non encore soumis à la relecture."
        actions={
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-3.5 w-3.5" /> Nouvel article
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading || loadingUser ? "—" : articles.length} brouillon{articles.length !== 1 ? "s" : ""}
        </span>
        <Badge variant="default">Brouillons</Badge>
      </div>

      {loading || loadingUser ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun brouillon"
          description="Vos brouillons apparaîtront ici dès que vous commencerez un article."
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
                      <Badge variant="default">Brouillon</Badge>
                    </div>
                    <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">
                      {article.title || "Sans titre"}
                    </h3>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {article.category?.name || "Sans rubrique"}
                      {" · "}
                      {article.language === "en" ? "EN" : "FR"}
                      {" · "}
                      modifié {formatDistanceToNow(new Date(article.updatedAt), { locale: fr, addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                    >
                      <PenSquare className="h-3 w-3" /> Modifier
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
