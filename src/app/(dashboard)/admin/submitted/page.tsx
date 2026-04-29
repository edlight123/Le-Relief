"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Clock, Eye } from "lucide-react";

interface SubmittedArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  submittedForReviewAt?: string | null;
  updatedAt: string;
  isBreaking?: boolean;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

export default function AdminSubmittedPage() {
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<SubmittedArticle[]>([]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => setAuthorId(data?.id ?? data?.uid ?? null))
      .catch(() => setAuthorId(null))
      .finally(() => setLoadingUser(false));
  }, []);

  const load = useCallback(async (uid: string) => {
    const res = await fetch(`/api/articles?status=in_review&authorId=${uid}&take=100`).then((r) => r.json());
    const sorted: SubmittedArticle[] = (res.articles || []).sort((a: SubmittedArticle, b: SubmittedArticle) => {
      const aDate = new Date(a.submittedForReviewAt || a.updatedAt).getTime();
      const bDate = new Date(b.submittedForReviewAt || b.updatedAt).getTime();
      return bDate - aDate;
    });
    setArticles(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authorId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(authorId);
  }, [authorId, load]);

  const [now] = useState(() => Date.now());
  const waitingLongCount = useMemo(
    () =>
      articles.filter((a) => {
        const base = a.submittedForReviewAt || a.updatedAt;
        const ageMs = now - new Date(base).getTime();
        return ageMs > 1000 * 60 * 60 * 48;
      }).length,
    [articles, now],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Workflow"
        title="Soumis"
        description="Articles en cours de relecture éditoriale."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading || loadingUser ? "—" : articles.length} article{articles.length !== 1 ? "s" : ""}
        </span>
        <Badge variant="info">En review</Badge>
        {waitingLongCount > 0 && (
          <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-1 font-label text-xs font-bold text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            {waitingLongCount} en attente &gt; 48h
          </span>
        )}
      </div>

      {loading || loadingUser ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Aucun article soumis"
          description="Vos articles soumis à la review apparaîtront ici."
          actionHref="/dashboard/articles/new"
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
                      <Badge variant="info">En review</Badge>
                      {article.isBreaking && <Badge variant="danger">Breaking</Badge>}
                    </div>
                    <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">
                      {article.title}
                    </h3>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {article.category?.name || "Sans rubrique"}
                      {" · "}
                      {article.language === "en" ? "EN" : "FR"}
                      {" · "}
                      soumis {formatDistanceToNow(new Date(article.submittedForReviewAt || article.updatedAt), { locale: fr, addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
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
