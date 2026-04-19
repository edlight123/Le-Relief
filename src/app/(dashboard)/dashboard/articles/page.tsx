"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { PenSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "published":
      return "success" as const;
    case "pending_review":
      return "info" as const;
    default:
      return "warning" as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "published":
      return "Publié";
    case "pending_review":
      return "En revue";
    case "draft":
      return "Brouillon";
    default:
      return status;
  }
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
    if (!confirm("Supprimer cet article ?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-t-2 border-border-strong pt-4">
        <div>
          <p className="page-kicker mb-2">Rédaction</p>
          <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
            Articles
          </h1>
        </div>
        <Link href="/dashboard/articles/new">
          <Button size="sm">
            <PenSquare className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 border-y border-border-subtle py-3">
        {["all", "draft", "pending_review", "published"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border px-4 py-1.5 font-label text-xs font-bold uppercase transition-colors ${
              filter === f
                ? "border-border-strong bg-foreground text-background"
                : "border-border-subtle bg-surface text-muted hover:text-foreground"
            }`}
          >
            {f === "all"
              ? "Tous"
              : f === "draft"
                ? "Brouillon"
                : f === "pending_review"
                  ? "En revue"
                  : "Publié"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-strong bg-surface-newsprint">
              <th className="px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted">
                Titre
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted md:table-cell">
                Rubrique
              </th>
              <th className="px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted">
                Statut
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted sm:table-cell">
                Vues
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted lg:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-right font-label text-xs font-extrabold uppercase text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body text-muted">
                  Chargement...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body text-muted">
                  Aucun article trouvé
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-surface-newsprint"
                >
                  <td className="max-w-xs px-4 py-3 lg:max-w-sm">
                    <span className="block truncate font-headline text-base font-bold text-foreground">
                      {article.title}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-muted md:table-cell">
                    {article.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(article.status)}>
                      {getStatusLabel(article.status)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-muted sm:table-cell">
                    {article.views}
                  </td>
                  <td className="hidden px-4 py-3 font-label text-muted lg:table-cell">
                    {format(new Date(article.updatedAt), "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/articles/${article.id}/edit`
                          )
                        }
                        className="border border-transparent p-2 transition-colors hover:border-border-subtle"
                      >
                        <PenSquare className="h-4 w-4 text-muted" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="border border-transparent p-2 transition-colors hover:border-primary"
                      >
                        <Trash2 className="h-4 w-4 text-primary" />
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
