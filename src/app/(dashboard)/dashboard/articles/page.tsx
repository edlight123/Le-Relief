"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { PenSquare, Trash2, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getEditorialStatusLabel,
  getEditorialStatusVariant,
  normalizeEditorialStatus,
} from "@/lib/editorial-workflow";

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

const STATUS_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "writing", label: "Rédaction" },
  { value: "in_review", label: "En revue" },
  { value: "revisions_requested", label: "Révisions" },
  { value: "approved", label: "Approuvés" },
  { value: "scheduled", label: "Programmés" },
  { value: "published", label: "Publiés" },
  { value: "draft", label: "Brouillons" },
  { value: "rejected", label: "Rejetés" },
  { value: "archived", label: "Archivés" },
];

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const selected = normalizeEditorialStatus(filter);
      const statuses =
        filter === "all"
          ? ["all"]
          : selected === "in_review"
          ? ["in_review", "pending_review"]
          : [selected];

      const requests = statuses.map((status) => {
        const params = status !== "all" ? `?status=${status}` : "";
        return fetch(`/api/articles${params}`).then((r) => r.json());
      });
      const responses = await Promise.all(requests);
      const merged = responses.flatMap((data) => data.articles || []);
      setArticles(merged);
      setLoading(false);
    }

    load();
  }, [filter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const term = search.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.author?.name?.toLowerCase().includes(term) ||
        a.category?.name?.toLowerCase().includes(term),
    );
  }, [articles, search]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    setDeletingId(id);
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-extrabold leading-none text-foreground">
          Articles
        </h1>
        <Link href="/dashboard/articles/new">
          <Button size="sm">
            <PenSquare className="mr-1.5 h-3.5 w-3.5" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Rechercher un article…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface py-2 pl-9 pr-4 font-label text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
        {/* Status filters */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                if (f.value !== filter) {
                  setLoading(true);
                  setFilter(f.value);
                }
              }}
              className={`rounded-sm px-3 py-1.5 font-label text-xs font-extrabold uppercase transition-colors ${
                filter === f.value
                  ? "bg-foreground text-background"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-sm border border-border-subtle bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-newsprint">
              <th className="px-5 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">
                Titre
              </th>
              <th className="hidden px-5 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wider text-muted md:table-cell">
                Rubrique
              </th>
              <th className="px-5 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">
                Statut
              </th>
              <th className="hidden px-5 py-3 text-right font-label text-[11px] font-extrabold uppercase tracking-wider text-muted sm:table-cell">
                Vues
              </th>
              <th className="hidden px-5 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wider text-muted lg:table-cell">
                Modifié
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-surface-elevated" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center font-body text-sm text-muted">
                  {search ? `Aucun résultat pour « ${search} »` : "Aucun article trouvé."}
                </td>
              </tr>
            ) : (
              filtered.map((article) => (
                <tr
                  key={article.id}
                  className="group cursor-pointer transition-colors hover:bg-surface-newsprint"
                  onClick={() => router.push(`/dashboard/articles/${article.id}/edit`)}
                >
                  <td className="max-w-xs px-5 py-3.5 lg:max-w-sm">
                    <p className="truncate font-body text-sm font-semibold text-foreground">
                      {article.title}
                    </p>
                    {article.author?.name ? (
                      <p className="mt-0.5 truncate font-label text-xs text-muted">
                        {article.author.name}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden px-5 py-3.5 font-label text-xs text-muted md:table-cell">
                    {article.category?.name ?? <span className="text-muted/40">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={getEditorialStatusVariant(article.status)}>
                      {getEditorialStatusLabel(article.status)}
                    </Badge>
                  </td>
                  <td className="hidden px-5 py-3.5 text-right sm:table-cell">
                    <span className="flex items-center justify-end gap-1 font-label text-xs text-muted">
                      <Eye className="h-3 w-3" />
                      {article.views.toLocaleString("fr-FR")}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 font-label text-xs text-muted lg:table-cell">
                    {format(new Date(article.updatedAt), "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/articles/${article.id}/edit`);
                        }}
                        className="rounded-sm p-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                        title="Modifier"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(article.id);
                        }}
                        disabled={deletingId === article.id}
                        className="rounded-sm p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && filtered.length > 0 && (
          <div className="border-t border-border-subtle px-5 py-3">
            <p className="font-label text-xs text-muted">
              {filtered.length} article{filtered.length > 1 ? "s" : ""}
              {search ? ` pour « ${search} »` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
