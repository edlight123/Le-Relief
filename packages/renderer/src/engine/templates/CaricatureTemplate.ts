/**
 * @le-relief/renderer – Caricature Card template
 *
 * Single-slide layout for Le Relief's weekly caricature column.
 * Illustrated by Francisco Silva and other artists.
 *
 * Canvas: 1080×1350 (4:5 portrait)
 *
 * Design principles:
 *   - The illustration is HERO — it must breathe (full bleed, no text overlay)
 *   - A translucent brand strip at the bottom carries the credit line
 *   - No category pill inside the image — brand wordmark only
 *   - Minimal text: "CARICATURE du jour" + "Dessinateur : {name}"
 *
 * Slide content mapping:
 *   slide.imageUrl    → full-bleed illustration
 *   slide.headline    → caricature title / label (usually "CARICATURE du jour avec Le Relief")
 *   slide.supportLine → drawer credit (e.g. "Dessinateur : Francisco Silva")
 *   slide.sourceLine  → author / editorial credit for footer
 */

import type { SlideContent } from "../types/post.js";
import {
  BRAND,
  GOOGLE_FONTS_LINK,
  brandHeaderHtml,
  escapeHtml,
  getBrandAccent,
  getBrandBackground,
} from "../config/brand.js";

const { fonts } = BRAND;

/**
 * Build HTML for a Caricature Card slide.
 */
export function buildCaricatureSlide(
  slide: SlideContent,
  contentType: string,
): string {
  const accent = getBrandAccent(contentType);
  const bg = getBrandBackground(contentType);
  const hasImage = Boolean(slide.imageUrl);

  // Headline defaults to the standard caricature label if not supplied
  const title = slide.headline?.trim() || "CARICATURE du jour avec Le Relief";
  const credit = slide.supportLine?.trim() || "";

  const bodyBg = hasImage
    ? `${bg} url('${slide.imageUrl}') center/cover no-repeat`
    : bg;

  // Bottom strip gradient — dark enough to read white text over any illustration
  const stripGradient = `linear-gradient(to top, ${bg}f5 0%, ${bg}cc 40%, transparent 100%)`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${GOOGLE_FONTS_LINK}
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1080px; height:1350px;
  background:${bodyBg};
  color:#fff;
  overflow:hidden;
  position:relative;
  font-family:${fonts.body};
}
/* Very subtle top vignette so the brand strip doesn't look pasted on */
.top-vignette {
  position:absolute; top:0; left:0; right:0; height:200px;
  background:linear-gradient(to bottom, ${bg}99 0%, transparent 100%);
  pointer-events:none;
}
/* Bottom strip: gradient fade into dark, then credit text */
.bottom-strip {
  position:absolute; bottom:0; left:0; right:0;
  padding: 80px 90px 40px;
  background:${stripGradient};
  display:flex; flex-direction:column; gap:12px;
}
.caricature-label {
  font-family:${fonts.headline};
  font-size:22px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:4px;
  color:${accent};
  opacity:0.9;
}
.title-text {
  font-family:${fonts.headline};
  font-size:34px;
  font-weight:800;
  line-height:1.15;
  color:#fff;
  overflow:hidden;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
}
.credit {
  font-family:${fonts.body};
  font-size:22px;
  font-weight:400;
  opacity:0.7;
  margin-top:4px;
}
.footer-brand {
  display:flex; align-items:center; justify-content:space-between;
  margin-top:16px;
  padding-top:14px;
  border-top:1px solid rgba(255,255,255,0.12);
}
.wordmark {
  font-family:${fonts.headline};
  font-size:19px;
  font-weight:900;
  letter-spacing:2px;
  display:inline-flex; align-items:center; gap:6px;
}
.wordmark-left { opacity:0.55; }
.wordmark-right { color:${accent}; }
.handle {
  font-family:${fonts.body};
  font-size:18px;
  font-weight:500;
  opacity:0.45;
}
/* Top-left: tiny brand pill so it's still branded if cropped */
.top-brand {
  position:absolute; top:48px; left:80px;
}
</style></head><body>
<div class="top-vignette"></div>

<div class="top-brand">
  ${brandHeaderHtml(accent, { logoSize: 40, fontSize: 20, compact: true })}
</div>

<div class="bottom-strip">
  <p class="caricature-label">Caricature</p>
  <p class="title-text">${escapeHtml(title)}</p>
  ${credit ? `<p class="credit">${escapeHtml(credit)}</p>` : ""}
  <div class="footer-brand">
    <span class="wordmark">
      <span class="wordmark-left">${BRAND.wordmark.left}</span>
      <span class="wordmark-right">&nbsp;${BRAND.wordmark.right}</span>
    </span>
    <span class="handle">${BRAND.socials.instagram ?? ""}</span>
  </div>
</div>
</body></html>`;
}
