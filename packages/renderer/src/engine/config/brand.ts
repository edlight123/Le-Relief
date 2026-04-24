/**
 * @le-relief/renderer – Brand configuration
 *
 * Single source of truth for the renderer's visual identity.
 *
 * Runtime-overridable via `setBrand(partial)`. All template builders and
 * helpers resolve brand values through `BRAND` (a Proxy that reads from the
 * live runtime object), so templates compiled before any `setBrand` call
 * still pick up subsequent overrides.
 */

import type { PlatformId } from "@le-relief/types";

// ── Brand shape ───────────────────────────────────────────────────────────────

export interface BrandSocials {
  instagram?: string;
  facebook?: string;
  x?: string;
  threads?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
  /** E.164-formatted phone number, e.g. "+509..." */
  whatsappNumber?: string;
}

export interface BrandConfig {
  name: string;
  wordmark: { left: string; right: string };
  website: string;
  socials: BrandSocials;
  colors: {
    primary: string;
    primaryDark: string;
    white: string;
    offWhite: string;
    dark: string;
    darkAlt: string;
    breaking: string;
    news: string;
    opportunity: string;
    scholarship: string;
    explainer: string;
    stat: string;
    recap: string;
    history: string;
    utility: string;
    data: string;
    [key: string]: string;
  };
  backgrounds: {
    breaking: string;
    news: string;
    opportunity: string;
    scholarship: string;
    explainer: string;
    stat: string;
    recap: string;
    history: string;
    utility: string;
    data: string;
    [key: string]: string;
  };
  fonts: {
    headline: string;
    body: string;
    editorial: string;
  };
  labels: {
    breaking: string;
    news: string;
    opportunity: string;
    scholarship: string;
    explainer: string;
    stat: string;
    recap: string;
    history: string;
    utility: string;
    data: string;
    default: string;
    [key: string]: string;
  };
}

// ── Default brand: Le Relief ──────────────────────────────────────────────────

const DEFAULT_BRAND: BrandConfig = {
  name: "Le Relief",
  wordmark: { left: "LE", right: "RELIEF" },
  website: "lereliefhaiti.com",
  socials: {
    instagram: "@lereliefhaiti",
    facebook: "",
    x: "@lereliefhaiti",
    threads: "@lereliefhaiti",
    tiktok: "",
    linkedin: "",
    youtube: "",
    whatsappNumber: "",
  },
  colors: {
    primary: "#b45309",       // warm ochre — matches Haitian editorial feel
    primaryDark: "#7c2d12",
    white: "#ffffff",
    offWhite: "#f8f5ef",
    dark: "#0f0a05",
    darkAlt: "#1a1108",
    breaking: "#f43f5e",
    news: "#2dd4bf",
    opportunity: "#fbbf24",
    scholarship: "#60a5fa",
    explainer: "#a855f7",
    stat: "#a855f7",
    recap: "#34d399",
    history: "#f59e0b",
    utility: "#34d399",
    data: "#a855f7",
  },
  backgrounds: {
    breaking: "#150408",
    news: "#061014",
    opportunity: "#0f0d08",
    scholarship: "#060d1f",
    explainer: "#0f0514",
    stat: "#0f0514",
    recap: "#060f0b",
    history: "#120b06",
    utility: "#060f0b",
    data: "#0f0514",
  },
  fonts: {
    headline: "'DM Sans', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    editorial: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
  },
  labels: {
    breaking: "FLASH",
    news: "ACTUALITÉ",
    opportunity: "OPPORTUNITÉ",
    scholarship: "BOURSE",
    explainer: "ANALYSE",
    stat: "DONNÉES",
    recap: "RÉSUMÉ",
    history: "HISTOIRE",
    utility: "GUIDE",
    data: "DONNÉES",
    default: "LE RELIEF",
  },
};

// ── Runtime mutable copy ──────────────────────────────────────────────────────

let _brand: BrandConfig = structuredClone(DEFAULT_BRAND);

export function getBrand(): BrandConfig {
  return _brand;
}

/**
 * Merge a partial BrandConfig into the live brand at runtime.
 * Top-level keys are replaced wholesale except for `colors`, `backgrounds`,
 * `labels`, `socials`, `wordmark`, and `fonts`, which are deep-merged so the
 * consumer can tweak one color without respecifying all of them.
 */
export function setBrand(partial: Partial<BrandConfig>): BrandConfig {
  const next: BrandConfig = { ..._brand };

  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    const k = key as keyof BrandConfig;
    const existing = _brand[k];
    if (
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing) &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      (next as unknown as Record<string, unknown>)[k] = {
        ...(existing as object),
        ...(value as object),
      };
    } else {
      (next as unknown as Record<string, unknown>)[k] = value as unknown;
    }
  }

  _brand = next;
  return _brand;
}

export function resetBrand(): BrandConfig {
  _brand = structuredClone(DEFAULT_BRAND);
  return _brand;
}

