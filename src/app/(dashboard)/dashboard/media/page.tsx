"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
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
    if (!confirm("Delete this media?")) return;
    await fetch(`/api/upload/${id}`, { method: "DELETE" });
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Media Library
        </h1>
        <Button
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload"}
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
        <p className="text-neutral-400 text-center py-8">Loading...</p>
      ) : media.length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center text-neutral-400">
            No media uploaded yet. Click Upload to add files.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
                <p className="text-white text-xs truncate flex-1">
                  {item.filename}
                </p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 bg-red-600 rounded-lg hover:bg-red-700"
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
