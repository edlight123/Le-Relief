"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { PenSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  status: string;
  views: number;
  publishedAt: string | null;
  updatedAt: string;
  author?: { name: string | null };
  category?: { name: string } | null;
}

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/articles${params}`)
      .then((r) => r.json())
      .then((data) => setArticles(data.articles || []))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Articles
        </h1>
        <Link href="/dashboard/articles/new">
          <Button size="sm">
            <PenSquare className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "draft", "published"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              filter === f
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <th className="px-4 py-3 text-left font-medium text-neutral-500">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500 hidden md:table-cell">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500 hidden sm:table-cell">
                Views
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500 hidden lg:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  Loading...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  No articles found
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {article.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500">
                    {article.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        article.status === "published" ? "success" : "warning"
                      }
                    >
                      {article.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-neutral-500">
                    {article.views}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                    {format(new Date(article.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/articles/${article.id}/edit`
                          )
                        }
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <PenSquare className="h-4 w-4 text-neutral-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
