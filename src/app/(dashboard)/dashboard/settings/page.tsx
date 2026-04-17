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
  const [profile, setProfile] = useState({ name: "", email: "" });
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
        if (data.name) setProfile({ name: data.name, email: data.email });
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
      body: JSON.stringify({ name: profile.name }),
    });
    setMessage(res.ok ? "Profile updated" : "Unable to update profile");
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
    setMessage(res.ok ? "Social links updated" : "Unable to update social links");
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
        setMessage("Category updated");
      } else {
        setCategories((prev) => [...prev, updated]);
        setMessage("Category created");
      }
      setCategoryForm({ name: "", description: "" });
      setEditingCategoryId(null);
    } else {
      setMessage("Unable to save category (admin role required)");
    }
    setSaving(false);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage("Category deleted");
      if (editingCategoryId === id) {
        setEditingCategoryId(null);
        setCategoryForm({ name: "", description: "" });
      }
    } else {
      setMessage("Unable to delete category (admin role required)");
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
          Settings
        </h1>
      </header>

      {message && (
        <p className="font-label text-sm font-bold text-accent-teal">{message}</p>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Profile
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            id="settings-name"
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
          />
          <Input
            label="Email"
            id="settings-email"
            value={profile.email}
            disabled
          />
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Social Links
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
            Save Social Links
          </Button>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <h2 className="font-label text-xs font-extrabold uppercase text-foreground">
            Categories
          </h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Category Name"
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
              {editingCategoryId ? "Update Category" : "Add Category"}
            </Button>
            {editingCategoryId ? (
              <Button variant="ghost" onClick={cancelEditCategory} size="sm">
                Cancel
              </Button>
            ) : null}
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle">
            {categories.length === 0 ? (
              <p className="px-4 py-6 font-body text-sm text-muted">
                No categories found.
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
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Delete
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
