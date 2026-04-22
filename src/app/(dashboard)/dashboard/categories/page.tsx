"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderTree, Search } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card, { CardContent } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar, { FilterBarSection } from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";

interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  _count?: { articles: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const term = search.toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description || "").toLowerCase().includes(term),
    );
  }, [categories, search]);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", description: "" });
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(editingId ? `/api/categories/${editingId}` : "/api/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Impossible d’enregistrer la rubrique.");
      setSaving(false);
      return;
    }
    if (editingId) {
      setCategories((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...data } : item)));
      setMessage("Rubrique mise à jour.");
    } else {
      setCategories((prev) => [data, ...prev]);
      setMessage("Rubrique créée.");
    }
    resetForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette rubrique ?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Impossible de supprimer la rubrique.");
      return;
    }
    setCategories((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage("Rubrique supprimée.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Taxonomie"
        title="Rubriques"
        description="Taxonomie éditoriale structurée pour le backoffice. Gérez les sections visibles dans les listes, l’édition et la publication."
      />

      {message ? (
        <p className="font-label text-sm font-bold text-accent-teal">{message}</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="space-y-4">
          <FilterBar>
            <FilterBarSection className="flex-1">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  placeholder="Rechercher une rubrique…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-border-subtle bg-surface py-2 pl-9 pr-4 font-label text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>
            </FilterBarSection>
            <FilterBarSection>
              <span className="font-label text-xs uppercase text-muted">
                {filtered.length} rubrique{filtered.length > 1 ? "s" : ""}
              </span>
            </FilterBarSection>
          </FilterBar>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-newsprint">
                    <th className="px-5 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">Rubrique</th>
                    <th className="px-5 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">Description</th>
                    <th className="px-5 py-3 text-right font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">Articles</th>
                    <th className="px-5 py-3 text-right font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={4} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded bg-surface-elevated" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6">
                        <EmptyState
                          icon={FolderTree}
                          title="Aucune rubrique"
                          description="Ajoutez une première section pour structurer le contenu éditorial."
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((category) => (
                      <tr key={category.id} className="hover:bg-surface-newsprint">
                        <td className="px-5 py-4 align-top">
                          <p className="font-label text-sm font-extrabold text-foreground">{category.name}</p>
                          <p className="mt-1 font-mono text-[11px] uppercase text-muted">/{category.slug || category.name.toLowerCase()}</p>
                        </td>
                        <td className="px-5 py-4 align-top font-body text-sm text-muted">
                          {category.description || "—"}
                        </td>
                        <td className="px-5 py-4 text-right align-top font-label text-sm text-foreground">
                          {(category._count?.articles || 0).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-5 py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(category.id);
                                setForm({
                                  name: category.name,
                                  description: category.description || "",
                                });
                              }}
                            >
                              Modifier
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(category.id)}>
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <p className="page-kicker mb-2">Edition</p>
              <h2 className="font-headline text-2xl font-extrabold text-foreground">
                {editingId ? "Modifier la rubrique" : "Nouvelle rubrique"}
              </h2>
            </div>
            <Input
              label="Nom"
              id="category-name"
              placeholder="Politique"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div>
              <label htmlFor="category-description" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Description
              </label>
              <textarea
                id="category-description"
                rows={4}
                placeholder="Contexte éditorial de la rubrique…"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? "Enregistrement…" : editingId ? "Mettre à jour" : "Créer la rubrique"}
              </Button>
              {editingId ? (
                <Button variant="ghost" onClick={resetForm}>
                  Annuler
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}