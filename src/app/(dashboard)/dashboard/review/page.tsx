"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getEditorialStatusLabel,
  getEditorialStatusVariant,
} from "@/lib/editorial-workflow";
import {
  CheckCircle2,
  RotateCcw,
  XCircle,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
} from "lucide-react";

interface ReviewArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  contentType?: string;
  submittedForReviewAt?: string | null;
  updatedAt: string;
  priorityLevel?: string | null;
  isBreaking?: boolean;
  excerpt?: string | null;
  coverImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  slug?: string | null;
  categoryId?: string | null;
  authorId?: string | null;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

interface CommentItem {
  id: string;
  body: string;
  type: "comment" | "blocking" | "revision_note";
  createdAt?: string;
  resolvedAt?: string | null;
  author?: { name?: string | null } | null;
}

function qualityFlags(a: ReviewArticle): string[] {
  const flags: string[] = [];
  if (!a.coverImage) flags.push("Image principale manquante");
  if (!a.excerpt) flags.push("Chapô manquant");
  if (!a.seoTitle) flags.push("SEO title manquant");
  if (!a.metaDescription) flags.push("Meta description manquante");
  if (!a.slug) flags.push("Slug invalide");
  if (!a.categoryId) flags.push("Rubrique manquante");
  if (!a.authorId) flags.push("Auteur manquant");
  return flags;
}

