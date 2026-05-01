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
    facebook: "https://www.facebook.com/profile.php?id=100065575869522",
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
    caricature: "#5090E0",
    interview: "#73A8EA",
    reportage: "#6EA5EA",
    analyse: "#5F9AE5",
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
    caricature: "#020b17",
    interview: "#041224",
    reportage: "#071425",
    analyse: "#071425",
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
    caricature: "CARICATURE",
    interview: "INTERVIEW",
    reportage: "REPORTAGE",
    analyse: "ANALYSE",
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

  // Always-available build-time embed — use as first resort so the logo
  // shows up in Docker / Cloud Run regardless of the runtime working directory.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./inlinedLogo.js") as { INLINED_LOGO_DATA_URI?: string };
    if (mod.INLINED_LOGO_DATA_URI) {
      _cachedLogoDataUri = mod.INLINED_LOGO_DATA_URI;
      return _cachedLogoDataUri;
    }
  } catch { /* fall through to file-system candidates */ }

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

// ── Font styles (inlined woff2 — no CDN round-trips) ─────────────────────────

export { INLINED_FONTS_STYLE as GOOGLE_FONTS_LINK } from "./inlinedFonts.js";

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
  return `<span style="font-family:${b.fonts.headline};font-size:${fontSize}px;font-weight:900;letter-spacing:${Math.max(2, fontSize * 0.14)}px;display:inline-flex;align-items:center;gap:${Math.max(4, fontSize * 0.35)}px"><span style="color:rgba(255,255,255,0.92)">${b.wordmark.left}</span><span style="color:${accent}">${b.wordmark.right}</span></span>`;
}

export function brandLogoHtml(size = 30): string {
  const logo = getBrandLogoDataUri();
  if (!logo) return "";
  // The Le Relief logo is itself a styled emblem — render it raw (no chrome
  // wrapper) so it reads as the actual brand mark, not a generic icon.
  return `<img src="${logo}" alt="Le Relief" style="width:${size}px;height:${size}px;object-fit:contain;display:block;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.45))" />`;
}

/**
 * Strong masthead-style brand header — logo + wordmark side-by-side.
 *
 * Drop this in the top-left of any slide so every Le Relief asset reads
 * unmistakably as a Le Relief publication, even on cropped previews.
 */
export function brandHeaderHtml(accent: string, opts?: { logoSize?: number; fontSize?: number; compact?: boolean }): string {
  const logoSize = opts?.logoSize ?? 44;
  const fontSize = opts?.fontSize ?? 22;
  const logo = brandLogoHtml(logoSize);
  const wm = brandWordmarkHtml(accent, fontSize);
  const gap = opts?.compact ? 10 : 14;
  return `<div style="display:inline-flex;align-items:center;gap:${gap}px">${logo}${logo ? `<span style="width:1px;height:${logoSize - 8}px;background:rgba(255,255,255,0.22);border-radius:1px"></span>` : ""}${wm}</div>`;
}

export function categoryPillHtml(label: string, accent: string, fontFamily: string): string {
  return `<div style="display:inline-flex;align-items:center;background:${accent};color:#000;font-family:${fontFamily};font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:3px;padding:10px 24px;border-radius:4px">${escapeHtml(label)}</div>`;
}

/**
 * Footer bar — masthead-style brand mark on the right, source/handle on left.
 *
 * Sized for high visibility: logo 36px, wordmark 22px, plus the website
 * domain always shown beneath the wordmark so every Le Relief asset is
 * discoverable when shared off-platform.
 */
export function footerBarHtml(
  sourceLine: string | undefined,
  accent: string,
  fontFamily: string,
  platform?: PlatformId,
): string {
  const b = getBrand();
  const handleText = platform ? platformHandleText(platform) : b.website;
  const src = sourceLine
    ? `<span style="font-size:18px;opacity:0.42;max-width:55%;line-height:1.3;font-weight:500;font-family:${fontFamily}">${escapeHtml(sourceLine)}</span>`
    : `<span style="font-size:18px;opacity:0.45;font-weight:600;font-family:${fontFamily};letter-spacing:0.5px;color:${accent}">${escapeHtml(b.website)}</span>`;

  // Right side: logo + wordmark stacked over the platform handle / website
  const logo = brandLogoHtml(36);
  const wordmark = brandWordmarkHtml(accent, 22);
  const handleLine = handleText && handleText !== sourceLine
    ? `<span style="font-size:14px;opacity:0.55;font-weight:500;font-family:${fontFamily};margin-top:2px;letter-spacing:0.4px">${escapeHtml(handleText)}</span>`
    : "";
  const mark = `
    <div style="display:flex;align-items:center;gap:12px">
      ${logo}
      ${logo ? `<span style="width:1px;height:30px;background:rgba(255,255,255,0.22);border-radius:1px"></span>` : ""}
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:0">
        ${wordmark}
        ${handleLine}
      </div>
    </div>`;

  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px 0;border-top:1px solid rgba(255,255,255,0.14);background:linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.00))">${src}${mark}</div>`;
}

/** Plain text version of platform handle (no markup). */
function platformHandleText(platform: PlatformId): string {
  const b = getBrand();
  switch (platform) {
    case "instagram-feed":
    case "instagram-story":
    case "instagram-reel-cover":
      return b.socials.instagram ?? b.website;
    case "facebook-feed":
    case "facebook-link":
      return b.website;
    case "x-landscape":
    case "x-portrait":
      return b.socials.x ?? b.website;
    case "threads":
      return b.socials.threads ?? b.socials.instagram ?? b.website;
    case "tiktok":
      return b.socials.tiktok || b.website;
    case "linkedin-feed":
    case "linkedin-link":
      return b.socials.linkedin || b.website;
    case "youtube-short-cover":
      return b.socials.youtube || b.website;
    case "whatsapp-status":
    case "whatsapp-sticker":
      return b.website;
  }
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
