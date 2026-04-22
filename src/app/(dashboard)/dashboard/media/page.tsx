"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Search, LayoutGrid, Rows2 } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar, { FilterBarSection } from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";

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
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const filtered = media.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Archives visuelles"
        title="Médiathèque"
        description="Bibliothèque rapide pour la rédaction, avec recherche, consultation et sélection des assets visuels."
        actions={
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Téléversement..." : "Téléverser"}
          </Button>
        }
      />
      <FilterBar>
        <FilterBarSection className="min-w-0 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Rechercher un média…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-border-subtle bg-surface py-2 pl-9 pr-4 font-label text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </FilterBarSection>
        <FilterBarSection>
          <button type="button" onClick={() => setView("grid")} className={`inline-flex items-center gap-1 border px-3 py-2 font-label text-xs font-bold uppercase ${view === "grid" ? "border-border-strong bg-foreground text-background" : "border-border-subtle text-muted"}`}><LayoutGrid className="h-3.5 w-3.5" />Grille</button>
          <button type="button" onClick={() => setView("list")} className={`inline-flex items-center gap-1 border px-3 py-2 font-label text-xs font-bold uppercase ${view === "list" ? "border-border-strong bg-foreground text-background" : "border-border-subtle text-muted"}`}><Rows2 className="h-3.5 w-3.5" />Liste</button>
        </FilterBarSection>
      </FilterBar>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

      {loading ? (
        <p className="py-8 text-center font-body text-muted">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="Aucun média trouvé"
          description="Téléversez une première image ou ajustez la recherche."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
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
          ) : (
            <Card>
              <div className="divide-y divide-border-subtle">
                {filtered.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-newsprint">
                    <div>
                      <p className="font-label text-sm font-bold text-foreground">{item.filename}</p>
                      <p className="font-label text-xs text-muted">{Math.round(item.size / 1024)} KB</p>
                    </div>
                    <span className="font-label text-xs text-muted">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
          <Card>
            <div className="p-4">
              <p className="page-kicker mb-2">Preview</p>
              {selected ? (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden border border-border-subtle bg-surface-newsprint">
                    <Image src={selected.url} alt={selected.filename} fill sizes="320px" className="object-cover" />
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="font-label text-sm font-bold text-foreground">{selected.filename}</p>
                    <p className="font-label text-xs uppercase text-muted">{selected.type} · {Math.round(selected.size / 1024)} KB</p>
                    <p className="font-label text-xs text-muted">Ajouté le {new Date(selected.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </>
              ) : (
                <p className="font-body text-sm text-muted">Sélectionnez un média pour voir ses détails.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
