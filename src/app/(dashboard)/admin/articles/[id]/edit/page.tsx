"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import ArticleEditor from "@/components/dashboard/ArticleEditor";
import EmptyState from "@/components/ui/EmptyState";
import { AlertTriangle } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Record<string, unknown> | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [articleRes, catRes] = await Promise.all([
          fetch(`/api/articles/${id}`, { cache: "no-store" }),
          fetch("/api/categories"),
        ]);
        if (!articleRes.ok) {
          setError("Article introuvable.");
          return;
        }
        const articleData = await articleRes.json();
        const catData = await catRes.json();
        setArticle(articleData);
        setCategories(catData.categories ?? []);
      } catch {
        setError("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, refreshKey]);

  const handleSubmit = useCallback(
    async (data: Parameters<React.ComponentProps<typeof ArticleEditor>["onSubmit"]>[0]) => {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }
      router.refresh();
      setRefreshKey((k) => k + 1);
    },
    [id, router],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Rédaction" title="Chargement…" />
        <div className="h-96 animate-pulse border border-border-subtle bg-surface" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Rédaction" title="Erreur" />
        <EmptyState
          icon={AlertTriangle}
          title={error || "Article introuvable"}
          description="Impossible de charger cet article."
          actionHref="/admin/articles"
          actionLabel="Retour aux articles"
        />
      </div>
    );
  }

  const initial = {
    id: article.id as string,
    title: (article.title as string) || "",
    subtitle: (article.subtitle as string) || "",
    body: (article.body as string) || "",
    excerpt: (article.excerpt as string) || "",
    coverImage: (article.coverImage as string) || "",
    coverImageCaption: (article.coverImageCaption as string) || "",
    categoryId: (article.categoryId as string) || "",
    tags: (article.tags as string[]) || [],
    status: (article.status as string) || "draft",
    contentType: (article.contentType as string) || "",
    language: (article.language as string) || "fr",
    translationStatus: (article.translationStatus as string) || "",
    sourceArticleId: (article.sourceArticleId as string) || "",
    sourceArticle: (article.sourceArticle as { id: string; title: string; slug?: string } | null) || null,
    translations: (article.translations as { id: string; title: string; slug?: string }[]) || [],
    alternateLanguageSlug: (article.alternateLanguageSlug as string) || "",
    allowTranslation: (article.allowTranslation as boolean) ?? true,
    translationPriority: (article.translationPriority as string) || "",
    scheduledAt: (article.scheduledAt as string) || "",
    priorityLevel: (article.priorityLevel as string) || "",
    isBreaking: Boolean(article.isBreaking),
    isHomepagePinned: Boolean(article.isHomepagePinned),
    slug: (article.slug as string) || "",
    seoTitle: (article.seoTitle as string) || "",
    metaDescription: (article.metaDescription as string) || "",
    authorId: (article.authorId as string) || "",
  };

  return (
    <div className="space-y-6">
      <ArticleEditor
        initial={initial}
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Sauvegarder"
      />
    </div>
  );
}
