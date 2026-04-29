"use client";

import { startTransition, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { AlertTriangle, Eye, PenSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ReviewArticleDetail {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  excerpt?: string;
  coverImage?: string;
  status: string;
  language?: string;
  slug?: string;
  seoTitle?: string;
  metaDescription?: string;
  publishedAt?: string | null;
  updatedAt?: string;
  submittedForReviewAt?: string | null;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

export default function AdminArticleReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ReviewArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    startTransition(() => setLoading(true));
    fetch(`/api/articles/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setArticle(data as ReviewArticleDetail))
      .catch(() => setError("Article introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Review" title="Chargement…" />
        <div className="h-96 animate-pulse border border-border-subtle bg-surface" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Review" title="Erreur" />
        <EmptyState
          icon={AlertTriangle}
          title={error || "Article introuvable"}
          description="Impossible de charger cet article pour la review."
          actionHref="/admin/review"
          actionLabel="Retour à la review"
        />
      </div>
    );
  }

  const qualityFlags: string[] = [];
  if (!article.coverImage) qualityFlags.push("Image de couverture");
  if (!article.excerpt) qualityFlags.push("Chapô");
  if (!article.seoTitle) qualityFlags.push("Titre SEO");
  if (!article.metaDescription) qualityFlags.push("Meta description");
  if (!article.slug) qualityFlags.push("Slug");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Review"
        title={article.title}
        description={`Lecture et validation de l'article — ${article.author?.name || "La rédaction"}`}
        actions={
          <Link
            href={`/admin/articles/${article.id}/edit`}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
          >
            <PenSquare className="h-3.5 w-3.5" /> Modifier
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="info">{article.status === "in_review" ? "En review" : article.status}</Badge>
        <span className="font-label text-xs text-muted">
          {article.language === "en" ? "EN" : "FR"}
          {article.category && <> · {article.category.name}</>}
        </span>
        {article.submittedForReviewAt && (
          <span className="flex items-center gap-1 font-label text-xs text-muted">
            <Clock className="h-3 w-3" />
            soumis {formatDistanceToNow(new Date(article.submittedForReviewAt), { locale: fr, addSuffix: true })}
          </span>
        )}
      </div>

      {qualityFlags.length > 0 && (
        <Card>
          <CardHeader>
            <p className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" /> Points à vérifier ({qualityFlags.length})
            </p>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 font-body text-sm text-muted">
              {qualityFlags.map((flag) => (
                <li key={flag}>{flag} manquant(e)</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {article.subtitle && (
        <Card>
          <CardHeader>
            <p className="font-label text-xs font-extrabold uppercase text-muted">Sous-titre</p>
          </CardHeader>
          <CardContent>
            <p className="font-body text-sm text-foreground">{article.subtitle}</p>
          </CardContent>
        </Card>
      )}

      {article.excerpt && (
        <Card>
          <CardHeader>
            <p className="font-label text-xs font-extrabold uppercase text-muted">Chapô</p>
          </CardHeader>
          <CardContent>
            <p className="font-body text-sm text-foreground">{article.excerpt}</p>
          </CardContent>
        </Card>
      )}

      {article.body && (
        <Card>
          <CardHeader>
            <p className="font-label text-xs font-extrabold uppercase text-muted">Corps de l&apos;article</p>
          </CardHeader>
          <CardContent>
            <div
              className="prose dark:prose-invert max-w-none font-body text-sm"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
