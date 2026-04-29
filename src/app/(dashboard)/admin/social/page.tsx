"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import type { SocialPost } from "@/types/social";
import { useAuth } from "@/hooks/useAuth";

interface ArticleLite {
  id: string;
  title: string;
  status: string;
  language: "fr" | "en";
  publishedAt?: string | null;
  updatedAt: string;
}

export default function SocialListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 font-body text-sm text-muted">Chargement…</div>;

  const postByArticle = new Map(posts.map((p) => [p.articleId, p] as const));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        kicker="Réseaux sociaux"
        title="Génération sociale"
        description="Crée et publie les visuels sociaux pour chaque article. Instagram et Facebook seront publiés via l'API une fois Meta connecté ; X et WhatsApp sont en mode copier-coller."
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b border-border-subtle bg-surface-elevated">
              <tr className="text-left">
                <th className="px-4 py-3 font-label text-xs uppercase tracking-wider text-muted">Article</th>
                <th className="px-4 py-3 font-label text-xs uppercase tracking-wider text-muted">Langue</th>
                <th className="px-4 py-3 font-label text-xs uppercase tracking-wider text-muted">Statut</th>
                <th className="px-4 py-3 font-label text-xs uppercase tracking-wider text-muted">Plateformes rendues</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <EmptyState icon={Newspaper} title="Aucun article publié" description="Publiez un article pour générer ses visuels sociaux." />
                  </td>
                </tr>
              ) : (
                articles.map((a) => {
                  const p = postByArticle.get(a.id);
                  const platformCount = p ? Object.keys(p.platforms).length : 0;
                  return (
                    <tr key={a.id} className="border-b border-border-subtle">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/social/${a.id}`}
                          className="font-body text-sm font-medium text-foreground hover:text-primary"
                        >
                          {a.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-body text-xs uppercase">{a.language}</td>
                      <td className="px-4 py-3">
                        {p ? (
                          <Badge variant={p.status === "ready" ? "success" : p.status === "failed" ? "danger" : "default"}>
                            {p.status}
                          </Badge>
                        ) : (
                          <Badge variant="default">non rendu</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-muted">
                        {platformCount > 0 ? `${platformCount} / 14` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/social/${a.id}`}
                          className="font-label text-xs uppercase tracking-wider text-primary hover:underline"
                        >
                          {p ? "Ouvrir →" : "Générer →"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
