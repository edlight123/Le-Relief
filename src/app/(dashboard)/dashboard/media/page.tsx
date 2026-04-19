"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/upload")
      .then((r) => r.json())
      .then((data) => setMedia(data.media || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      setMedia((prev) => [data, ...prev]);
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce média ?")) return;
    await fetch(`/api/upload/${id}`, { method: "DELETE" });
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-t-2 border-border-strong pt-4">
        <div>
          <p className="page-kicker mb-2">Archives visuelles</p>
          <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
            Médiathèque
          </h1>
        </div>
        <Button
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Téléversement..." : "Téléverser"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center font-body text-muted">Chargement...</p>
      ) : media.length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center font-body text-muted">
            Aucun média téléversé pour le moment.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative h-40 overflow-hidden border border-border-subtle"
            >
              <Image
                src={item.url}
                alt={item.filename}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-between bg-black/0 p-3 opacity-0 transition-colors group-hover:bg-black/50 group-hover:opacity-100">
                <p className="flex-1 truncate font-label text-xs text-white">
                  {item.filename}
                </p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-primary p-1.5 hover:bg-foreground"
                >
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
