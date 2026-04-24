"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CopyPasteCard from "./CopyPasteCard";
import type { PlatformId } from "@le-relief/types";
import type { SocialPost, PlatformPostState, PlatformPublishStatus } from "@/types/social";

const PLATFORM_LABELS: Record<PlatformId, string> = {
  "instagram-feed": "Instagram — Feed (4:5)",
  "instagram-story": "Instagram — Story (9:16)",
  "instagram-reel-cover": "Instagram — Reel cover (9:16)",
  "facebook-feed": "Facebook — Feed (4:5)",
  "facebook-link": "Facebook — Link card (1.91:1)",
  "x-landscape": "X — Landscape (16:9)",
  "x-portrait": "X — Portrait (4:5)",
  "whatsapp-status": "WhatsApp — Status (9:16)",
  "whatsapp-sticker": "WhatsApp — Sticker (1:1)",
  tiktok: "TikTok (9:16)",
  "linkedin-feed": "LinkedIn — Feed (4:5)",
  "linkedin-link": "LinkedIn — Link card (1.91:1)",
  threads: "Threads (4:5)",
  "youtube-short-cover": "YouTube — Short cover (9:16)",
};

const STATUS_VARIANT: Record<PlatformPublishStatus, "default" | "success" | "warning" | "danger"> = {
  "not-published": "default",
  scheduled: "warning",
  publishing: "warning",
  published: "success",
  failed: "danger",
  "not-connected": "warning",
};

const STATUS_LABEL: Record<PlatformPublishStatus, string> = {
  "not-published": "Non publié",
  scheduled: "Programmé",
  publishing: "En cours…",
  published: "Publié",
  failed: "Échec",
  "not-connected": "Non connecté",
};

export default function PlatformPanel({
  post,
  platform,
  state,
  onPostUpdated,
}: {
  post: SocialPost;
  platform: PlatformId;
  state: PlatformPostState;
  onPostUpdated: (post: SocialPost) => void;
}) {
  const [caption, setCaption] = useState(state.caption);
  const [savingCaption, setSavingCaption] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>(
    state.publish.scheduledFor ? state.publish.scheduledFor.slice(0, 16) : "",
  );
  const [scheduling, setScheduling] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copyPaste, setCopyPaste] = useState<{
    caption: string;
    thread?: string[];
    assetUrls: string[];
    instructions: string;
  } | null>(null);

  async function saveCaption() {
    setSavingCaption(true);
    try {
      const res = await fetch(`/api/admin/social/post/${post.articleId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, caption }),
      });
      const json = await res.json();
      if (json.post) onPostUpdated(json.post);
    } finally {
      setSavingCaption(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/social/render`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId: post.articleId, platforms: [platform] }),
      });
      const json = await res.json();
      if (json.post) onPostUpdated(json.post);
    } finally {
      setRegenerating(false);
    }
  }

  async function scheduleOrClear(clear = false) {
    setScheduling(true);
    try {
      const res = await fetch(`/api/admin/social/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          articleId: post.articleId,
          platform,
          scheduledFor: clear ? null : new Date(scheduledAt).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.post) onPostUpdated(json.post);
    } finally {
      setScheduling(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    setCopyPaste(null);
    try {
      const res = await fetch(`/api/admin/social/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId: post.articleId, platform }),
      });
      const json = await res.json();
      const result = json.result;
      if (result?.error) setPublishError(result.error);
      if (result?.copyPaste) setCopyPaste(result.copyPaste);
      // Refresh the post state from server.
      const fresh = await fetch(`/api/admin/social/post/${post.articleId}`).then((r) => r.json());
      if (fresh.post) onPostUpdated(fresh.post);
    } catch (err) {
      setPublishError(String(err));
    } finally {
      setPublishing(false);
    }
  }

  const isCopyPaste = state.publish.mode === "copy-paste";
  const buttonLabel = isCopyPaste ? "Préparer le copier-coller" : "Publier maintenant";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-label text-sm font-bold uppercase tracking-wider">
              {PLATFORM_LABELS[platform]}
            </h3>
            <p className="mt-1 font-body text-xs text-muted">
              {state.assets.length} image(s) · {state.assets[0]?.width}×{state.assets[0]?.height}
              {state.captionDirty && " · légende modifiée"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={STATUS_VARIANT[state.publish.status]}>
              {STATUS_LABEL[state.publish.status]}
            </Badge>
            <button
              type="button"
              onClick={regenerate}
              disabled={regenerating}
              title="Régénérer cette plateforme"
              className="font-label text-[10px] uppercase tracking-wider text-muted hover:text-primary disabled:opacity-50"
            >
              {regenerating ? "↻ …" : "↻ Re-générer"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {state.assets.map((a) => (
            <div key={a.url} className="relative aspect-square overflow-hidden border border-border-subtle bg-background">
              <Image src={a.url} alt={`Slide ${a.slideNumber}`} fill className="object-contain" unoptimized />
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block font-label text-[11px] uppercase tracking-wider text-muted">
            Légende ({caption.length} caractères)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="w-full rounded border border-border-subtle bg-surface p-2 font-body text-sm focus:border-primary focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={saveCaption}
              disabled={savingCaption || caption === state.caption}
            >
              {savingCaption ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {state.firstComment && (
              <span className="self-center font-body text-xs text-muted">
                + 1er commentaire&nbsp;: {state.firstComment.slice(0, 60)}…
              </span>
            )}
          </div>
        </div>

        {state.publish.error && (
          <div className="rounded border border-warning/40 bg-warning/10 p-2 font-body text-xs">
            {state.publish.error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={publish} disabled={publishing} variant="primary">
            {publishing ? "…" : buttonLabel}
          </Button>
          {state.publish.externalUrl && (
            <a
              href={state.publish.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label text-xs uppercase tracking-wider text-primary hover:underline"
            >
              Voir la publication ↗
            </a>
          )}
        </div>

        {!isCopyPaste && (
          <div className="space-y-2 rounded border border-border-subtle bg-surface p-2">
            <div className="flex items-center gap-2">
              <label className="font-label text-[11px] uppercase tracking-wider text-muted">
                Programmer
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded border border-border-subtle bg-background p-1 font-body text-xs"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => scheduleOrClear(false)}
                disabled={scheduling || !scheduledAt}
              >
                {scheduling ? "…" : "Planifier"}
              </Button>
              {state.publish.status === "scheduled" && (
                <Button size="sm" variant="outline" onClick={() => scheduleOrClear(true)} disabled={scheduling}>
                  Annuler
                </Button>
              )}
            </div>
            {state.publish.scheduledFor && (
              <p className="font-body text-[11px] text-muted">
                Programmé pour : <span className="font-mono">{new Date(state.publish.scheduledFor).toLocaleString()}</span>
              </p>
            )}
          </div>
        )}

        {publishError && !copyPaste && (
          <div className="rounded border border-danger/40 bg-danger/10 p-2 font-body text-xs text-danger">
            {publishError}
          </div>
        )}

        {copyPaste && (
          <div className="rounded border border-primary/40 bg-primary/5 p-3">
            <p className="mb-2 font-body text-xs whitespace-pre-line">{copyPaste.instructions}</p>
            <CopyPasteCard
              state={{
                ...state,
                caption: copyPaste.caption,
                thread: copyPaste.thread ?? state.thread ?? null,
              }}
              platform={platform}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
