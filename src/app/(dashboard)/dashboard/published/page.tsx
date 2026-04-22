"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, ExternalLink, Copy, CheckCircle2, TrendingUp } from "lucide-react";

interface PublishedArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  publishedAt?: string | null;
  slug?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  viewCount?: number | null;
  isBreaking?: boolean;
  hasCorrectionNote?: boolean;
  linkedArticleId?: string | null;
  author?: { name: string | null } | null;
  category?: { name: string; slug?: string } | null;
}

function seoScore(article: PublishedArticle): "good" | "partial" | "missing" {
  const count = [article.seoTitle, article.metaDescription, article.slug].filter(Boolean).length;
  if (count === 3) return "good";
  if (count > 0) return "partial";
  return "missing";
}

function SeoChip({ score }: { score: "good" | "partial" | "missing" }) {
  const labels = { good: "SEO ✓", partial: "SEO partiel", missing: "SEO manquant" };
  const colors = { good: "text-emerald-600", partial: "text-amber-600", missing: "text-red-600" };
  return <span className={`font-label text-[10px] font-bold ${colors[score]}`}>{labels[score]}</span>;
}

function ArticleCard({ article, onUnpublish }: { article: PublishedArticle; onUnpublish: (id: string) => Promise<void>; }) {
  const [unpublishing, setUnpublishing] = useState(false);
  const score = seoScore(article);
  const publicUrl = article.slug
    ? `/${article.language === "en" ? "en/" : ""}articles/${article.slug}`
    : null;

  async function handleUnpublish() {
    if (!confirm("Dépublier cet article ?")) return;
    setUnpublishing(true);
    await onUnpublish(article.id);
    setUnpublishing(false);
  }

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="success">Publié</Badge>
              {article.isBreaking && <Badge variant="danger">Breaking</Badge>}
              {article.hasCorrectionNote && <Badge variant="warning">Correction</Badge>}
              <SeoChip score={score} />
            </div>
            <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">{article.title}</h3>
            <p className="mt-0.5 font-label text-xs text-muted">
              {article.author?.name || "La rédaction"}
              {article.category && <> · {article.category.name}</>}
              {" · "}{article.language === "en" ? "EN" : "FR"}
              {article.publishedAt && <> · Publié {formatDistanceToNow(new Date(article.publishedAt), { locale: fr, addSuffix: true })}</>}
            </p>
            {article.viewCount != null && (
              <p className="mt-1 flex items-center gap-1 font-label text-[10px] text-muted">
                <TrendingUp className="h-3 w-3" />{article.viewCount.toLocaleString("fr-FR")} vue{article.viewCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {publicUrl && (
              <Link href={publicUrl} target="_blank" className="flex items-center gap-1 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground">
                <ExternalLink className="h-3 w-3" />Voir
              </Link>
            )}
            <Link href={`/dashboard/articles/new?duplicateFrom=${article.id}`} className="flex items-center gap-1 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground">
              <Copy className="h-3 w-3" />Dupliquer
            </Link>
            <Button size="sm" variant="ghost" onClick={handleUnpublish} disabled={unpublishing}>
              {unpublishing ? "Dépublication..." : "Dépublier"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PublishedPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<"all" | "fr" | "en">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/articles?status=published&take=100").then((r) => r.json());
    const sorted: PublishedArticle[] = (res.articles || []).sort((a: PublishedArticle, b: PublishedArticle) =>
      new Date(b.publishedAt || b.id).getTime() - new Date(a.publishedAt || a.id).getTime(),
    );
    setArticles(sorted);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const filtered = langFilter === "all" ? articles : articles.filter((a) => a.language === langFilter);

  async function handleUnpublish(id: string) {
    await fetch(`/api/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) });
    setSuccessMsg("Article dépublié.");
    setTimeout(() => setSuccessMsg(null), 3000);
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Suivi post-publication"
        title="Articles publiés"
        description="Vue opérationnelle des contenus live. Triés par date de publication décroissante."
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">{loading ? "—" : filtered.length} article{filtered.length !== 1 ? "s" : ""}</span>
        {(["all", "fr", "en"] as const).map((l) => (
          <button key={l} type="button" onClick={() => setLangFilter(l)} className={`rounded-sm px-2.5 py-1 font-label text-xs font-bold transition-colors ${ langFilter === l ? "bg-primary text-primary-foreground" : "border border-border-subtle text-muted hover:text-foreground" }`}>
            {l === "all" ? "Tous" : l.toUpperCase()}
          </button>
        ))}
        {successMsg && <span className="rounded-sm bg-accent-teal/10 px-2 py-1 font-label text-xs font-bold text-accent-teal">{successMsg}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted" />
        <span className="font-label text-xs text-muted">{articles.reduce((sum, a) => sum + (a.viewCount || 0), 0).toLocaleString("fr-FR")} vues totales</span>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 animate-pulse border border-border-subtle bg-surface" />))}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Aucun article publié"
          description="Aucun contenu live à superviser pour le moment."
          actionHref="/dashboard/approved"
          actionLabel="Voir les approuvés"
        />
      ) : (
        <div className="space-y-3">{filtered.map((article) => (<ArticleCard key={article.id} article={article} onUnpublish={handleUnpublish} />))}</div>
      )}
    </div>
  );
}