function ArticleCard({
  article,
  onDecision,
}: {
  article: ReviewArticle;
  onDecision: (
    id: string,
    action: "approve" | "revisions_requested" | "rejected",
    note?: string,
  ) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "approve" | "revisions_requested" | "rejected" | null
  >(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const flags = useMemo(() => qualityFlags(article), [article]);
  const isOverdue = useMemo(() => {
    if (!article.submittedForReviewAt) return false;
    const ageHours =
      differenceInHours(new Date(), new Date(article.submittedForReviewAt));
    return ageHours > 48;
  }, [article.submittedForReviewAt]);

  useEffect(() => {
    if (!expanded || commentsLoaded) return;
    let active = true;
    fetch(`/api/articles/${article.id}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setComments(data.comments || []);
        setCommentsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [expanded, commentsLoaded, article.id]);

  const unresolvedBlocking = useMemo(
    () => comments.filter((c) => c.type === "blocking" && !c.resolvedAt).length,
    [comments],
  );

  async function handleDecision() {
    if (!pendingAction) return;
    if (
      (pendingAction === "revisions_requested" || pendingAction === "rejected") &&
      !actionNote.trim()
    )
      return;
    setSubmitting(true);
    await onDecision(article.id, pendingAction, actionNote.trim() || undefined);
    setSubmitting(false);
    setPendingAction(null);
    setActionNote("");
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant={getEditorialStatusVariant(article.status)}>
              {getEditorialStatusLabel(article.status)}
            </Badge>
            {article.isBreaking && <Badge variant="danger">Breaking</Badge>}
            {article.priorityLevel && (
              <Badge variant="warning">{article.priorityLevel}</Badge>
            )}
            {isOverdue && (
              <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 font-label text-[10px] font-bold text-red-600">
                <Clock className="h-3 w-3" />
                En retard
              </span>
            )}
            {unresolvedBlocking > 0 && (
              <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 font-label text-[10px] font-bold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {unresolvedBlocking} bloquant{unresolvedBlocking > 1 ? "s" : ""}
              </span>
            )}
            {flags.length > 0 && (
              <span className="flex items-center gap-1 rounded-sm bg-accent-amber/10 px-1.5 py-0.5 font-label text-[10px] font-bold text-accent-amber">
                <AlertTriangle className="h-3 w-3" />
                {flags.length} avertissement{flags.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">
            {article.title}
          </h3>
          <p className="mt-0.5 font-label text-xs text-muted">
            {article.author?.name || "La rédaction"}
            {article.category && <> · {article.category.name}</>}
            {" · "}
            {article.language === "en" ? "EN" : "FR"}
            {article.submittedForReviewAt && (
              <>
                {" · "}Soumis{" "}
                {formatDistanceToNow(new Date(article.submittedForReviewAt), {
                  locale: fr,
                  addSuffix: true,
                })}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/dashboard/articles/${article.id}/edit`}
            className="flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-1.5 font-label text-[11px] font-bold text-muted transition-colors hover:text-foreground"
            target="_blank"
          >
            <Eye className="h-3 w-3" />
            Ouvrir
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-sm border border-border-subtle px-2 py-1.5 font-label text-[11px] font-bold text-muted transition-colors hover:text-foreground"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Décision
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-subtle bg-surface-newsprint">
          <div className="grid gap-6 px-5 py-4 lg:grid-cols-2">
            {/* Quality checklist */}
            <div>
              <p className="mb-2 font-label text-[11px] font-extrabold uppercase text-muted">
                Contrôle qualité
              </p>
              {flags.length === 0 ? (
                <p className="flex items-center gap-1.5 font-label text-xs text-accent-teal">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tous les champs requis sont présents
                </p>
              ) : (
                <ul className="space-y-1">
                  {flags.map((flag) => (
                    <li
                      key={flag}
                      className="flex items-center gap-1.5 font-label text-xs text-accent-amber"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              )}

              {commentsLoaded && comments.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 font-label text-[11px] font-extrabold uppercase text-muted">
                    Commentaires ({comments.length})
                  </p>
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {comments.map((c) => (
                      <li
                        key={c.id}
                        className="border border-border-subtle bg-surface p-2"
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <Badge
                            variant={
                              c.type === "blocking"
                                ? "danger"
                                : c.type === "revision_note"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {c.type === "blocking"
                              ? "Bloquant"
                              : c.type === "revision_note"
                                ? "Note révision"
                                : "Commentaire"}
                          </Badge>
                          {c.resolvedAt && <Badge variant="success">Résolu</Badge>}
                          <span className="font-label text-[10px] text-muted">
                            {c.author?.name || "Rédaction"}
                          </span>
                        </div>
                        <p className="font-body text-xs text-foreground">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Decision panel */}
            <div>
              <p className="mb-2 font-label text-[11px] font-extrabold uppercase text-muted">
                Décision éditoriale
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPendingAction(pendingAction === "approve" ? null : "approve")
                  }
                  className={`flex items-center gap-1.5 rounded-sm border px-3 py-2 font-label text-xs font-bold transition-colors ${
                    pendingAction === "approve"
                      ? "border-accent-teal bg-accent-teal/10 text-accent-teal"
                      : "border-border-subtle hover:border-accent-teal hover:text-accent-teal"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approuver
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPendingAction(
                      pendingAction === "revisions_requested"
                        ? null
                        : "revisions_requested",
                    )
                  }
                  className={`flex items-center gap-1.5 rounded-sm border px-3 py-2 font-label text-xs font-bold transition-colors ${
                    pendingAction === "revisions_requested"
                      ? "border-accent-amber bg-accent-amber/10 text-accent-amber"
                      : "border-border-subtle hover:border-accent-amber hover:text-accent-amber"
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Révisions demandées
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPendingAction(pendingAction === "rejected" ? null : "rejected")
                  }
                  className={`flex items-center gap-1.5 rounded-sm border px-3 py-2 font-label text-xs font-bold transition-colors ${
                    pendingAction === "rejected"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-subtle hover:border-primary hover:text-primary"
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Rejeter
                </button>
              </div>

              {pendingAction && (
                <div className="space-y-2">
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder={
                      pendingAction === "revisions_requested"
                        ? "Décrivez les révisions attendues..."
                        : pendingAction === "rejected"
                          ? "Motif du rejet..."
                          : "Note optionnelle pour l'approbation..."
                    }
                    rows={3}
                    className="w-full resize-none border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={
                        pendingAction === "approve"
                          ? "primary"
                          : pendingAction === "rejected"
                            ? "danger"
                            : "secondary"
                      }
                      onClick={handleDecision}
                      disabled={
                        submitting ||
                        ((pendingAction === "revisions_requested" ||
                          pendingAction === "rejected") &&
                          !actionNote.trim())
                      }
                    >
                      {submitting
                        ? "En cours..."
                        : pendingAction === "approve"
                          ? "Confirmer l'approbation"
                          : pendingAction === "revisions_requested"
                            ? "Demander révisions"
                            : "Confirmer le rejet"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingAction(null);
                        setActionNote("");
                      }}
                      className="font-label text-xs text-muted hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-border-subtle pt-3">
                <Link
                  href={`/dashboard/articles/${article.id}/edit`}
                  className="flex items-center gap-1.5 font-label text-xs text-primary hover:underline"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ouvrir l&apos;éditeur pour commenter
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ReviewQueuePage() {
  const [articles, setArticles] = useState<ReviewArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "fr" | "en">("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch("/api/articles?status=in_review&take=100").then((r) => r.json()),
      fetch("/api/articles?status=pending_review&take=100").then((r) => r.json()),
    ]);
    const merged: ReviewArticle[] = [
      ...(r1.articles || []),
      ...(r2.articles || []),
    ];
    const seen = new Set<string>();
    const deduped = merged.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    deduped.sort((a, b) => {
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;
      const aDate = new Date(a.submittedForReviewAt || a.updatedAt).getTime();
      const bDate = new Date(b.submittedForReviewAt || b.updatedAt).getTime();
      return aDate - bDate;
    });
    setArticles(deduped);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => a.language === filter);
  }, [articles, filter]);

  async function handleDecision(
    id: string,
    action: "approve" | "revisions_requested" | "rejected",
    note?: string,
  ) {
    const statusMap = {
      approve: "approved",
      revisions_requested: "revisions_requested",
      rejected: "rejected",
    } as const;

    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusMap[action] }),
    });

    if (note) {
      const commentType =
        action === "revisions_requested"
          ? "revision_note"
          : action === "rejected"
            ? "blocking"
            : "comment";
      await fetch(`/api/articles/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note, type: commentType }),
      });
    }

    const label =
      action === "approve"
        ? "approuvé"
        : action === "revisions_requested"
          ? "renvoyé en révision"
          : "rejeté";
    setSuccessMsg(`Article ${label}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
    await load();
  }

  const overdueCount = articles.filter((a) => {
    if (!a.submittedForReviewAt) return false;
    return differenceInHours(new Date(), new Date(a.submittedForReviewAt)) > 48;
  }).length;

  return (
    <div className="space-y-6">
      <header className="border-t-2 border-border-strong pt-4">
        <p className="page-kicker mb-2">Validation</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Review Queue
        </h1>
        <p className="mt-3 max-w-2xl font-body text-sm text-muted">
          Contenus soumis à validation éditoriale. Approuvez, demandez des révisions ou
          rejetez directement depuis cette vue.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-label text-sm font-bold text-foreground">
            {loading ? "—" : filtered.length} article
            {filtered.length !== 1 ? "s" : ""}
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-2 py-1 font-label text-xs font-bold text-red-600">
              <Clock className="h-3 w-3" />
              {overdueCount} en retard (&gt;48h)
            </span>
          )}
          {successMsg && (
            <span className="rounded-sm bg-accent-teal/10 px-2 py-1 font-label text-xs font-bold text-accent-teal">
              {successMsg}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "fr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-3 py-1.5 font-label text-xs font-bold transition-colors ${
                filter === l
                  ? "bg-foreground text-background"
                  : "border border-border-subtle text-foreground hover:bg-surface-elevated"
              }`}
            >
              {l === "all" ? "Tous" : l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse border border-border-subtle bg-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-accent-teal" />
            <p className="font-label text-sm font-bold text-foreground">
              Review queue vide
            </p>
            <p className="mt-1 font-body text-xs text-muted">
              Tous les articles soumis ont été traités.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onDecision={handleDecision}
            />
          ))}
        </div>
      )}

      <div className="border-t border-border-subtle pt-4">
        <p className="font-label text-xs text-muted">
          Les articles approuvés apparaissent dans la{" "}
          <Link href="/dashboard/approved" className="text-primary hover:underline">
            file des approuvés
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
