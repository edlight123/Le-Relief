"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ArticleEditor from "@/components/dashboard/ArticleEditor";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<{
    id?: string;
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    coverImageCaption: string;
    categoryId: string;
    tags: string[];
    status: string;
    contentType: string;
    language: string;
    translationStatus: string;
    sourceArticleId?: string;
    sourceArticle?: { id: string; title: string; slug?: string } | null;
    translations?: { id: string; title: string; slug?: string }[];
    alternateLanguageSlug: string;
    allowTranslation: boolean;
    translationPriority: string;
    scheduledAt: string;
  } | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [articleData, catData] = await Promise.all([
        fetch(`/api/articles/${id}`).then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]);

      let sourceArticle: { id: string; title: string; slug?: string } | null = null;
      let translations: { id: string; title: string; slug?: string }[] = [];

      if (articleData.language === "fr") {
        const enData = await fetch(
          `/api/articles?language=en&sourceArticleId=${encodeURIComponent(id)}&take=100`,
        ).then((r) => r.json());
        translations = Array.isArray(enData.articles)
          ? enData.articles.map((item: { id: string; title: string; slug?: string }) => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
            }))
          : [];
      }

      if (articleData.language === "en" && articleData.sourceArticleId) {
        const sourceData = await fetch(`/api/articles/${articleData.sourceArticleId}`).then((r) =>
          r.json(),
        );
        if (sourceData?.id) {
          sourceArticle = {
            id: sourceData.id,
            title: sourceData.title,
            slug: sourceData.slug,
          };
        }
      }

      setArticle({
        id: articleData.id,
        title: articleData.title || "",
        subtitle: articleData.subtitle || "",
        body: articleData.body || "",
        excerpt: articleData.excerpt || "",
        coverImage: articleData.coverImage || "",
        coverImageCaption: articleData.coverImageCaption || "",
        categoryId: articleData.categoryId || "",
        tags: Array.isArray(articleData.tags) ? articleData.tags : [],
        status: articleData.status || "draft",
        contentType: articleData.contentType || "actualite",
        language: articleData.language || "fr",
        translationStatus:
          articleData.translationStatus || (articleData.language === "en" ? "not_started" : "not_applicable"),
        sourceArticleId: articleData.sourceArticleId || "",
        sourceArticle,
        translations,
        alternateLanguageSlug: articleData.alternateLanguageSlug || "",
        allowTranslation: Boolean(articleData.allowTranslation),
        translationPriority: articleData.translationPriority || "",
        scheduledAt: articleData.scheduledAt || "",
      });
      setCategories(catData.categories || []);
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleSubmit(data: {
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    coverImageCaption: string;
    categoryId: string;
    tags: string[];
    status: string;
    contentType: string;
    language: string;
    translationStatus: string;
    sourceArticleId: string;
    alternateLanguageSlug: string;
    allowTranslation: boolean;
    translationPriority: string;
    scheduledAt: string;
  }) {
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: "Erreur inconnue" }));
      throw new Error(payload.error || "Échec de mise à jour de l'article");
    }

    router.push("/dashboard/articles");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-body text-muted">Chargement...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-body text-muted">Article introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="page-kicker mb-2">Révision</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Modifier l&apos;article
        </h1>
      </header>
      <ArticleEditor
        initial={article}
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Mettre à jour"
      />
    </div>
  );
}
