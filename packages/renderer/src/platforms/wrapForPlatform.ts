/**
 * @le-relief/renderer – Platform wrapper
 *
 * Every template produces a 1080×1350 body (the canonical Instagram 4:5
 * canvas). This helper wraps that body in an outer container sized to the
 * target PlatformSpec and applies a CSS transform so the base design fits
 * the target aspect ratio without re-authoring every template.
 *
 * Behaviour by aspect:
 *   – 1080×1350 (4:5 native)           → pass-through
 *   – Larger 4:5 (FB/LinkedIn 1200×1500) → uniform scale up
 *   – 9:16 (stories / TikTok / shorts) → scale to fit width, letterbox top/bottom
 *   – 16:9 / 1.91:1 (X-landscape / link cards) → letterbox left/right
 *   – 1:1 transparent (WhatsApp sticker) → scale down, transparent bg
 */

import type { PlatformSpec } from "./types.js";
import { getBrand } from "../engine/config/brand.js";

const BASE_W = 1080;
const BASE_H = 1350;

/**
 * Wrap a 1080×1350 slide body in a container sized to the target platform.
 *
 * The input `html` is a complete `<!DOCTYPE html>…</html>` document. We
 * inject a wrapper by replacing the top `<body>` styles with a new outer
 * stage, then scale the original body via CSS transform.
 */
export function wrapForPlatform(html: string, spec: PlatformSpec): string {
  // Pass-through when canvas already matches the base size.
  if (spec.canvas.width === BASE_W && spec.canvas.height === BASE_H) return html;

  const b = getBrand();
  const bg = spec.background === "transparent" ? "transparent" : b.backgrounds.news;

  // Uniform scale that fits the whole 1080×1350 inside the target canvas
  // while preserving aspect. For wider/landscape targets this produces
  // letterbox bands; for vertical targets it produces pillarbox-top/bottom
  // bands.
  const scale = Math.min(spec.canvas.width / BASE_W, spec.canvas.height / BASE_H);
  const innerW = BASE_W * scale;
  const innerH = BASE_H * scale;
  const offsetX = (spec.canvas.width - innerW) / 2;
  const offsetY = (spec.canvas.height - innerH) / 2;

  // Strip the original HTML/body wrapper so we can re-mount the content
  // inside a new stage. We keep <head> (fonts + inline styles).
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyAttrs = html.match(/<body([^>]*)>/i)?.[1] ?? "";
  const head = headMatch?.[1] ?? "";
  const bodyInner = bodyMatch?.[1] ?? html;

  // Extract original body style attr (it sets width/height/background/etc.)
  const styleMatch = bodyAttrs.match(/style="([^"]*)"/i);
  const bodyStyle = styleMatch?.[1] ?? "";

  return `<!DOCTYPE html><html><head>${head}<style>
html,body{margin:0;padding:0;}
body{
  width:${spec.canvas.width}px;
  height:${spec.canvas.height}px;
  background:${bg};
  position:relative;
  overflow:hidden;
}
.platform-stage{
  position:absolute;
  left:${offsetX}px;
  top:${offsetY}px;
  width:${BASE_W}px;
  height:${BASE_H}px;
  transform:scale(${scale});
  transform-origin:top left;
}
.platform-stage > .platform-stage-body{
  position:relative;
  width:${BASE_W}px;
  height:${BASE_H}px;
  ${bodyStyle}
}
</style></head><body>
<div class="platform-stage">
  <div class="platform-stage-body">${bodyInner}</div>
</div>
</body></html>`;
}
