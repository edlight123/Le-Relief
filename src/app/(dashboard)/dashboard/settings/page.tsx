"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: { articles: number };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "", bio: "" });
  const [socials, setSocials] = useState({
    instagram: "",
    facebook: "",
    x: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setProfile({ name: data.name, email: data.email, bio: data.bio || "" });
      });

    fetch("/api/social-links")
      .then((r) => r.json())
      .then((data) => {
        if (data.links) {
          const map: Record<string, string> = {};
          data.links.forEach((l: { platform: string; url: string }) => {
            map[l.platform] = l.url;
          });
          setSocials((prev) => ({ ...prev, ...map }));
        }
      });

    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      });
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, bio: profile.bio }),
    });
    setMessage(res.ok ? "Profil mis à jour" : "Impossible de mettre à jour le profil");
    setSaving(false);
  }

  async function handleSaveSocials() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/social-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(socials),
    });
    setMessage(res.ok ? "Liens sociaux mis à jour" : "Impossible de mettre à jour les liens sociaux");
    setSaving(false);
  }

  async function handleSaveCategory() {
    if (!categoryForm.name.trim()) return;

    setSaving(true);
    setMessage("");

    const payload = {
      name: categoryForm.name,
      description: categoryForm.description,
    };

    const res = await fetch(
      editingCategoryId ? `/api/categories/${editingCategoryId}` : "/api/categories",
      {
        method: editingCategoryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      if (editingCategoryId) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategoryId ? { ...c, ...updated } : c))
        );
        setMessage("Rubrique mise à jour");
      } else {
        setCategories((prev) => [...prev, updated]);
        setMessage("Rubrique créée");
      }
      setCategoryForm({ name: "", description: "" });
      setEditingCategoryId(null);
    } else {
      setMessage("Impossible d'enregistrer la rubrique (rôle admin requis)");
    }
    setSaving(false);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Supprimer cette rubrique ?")) return;
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage("Rubrique supprimée");
      if (editingCategoryId === id) {
        setEditingCategoryId(null);
        setCategoryForm({ name: "", description: "" });
      }
    } else {
      setMessage("Impossible de supprimer la rubrique (rôle admin requis)");
    }
    setSaving(false);
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", description: "" });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="border-t-2 border-border-strong pt-4">
        <p className="page-kicker mb-2">Configuration</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Paramètres
        </h1>
      </header>

      {message && (
        <p className="font-label text-sm font-bold text-accent-teal">{message}</p>
      )}

      {/* Profil */}
      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Profil
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nom"
            id="settings-name"
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
          />
          <Input
            label="Courriel"
            id="settings-email"
            value={profile.email}
            disabled
          />
          <div className="w-full">
            <label
              htmlFor="settings-bio"
              className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
            >
              Biographie
            </label>
            <textarea
              id="settings-bio"
              rows={4}
              placeholder="Quelques lignes sur votre parcours et votre rôle éditorial..."
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground placeholder:text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/30 resize-none"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            Enregistrer le profil
          </Button>
        </CardContent>
      </Card>

      {/* Liens sociaux */}
      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Liens sociaux
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Instagram"
            id="instagram"
            placeholder="https://instagram.com/..."
            value={socials.instagram}
            onChange={(e) =>
              setSocials((s) => ({ ...s, instagram: e.target.value }))
            }
          />
          <Input
            label="Facebook"
            id="facebook"
            placeholder="https://facebook.com/..."
            value={socials.facebook}
            onChange={(e) =>
              setSocials((s) => ({ ...s, facebook: e.target.value }))
            }
          />
          <Input
            label="X (Twitter)"
            id="x"
            placeholder="https://x.com/..."
            value={socials.x}
            onChange={(e) =>
              setSocials((s) => ({ ...s, x: e.target.value }))
            }
          />
          <Button onClick={handleSaveSocials} disabled={saving} size="sm">
            Enregistrer les liens sociaux
          </Button>
        </CardContent>
      </Card>

      {/* Gestion des rubriques */}
      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Rubriques
          </h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nom de la rubrique"
              id="category-name"
              placeholder="Politique"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              label="Description"
              id="category-description"
              placeholder="Actualités et analyses..."
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveCategory} disabled={saving} size="sm">
              {editingCategoryId ? "Mettre à jour" : "Ajouter la rubrique"}
            </Button>
            {editingCategoryId ? (
              <Button variant="ghost" onClick={cancelEditCategory} size="sm">
                Annuler
              </Button>
            ) : null}
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle">
            {categories.length === 0 ? (
              <p className="px-4 py-6 font-body text-sm text-muted">
                Aucune rubrique trouvée.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="font-label text-xs font-extrabold uppercase text-foreground">
                      {category.name}
                    </p>
                    {category.description ? (
                      <p className="mt-1 font-body text-sm text-muted">{category.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEditCategory(category)}>
                      Modifier
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
