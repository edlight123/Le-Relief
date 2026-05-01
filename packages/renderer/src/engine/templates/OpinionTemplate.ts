/**
 * @le-relief/renderer – Opinion Card template
 *
 * Magazine-feel multi-slide layout for opinion, editorial, décryptage and
 * chronique content types.
 * Canvas: 1080×1350 (4:5 portrait)
 *
 * Slide variants:
 *   - cover:  Italic DM Sans headline, author byline, category pill, vertical accent bar
 *   - detail: Medium headline + body bullets, vertical accent bar
 *   - cta:    Follow prompt / swipe CTA (same as news-carousel)
 */

import type { SlideContent } from "../types/post.js";
import { resolveZone, resolveEffectiveFontSize } from "../types/post.js";
import { getTemplateConfig } from "../config/templateLimits.js";
import {
  BRAND,
  GOOGLE_FONTS_LINK,
  brandLogoHtml,
  escapeHtml,
  getBrandAccent,
  getBrandBackground,
  getBrandLabel,
  footerBarHtml,
  premiumAtmosphereHtml,
} from "../config/brand.js";

const { fonts } = BRAND;

/**
 * Build HTML for a single Opinion Card slide.
 *
 * @param slide       Validated slide content
 * @param contentType Content type key (e.g. "opinion")
 * @param slideIndex  0-based slide index
 * @param totalSlides Total slides in the carousel
 */
export function buildOpinionSlide(
  slide: SlideContent,
  contentType: string,
  slideIndex: number,
  totalSlides: number,
): string {
  const accent = getBrandAccent(contentType);
  const bg = getBrandBackground(contentType);
  const label = slide.label ?? getBrandLabel(contentType);
  const variant = slide.layoutVariant ?? (slideIndex === 0 ? "cover" : "detail");

  if (variant === "cta") return buildCtaSlide(slide, accent, bg, totalSlides);
  if (slideIndex === 0 || variant === "cover") return buildCoverSlide(slide, accent, bg, label, totalSlides);
  return buildDetailSlide(slide, accent, bg, label, slideIndex, totalSlides);
}

// ── Vertical accent bar (shared decoration) ───────────────────────────────────

function accentBarHtml(accent: string): string {
  // 4 px wide bar, full height minus top/bottom margins, positioned left of text
  return `<div style="position:absolute;left:90px;top:120px;width:4px;height:1110px;background:linear-gradient(to bottom,${accent},${accent}88,transparent);border-radius:2px;"></div>`;
}

// ── Cover slide ───────────────────────────────────────────────────────────────

