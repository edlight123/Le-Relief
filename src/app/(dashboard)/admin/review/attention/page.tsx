"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Clock, ClipboardCheck, Zap } from "lucide-react";

interface AttentionArticle {
  id: string;
  title: string;
  status: string;
  submittedForReviewAt?: string | null;
  updatedAt: string;
  isBreaking?: boolean;
  coverImage?: string | null;
  excerpt?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  slug?: string | null;
  categoryId?: string | null;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

function qualityFlags(a: AttentionArticle): string[] {
  const flags: string[] = [];
  if (!a.coverImage) flags.push("Image");
  if (!a.excerpt) flags.push("Chapô");
  if (!a.seoTitle) flags.push("SEO title");
  if (!a.metaDescription) flags.push("Meta description");
  if (!a.slug) flags.push("Slug");
  if (!a.categoryId) flags.push("Rubrique");
  return flags;
}

export default function AdminReviewAttentionPage() {
  const [articles, setArticles] = useState<AttentionArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/articles?status=in_review&take=150").then((r) => r.json());
    const rows: AttentionArticle[] = (res.articles || []).sort((a: AttentionArticle, b: AttentionArticle) => {
      const aDate = new Date(a.submittedForReviewAt || a.updatedAt).getTime();
      const bDate = new Date(b.submittedForReviewAt || b.updatedAt).getTime();
      return aDate - bDate;
    });
    setArticles(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attention = useMemo(
    () =>
      articles
        .map((article) => {
          const flags = qualityFlags(article);
          const ageHours = differenceInHours(new Date(), new Date(article.submittedForReviewAt || article.updatedAt));
          const urgent = ageHours > 48 || article.isBreaking || flags.length > 0;
          return { article, flags, ageHours, urgent };
        })
        .filter((row) => row.urgent)
        .sort((a, b) => {
          if (a.article.isBreaking && !b.article.isBreaking) return -1;
          if (!a.article.isBreaking && b.article.isBreaking) return 1;
          return b.ageHours - a.ageHours;
        }),
    [articles],
  );

  const overdueCount = useMemo(() => attention.filter((r) => r.ageHours > 48).length, [attention]);
  const breakingCount = useMemo(() => attention.filter((r) => r.article.isBreaking).length, [attention]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Review"
        title="Besoin d'attention"
        description="Articles urgents, bloqués ou incomplets à traiter en priorité."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : attention.length} article{attention.length !== 1 ? "s" : ""}
        </span>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-2 py-1 font-label text-xs font-bold text-red-600">
            <Clock className="h-3 w-3" /> {overdueCount} en retard (&gt;48h)
          </span>
        )}
        {breakingCount > 0 && <Badge variant="danger">{breakingCount} Breaking</Badge>}
        <Link href="/dashboard/review" className="ml-auto font-label text-xs font-bold text-muted hover:text-primary">
          Ouvrir la queue complète →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : attention.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aucun article critique"
          description="Pas d'éléments urgents dans la file de review."
          actionHref="/dashboard/review"
          actionLabel="Voir la review queue"
        />
      ) : (
        <div className="space-y-3">
          {attention.map(({ article, flags, ageHours }) => (
            <Card key={article.id}>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="info">En review</Badge>
                      {article.isBreaking && (
                        <Badge variant="danger">
                          <Zap className="mr-1 h-3 w-3" /> Breaking
                        </Badge>
                      )}
                      {ageHours > 48 && (
                        <Badge variant="danger">
                          <Clock className="mr-1 h-3 w-3" /> {Math.floor(ageHours)}h
                        </Badge>
                      )}
                      {flags.length > 0 && (
                        <Badge variant="warning">
                          <AlertTriangle className="mr-1 h-3 w-3" /> {flags.length} point{flags.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">{article.title}</h3>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {article.author?.name || "La rédaction"}
                      {article.category && <> · {article.category.name}</>}
                      {" · "}
                      soumis {formatDistanceToNow(new Date(article.submittedForReviewAt || article.updatedAt), { locale: fr, addSuffix: true })}
                    </p>
                    {flags.length > 0 && (
                      <p className="mt-2 font-label text-xs text-amber-700 dark:text-amber-400">
                        Vérifier: {flags.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
                      className="rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                    >
                      Ouvrir
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
