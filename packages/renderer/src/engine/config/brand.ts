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
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
    primary: "#5090E0",       // sampled from Le Relief logo
    primaryDark: "#1E4D87",
    white: "#ffffff",
    offWhite: "#f3f7fd",
    dark: "#040b16",
    darkAlt: "#0b1a2d",
    breaking: "#f43f5e",
    news: "#5090E0",
    opportunity: "#73A8EA",
    scholarship: "#8BB8EF",
    explainer: "#5F9AE5",
    stat: "#6EA5EA",
    recap: "#4A84CF",
    history: "#7FB0ED",
    utility: "#5A97E4",
    data: "#6EA5EA",
  },
  backgrounds: {
    breaking: "#150408",
    news: "#020b17",
    opportunity: "#041224",
    scholarship: "#061831",
    explainer: "#071425",
    stat: "#071425",
    recap: "#041023",
    history: "#08192d",
    utility: "#041023",
    data: "#071425",
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

// ── Logo helpers ─────────────────────────────────────────────────────────────

let _cachedLogoDataUri: string | null | undefined;

/**
 * Resolve a local logo (PNG/SVG) to a data URI so templates can embed it in
 * screenshots regardless of runtime base URL.
 */
export function getBrandLogoDataUri(): string | null {
  if (_cachedLogoDataUri !== undefined) return _cachedLogoDataUri;

  const envUri = process.env.LE_RELIEF_LOGO_DATA_URI?.trim();
  if (envUri?.startsWith("data:image/")) {
    _cachedLogoDataUri = envUri;
    return _cachedLogoDataUri;
  }

  const candidates = [
    process.env.LE_RELIEF_LOGO_PATH,
    "public/logo.png",
    "public/logo.svg",
    "/workspaces/Le-Relief/public/logo.png",
    "/workspaces/Le-Relief/public/logo.svg",
  ].filter((v): v is string => Boolean(v && v.trim()));

  for (const candidate of candidates) {
    const abs = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(process.cwd(), candidate);
    if (!existsSync(abs)) continue;

    try {
      const raw = readFileSync(abs);
      const ext = path.extname(abs).toLowerCase();
      const mime = ext === ".svg" ? "image/svg+xml" : "image/png";
      _cachedLogoDataUri = `data:${mime};base64,${raw.toString("base64")}`;
      return _cachedLogoDataUri;
    } catch {
      // Ignore and continue with fallback candidates.
    }
  }

  _cachedLogoDataUri = null;
  return _cachedLogoDataUri;
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

export function brandLogoHtml(size = 30): string {
  const logo = getBrandLogoDataUri();
  if (!logo) return "";
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9px;background:linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));border:1px solid rgba(255,255,255,0.18);box-shadow:0 10px 28px rgba(0,0,0,0.32)"><img src="${logo}" alt="Le Relief logo" style="width:${Math.max(18, size - 8)}px;height:${Math.max(18, size - 8)}px;object-fit:contain;display:block" /></span>`;
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
  const logo = brandLogoHtml(28);
  const markCore = `${logo ? `${logo}<span style="width:2px;height:20px;background:rgba(255,255,255,0.12);border-radius:2px"></span>` : ""}${brandWordmarkHtml(accent, 17)}`;
  const mark = handle
    ? `<span style="display:inline-flex;align-items:center;gap:14px">${handle}<span style="display:inline-flex;align-items:center;gap:10px">${markCore}</span></span>`
    : `<span style="display:inline-flex;align-items:center;gap:10px">${markCore}</span>`;
  return `<div style="display:flex;justify-content:space-between;align-items:flex-end;padding:14px 16px 0;border-top:1px solid rgba(255,255,255,0.10);background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));backdrop-filter:blur(4px);border-radius:10px">${src}${mark}</div>`;
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
    `<svg style="position:absolute;inset:0;width:${width}px;height:${height}px;opacity:0.05;pointer-events:none">` +
    `<defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#grid)"/></svg>` +
    `<svg style="position:absolute;inset:0;width:${width}px;height:${height}px;opacity:0.04;pointer-events:none">` +
    `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.58" numOctaves="3" stitchTiles="stitch"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#grain)"/></svg>` +
    `<div style="position:absolute;inset:0;pointer-events:none;background:` +
    `radial-gradient(ellipse at 85% 8%, ${accent}38 0%, transparent 52%),` +
    `radial-gradient(ellipse at 12% 92%, ${accent}22 0%, transparent 46%),` +
    `linear-gradient(140deg, rgba(10,31,58,0.52) 0%, rgba(4,12,24,0.18) 36%, rgba(8,26,48,0.40) 100%)` +
    `"></div>`
  );
}
