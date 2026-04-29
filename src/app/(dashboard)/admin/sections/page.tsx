"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { FolderOpen, Plus, CheckCircle2, AlertTriangle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { articles: number };
}

export default function AdminSectionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la création");
      }
      setNewName("");
      setNewDescription("");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Rubriques"
        description="Gestion des rubriques et catégories de la rédaction."
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-3.5 w-3.5" /> Nouvelle rubrique
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {showForm && (
        <Card>
          <div className="space-y-4 px-5 py-4">
            <p className="font-label text-xs font-extrabold uppercase tracking-wider text-muted">
              Nouvelle rubrique
            </p>
            <div>
              <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">Nom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Politique, Culture…"
                className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description optionnelle"
                className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="inline-flex items-center rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {creating ? "Création…" : "Créer"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="inline-flex items-center rounded-sm border border-border-subtle px-4 py-2 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
              >
                Annuler
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : categories.length} rubrique{categories.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucune rubrique"
          description="Créez des rubriques pour organiser vos articles."
          actionHref="/admin/sections"
          actionLabel="Créer une rubrique"
        />
      ) : (
        <div className="overflow-hidden border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-newsprint">
                <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Rubrique
                </th>
                <th className="hidden px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted md:table-cell">
                  Slug
                </th>
                <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Articles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-surface-newsprint">
                  <td className="px-4 py-3">
                    <p className="font-body font-semibold text-foreground">{cat.name}</p>
                    {cat.description && (
                      <p className="mt-0.5 font-label text-xs text-muted">{cat.description}</p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 font-label text-xs text-muted md:table-cell">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{cat._count?.articles ?? 0}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