function buildCoverSlide(
  slide: SlideContent,
  accent: string,
  bg: string,
  label: string,
  totalSlides: number,
): string {
  const hasImage = Boolean(slide.imageUrl);
  const bodyBg = hasImage ? `${bg} url('${slide.imageUrl}') center/cover no-repeat` : bg;
  const overlay = hasImage
    ? `linear-gradient(to bottom, ${bg}cc 0%, ${bg}44 30%, ${bg}99 65%, ${bg}f5 100%)`
    : `radial-gradient(ellipse at 50% 110%, ${bg}cc 0%, transparent 65%)`;

  const cfg = getTemplateConfig("opinion-card");
  const hlZone = resolveZone(cfg, "headline", "cover")!;
  const bodyZone = resolveZone(cfg, "body", "cover")!;

  const hlSize = resolveEffectiveFontSize(hlZone, slide.headline);
  const logo = brandLogoHtml(34);

  // Category pill label — map to editorial vocabulary
  const opinionLabels: Record<string, string> = {
    opinion: "OPINION",
    editorial: "ÉDITORIAL",
    decryptage: "DÉCRYPTAGE",
    décryptage: "DÉCRYPTAGE",
    chronique: "CHRONIQUE",
  };
  const displayLabel = opinionLabels[label.toLowerCase()] ?? label.toUpperCase();

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONTS_LINK}
<style>
${baseReset(bg, bodyBg)}
.overlay { position:absolute;inset:0;background:${overlay};pointer-events:none; }
.canvas { position:absolute;inset:0;display:flex;flex-direction:column;padding:92px 90px 100px 122px;justify-content:space-between; }
.top { display:flex;justify-content:space-between;align-items:flex-start; }
.brand-chip { display:inline-flex;align-items:center;gap:12px; }
.pill { display:inline-flex;align-items:center;background:linear-gradient(135deg, ${accent} 0%, ${BRAND.colors.primaryDark} 100%);color:#fff;font-family:${fonts.headline};font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:2.8px;padding:12px 24px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);box-shadow:0 10px 26px rgba(0,0,0,0.28); }
.counter { font-family:${fonts.headline};font-size:17px;font-weight:600;opacity:0.3;letter-spacing:1px; }
.mid { flex:1;display:flex;flex-direction:column;justify-content:center;gap:24px;padding-bottom:40px; }
.headline { font-family:${fonts.headline};font-size:${hlSize}px;font-style:italic;font-weight:900;line-height:${hlZone.lineHeight};letter-spacing:-0.5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${hlZone.limits.maxLines ?? 4};-webkit-box-orient:vertical; }
.accent-rule { width:60px;height:3px;background:${accent};border-radius:2px; }
.thesis { font-family:${fonts.body};font-size:${bodyZone.fontSize}px;font-weight:400;line-height:${bodyZone.lineHeight};opacity:0.82;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${bodyZone.limits.maxLines ?? 4};-webkit-box-orient:vertical; }
.byline { font-family:${fonts.body};font-size:22px;font-weight:500;opacity:0.65;letter-spacing:0.3px; }
</style></head><body>
<div class="overlay"></div>
${premiumAtmosphereHtml(accent)}
${accentBarHtml(accent)}
<div class="canvas">
  <div class="top">
    <div class="brand-chip">${logo}<span class="pill">${escapeHtml(displayLabel)}</span></div>
    <span class="counter">1 / ${totalSlides}</span>
  </div>
  <div class="mid">
    <p class="headline">${escapeHtml(slide.headline)}</p>
    <div class="accent-rule"></div>
    ${slide.body ? `<p class="thesis">${escapeHtml(slide.body)}</p>` : ""}
    ${slide.supportLine ? `<p class="byline">— ${escapeHtml(slide.supportLine)}</p>` : ""}
  </div>
  ${footerBarHtml(slide.sourceLine, accent, fonts.body)}
</div>
</body></html>`;
}

// ── Detail slide ──────────────────────────────────────────────────────────────

function buildDetailSlide(
  slide: SlideContent,
  accent: string,
  bg: string,
  label: string,
  slideIndex: number,
  totalSlides: number,
): string {
  const cfg = getTemplateConfig("opinion-card");
  const hlZone = resolveZone(cfg, "headline", "detail")!;
  const bodyZone = resolveZone(cfg, "body", "detail")!;

  const hasBullets = slide.body ? /\n|•/.test(slide.body) : false;
  const bullets = hasBullets
    ? slide.body!.split(/\n|•/).map(s => s.trim()).filter(Boolean)
    : [];

  const logo = brandLogoHtml(32);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONTS_LINK}
<style>
${baseReset(bg)}
.canvas { position:absolute;inset:0;display:flex;flex-direction:column;padding:92px 90px 100px 122px;justify-content:space-between; }
.top { display:flex;justify-content:space-between;align-items:flex-start; }
.brand-chip { display:inline-flex;align-items:center;gap:12px; }
.pill { display:inline-flex;align-items:center;background:linear-gradient(135deg, ${accent} 0%, ${BRAND.colors.primaryDark} 100%);color:#fff;font-family:${fonts.headline};font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:2.8px;padding:12px 24px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);box-shadow:0 10px 26px rgba(0,0,0,0.28); }
.counter { font-family:${fonts.headline};font-size:17px;font-weight:600;opacity:0.3;letter-spacing:1px; }
.mid { flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px; }
.headline { font-family:${fonts.headline};font-size:${hlZone.fontSize}px;font-style:italic;font-weight:800;line-height:${hlZone.lineHeight};letter-spacing:-0.3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${hlZone.limits.maxLines ?? 3};-webkit-box-orient:vertical; }
.divider { width:60px;height:3px;background:${accent};border-radius:2px; }
.body { display:flex;flex-direction:column;gap:16px; }
.bullet-dot { width:8px;height:8px;border-radius:50%;background:${accent};flex-shrink:0;margin-top:12px; }
</style></head><body>
${premiumAtmosphereHtml(accent)}
${accentBarHtml(accent)}
<div class="canvas">
  <div class="top">
    <div class="brand-chip">${logo}<span class="pill">${escapeHtml(label)}</span></div>
    <span class="counter">${slideIndex + 1} / ${totalSlides}</span>
  </div>
  <div class="mid">
    <p class="headline">${escapeHtml(slide.headline)}</p>
    <div class="divider"></div>
    <div class="body">
      ${bullets.length
        ? bullets.map(b => `<div style="display:flex;gap:16px;align-items:flex-start"><div class="bullet-dot"></div><span style="font-family:${fonts.body};font-size:${bodyZone.fontSize}px;font-weight:400;line-height:${bodyZone.lineHeight};flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${bodyZone.limits.perBulletMaxLines ?? 5};-webkit-box-orient:vertical">${escapeHtml(b)}</span></div>`).join("")
        : slide.body ? `<p style="font-family:${fonts.body};font-size:${bodyZone.fontSize}px;font-weight:400;line-height:${bodyZone.lineHeight};overflow:hidden;display:-webkit-box;-webkit-line-clamp:${bodyZone.limits.maxLines ?? 8};-webkit-box-orient:vertical">${escapeHtml(slide.body)}</p>` : ""}
    </div>
  </div>
  ${footerBarHtml(slide.sourceLine, accent, fonts.body)}
</div>
</body></html>`;
}

