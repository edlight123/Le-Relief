/**
 * @le-relief/renderer – Story Cover template
 *
 * Single-slide layout optimised for Instagram Stories / Reels cover /
 * TikTok cover.  Rendered at the standard 1080×1350 base canvas;
 * wrapForPlatform scales it to 9:16 (1080×1920) with matching letterbox.
 *
 * Canvas: 1080×1350 (4:5 portrait)
 *
 * Design:
 *   - Full-bleed hero image (imageUrl), deep gradient overlay
 *   - Top row: date pill (optional) + category label
 *   - Centre: large headline, dynamic font 88 → 54px
 *   - Bottom: Le Relief wordmark + website domain
 *
 * Slide content mapping:
 *   slide.imageUrl    → hero image
 *   slide.headline    → main headline text
 *   slide.label       → category label (e.g. ACTUALITÉS) — overrides brand default
 *   slide.sourceLine  → optional date / location line shown as top pill
 *   slide.supportLine → optional deck / subheadline below headline
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
  getBrandLabel,
  brandHeaderHtml,
  premiumAtmosphereHtml,
  footerBarHtml,
} from "../config/brand.js";

const { fonts } = BRAND;

export function buildStoryCoverSlide(
  slide: SlideContent,
  contentType: string,
): string {
  const accent = getBrandAccent(contentType);
  const bg = getBrandBackground(contentType);
  const label = slide.label ?? getBrandLabel(contentType);
  const hasImage = Boolean(slide.imageUrl);

  const bodyBg = hasImage
    ? `${bg} url('${slide.imageUrl}') center/cover no-repeat`
    : bg;

  // Deep vignette — stories need more contrast at the edges
  const overlayGradient = hasImage
    ? `linear-gradient(to bottom, ${bg}dd 0%, ${bg}33 25%, ${bg}55 65%, ${bg}f0 100%)`
    : `radial-gradient(ellipse at 50% 115%, ${bg}cc 0%, transparent 65%)`;

  const cfg = getTemplateConfig("story-cover");
  const hlZone = resolveZone(cfg, "headline", "cover")!;
  const headlineSize = resolveEffectiveFontSize(hlZone, slide.headline);

  const footer = footerBarHtml(slide.sourceLine ?? BRAND.website, accent, fonts.body);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONTS_LINK}
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1080px; height:1350px;
  font-family:${fonts.body};
  background:${bodyBg};
  color:#fff;
  overflow:hidden;
  position:relative;
}
.overlay {
  position:absolute; inset:0;
  background:${overlayGradient};
  pointer-events:none;
}
.top-row {
  position:absolute;
  top:60px; left:80px; right:80px;
  display:flex; align-items:center; gap:16px;
}
.date-pill {
  background:rgba(255,255,255,0.12);
  border:1px solid rgba(255,255,255,0.22);
  backdrop-filter:blur(4px);
  padding:8px 18px;
  border-radius:4px;
  font-size:19px;
  font-weight:500;
  font-family:${fonts.body};
  white-space:nowrap;
  opacity:0.85;
}
.category-label {
  font-family:${fonts.headline};
  font-size:20px;
  font-weight:900;
  letter-spacing:4px;
  text-transform:uppercase;
  color:${accent};
}
.headline-block {
  position:absolute;
  top:${hlZone.box.y}px;
  left:80px; right:80px;
  max-height:${hlZone.box.height}px;
  overflow:hidden;
}
.headline {
  font-family:${fonts.headline};
  font-size:${headlineSize}px;
  font-weight:900;
  line-height:1.10;
  color:#fff;
  text-shadow:0 2px 24px ${bg}99;
  overflow:hidden;
  display:-webkit-box;
  -webkit-line-clamp:5;
  -webkit-box-orient:vertical;
}
.support-line {
  font-family:${fonts.body};
  font-size:26px;
  font-weight:400;
  line-height:1.4;
  color:rgba(255,255,255,0.75);
  margin-top:24px;
  overflow:hidden;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
}
.accent-rule {
  width:56px; height:4px;
  background:${accent};
  border-radius:2px;
  margin-bottom:22px;
}
.footer { position:absolute; bottom:0; left:0; right:0; }
</style></head><body>
<div class="overlay"></div>
${premiumAtmosphereHtml(accent)}

<div class="top-row">
  ${brandHeaderHtml(accent, { logoSize: 44, fontSize: 22 })}
  ${slide.sourceLine ? `<span class="date-pill">${escapeHtml(slide.sourceLine)}</span>` : `<span class="category-label">${escapeHtml(label)}</span>`}
</div>

<div class="headline-block">
  <div class="accent-rule"></div>
  <p class="headline">${escapeHtml(slide.headline ?? "")}</p>
  ${slide.supportLine ? `<p class="support-line">${escapeHtml(slide.supportLine)}</p>` : ""}
</div>

<div class="footer">${footer}</div>
</body></html>`;
}
