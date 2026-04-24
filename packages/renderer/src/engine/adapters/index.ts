/**
 * @le-relief/renderer – Platform caption adapters
 *
 * Each adapter receives the engine's neutral caption + post metadata plus
 * per-platform overrides from `SocialFormattedPayload.platforms`, and
 * returns the final caption text ready for copy/paste into that platform.
 */

import type { PlatformId, PlatformCaptionOverrides, SocialFormattedPayload } from "@le-relief/types";
import type { EnginePost } from "../types/post.js";
import type { PlatformSpec } from "../../platforms/types.js";
import { getPlatformSpec } from "../../platforms/index.js";
import { getBrand } from "../config/brand.js";

export interface AdapterInput {
  post: EnginePost;
  /** Neutral payload (if any) — used for per-platform override lookup. */
  payload?: SocialFormattedPayload;
  /** Extra override map passed directly to the adapter (wins over payload). */
  overrides?: PlatformCaptionOverrides;
}

export interface AdapterOutput {
  /** The caption text to write to caption.txt. */
  caption: string;
  /** Optional separate hashtag line (IG "first-comment" strategy). */
  firstComment?: string;
  /** Optional thread splits (X / Threads). */
  thread?: string[];
  /** Extra metadata the exporter should embed in meta.json. */
  meta?: Record<string, unknown>;
}

// ── Registry ─────────────────────────────────────────────────────────────────

type AdapterFn = (input: AdapterInput, spec: PlatformSpec) => AdapterOutput;

export function formatForPlatform(
  platform: PlatformId,
  input: AdapterInput,
): AdapterOutput {
  const spec = getPlatformSpec(platform);
  const fn = ADAPTERS[platform];
  return fn(input, spec);
}

// ── Utilities ────────────────────────────────────────────────────────────────

function clamp(text: string, max: number): string {
  if (!Number.isFinite(max) || max <= 0) return text;
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1).trimEnd();
  return slice + "…";
}

function baseCaptionText(input: AdapterInput): string {
  return (
    input.payload?.caption ??
    input.post.caption.text +
      (input.post.caption.cta ? `\n\n${input.post.caption.cta}` : "")
  );
}

function withHashtags(text: string, hashtags: string[], allow: boolean): string {
  if (!allow || hashtags.length === 0) return text;
  return `${text}\n\n${hashtags.join(" ")}`;
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars - 6 /* room for " 1/n" */) {
      if (current) chunks.push(current.trim());
      current = w;
    } else {
      current = current ? `${current} ${w}` : w;
    }
  }
  if (current) chunks.push(current.trim());
  const total = chunks.length;
  return chunks.map((c, i) => (total > 1 ? `${c} ${i + 1}/${total}` : c));
}

// ── Per-platform adapters ────────────────────────────────────────────────────

function instagramAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.instagram ?? input.payload?.platforms?.instagram;
  const caption = ov?.caption ?? baseCaptionText(input);
  const withTags = withHashtags(caption, input.post.hashtags, spec.caption.allowHashtags);
  return {
    caption: clamp(withTags, spec.caption.maxChars),
    firstComment: input.post.hashtags.join(" "),
    meta: { handle: ov?.handle ?? b.socials.instagram },
  };
}

function facebookAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.facebook ?? input.payload?.platforms?.facebook;
  const caption = ov?.caption ?? baseCaptionText(input);
  const withTags = withHashtags(caption, input.post.hashtags, spec.caption.allowHashtags);
  return {
    caption: clamp(withTags, spec.caption.maxChars),
    meta: { pageUrl: ov?.pageUrl ?? b.socials.facebook ?? b.website },
  };
}

function xAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.x ?? input.payload?.platforms?.x;
  const source = ov?.caption ?? baseCaptionText(input);
  const chunks =
    ov?.thread ??
    (spec.caption.splitIntoThread
      ? splitIntoChunks(source, spec.caption.threadChunkMaxChars ?? spec.caption.maxChars)
      : [clamp(source, spec.caption.maxChars)]);
  return {
    caption: chunks.join("\n\n---\n\n"),
    thread: chunks,
    meta: { handle: ov?.handle ?? b.socials.x },
  };
}

function threadsAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const ov = input.overrides?.threads ?? input.payload?.platforms?.threads;
  const source = ov?.caption ?? baseCaptionText(input);
  const chunks =
    ov?.chunks ??
    (spec.caption.splitIntoThread
      ? splitIntoChunks(source, spec.caption.threadChunkMaxChars ?? spec.caption.maxChars)
      : [clamp(source, spec.caption.maxChars)]);
  return { caption: chunks.join("\n\n---\n\n"), thread: chunks };
}

function whatsappAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.whatsapp ?? input.payload?.platforms?.whatsapp;
  const base = ov?.caption ?? baseCaptionText(input);
  // WhatsApp status — strip hashtags (no discovery surface) even if they're
  // already in base.
  const stripped = base.replace(/#[^\s#]+/g, "").replace(/\s{2,}/g, " ").trim();
  return {
    caption: clamp(stripped, spec.caption.maxChars || Number.POSITIVE_INFINITY),
    meta: { whatsappNumber: ov?.number ?? b.socials.whatsappNumber },
  };
}

function tiktokAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.tiktok ?? input.payload?.platforms?.tiktok;
  const caption = ov?.caption ?? baseCaptionText(input);
  const withTags = withHashtags(caption, input.post.hashtags, spec.caption.allowHashtags);
  return {
    caption: clamp(withTags, spec.caption.maxChars),
    meta: { handle: ov?.handle ?? b.socials.tiktok },
  };
}

function linkedinAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.linkedin ?? input.payload?.platforms?.linkedin;
  const caption = ov?.caption ?? baseCaptionText(input);
  const withTags = withHashtags(caption, input.post.hashtags, spec.caption.allowHashtags);
  return {
    caption: clamp(withTags, spec.caption.maxChars),
    meta: { pageUrl: ov?.pageUrl ?? b.socials.linkedin ?? b.website },
  };
}

function youtubeAdapter(input: AdapterInput, spec: PlatformSpec): AdapterOutput {
  const b = getBrand();
  const ov = input.overrides?.youtube ?? input.payload?.platforms?.youtube;
  const title = ov?.title ?? input.post.topic;
  const description =
    ov?.description ?? baseCaptionText(input);
  const final = `${title}\n\n${description}`;
  return {
    caption: clamp(
      withHashtags(final, input.post.hashtags, spec.caption.allowHashtags),
      spec.caption.maxChars,
    ),
    meta: {
      channelUrl: ov?.channelUrl ?? b.socials.youtube ?? b.website,
      title,
    },
  };
}

const ADAPTERS: Record<PlatformId, AdapterFn> = {
  "instagram-feed": instagramAdapter,
  "instagram-story": instagramAdapter,
  "instagram-reel-cover": instagramAdapter,
  "facebook-feed": facebookAdapter,
  "facebook-link": facebookAdapter,
  "x-landscape": xAdapter,
  "x-portrait": xAdapter,
  "whatsapp-status": whatsappAdapter,
  "whatsapp-sticker": whatsappAdapter,
  tiktok: tiktokAdapter,
  "linkedin-feed": linkedinAdapter,
  "linkedin-link": linkedinAdapter,
  threads: threadsAdapter,
  "youtube-short-cover": youtubeAdapter,
};
