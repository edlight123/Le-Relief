"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CopyPasteCard from "./CopyPasteCard";
import type { PlatformId } from "@le-relief/types";
import type { SocialPost, PlatformPostState, PlatformPublishStatus, SocialAsset } from "@/types/social";

// ── Platform behaviour categories ──────────────────────────────────────────

/** Platforms where caption / link card should appear BEFORE the image. */
const LINK_FIRST_PLATFORMS = new Set<PlatformId>([
  "facebook-feed",
  "facebook-link",
  "x-landscape",
  "x-portrait",
  "threads",
  "linkedin-feed",
  "linkedin-link",
]);

/** Tall (9:16) platforms — preview in portrait aspect. */
const TALL_PLATFORMS = new Set<PlatformId>([
  "instagram-story",
  "instagram-reel-cover",
  "tiktok",
  "youtube-short-cover",
  "whatsapp-status",
]);

// ── Platform icon / colour helpers ────────────────────────────────────────

const PLATFORM_ICONS: Partial<Record<PlatformId, string>> = {
  "instagram-feed": "📷",
  "instagram-story": "📷",
  "instagram-reel-cover": "🎬",
  "facebook-feed": "👤",
  "facebook-link": "🔗",
  "x-landscape": "𝕏",
  "x-portrait": "𝕏",
  threads: "〓",
  "linkedin-feed": "in",
  "linkedin-link": "in",
  "whatsapp-status": "💬",
  "whatsapp-sticker": "💬",
  tiktok: "♪",
  "youtube-short-cover": "▶",
};

const PLATFORM_HANDLE_HINT: Partial<Record<PlatformId, string>> = {
  "instagram-feed": "@lereliefhaiti",
  "instagram-story": "@lereliefhaiti",
  "instagram-reel-cover": "@lereliefhaiti",
  "facebook-feed": "Le Relief · lereliefhaiti.com",
  "facebook-link": "Le Relief · lereliefhaiti.com",
  "x-landscape": "@lereliefhaiti",
  "x-portrait": "@lereliefhaiti",
  threads: "@lereliefhaiti",
  "linkedin-feed": "Le Relief",
  "linkedin-link": "Le Relief",
};

// ── Carousel slide preview ────────────────────────────────────────────────

