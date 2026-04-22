"use client";

import { useRouter } from "next/navigation";
import ArticleEditor from "@/components/dashboard/ArticleEditor";
import { useEffect, useState } from "react";

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

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
    slug: string;
    seoTitle: string;
    metaDescription: string;
  }) {
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: "Erreur inconnue" }));
      throw new Error(payload.error || "Échec de création de l'article");
    }

    router.push("/dashboard/articles");
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="page-kicker mb-2">Composer</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Nouvel article
        </h1>
      </header>
      <ArticleEditor
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Publier"
      />
    </div>
  );
}
