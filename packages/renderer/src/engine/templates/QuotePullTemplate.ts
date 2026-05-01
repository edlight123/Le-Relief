/**
 * @le-relief/renderer – Quote Pull template
 *
 * Single-slide layout for highlighted quotes, notable statements,
 * and pull-quotes from interviews or analysis pieces.
 *
 * Canvas: 1080×1350 (4:5 portrait)
 *
 * Design:
 *   - Dark brand background (no hero image by default)
 *   - Oversized typographic quotation mark
 *   - Quote text in Playfair Display italic, centred
 *   - Attribution line "— {supportLine}" below quote
 *   - Category pill: CITATION
 *   - Minimal footer: wordmark + website
 *
 * Slide content mapping:
 *   slide.headline    → the quote text itself
 *   slide.supportLine → attribution (person, title, publication)
 *   slide.label       → overrides the category pill label
 *   slide.imageUrl    → optional subtle background (low opacity)
 */

import type { SlideContent } from "../types/post.js";
import { getTemplateConfig } from "../config/templateLimits.js";
import { resolveZone, resolveEffectiveFontSize } from "../types/post.js";
import {
  BRAND,
  GOOGLE_FONTS_LINK,
  escapeHtml,
  getBrandAccent,
  getBrandBackground,
  brandHeaderHtml,
  premiumAtmosphereHtml,
  footerBarHtml,
} from "../config/brand.js";

const { fonts } = BRAND;

export function buildQuotePullSlide(
  slide: SlideContent,
  contentType: string,
): string {
  const accent = getBrandAccent(contentType);
  const bg = getBrandBackground(contentType);

  // Pill label: prefer slide.label, else CITATION
  const pillLabel = slide.label?.trim() || "CITATION";
  const hasImage = Boolean(slide.imageUrl);

  const cfg = getTemplateConfig("quote-pull");
  const hlZone = resolveZone(cfg, "headline", "quote")!;
  const quoteSize = resolveEffectiveFontSize(hlZone, slide.headline);

  const footer = footerBarHtml(undefined, accent, fonts.body);

  const bgStyle = hasImage
    ? `background: ${bg} url('${slide.imageUrl}') center/cover no-repeat;`
    : `background: ${bg};`;

  const imageOverlay = hasImage
    ? `<div class="image-overlay"></div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONTS_LINK}
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1080px; height:1350px;
  font-family:${fonts.body};
  ${bgStyle}
  color:#fff;
  overflow:hidden;
  position:relative;
}
.image-overlay {
  position:absolute; inset:0;
  background:${bg}e8;
  pointer-events:none;
}
.big-quote-mark {
  position:absolute;
  top:100px; left:80px;
  font-family:'Playfair Display', Georgia, serif;
  font-size:260px;
  line-height:1;
  font-weight:700;
  color:${accent};
  opacity:0.18;
  user-select:none;
  pointer-events:none;
}
.brand-header {
  position:absolute;
  top:64px; left:80px;
  z-index:5;
}
.pill {
  position:absolute;
  top:78px; right:80px;
  background:${accent}22;
  border:1px solid ${accent}44;
  padding:10px 28px;
  border-radius:4px;
  font-family:${fonts.headline};
  font-size:18px;
  font-weight:900;
  letter-spacing:4px;
  text-transform:uppercase;
  color:${accent};
  white-space:nowrap;
}
.quote-block {
  position:absolute;
  top:${hlZone.box.y}px;
  left:90px; right:90px;
  max-height:${hlZone.box.height}px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:32px;
}
.quote-text {
  font-family:'Playfair Display', Georgia, serif;
  font-size:${quoteSize}px;
  font-style:italic;
  font-weight:400;
  line-height:1.30;
  text-align:center;
  color:#fff;
  overflow:hidden;
  display:-webkit-box;
  -webkit-line-clamp:8;
  -webkit-box-orient:vertical;
}
.divider {
  width:48px; height:2px;
  background:${accent};
  border-radius:1px;
  opacity:0.5;
}
.attribution {
  font-family:${fonts.body};
  font-size:22px;
  font-weight:600;
  letter-spacing:1px;
  text-align:center;
  color:rgba(255,255,255,0.65);
  overflow:hidden;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
}
.footer { position:absolute; bottom:0; left:0; right:0; }
</style></head><body>
${imageOverlay}
${premiumAtmosphereHtml(accent)}

<div class="big-quote-mark">\u201C</div>

<div class="brand-header">${brandHeaderHtml(accent, { logoSize: 40, fontSize: 20, compact: true })}</div>

<div class="pill">${escapeHtml(pillLabel)}</div>

<div class="quote-block">
  <p class="quote-text">${escapeHtml(slide.headline ?? "")}</p>
  ${slide.supportLine ? `<div class="divider"></div><p class="attribution">— ${escapeHtml(slide.supportLine)}</p>` : ""}
</div>

<div class="footer">${footer}</div>
</body></html>`;
}
