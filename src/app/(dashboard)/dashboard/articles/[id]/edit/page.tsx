"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ArticleEditor from "@/components/dashboard/ArticleEditor";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<{
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
    Promise.all([
      fetch(`/api/articles/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([articleData, catData]) => {
      setArticle({
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
        translationStatus: articleData.translationStatus || "not_started",
        alternateLanguageSlug: articleData.alternateLanguageSlug || "",
        allowTranslation: Boolean(articleData.allowTranslation),
        translationPriority: articleData.translationPriority || "",
        scheduledAt: articleData.scheduledAt || "",
      });
      setCategories(catData.categories || []);
      setLoading(false);
    });
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

    if (res.ok) {
      router.push("/dashboard/articles");
    }
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