// ── CTA slide ─────────────────────────────────────────────────────────────────

function buildCtaSlide(
  slide: SlideContent,
  accent: string,
  bg: string,
  totalSlides: number,
): string {
  const hasImage = Boolean(slide.imageUrl);
  const logo = brandLogoHtml(42);
  const bodyBg = hasImage ? `${bg} url('${slide.imageUrl}') center/cover no-repeat` : bg;
  const overlay = hasImage
    ? `linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.92) 100%)`
    : `radial-gradient(ellipse at 50% 110%, ${bg}cc 0%, transparent 65%)`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONTS_LINK}
<style>
${baseReset(bg, bodyBg)}
${hasImage ? `.img-overlay { position:absolute;inset:0;background:${overlay};pointer-events:none; }` : ""}
.canvas { position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:80px 90px; }
.top-brand { display:flex;align-items:center;gap:12px;font-family:${fonts.headline};font-size:24px;font-weight:900;letter-spacing:4px; }
.top-brand .el { color:rgba(255,255,255,0.88); }
.top-brand .nw { color:${accent}; }
.top-rule { width:56px;height:3px;background:${accent};border-radius:2px;margin-top:14px; }
.center { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:32px; }
.display-h { font-family:${fonts.headline};font-size:80px;font-style:italic;font-weight:900;line-height:1.02;letter-spacing:-2px;text-shadow:0 4px 48px rgba(0,0,0,0.9),0 2px 16px rgba(0,0,0,0.7); }
.rule { width:72px;height:4px;background:${accent};border-radius:2px; }
.tagline { font-family:${fonts.body};font-size:34px;font-weight:500;line-height:1.45;opacity:0.88;max-width:800px;text-shadow:0 2px 24px rgba(0,0,0,0.7); }
.handle { display:inline-flex;align-items:center;background:${accent};color:#000;font-family:${fonts.headline};font-size:26px;font-weight:900;letter-spacing:3px;text-transform:uppercase;padding:18px 48px;border-radius:8px;box-shadow:0 8px 32px ${accent}55; }
</style></head><body>
${hasImage ? `<div class="img-overlay"></div>` : ""}
<div class="canvas">
  <div>
    <div class="top-brand">${logo}<span class="el">${BRAND.wordmark.left}</span><span class="nw">${BRAND.wordmark.right}</span></div>
    <div class="top-rule"></div>
  </div>
  <div class="center">
    <p class="display-h">${escapeHtml(slide.headline ?? "Suivez EdLight News")}</p>
    <div class="rule"></div>
    <p class="tagline">${escapeHtml(slide.body ?? "L'actu haïtienne, chaque jour.")}</p>
    <div class="handle">${BRAND.socials.instagram}</div>
  </div>
  <span></span>
</div>
</body></html>`;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function baseReset(bg: string, bodyBg?: string): string {
  const b = bodyBg ?? bg;
  return `* { margin:0;padding:0;box-sizing:border-box; }
body { width:1080px;height:1350px;font-family:${fonts.body};background:${b};color:#fff;overflow:hidden;position:relative; }`;
}
