"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, AlertTriangle, MessageSquare, Send, CheckCircle2, Pencil } from "lucide-react";

interface RevisionArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  revisionRequestedAt?: string | null;
  revisionRequestedBy?: string | null;
  updatedAt: string;
  priorityLevel?: string | null;
  isBreaking?: boolean;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

interface CommentItem {
  id: string;
  body: string;
  type: "comment" | "blocking" | "revision_note";
  resolvedAt?: string | null;
  author?: { name?: string | null } | null;
}

function ArticleCard({ article, onResubmit }: { article: RevisionArticle; onResubmit: (id: string) => Promise<void>; }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOverdue = useMemo(() => {
    if (!article.revisionRequestedAt) return false;
    return differenceInHours(new Date(), new Date(article.revisionRequestedAt)) > 72;
  }, [article.revisionRequestedAt]);

  useEffect(() => {
    if (!showComments || commentsLoaded) return;
    let active = true;
    fetch(`/api/articles/${article.id}/comments`)
      .then((r) => r.json())
      .then((data) => { if (!active) return; setComments(data.comments || []); setCommentsLoaded(true); });
    return () => { active = false; };
  }, [showComments, commentsLoaded, article.id]);

  const unresolvedCount = useMemo(() => comments.filter((c) => !c.resolvedAt).length, [comments]);
  const blockingCount = useMemo(() => comments.filter((c) => c.type === "blocking" && !c.resolvedAt).length, [comments]);
  const revisionNote = useMemo(() => [...comments].reverse().find((c) => c.type === "revision_note"), [comments]);

  async function handleResubmit() {
    setResubmitting(true);
    await onResubmit(article.id);
    setResubmitting(false);
  }

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="warning">Révisions demandées</Badge>
              {article.isBreaking && <Badge variant="danger">Breaking</Badge>}
              {isOverdue && (
                <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 font-label text-[10px] font-bold text-red-600">
                  <Clock className="h-3 w-3" /> En retard (&gt;72h)
                </span>
              )}
            </div>
            <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">{article.title}</h3>
            <p className="mt-0.5 font-label text-xs text-muted">
              {article.author?.name || "La rédaction"}
              {article.category && <> · {article.category.name}</>}
              {" · "}{article.language === "en" ? "EN" : "FR"}
              {article.revisionRequestedAt && <> · Révisions demandées {formatDistanceToNow(new Date(article.revisionRequestedAt), { locale: fr, addSuffix: true })}</>}
              {article.revisionRequestedBy && <> · par {article.revisionRequestedBy}</>}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href={`/dashboard/articles/${article.id}/edit`} className="flex items-center gap-1 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground">
              <Pencil className="h-3 w-3" /> Éditer
            </Link>
            <Button size="sm" onClick={handleResubmit} disabled={resubmitting}>
              <Send className="mr-1.5 h-3 w-3" />
              {resubmitting ? "Soumission..." : "Resoumettre"}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-border-subtle pt-3">
          <button type="button" onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1.5 font-label text-xs text-muted transition-colors hover:text-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {commentsLoaded ? `${unresolvedCount} commentaire${unresolvedCount !== 1 ? "s" : ""} non résolu${unresolvedCount !== 1 ? "s" : ""}` : "Voir les commentaires"}
          </button>
          {blockingCount > 0 && (
            <span className="flex items-center gap-1 font-label text-xs font-bold text-red-600">
              <AlertTriangle className="h-3 w-3" /> {blockingCount} bloquant{blockingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {showComments && commentsLoaded && (
          <div className="mt-3 space-y-2">
            {revisionNote && (
              <div className="border-l-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                <p className="font-label text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Motif de révision</p>
                <p className="font-body text-sm text-foreground">{revisionNote.body}</p>
              </div>
            )}
            {comments.filter((c) => !c.resolvedAt && c.type !== "revision_note").map((c) => (
              <div key={c.id} className="border border-border-subtle bg-surface-newsprint p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant={c.type === "blocking" ? "danger" : "default"}>{c.type === "blocking" ? "Bloquant" : "Commentaire"}</Badge>
                  <span className="font-label text-[10px] text-muted">{c.author?.name || "Rédaction"}</span>
                </div>
                <p className="font-body text-sm text-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function RevisionsRequestedPage() {
  const [articles, setArticles] = useState<RevisionArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/articles?status=revisions_requested&take=100").then((r) => r.json());
    const sorted: RevisionArticle[] = (res.articles || []).sort((a: RevisionArticle, b: RevisionArticle) => {
      const aDate = new Date(a.revisionRequestedAt || a.updatedAt).getTime();
      const bDate = new Date(b.revisionRequestedAt || b.updatedAt).getTime();
      return aDate - bDate;
    });
    setArticles(sorted);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const overdueCount = useMemo(() =>
    articles.filter((a) => a.revisionRequestedAt && differenceInHours(new Date(), new Date(a.revisionRequestedAt)) > 72).length,
    [articles],
  );

  async function handleResubmit(id: string) {
    await fetch(`/api/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_review" }) });
    setSuccessMsg("Article resoumis pour review.");
    setTimeout(() => setSuccessMsg(null), 3000);
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Workflow"
        title="Révisions demandées"
        description="Articles renvoyés aux rédacteurs pour corrections. Triés du plus ancien au plus récent."
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">{loading ? "—" : articles.length} article{articles.length !== 1 ? "s" : ""}</span>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 rounded-sm bg-red-500/10 px-2 py-1 font-label text-xs font-bold text-red-600">
            <Clock className="h-3 w-3" /> {overdueCount} en retard (&gt;72h)
          </span>
        )}
        {successMsg && <span className="rounded-sm bg-accent-teal/10 px-2 py-1 font-label text-xs font-bold text-accent-teal">{successMsg}</span>}
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 animate-pulse border border-border-subtle bg-surface" />))}</div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Aucune révision en attente"
          description="Tous les articles sont à jour."
          actionHref="/dashboard/articles"
          actionLabel="Revenir aux articles"
        />
      ) : (
        <div className="space-y-3">{articles.map((article) => (<ArticleCard key={article.id} article={article} onResubmit={handleResubmit} />))}</div>
      )}
    </div>
  );
}
