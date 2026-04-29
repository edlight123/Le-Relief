"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { RotateCcw, PenSquare, AlertTriangle } from "lucide-react";

interface RevisionArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  revisionRequestedAt?: string | null;
  updatedAt: string;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

export default function AdminRevisionsPage() {
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<RevisionArticle[]>([]);

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
    fetch(`/api/articles?status=revisions_requested&authorId=${authorId}&take=100`)
      .then((r) => r.json())
      .then((data) => {
        const rows: RevisionArticle[] = (data.articles || []).sort(
          (a: RevisionArticle, b: RevisionArticle) => {
            const aDate = new Date(a.revisionRequestedAt || a.updatedAt).getTime();
            const bDate = new Date(b.revisionRequestedAt || b.updatedAt).getTime();
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
        title="Révisions demandées"
        description="Articles renvoyés par l'éditeur avec des corrections à apporter."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading || loadingUser ? "—" : articles.length} article{articles.length !== 1 ? "s" : ""}
        </span>
        <Badge variant="warning">Révisions</Badge>
      </div>

      {loading || loadingUser ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="Aucune révision en attente"
          description="Vous n'avez aucun article nécessitant des corrections."
          actionHref="/admin/workspace"
          actionLabel="Retour à l'espace de travail"
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="warning">Révisions demandées</Badge>
                    </div>
                    <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">
                      {article.title}
                    </h3>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {article.category?.name || "Sans rubrique"}
                      {" · "}
                      {article.language === "en" ? "EN" : "FR"}
                      {" · "}
                      demandé {formatDistanceToNow(new Date(article.revisionRequestedAt || article.updatedAt), { locale: fr, addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                    >
                      <PenSquare className="h-3 w-3" /> Corriger
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