function CarouselPreview({
  assets,
  tall,
  onExpand,
}: {
  assets: SocialAsset[];
  tall: boolean;
  onExpand: (index: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const total = assets.length;
  const asset = assets[idx];
  if (!asset) return null;

  const aspectClass = tall ? "aspect-[9/16]" : "aspect-[4/5]";
  const maxH = tall ? "max-h-[60vh]" : "max-h-[480px]";

  return (
    <div className="space-y-2">
      {/* Main slide */}
      <div className={`relative w-full ${aspectClass} ${maxH} mx-auto overflow-hidden rounded border border-border-subtle bg-black`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt={`Slide ${idx + 1}`}
          className="h-full w-full object-contain"
        />
        {/* Slide counter badge */}
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
          {idx + 1} / {total}
        </span>
        {/* Expand button */}
        <button
          type="button"
          onClick={() => onExpand(idx)}
          className="absolute inset-0 flex items-end justify-end p-2 opacity-0 hover:opacity-100 transition-opacity"
          title="Agrandir"
        >
          <span className="rounded bg-black/60 px-2 py-1 font-label text-[10px] uppercase tracking-wider text-white">
            ⤢ Agrandir
          </span>
        </button>
        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + total) % total)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:opacity-30"
              disabled={idx === 0}
              aria-label="Slide précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % total)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:opacity-30"
              disabled={idx === total - 1}
              aria-label="Slide suivante"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5">
          {assets.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-4 bg-primary" : "w-1.5 bg-border-subtle hover:bg-muted"
              }`}
              aria-label={`Aller à la slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip for quick nav */}
      {total > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {assets.map((a, i) => (
            <button
              key={a.url}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded border-2 transition-all ${
                i === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Link-first (Facebook / X / Threads / LinkedIn) preview ───────────────

function LinkFirstPreview({
  assets,
  caption,
  platform,
  onExpand,
}: {
  assets: SocialAsset[];
  caption: string;
  platform: PlatformId;
  onExpand: (index: number) => void;
}) {
  const icon = PLATFORM_ICONS[platform] ?? "📄";
  const handle = PLATFORM_HANDLE_HINT[platform] ?? "Le Relief";
  const isX = platform === "x-landscape" || platform === "x-portrait";
  const isLinkedIn = platform === "linkedin-feed" || platform === "linkedin-link";
  const asset = assets[0];

  // Detect aspect for image preview
  const isLandscape = platform === "x-landscape" || platform === "facebook-link" || platform === "linkedin-link";
  const imgAspect = isLandscape ? "aspect-video" : "aspect-[4/5]";

  return (
    <div className={`overflow-hidden rounded border border-border-subtle bg-surface ${isX ? "max-w-lg" : ""}`}>
      {/* Platform chrome header */}
      <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-elevated px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-label text-xs font-bold text-primary">
          {icon}
        </span>
        <div>
          <p className="font-label text-xs font-bold text-foreground">Le Relief</p>
          <p className="font-body text-[10px] text-muted">{handle}</p>
        </div>
      </div>

      {/* Caption / post text */}
      <div className="px-3 py-2">
        <p className="whitespace-pre-wrap font-body text-sm text-foreground line-clamp-4">
          {caption || "(pas de légende)"}
        </p>
        {isX && (
          <p className="mt-1 font-body text-xs text-primary">lereliefhaiti.com</p>
        )}
        {isLinkedIn && (
          <p className="mt-1 font-body text-xs text-muted">lereliefhaiti.com · voir l&apos;article</p>
        )}
      </div>

      {/* Image / link card */}
      {asset && (
        <button
          type="button"
          onClick={() => onExpand(0)}
          className="group relative block w-full overflow-hidden border-t border-border-subtle bg-black"
        >
          <div className={`relative w-full ${imgAspect}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt="Aperçu"
              className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
            />
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="rounded bg-black/60 px-2 py-1 font-label text-[10px] uppercase tracking-wider text-white">
                ⤢ Agrandir
              </span>
            </span>
          </div>
          {/* Facebook link card footer */}
          {(platform === "facebook-feed" || platform === "facebook-link") && (
            <div className="flex items-center gap-2 border-t border-border-subtle bg-surface-elevated px-3 py-1.5">
              <span className="font-body text-[10px] uppercase text-muted">lereliefhaiti.com</span>
              <span className="ml-auto font-label text-[10px] uppercase tracking-wider text-muted">Voir plus</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

// ── Carousel modal with navigation ───────────────────────────────────────

function CarouselModal({
  assets,
  initialIndex,
  onClose,
}: {
  assets: SocialAsset[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const total = assets.length;
  const asset = assets[idx];
  if (!asset) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div className="relative flex max-h-full max-w-3xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-full items-center justify-between">
          <span className="font-mono text-xs text-white/60">{idx + 1} / {total}</span>
          <button
            onClick={onClose}
            className="font-label text-xs uppercase tracking-wider text-white/70 hover:text-white"
          >
            ✕ Fermer
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          {total > 1 && (
            <button
              onClick={() => setIdx((i) => (i - 1 + total) % total)}
              disabled={idx === 0}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-20"
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.url}
            alt={`Slide ${idx + 1}`}
            className="max-h-[80vh] max-w-full rounded object-contain shadow-2xl"
          />
          {total > 1 && (
            <button
              onClick={() => setIdx((i) => (i + 1) % total)}
              disabled={idx === total - 1}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-20"
            >
              ›
            </button>
          )}
        </div>

        {/* Dot strip */}
        {total > 1 && (
          <div className="flex gap-1.5">
            {assets.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}

        <a
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-label text-[11px] uppercase tracking-wider text-white/50 hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          Ouvrir l&apos;original ↗
        </a>
      </div>
    </div>
  );
}

// ── Platform labels ───────────────────────────────────────────────────────

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
  // Modal: which slide index is open (-1 = closed)
  const [modalIndex, setModalIndex] = useState<number>(-1);
  // Background replace
  const [bgUrl, setBgUrl] = useState("");
  const [showBgInput, setShowBgInput] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const isLinkFirst = LINK_FIRST_PLATFORMS.has(platform);
  const isTall = TALL_PLATFORMS.has(platform);

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

  async function regenerateWithBg() {
    if (!bgUrl.trim()) return;
    setRegenerating(true);
    setShowBgInput(false);
    try {
      const res = await fetch(`/api/admin/social/render`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          articleId: post.articleId,
          platforms: [platform],
          coverImageOverride: bgUrl.trim(),
        }),
      });
      const json = await res.json();
      if (json.post) onPostUpdated(json.post);
    } finally {
      setRegenerating(false);
      setBgUrl("");
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
    <>
      {/* ── Carousel modal ── */}
      {modalIndex >= 0 && (
        <CarouselModal
          assets={state.assets}
          initialIndex={modalIndex}
          onClose={() => setModalIndex(-1)}
        />
      )}

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

        {/* ── Platform-aware preview ── */}
        {isLinkFirst ? (
          <LinkFirstPreview
            assets={state.assets}
            caption={caption}
            platform={platform}
            onExpand={(i) => setModalIndex(i)}
          />
        ) : (
          <CarouselPreview
            assets={state.assets}
            tall={isTall}
            onExpand={(i) => setModalIndex(i)}
          />
        )}

        {/* Background replacement */}
        <div className="rounded border border-border-subtle bg-surface p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label text-[11px] uppercase tracking-wider text-muted">Remplacer l&apos;image de fond</span>
            <button
              type="button"
              onClick={() => { setShowBgInput((v) => !v); setTimeout(() => bgInputRef.current?.focus(), 50); }}
              className="font-label text-[10px] uppercase tracking-wider text-primary hover:underline"
            >
              {showBgInput ? "Annuler" : "Changer"}
            </button>
          </div>
          {showBgInput && (
            <div className="flex gap-2">
              <input
                ref={bgInputRef}
                type="url"
                placeholder="https://…"
                value={bgUrl}
                onChange={(e) => setBgUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && regenerateWithBg()}
                className="flex-1 rounded border border-border-subtle bg-background p-1.5 font-body text-xs focus:border-primary focus:outline-none"
              />
              <Button size="sm" onClick={regenerateWithBg} disabled={!bgUrl.trim() || regenerating}>
                {regenerating ? "…" : "Appliquer"}
              </Button>
            </div>
          )}
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
    </>
  );
}
