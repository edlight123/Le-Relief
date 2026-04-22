"use client";

import Input from "@/components/ui/Input";

export interface ArticleMetadataModel {
  categoryId: string;
  contentType: string;
  language: string;
  tagsInput: string;
}

export default function ArticleMetadataPanel({
  value,
  categories,
  onChange,
}: {
  value: ArticleMetadataModel;
  categories: { id: string; name: string }[];
  onChange: (next: ArticleMetadataModel) => void;
}) {
  return (
    <section className="space-y-3 border border-border-subtle p-4">
      <p className="font-label text-xs font-extrabold uppercase text-muted">Métadonnées</p>
      <select
        value={value.categoryId}
        onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
        className="w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
      >
        <option value="">Choisir une rubrique</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <Input
        id="contentType"
        label="Type"
        value={value.contentType}
        onChange={(e) => onChange({ ...value, contentType: e.target.value })}
      />
      <Input
        id="language"
        label="Langue"
        value={value.language}
        onChange={(e) => onChange({ ...value, language: e.target.value })}
      />
      <Input
        id="tags"
        label="Tags"
        value={value.tagsInput}
        onChange={(e) => onChange({ ...value, tagsInput: e.target.value })}
      />
    </section>
  );
}
