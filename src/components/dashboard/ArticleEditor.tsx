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
  submitLabel = "Publish",
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
    <div className="max-w-4xl space-y-6">
      <Input
        label="Title"
        id="title"
        placeholder="Article title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Input
        label="Subtitle"
        id="subtitle"
        placeholder="Optional subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          Cover Image
        </label>
        <MediaUploader
          onUpload={uploadFile}
          value={coverImage}
          onChange={setCoverImage}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          <option value="">Select category</option>
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
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={3}
          placeholder="Short description..."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-none"
        />
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          Body
        </label>
        <textarea
          id="body"
          rows={16}
          placeholder="Write your article content..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 font-mono leading-relaxed resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          onClick={() => handleSubmit("published")}
          disabled={saving || !title || !body}
        >
          {saving ? "Saving..." : submitLabel}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={saving || !title}
        >
          Save Draft
        </Button>
      </div>
    </div>
  );
}
