"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface MediaUploaderProps {
  onUpload: (file: File) => Promise<string>;
  value?: string;
  onChange?: (url: string) => void;
}

export default function MediaUploader({
  onUpload,
  value,
  onChange,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await onUpload(file);
      setPreview(url);
      onChange?.(url);
    } catch {
      // handle error
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {preview ? (
        <div className="relative h-48 overflow-hidden border border-border-subtle">
          <Image
            src={preview}
            alt="Aperçu du média"
            fill
            sizes="(min-width: 768px) 672px, 100vw"
            className="object-cover"
          />
          <button
            onClick={() => {
              setPreview("");
              onChange?.("");
            }}
            className="absolute right-2 top-2 bg-black/60 p-1 hover:bg-black/80"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-border-subtle p-8 text-center transition-colors hover:border-border-strong"
        >
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="font-label text-sm text-muted">
            {uploading ? "Téléversement..." : "Déposez une image ou cliquez pour téléverser"}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
