"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import MediaUploader from "@/components/dashboard/MediaUploader";

interface ArticleEditorProps {
  initial?: {
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    categoryId: string;
    status: string;
  };
  categories: { id: string; name: string }[];
  onSubmit: (data: {
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    categoryId: string;
    status: string;
  }) => Promise<void>;
  submitLabel?: string;
}

export default function ArticleEditor({
  initial,
  categories,
  onSubmit,
  submitLabel = "Publier",
}: ArticleEditorProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [body, setBody] = useState(initial?.body || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(status: string) {
    setSaving(true);
    try {
      await onSubmit({
        title,
        subtitle,
        body,
        excerpt,
        coverImage,
        categoryId,
        status,
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    return data.url;
  }

  return (
    <div className="max-w-4xl space-y-6 border-t-2 border-border-strong pt-5">
      <Input
        label="Titre"
        id="title"
        placeholder="Titre de l'article"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Input
        label="Sous-titre"
        id="subtitle"
        placeholder="Sous-titre optionnel"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
      />

      <div>
        <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
          Image de Couverture
        </label>
        <MediaUploader
          onUpload={uploadFile}
          value={coverImage}
          onChange={setCoverImage}
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
          Catégorie
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Sélectionner une catégorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
        >
          Extrait
        </label>
        <textarea
          id="excerpt"
          rows={3}
          placeholder="Courte description..."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="body"
          className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
        >
          Contenu
        </label>
        <textarea
          id="body"
          rows={16}
          placeholder="Écrivez le contenu de votre article..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          onClick={() => handleSubmit("published")}
          disabled={saving || !title || !body}
        >
          {saving ? "Enregistrement..." : submitLabel}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={saving || !title}
        >
          Sauvegarder Brouillon
        </Button>
      </div>
    </div>
  );
}
