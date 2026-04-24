/**
 * @le-relief/types
 *
 * Generalized social-post types shared between the renderer and any
 * publishing pipeline. These descend from EdLight News's IG-specific
 * types but have been lifted to a platform-agnostic shape so the same
 * slide/payload objects can feed Instagram, Facebook, X, WhatsApp,
 * TikTok, LinkedIn, Threads, and YouTube Shorts.
 */

// ── Platform identity ────────────────────────────────────────────────────────

export type PlatformId =
  | "instagram-feed"
  | "instagram-story"
  | "instagram-reel-cover"
  | "facebook-feed"
  | "facebook-link"
  | "x-landscape"
  | "x-portrait"
  | "whatsapp-status"
  | "whatsapp-sticker"
  | "tiktok"
  | "linkedin-feed"
  | "linkedin-link"
  | "threads"
  | "youtube-short-cover";

// ── Post type & queue status (generalized) ───────────────────────────────────

export type SocialPostType =
  | "scholarship"
  | "opportunity"
  | "news"
  | "histoire"
  | "utility"
  | "data"
  | "breaking"
  | "stat";

export type SocialQueueStatus =
  | "queued"
  | "scheduled"
  | "rendering"
  | "posted"
  | "skipped"
  | "expired"
  | "failed"
  | "scheduled_ready_for_manual";

// ── Slide layouts ────────────────────────────────────────────────────────────

export type SocialSlideLayout = "headline" | "explanation" | "data" | "cta";

export interface SocialSlide {
  heading: string;
  bullets: string[];
  footer?: string;
  backgroundImage?: string;
  layout?: SocialSlideLayout;
  statValue?: string;
  statDescription?: string;
}

export interface SocialStorySlide {
  heading: string;
  bullets: string[];
  eyebrow?: string;
  subheading?: string;
  meta?: string[];
  footer?: string;
  backgroundImage?: string;
  accent?: string;
  frameType?: "cover" | "data" | "facts" | "headline" | "cta";
}

// ── Meme slides ──────────────────────────────────────────────────────────────

export type SocialMemeTemplate =
  | "drake"
  | "expanding-brain"
  | "distracted"
  | "starter-pack"
  | "two-buttons"
  | "tell-me"
  | "nobody"
  | "reaction"
  | "comparison";

export interface SocialMemePanel {
  text: string;
  emoji?: string;
}

export interface SocialMemeSlide {
  template: SocialMemeTemplate;
  panels: SocialMemePanel[];
  topicLine?: string;
  tone: "witty" | "wholesome" | "ironic" | "hype";
}

// ── Per-platform caption overrides ──────────────────────────────────────────

export interface PlatformCaptionOverrides {
  instagram?: { handle?: string; caption?: string };
  facebook?: { pageUrl?: string; caption?: string };
  x?: { handle?: string; caption?: string; thread?: string[] };
  threads?: { caption?: string; chunks?: string[] };
  whatsapp?: { caption?: string; number?: string };
  tiktok?: { handle?: string; caption?: string };
  linkedin?: { pageUrl?: string; caption?: string };
  youtube?: { channelUrl?: string; title?: string; description?: string };
}

export interface SocialFormattedPayload {
  slides: SocialSlide[];
  caption: string;
  memeSlide?: SocialMemeSlide;
  platforms?: PlatformCaptionOverrides;
}

export interface SocialStoryPayload {
  slides: SocialStorySlide[];
  dateLabel: string;
  platforms?: PlatformCaptionOverrides;
}

// ── Queue items ──────────────────────────────────────────────────────────────

export interface SocialQueueItem {
  id: string;
  sourceContentId: string;
  postType: SocialPostType;
  /** Legacy alias for `postType`, kept so ported EdLight code still compiles. */
  igType?: SocialPostType;
  score: number;
  status: SocialQueueStatus;
  scheduledFor?: string;
  targetPostDate?: string;
  queuedDate?: string;
  renderRetries?: number;
  platformPostIds?: Partial<Record<PlatformId, string>>;
  reasons: string[];
  payload?: SocialFormattedPayload;
  dryRunPath?: string;
  renderedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialStoryQueueItem {
  id: string;
  dateKey: string;
  status: SocialQueueStatus;
  sourceItemIds: string[];
  platformPostIds?: Partial<Record<PlatformId, string>>;
  payload?: SocialStoryPayload;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Back-compat IG-prefixed aliases ──────────────────────────────────────────

export type IGPostType = SocialPostType;
export type IGQueueStatus = SocialQueueStatus;
export type IGSlideLayout = SocialSlideLayout;
export type IGSlide = SocialSlide;
export type IGStorySlide = SocialStorySlide;
export type IGMemeTemplate = SocialMemeTemplate;
export type IGMemePanel = SocialMemePanel;
export type IGMemeSlide = SocialMemeSlide;
export type IGFormattedPayload = SocialFormattedPayload;
export type IGStoryPayload = SocialStoryPayload;
export type IGQueueItem = SocialQueueItem;
export type IGStoryQueueItem = SocialStoryQueueItem;
