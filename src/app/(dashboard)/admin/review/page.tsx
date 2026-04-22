"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardCheck, Clock, AlertTriangle, ChevronRight } from "lucide-react";

interface ReviewArticle {
  id: string;
  title: string;
  status: string;
  submittedForReviewAt?: string | null;
  updatedAt: string;
  isBreaking?: boolean;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

export default function AdminReviewPage() {
  const [articles, setArticles] = useState<ReviewArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/articles?status=in_review&take=100").then((r) => r.json());
      const rows = (res.articles || []) as ReviewArticle[];
      rows.sort((a, b) => {
        const aDate = new Date(a.submittedForReviewAt || a.updatedAt).getTime();
        const bDate = new Date(b.submittedForReviewAt || b.updatedAt).getTime();
        return aDate - bDate;
      });
      setArticles(rows);
      setLoading(false);
    }
    load();
  }, []);

  const overdue = useMemo(
    () =>
      articles.filter((a) => {
        const age = differenceInHours(new Date(), new Date(a.submittedForReviewAt || a.updatedAt));
        return age > 48;
      }).length,
    [articles],
  );

  const breaking = useMemo(() => articles.filter((a) => a.isBreaking).length, [articles]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Review"
        title="Review Queue"
        description="Desk de validation éditoriale, trié du plus ancien au plus récent."
        actions={
          <Link
            href="/admin/review/attention"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
          >
            Besoin d'attention
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : articles.length} article{articles.length !== 1 ? "s" : ""}
        </span>
        <Badge variant="info">En review</Badge>
        {overdue > 0 && (
          <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-2 py-1 font-label text-xs font-bold text-red-600">
            <Clock className="h-3 w-3" /> {overdue} en retard (&gt;48h)
          </span>
        )}
        {breaking > 0 && (
          <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-2 py-1 font-label text-xs font-bold text-red-600">
            <AlertTriangle className="h-3 w-3" /> {breaking} Breaking
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="File vide"
          description="Aucun article en attente de review pour le moment."
          actionHref="/admin/articles"
          actionLabel="Voir les articles"
        />
      ) : (
        <div className="space-y-3">
          {articles.slice(0, 15).map((article) => (
            <Card key={article.id}>
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="info">En review</Badge>
                    {article.isBreaking ? <Badge variant="danger">Breaking</Badge> : null}
                  </div>
                  <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">{article.title}</h3>
                  <p className="mt-0.5 font-label text-xs text-muted">
                    {article.author?.name || "La rédaction"}
                    {article.category ? <> · {article.category.name}</> : null}
                    {" · "}
                    soumis {formatDistanceToNow(new Date(article.submittedForReviewAt || article.updatedAt), { locale: fr, addSuffix: true })}
                  </p>
                </div>
                <Link
                  href={`/dashboard/articles/${article.id}/edit`}
                  className="shrink-0 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                >
                  Ouvrir
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
