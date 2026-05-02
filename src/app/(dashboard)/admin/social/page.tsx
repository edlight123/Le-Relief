"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock3, Layers3, Newspaper, Search, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import type { SocialPost, SocialPostStatus } from "@/types/social";
import { useAuth } from "@/hooks/useAuth";

interface ArticleLite {
  id: string;
  title: string;
  status: string;
  language: "fr" | "en";
  publishedAt?: string | null;
  updatedAt: string;
}

type StatusFilter = "all" | "not-rendered" | SocialPostStatus;

function statusLabel(status?: SocialPostStatus): string {
  switch (status) {
    case "approved": return "Approuvé";
    case "needs_review": return "En révision";
    case "ready": return "Prêt";
    case "rendering": return "Rendu…";
    case "publishing": return "Publication…";
    case "published": return "Publié";
    case "partially_published": return "Partiel";
    case "failed": return "Échec";
    case "draft": return "Brouillon";
    default: return "Non rendu";
  }
}

function statusVariant(status?: SocialPostStatus): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "approved":
    case "published":
      return "success";
    case "needs_review":
    case "rendering":
    case "publishing":
    case "partially_published":
      return "warning";
    case "ready":
      return "info";
    case "failed":
      return "danger";
    default:
      return "default";
  }
}

export default function SocialListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/admin/access-denied");
    }
  }, [authLoading, user, router]);


  useEffect(() => {
    async function load() {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/admin/social"),
          fetch("/api/articles?status=published&take=50"),
        ]);
        const pJson = await pRes.json();
        const aJson = await aRes.json();
        setPosts(pJson.posts ?? []);
        setArticles(aJson.articles ?? aJson ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const postByArticle = useMemo(() => new Map(posts.map((p) => [p.articleId, p] as const)), [posts]);

  const stats = useMemo(() => {
    const rendered = posts.length;
    const approved = posts.filter((p) => p.status === "approved").length;
    const needsReview = posts.filter((p) => p.status === "needs_review").length;
    const totalAssets = posts.reduce((sum, p) => sum + Object.keys(p.platforms).length, 0);
    return { rendered, approved, needsReview, totalAssets };
  }, [posts]);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      const post = postByArticle.get(article.id);
      const matchesQuery = !q || article.title.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "not-rendered" ? !post : post?.status === filter);
      return matchesQuery && matchesFilter;
    });
  }, [articles, filter, postByArticle, query]);

  if (loading) return <div className="p-8 font-body text-sm text-muted">Chargement…</div>;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        kicker="Réseaux sociaux"
        title="Studio social"
        description="Transformez les articles publiés en carrousels Instagram, cartes Facebook/X et formats stories avec validation éditoriale."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><Sparkles className="h-5 w-5 text-primary" /><div><p className="font-mono text-2xl font-bold">{stats.rendered}</p><p className="font-label text-[11px] uppercase text-muted">posts rendus</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-5 w-5 text-accent-teal" /><div><p className="font-mono text-2xl font-bold">{stats.approved}</p><p className="font-label text-[11px] uppercase text-muted">approuvés</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Clock3 className="h-5 w-5 text-accent-amber" /><div><p className="font-mono text-2xl font-bold">{stats.needsReview}</p><p className="font-label text-[11px] uppercase text-muted">en révision</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Layers3 className="h-5 w-5 text-accent-blue" /><div><p className="font-mono text-2xl font-bold">{stats.totalAssets}</p><p className="font-label text-[11px] uppercase text-muted">plateformes</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative lg:w-96">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un article…"
                className="w-full rounded-sm border border-border-subtle bg-background py-2 pl-9 pr-3 font-body text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "Tout"],
                ["not-rendered", "Non rendu"],
                ["ready", "Prêt"],
                ["needs_review", "Révision"],
                ["approved", "Approuvé"],
                ["failed", "Échec"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as StatusFilter)}
                  className={`rounded-sm border px-3 py-1.5 font-label text-[11px] uppercase tracking-wider transition-colors ${filter === value ? "border-primary bg-primary text-white" : "border-border-subtle bg-surface-elevated text-muted hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <EmptyState icon={Newspaper} title="Aucun article trouvé" description="Ajustez la recherche ou les filtres pour retrouver un rendu social." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredArticles.map((article) => {
                const post = postByArticle.get(article.id);
                const platformCount = post ? Object.keys(post.platforms).length : 0;
                const updated = post?.updatedAt ?? article.publishedAt ?? article.updatedAt;
                return (
                  <Link
                    key={article.id}
                    href={`/admin/social/${article.id}`}
                    prefetch={false}
                    className="group rounded-sm border border-border-subtle bg-background p-4 transition-colors hover:border-primary hover:bg-surface-elevated"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <Newspaper className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(post?.status)}>{statusLabel(post?.status)}</Badge>
                          <span className="font-label text-[10px] uppercase tracking-wider text-muted">{article.language}</span>
                          <span className="font-body text-xs text-muted">{platformCount ? `${platformCount}/14 plateformes` : "Aucun rendu"}</span>
                        </div>
                        <h2 className="line-clamp-2 font-body text-sm font-semibold text-foreground group-hover:text-primary">
                          {article.title}
                        </h2>
                        <p className="mt-2 font-body text-xs text-muted">
                          Dernière mise à jour : {updated ? new Date(updated).toLocaleString() : "—"}
                        </p>
                      </div>
                      <span className="shrink-0 font-label text-xs uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Ouvrir →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