// ── Proxy: `BRAND` always reads from the live runtime brand ──────────────────
//
// Templates compiled at import time reference `BRAND.fonts.body`,
// `BRAND.wordmark.left`, etc. Wrapping with a Proxy means those references
// re-evaluate against the latest `_brand` each time they're read, so
// `setBrand()` takes effect without re-importing anything.

export const BRAND: BrandConfig = new Proxy({} as BrandConfig, {
  get(_target, prop) {
    return (_brand as unknown as Record<string | symbol, unknown>)[prop as string];
  },
  has(_target, prop) {
    return prop in _brand;
  },
  ownKeys() {
    return Reflect.ownKeys(_brand);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(_brand, prop);
  },
}) as BrandConfig;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getBrandAccent(contentType: string): string {
  return (_brand.colors as Record<string, string>)[contentType] ?? _brand.colors.primary;
}

export function getBrandBackground(contentType: string): string {
  return (_brand.backgrounds as Record<string, string>)[contentType] ?? _brand.backgrounds.news;
}

export function getBrandLabel(contentType: string): string {
  return (_brand.labels as Record<string, string>)[contentType] ?? contentType.toUpperCase();
}

// ── Google Fonts preload link (HTML head snippet) ─────────────────────────────

export const GOOGLE_FONTS_LINK =
  `<link rel="preconnect" href="https://fonts.googleapis.com">` +
  `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
  `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700;0,800;0,900;1,500;1,700&display=swap" rel="stylesheet">`;

// ── HTML helpers ──────────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function brandWordmarkHtml(accent: string, fontSize = 18): string {
  const b = getBrand();
  return `<span style="font-family:${b.fonts.headline};font-size:${fontSize}px;font-weight:800;letter-spacing:2.5px;display:inline-flex;align-items:center;gap:6px"><span style="color:rgba(255,255,255,0.85)">${b.wordmark.left}</span><span style="color:${accent}">${b.wordmark.right}</span></span>`;
}

export function categoryPillHtml(label: string, accent: string, fontFamily: string): string {
  return `<div style="display:inline-flex;align-items:center;background:${accent};color:#000;font-family:${fontFamily};font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:3px;padding:10px 24px;border-radius:4px">${escapeHtml(label)}</div>`;
}

/**
 * Footer bar with source line and brand mark.
 *
 * When a PlatformId is supplied, the handle shown next to the wordmark is
 * adapted per platform (IG handle, FB page URL, website on WhatsApp, etc.).
 */
export function footerBarHtml(
  sourceLine: string | undefined,
  accent: string,
  fontFamily: string,
  platform?: PlatformId,
): string {
  const src = sourceLine
    ? `<span style="font-size:17px;opacity:0.35;max-width:60%;line-height:1.3;font-weight:400;font-family:${fontFamily}">${escapeHtml(sourceLine)}</span>`
    : `<span></span>`;
  const handle = platform ? platformHandleHtml(platform, accent, fontFamily) : "";
  const mark = handle
    ? `<span style="display:inline-flex;align-items:center;gap:14px">${handle}${brandWordmarkHtml(accent)}</span>`
    : brandWordmarkHtml(accent);
  return `<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:14px;border-top:1px solid rgba(255,255,255,0.10)">${src}${mark}</div>`;
}

/** Small handle chip used in platform-aware footer bars. */
export function platformHandleHtml(
  platform: PlatformId,
  _accent: string,
  fontFamily: string,
): string {
  const b = getBrand();
  let text = "";
  switch (platform) {
    case "instagram-feed":
    case "instagram-story":
    case "instagram-reel-cover":
      text = b.socials.instagram ?? "";
      break;
    case "facebook-feed":
    case "facebook-link":
      text = b.socials.facebook || b.website;
      break;
    case "x-landscape":
    case "x-portrait":
      text = b.socials.x ?? "";
      break;
    case "threads":
      text = b.socials.threads ?? b.socials.instagram ?? "";
      break;
    case "tiktok":
      text = b.socials.tiktok ?? "";
      break;
    case "linkedin-feed":
    case "linkedin-link":
      text = b.socials.linkedin || b.website;
      break;
    case "youtube-short-cover":
      text = b.socials.youtube || b.website;
      break;
    case "whatsapp-status":
    case "whatsapp-sticker":
      // No handle on WhatsApp — website only
      text = b.website;
      break;
  }
  if (!text) return "";
  return `<span style="font-size:15px;opacity:0.45;font-weight:500;font-family:${fontFamily}">${escapeHtml(text)}</span>`;
}

export function premiumAtmosphereHtml(accent: string, width = 1080, height = 1350): string {
  return (
    `<svg style="position:absolute;inset:0;width:${width}px;height:${height}px;opacity:0.04;pointer-events:none">` +
    `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#grain)"/></svg>` +
    `<div style="position:absolute;inset:0;pointer-events:none;background:` +
    `radial-gradient(ellipse at 80% 15%, ${accent}26 0%, transparent 50%),` +
    `radial-gradient(ellipse at 18% 80%, ${accent}1a 0%, transparent 45%),` +
    `radial-gradient(ellipse at 52% 48%, ${accent}0d 0%, transparent 38%)` +
    `"></div>`
  );
}
