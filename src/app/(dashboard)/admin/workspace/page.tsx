"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import {
  PenSquare,
  RotateCcw,
  Send,
  FileText,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Card, { CardContent } from "@/components/ui/Card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticleAuthor {
  id: string;
  displayName?: string;
  name?: string;
}

interface ArticleCategory {
  id: string;
  name?: string;
  slug?: string;
}

interface ArticleComment {
  id: string;
  body?: string;
  content?: string;
  resolved?: boolean;
  createdAt?: string;
}

interface Article {
  id: string;
  title: string;
  status: string;
  language?: string;
  authorId?: string;
  author?: ArticleAuthor | null;
  categoryId?: string;
  category?: ArticleCategory | null;
  updatedAt?: string;
  createdAt?: string;
  revisionRequestedAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Brouillon",
    writing: "En rédaction",
    revisions_requested: "Révisions demandées",
    in_review: "En relecture",
    pending_review: "En attente de relecture",
  };
  return map[status] ?? status;
}

function statusVariant(
  status: string
): "default" | "warning" | "info" | "success" | "danger" {
  if (status === "revisions_requested") return "warning";
  if (status === "in_review" || status === "pending_review") return "info";
  return "default";
}

async function fetchArticlesByStatus(
  status: string,
  authorId: string
): Promise<Article[]> {
  const res = await fetch(
    `/api/articles?status=${status}&authorId=${authorId}&take=5`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.articles ?? []);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse border border-border-subtle bg-surface"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article row
// ---------------------------------------------------------------------------

interface ArticleRowProps {
  article: Article;
  showResubmit?: boolean;
  showComments?: boolean;
}

function ArticleRow({
  article,
  showResubmit = false,
  showComments = false,
}: ArticleRowProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<ArticleComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitted, setResubmitted] = useState(false);

  const authorName =
    article.author?.displayName ?? article.author?.name ?? "—";
  const categoryName = article.category?.name ?? "—";
  const lang = article.language ? article.language.toUpperCase() : "";
  const updatedAt = article.updatedAt
    ? formatDistanceToNow(new Date(article.updatedAt), {
        locale: fr,
        addSuffix: true,
      })
    : null;

  const isOverdue =
    article.revisionRequestedAt &&
    differenceInHours(new Date(), new Date(article.revisionRequestedAt)) > 72;

  const unresolvedCount =
    comments?.filter((c) => !c.resolved).length ?? null;

  async function toggleComments() {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    if (comments !== null) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/articles/${article.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : (data.comments ?? []));
      }
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleResubmit() {
    setResubmitting(true);
    try {
      await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_review" }),
      });
      setResubmitted(true);
    } finally {
      setResubmitting(false);
    }
  }

  return (
    <div className="border border-border-subtle bg-surface">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-headline text-sm font-bold text-foreground truncate">
              {article.title || "Sans titre"}
            </span>
            <Badge variant={statusVariant(article.status)}>
              {statusLabel(article.status)}
            </Badge>
            {isOverdue && (
              <Badge variant="danger">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                En retard
              </Badge>
            )}
            {resubmitted && <Badge variant="success">Soumis</Badge>}
          </div>
          <p className="mt-1 font-body text-xs text-muted">
            {authorName} · {categoryName}
            {lang ? ` · ${lang}` : ""}
            {updatedAt ? ` · modifié ${updatedAt}` : ""}
          </p>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showComments && (
            <button
              type="button"
              onClick={toggleComments}
              className="inline-flex items-center gap-1 border border-border-subtle bg-surface px-3 py-1.5 font-label text-xs font-bold text-foreground hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Voir les commentaires
              {unresolvedCount !== null && unresolvedCount > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary font-label text-[10px] font-bold text-white">
                  {unresolvedCount}
                </span>
              )}
              {commentsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
          {showResubmit && !resubmitted && (
            <button
              type="button"
              onClick={handleResubmit}
              disabled={resubmitting}
              className="inline-flex items-center gap-1 border border-accent-teal bg-[rgba(31,111,100,0.08)] px-3 py-1.5 font-label text-xs font-bold text-accent-teal hover:bg-[rgba(31,111,100,0.14)] disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {resubmitting ? "…" : "Resoumettre"}
            </button>
          )}
          <Link
            href={`/dashboard/articles/${article.id}/edit`}
            className="inline-flex items-center gap-1 border border-border-subtle bg-surface px-3 py-1.5 font-label text-xs font-bold text-foreground hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
          >
            <PenSquare className="h-3.5 w-3.5" />
            Modifier
          </Link>
        </div>
      </div>

      {/* Comments panel */}
      {commentsOpen && (
        <div className="border-t border-border-subtle px-4 py-3">
          {loadingComments ? (
            <p className="font-body text-xs text-muted">Chargement…</p>
          ) : comments && comments.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-sm border px-3 py-2 font-body text-xs ${
                    c.resolved
                      ? "border-border-subtle text-muted line-through opacity-60"
                      : "border-accent-amber/30 bg-[rgba(185,120,24,0.06)] text-foreground"
                  }`}
                >
                  {c.body ?? c.content ?? "(commentaire vide)"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-xs text-muted">Aucun commentaire.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}

function Section({ icon, title, count, children }: SectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted">{icon}</span>
        <h2 className="font-headline text-lg font-bold text-foreground">
          {title}
        </h2>
        {count > 0 && <Badge variant="default">{count}</Badge>}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WriterWorkspacePage() {
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [inProgress, setInProgress] = useState<Article[]>([]);
  const [revisions, setRevisions] = useState<Article[]>([]);
  const [submitted, setSubmitted] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Step 1: resolve authorId
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setAuthorId(data?.id ?? data?.uid ?? null);
      })
      .catch(() => setAuthorId(null))
      .finally(() => setLoadingUser(false));
  }, []);

  // Step 2: fetch articles once authorId is known
  const loadArticles = useCallback(async (id: string) => {
    setLoadingArticles(true);
    try {
      const [drafts, writing, revisionsData, inReview] = await Promise.all([
        fetchArticlesByStatus("draft", id),
        fetchArticlesByStatus("writing", id),
        fetchArticlesByStatus("revisions_requested", id),
        fetchArticlesByStatus("in_review", id),
      ]);
      // merge draft + writing, de-duplicate by id
      const mergedInProgress = [
        ...drafts,
        ...writing.filter((w) => !drafts.some((d) => d.id === w.id)),
      ].slice(0, 5);
      setInProgress(mergedInProgress);
      setRevisions(revisionsData.slice(0, 5));
      setSubmitted(inReview.slice(0, 5));
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    if (authorId) loadArticles(authorId);
  }, [authorId, loadArticles]);

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  // Render loading state while resolving user
  if (loadingUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 h-16 w-64 animate-pulse border border-border-subtle bg-surface" />
        <div className="flex flex-col gap-6">
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <PageHeader
          kicker="Ma rédaction"
          title="Espace de travail"
          description={todayLabel}
          actions={
            <Link
              href="/dashboard/articles/new"
              className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-label text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              <PenSquare className="h-4 w-4" />
              Nouvel article
            </Link>
          }
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-10">
        {/* 1 · En cours */}
        <Section
          icon={<Clock className="h-5 w-5" />}
          title="En cours"
          count={inProgress.length}
        >
          {loadingArticles ? (
            <SectionSkeleton />
          ) : inProgress.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun brouillon en cours"
              description="Créez un nouvel article pour commencer à rédiger."
              actionLabel="Créer un article"
              actionHref="/dashboard/articles/new"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {inProgress.map((a) => (
                <ArticleRow key={a.id} article={a} />
              ))}
            </div>
          )}
        </Section>

        {/* 2 · Révisions demandées */}
        <Section
          icon={<RotateCcw className="h-5 w-5" />}
          title="Révisions demandées"
          count={revisions.length}
        >
          {loadingArticles ? (
            <SectionSkeleton />
          ) : revisions.length === 0 ? (
            <EmptyState
              icon={RotateCcw}
              title="Aucune révision en attente"
              description="Vous n'avez pas d'articles à corriger pour le moment."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {revisions.map((a) => (
                <ArticleRow key={a.id} article={a} showResubmit showComments />
              ))}
            </div>
          )}
        </Section>

        {/* 3 · Soumis à relecture */}
        <Section
          icon={<Send className="h-5 w-5" />}
          title="Soumis à relecture"
          count={submitted.length}
        >
          {loadingArticles ? (
            <SectionSkeleton />
          ) : submitted.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Aucun article en relecture"
              description="Vos articles soumis à l'équipe éditoriale apparaîtront ici."
            />
          ) : (
            <div className="flex flex-col gap-2">
              <Card>
                <CardContent className="py-2.5 px-4">
                  <p className="font-body text-xs text-muted flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-accent-amber" />
                    Votre contenu est en cours de relecture. Aucune modification n&apos;est possible.
                  </p>
                </CardContent>
              </Card>
              {submitted.map((a) => (
                <div
                  key={a.id}
                  className="border border-border-subtle bg-surface"
                >
                  <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-headline text-sm font-bold text-foreground truncate">
                          {a.title || "Sans titre"}
                        </span>
                        <Badge variant={statusVariant(a.status)}>
                          {statusLabel(a.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 font-body text-xs text-muted">
                        {a.author?.displayName ?? a.author?.name ?? "—"} ·{" "}
                        {a.category?.name ?? "—"}
                        {a.language ? ` · ${a.language.toUpperCase()}` : ""}
                        {a.updatedAt
                          ? ` · modifié ${formatDistanceToNow(
                              new Date(a.updatedAt),
                              { locale: fr, addSuffix: true }
                            )}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <span className="inline-flex items-center gap-1 font-label text-xs text-muted">
                        <Clock className="h-3.5 w-3.5" />
                        En relecture
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

