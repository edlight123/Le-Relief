/**
 * Social-publishing types — Firestore schema for `social_posts` and
 * `social_connections`. Mirrors {@link PlatformId} from `@le-relief/types`
 * but lives in the Next.js app so the admin UI doesn't import the renderer
 * package directly.
 */

import type { PlatformId } from "@le-relief/types";

export type SocialPostStatus =
  | "draft"
  | "rendering"
  | "ready"
  | "needs_review"
  | "approved"
  | "publishing"
  | "published"
  | "partially_published"
  | "failed";

export type PlatformPublishMode = "api" | "copy-paste";

export type PlatformPublishStatus =
  | "not-published"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "not-connected";

export interface SocialAsset {
  url: string;
  storagePath: string;
  format: "png" | "webp" | "jpeg";
  width: number;
  height: number;
  sizeBytes: number;
  slideNumber: number;
}

export interface PlatformPublishState {
  status: PlatformPublishStatus;
  mode: PlatformPublishMode;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  externalId?: string | null;
  externalUrl?: string | null;
  error?: string | null;
}

export interface PlatformPostState {
  assets: SocialAsset[];
  /** The caption shown in the UI (editable by the publisher). */
  caption: string;
  /** Optional first comment (Instagram hashtags). */
  firstComment?: string | null;
  /** Optional thread chunks (X / Threads). */
  thread?: string[] | null;
  /** Free-form per-platform metadata returned by the renderer adapter. */
  meta?: Record<string, unknown> | null;
  publish: PlatformPublishState;
  renderedAt?: string | null;
  /** Set when the publisher manually edited the caption. */
  captionDirty?: boolean;
  /** Three caption variants generated at render time. */
  captionVariants?: { neutral: string; engaging: string; short: string };
}

export interface SocialPost {
  id: string;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  articleLanguage: "fr" | "en";
  status: SocialPostStatus;
  /** Snapshot of the brand at render time. */
  brandName: string;
  /** Per-platform state. Keys are PlatformId strings. */
  platforms: Partial<Record<PlatformId, PlatformPostState>>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ── Connection records (one per platform) ───────────────────────────────────

export type ConnectionPlatform =
  | "meta" // covers Instagram + Facebook (one Graph token)
  | "x"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "threads"
  | "whatsapp";

export type ConnectionStatus = "connected" | "disconnected" | "expired";

export interface SocialConnection {
  platform: ConnectionPlatform;
  status: ConnectionStatus;
  /** AES-256-GCM encrypted JSON blob — never returned to the client. */
  encryptedToken?: string;
  expiresAt?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  scopes?: string[];
  /** Free-form, non-secret metadata. e.g. { fbPageId, igUserId } for Meta. */
  metadata?: Record<string, string> | null;
  updatedAt: string;
}

// ── Publish results ─────────────────────────────────────────────────────────

export interface PublishResult {
  status: PlatformPublishStatus;
  mode: PlatformPublishMode;
  externalId?: string | null;
  externalUrl?: string | null;
  /** When mode === "copy-paste", these are what the editor copies into
   *  the platform's native composer. */
  copyPaste?: {
    caption: string;
    thread?: string[];
    assetUrls: string[];
    instructions: string;
  };
  error?: string | null;
}
