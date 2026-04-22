"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import AlertBanner from "@/components/ui/AlertBanner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Globe, Calendar, RotateCcw } from "lucide-react";

interface ApprovedArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  approvedAt?: string | null;
  approvedBy?: string | null;
  updatedAt: string;
  priorityLevel?: string | null;
  isBreaking?: boolean;
  isHomepagePinned?: boolean;
  translationStatus?: string | null;
  body?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  categoryId?: string | null;
  contentType?: string | null;
  slug?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  authorId?: string | null;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

function publishBlockers(a: ApprovedArticle): string[] {
  const flags: string[] = [];
  if (!a.title?.trim()) flags.push("Titre requis");
  if (!a.body?.trim()) flags.push("Corps requis");
  if (!a.excerpt?.trim()) flags.push("Chapô requis");
  if (!a.coverImage?.trim()) flags.push("Image principale requise");
  if (!a.categoryId?.trim()) flags.push("Rubrique requise");
  if (!a.contentType?.trim()) flags.push("Type de contenu requis");
  if (!a.slug?.trim()) flags.push("Slug requis");
  if (!a.seoTitle?.trim()) flags.push("SEO title requis");
  if (!a.metaDescription?.trim()) flags.push("Meta description requise");
  if (!a.authorId?.trim()) flags.push("Auteur manquant");
  return flags;
}

function ArticleCard({ article, onPublish, onSchedule, onSendBack }: {
  article: ApprovedArticle;
  onPublish: (id: string) => Promise<void>;
  onSchedule: (id: string, at: string) => Promise<void>;
  onSendBack: (id: string) => Promise<void>;
}) {
  const [publishing, setPublishing] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const blockers = useMemo(() => publishBlockers(article), [article]);
  const isPublishReady = blockers.length === 0;

  async function handlePublish() {
    setPublishing(true);
    await onPublish(article.id);
    setPublishing(false);
  }

  async function handleSchedule() {
    if (!scheduleAt) return;
    setScheduling(true);
    await onSchedule(article.id, scheduleAt);
    setScheduling(false);
    setScheduleMode(false);
  }

  async function handleSendBack() {
    setSendingBack(true);
    await onSendBack(article.id);
    setSendingBack(false);
  }

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="success">Approuvé</Badge>
              {article.isBreaking && <Badge variant="danger">Breaking</Badge>}
              {article.isHomepagePinned && <Badge variant="default">Homepage</Badge>}
              {article.translationStatus === "translated" && (
                <span className="flex items-center gap-1 font-label text-[10px] text-muted"><Globe className="h-3 w-3" /> Traduit</span>
              )}
            </div>
            <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">{article.title}</h3>
            <p className="mt-0.5 font-label text-xs text-muted">
              {article.author?.name || "La rédaction"}
              {article.category && <> · {article.category.name}</>}
              {" · "}{article.language === "en" ? "EN" : "FR"}
              {article.approvedAt && <> · Approuvé {formatDistanceToNow(new Date(article.approvedAt), { locale: fr, addSuffix: true })}</>}
              {article.approvedBy && <> · par {article.approvedBy}</>}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href={`/dashboard/articles/${article.id}/edit`} className="rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground">Voir</Link>
            <Button size="sm" variant="ghost" onClick={handleSendBack} disabled={sendingBack}>
              <RotateCcw className="mr-1.5 h-3 w-3" />{sendingBack ? "Renvoi..." : "Renvoyer à l'éditeur"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setScheduleMode((v) => !v)} disabled={publishing}>
              <Calendar className="mr-1.5 h-3 w-3" />Programmer
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishing || scheduling || !isPublishReady}>
              {publishing ? "Publication..." : "Publier maintenant"}
            </Button>
          </div>
        </div>
        {!isPublishReady && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <AlertBanner variant="warning" title="Préparation incomplète">
              <p className="font-body text-sm">
                Corriger avant publication : {blockers.join(", ")}.
              </p>
            </AlertBanner>
          </div>
        )}
        {scheduleMode && (
          <div className="mt-3 flex items-center gap-2 border-t border-border-subtle pt-3">
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="rounded-sm border border-border-subtle bg-surface px-2 py-1 font-label text-xs text-foreground"
            />
            <Button size="sm" onClick={handleSchedule} disabled={!scheduleAt || scheduling || !isPublishReady}>
              {scheduling ? "Programmation..." : "Confirmer"}
            </Button>
            <button type="button" onClick={() => setScheduleMode(false)} className="font-label text-xs text-muted hover:text-foreground">Annuler</button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ApprovedQueuePage() {
  const [articles, setArticles] = useState<ApprovedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/articles?status=approved&take=100").then((r) => r.json());
    const sorted: ApprovedArticle[] = (res.articles || []).sort((a: ApprovedArticle, b: ApprovedArticle) => {
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;
      return new Date(a.approvedAt || a.updatedAt).getTime() - new Date(b.approvedAt || b.updatedAt).getTime();
    });
    setArticles(sorted);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const breakingCount = useMemo(() => articles.filter((a) => a.isBreaking).length, [articles]);
  const blockedCount = useMemo(() => articles.filter((a) => publishBlockers(a).length > 0).length, [articles]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handlePublish(id: string) {
    await fetch(`/api/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published" }) });
    showSuccess("Article publié.");
    await load();
  }

  async function handleSchedule(id: string, scheduledAt: string) {
    await fetch(`/api/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "scheduled", scheduledAt }) });
    showSuccess("Article programmé.");
    await load();
  }

  async function handleSendBack(id: string) {
    await fetch(`/api/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "revisions_requested" }) });
    showSuccess("Article renvoyé à l'éditeur.");
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Workflow"
        title="File d’approbation"
        description="Articles validés, prêts pour publication immédiate ou programmée."
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">{loading ? "—" : articles.length} article{articles.length !== 1 ? "s" : ""}</span>
        {breakingCount > 0 && <Badge variant="danger">{breakingCount} Breaking</Badge>}
        {blockedCount > 0 && <Badge variant="warning">{blockedCount} avec blocages</Badge>}
        {successMsg && <span className="rounded-sm bg-accent-teal/10 px-2 py-1 font-label text-xs font-bold text-accent-teal">{successMsg}</span>}
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 animate-pulse border border-border-subtle bg-surface" />))}</div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Aucun article approuvé"
          description="La file est vide."
          actionHref="/dashboard/review"
          actionLabel="Ouvrir la review queue"
        />
      ) : (
        <div className="space-y-3">{articles.map((article) => (<ArticleCard key={article.id} article={article} onPublish={handlePublish} onSchedule={handleSchedule} onSendBack={handleSendBack} />))}</div>
      )}
    </div>
  );
}
