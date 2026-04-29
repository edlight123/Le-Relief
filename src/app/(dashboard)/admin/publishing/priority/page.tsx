"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Zap, AlertTriangle, Rocket } from "lucide-react";

interface PriorityArticle {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  priorityLevel?: string | null;
  isBreaking?: boolean;
  approvedAt?: string | null;
  updatedAt: string;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

export default function AdminPublishingPriorityPage() {
  const [articles, setArticles] = useState<PriorityArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [approvedRes, scheduledRes] = await Promise.all([
          fetch("/api/articles?status=approved&take=150"),
          fetch("/api/articles?status=scheduled&take=150"),
        ]);
        const approvedData = await approvedRes.json();
        const scheduledData = await scheduledRes.json();
        const all: PriorityArticle[] = [
          ...(approvedData.articles ?? []),
          ...(scheduledData.articles ?? []),
        ];
        setArticles(all);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const priorityArticles = useMemo(
    () =>
      articles
        .filter((a) => a.isBreaking || a.priorityLevel)
        .sort((a, b) => {
          if (a.isBreaking && !b.isBreaking) return -1;
          if (!a.isBreaking && b.isBreaking) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }),
    [articles],
  );

  const breakingCount = useMemo(() => priorityArticles.filter((a) => a.isBreaking).length, [priorityArticles]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Publication"
        title="Prioritaires"
        description="Articles marqués breaking ou prioritaires en attente de publication."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : priorityArticles.length} article{priorityArticles.length !== 1 ? "s" : ""} prioritaire{priorityArticles.length !== 1 ? "s" : ""}
        </span>
        {breakingCount > 0 && (
          <Badge variant="danger">
            <Zap className="mr-1 h-3 w-3" /> {breakingCount} Breaking
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : priorityArticles.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="Aucun article prioritaire"
          description="Aucun article breaking ou prioritaire en attente."
          actionHref="/admin/publishing"
          actionLabel="Retour à la publication"
        />
      ) : (
        <div className="space-y-3">
          {priorityArticles.map((article) => (
            <Card key={article.id}>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {article.isBreaking && (
                        <Badge variant="danger">
                          <Zap className="mr-1 h-3 w-3" /> Breaking
                        </Badge>
                      )}
                      {article.priorityLevel && (
                        <Badge variant="warning">{article.priorityLevel}</Badge>
                      )}
                      <Badge variant={article.status === "approved" ? "success" : "info"}>
                        {article.status === "approved" ? "Approuvé" : "Programmé"}
                      </Badge>
                    </div>
                    <h3 className="font-headline text-base font-extrabold leading-snug text-foreground">
                      {article.title}
                    </h3>
                    <p className="mt-0.5 font-label text-xs text-muted">
                      {article.author?.name || "La rédaction"}
                      {article.category && <> · {article.category.name}</>}
                      {" · "}
                      {article.language === "en" ? "EN" : "FR"}
                      {" · "}
                      modifié {formatDistanceToNow(new Date(article.updatedAt), { locale: fr, addSuffix: true })}
                    </p>
                  </div>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="shrink-0 rounded-sm border border-border-subtle px-3 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                  >
                    Ouvrir
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
