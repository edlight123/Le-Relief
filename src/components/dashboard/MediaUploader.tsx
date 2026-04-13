"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";

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
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-48 object-cover"
          />
          <button
            onClick={() => {
              setPreview("");
              onChange?.("");
            }}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
        >
          <ImageIcon className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {uploading ? "Uploading..." : "Drop an image or click to upload"}
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
