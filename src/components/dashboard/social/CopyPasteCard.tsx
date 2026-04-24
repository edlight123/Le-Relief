"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import type { PlatformPostState } from "@/types/social";

export default function CopyPasteCard({
  state,
  platform,
}: {
  state: PlatformPostState;
  platform: string;
}) {
  const [copied, setCopied] = useState<"caption" | null>(null);

  async function copyCaption() {
    await navigator.clipboard.writeText(state.caption);
    setCopied("caption");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-border-subtle bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-label text-xs uppercase tracking-wider text-muted">
            Légende prête à copier
          </span>
          <Button size="sm" variant="outline" onClick={copyCaption}>
            {copied === "caption" ? "Copié ✓" : "Copier"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap break-words font-body text-sm text-foreground">
          {state.caption}
        </pre>
      </div>

      {state.thread && state.thread.length > 1 && (
        <div className="rounded border border-border-subtle bg-surface p-3">
          <div className="mb-2 font-label text-xs uppercase tracking-wider text-muted">
            Suite du thread ({state.thread.length} tweets)
          </div>
          <ol className="list-decimal space-y-2 pl-5 font-body text-sm">
            {state.thread.map((t, i) => (
              <li key={i} className="whitespace-pre-wrap">{t}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {state.assets.map((a) => (
          <div key={a.url} className="space-y-1">
            <div className="relative aspect-square overflow-hidden border border-border-subtle bg-background">
              <Image src={a.url} alt={`Slide ${a.slideNumber}`} fill className="object-contain" unoptimized />
            </div>
            <a
              href={a.url}
              download
              className="block text-center font-label text-[10px] uppercase tracking-wider text-primary hover:underline"
            >
              Télécharger #{a.slideNumber} ({Math.round(a.sizeBytes / 1024)} KB)
            </a>
          </div>
        ))}
      </div>

      <p className="font-body text-xs text-muted">
        Plateforme&nbsp;: <span className="font-mono">{platform}</span> — mode copier-coller manuel.
      </p>
    </div>
  );
}
