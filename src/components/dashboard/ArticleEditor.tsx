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
    coverImageCaption?: string;
    categoryId: string;
    tags: string[];
    status: string;
    contentType?: string;
    language?: string;
    translationStatus?: string;
    alternateLanguageSlug?: string;
    allowTranslation?: boolean;
    translationPriority?: string;
    scheduledAt?: string;
  };
  categories: { id: string; name: string }[];
  onSubmit: (data: {
    title: string;
    subtitle: string;
    body: string;
    excerpt: string;
    coverImage: string;
    coverImageCaption: string;
    categoryId: string;
    tags: string[];
    status: string;
    contentType: string;
    language: string;
    translationStatus: string;
    alternateLanguageSlug: string;
    allowTranslation: boolean;
    translationPriority: string;
    scheduledAt: string;
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
  const [coverImageCaption, setCoverImageCaption] = useState(initial?.coverImageCaption || "");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [contentType, setContentType] = useState(initial?.contentType || "actualite");
  const [language, setLanguage] = useState(initial?.language || "fr");
  const [translationStatus, setTranslationStatus] = useState(
    initial?.translationStatus || "not_started",
  );
  const [alternateLanguageSlug, setAlternateLanguageSlug] = useState(
    initial?.alternateLanguageSlug || "",
  );
  const [allowTranslation, setAllowTranslation] = useState(
    initial?.allowTranslation || false,
  );
  const [translationPriority, setTranslationPriority] = useState(
    initial?.translationPriority || "",
  );
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(status: string) {
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await onSubmit({
        title,
        subtitle,
        body,
        excerpt,
        coverImage,
        coverImageCaption,
        categoryId,
        tags,
        status,
        contentType,
        language,
        translationStatus,
        alternateLanguageSlug,
        allowTranslation,
        translationPriority,
        scheduledAt,
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

      <Input
        label="Crédit photo"
        id="coverImageCaption"
        placeholder="Photo : AFP / Le Relief Haïti"
        value={coverImageCaption}
        onChange={(e) => setCoverImageCaption(e.target.value)}
      />

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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
            Type de contenu
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="actualite">Actualité</option>
            <option value="analyse">Analyse</option>
            <option value="opinion">Opinion</option>
            <option value="editorial">Éditorial</option>
            <option value="tribune">Tribune</option>
            <option value="dossier">Dossier</option>
            <option value="fact_check">Fact-checking</option>
            <option value="emission_speciale">Émission spéciale</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
            Langue
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <details className="group border border-border-subtle">
        <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 font-label text-xs font-extrabold uppercase text-foreground hover:bg-surface-newsprint">
          Traduction
          <span className="text-muted transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-4 border-t border-border-subtle px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                Statut de traduction
              </label>
              <select
                value={translationStatus}
                onChange={(e) => setTranslationStatus(e.target.value)}
                className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="not_applicable">Non concerné</option>
                <option value="not_started">Non lancée</option>
                <option value="generated_draft">Brouillon IA</option>
                <option value="in_review">En revue</option>
                <option value="approved">Approuvée</option>
                <option value="published">Publiée</option>
                <option value="rejected">Rejetée</option>
              </select>
            </div>

            <Input
              label="Slug langue liée"
              id="alternateLanguageSlug"
              placeholder="slug-de-la-version-liee"
              value={alternateLanguageSlug}
              onChange={(e) => setAlternateLanguageSlug(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
            <label className="flex items-center gap-3 border border-border-subtle px-4 py-3 font-label text-xs font-extrabold uppercase text-foreground">
              <input
                type="checkbox"
                checked={allowTranslation}
                onChange={(e) => setAllowTranslation(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Éligible traduction EN
            </label>
            <Input
              label="Priorité de traduction"
              id="translationPriority"
              placeholder="élevée, moyenne, basse"
              value={translationPriority}
              onChange={(e) => setTranslationPriority(e.target.value)}
            />
          </div>
        </div>
      </details>

      <div>
        <label
          htmlFor="tags"
          className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground"
        >
          Tags
        </label>
        <input
          id="tags"
          type="text"
          placeholder="politique, économie, société"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
        />
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
          className="w-full resize-y border border-border-subtle bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="border-t border-border-subtle pt-6">
        <label className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
          Publication programmée
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="border border-border-subtle bg-surface px-4 py-3 font-label text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <p className="mt-1 font-label text-[11px] text-muted">
          Laisser vide pour publier immédiatement.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          onClick={() => handleSubmit("published")}
          disabled={saving || !title || !body}
        >
          {saving ? "Enregistrement..." : submitLabel}
        </Button>
        {scheduledAt && (
          <Button
            variant="outline"
            onClick={() => handleSubmit("scheduled")}
            disabled={saving || !title || !body}
          >
            Programmer
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleSubmit("pending_review")}
          disabled={saving || !title || !body}
        >
          Soumettre en revue
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={saving || !title}
        >
          Sauvegarder brouillon
        </Button>
      </div>
    </div>
  );
}
