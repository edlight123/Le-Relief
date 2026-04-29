"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { ImageIcon, Upload, Trash2, Copy, CheckCircle2 } from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  createdAt?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/upload");
      const data = await res.json();
      setMedia(data.media ?? []);
    } catch {
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        await load();
      }
    } catch {
      // handle error silently
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function copyUrl(item: MediaItem) {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Publication"
        title="Médiathèque"
        description="Bibliothèque des fichiers et images uploadés."
        actions={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Upload…" : "Ajouter un fichier"}
            <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*,application/pdf" />
          </label>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : media.length} fichier{media.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Aucun média"
          description="Uploadez des images et fichiers pour les utiliser dans vos articles."
          actionHref="/admin/articles/new"
          actionLabel="Créer un article"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <Card key={item.id}>
              <div className="relative aspect-square overflow-hidden bg-surface-elevated">
                {item.type?.startsWith("image/") ? (
                  <Image
                    src={item.url}
                    alt={item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-1 py-3">
                <p className="line-clamp-1 font-label text-xs font-bold text-foreground">{item.filename}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{formatBytes(item.size)}</Badge>
                  <button
                    onClick={() => copyUrl(item)}
                    className="inline-flex items-center gap-1 font-label text-[10px] text-muted hover:text-primary"
                    title="Copier l'URL"
                  >
                    {copiedId === item.id ? (
                      <><CheckCircle2 className="h-3 w-3 text-green-600" /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" /> URL</>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
