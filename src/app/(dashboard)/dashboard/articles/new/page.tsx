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
    categoryId: string;
    status: string;
  }) {
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/dashboard/articles");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        New Article
      </h1>
      <ArticleEditor
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Publish"
      />
    </div>
  );
}
