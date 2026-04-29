"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import ArticleEditor from "@/components/dashboard/ArticleEditor";

interface CategoryOption {
  id: string;
  name: string;
}

export default function AdminArticlesNewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = useCallback(
    async (data: Parameters<React.ComponentProps<typeof ArticleEditor>["onSubmit"]>[0]) => {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la création");
      }
      const created = await res.json();
      router.push(`/admin/articles/${created.id}/edit`);
    },
    [router],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Rédaction" title="Nouvel article" description="Chargement…" />
        <div className="h-96 animate-pulse border border-border-subtle bg-surface" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Rédaction" title="Nouvel article" description="Créez un nouvel article pour la rédaction." />
      <ArticleEditor categories={categories} onSubmit={handleSubmit} submitLabel="Créer l'article" />
    </div>
  );
}
