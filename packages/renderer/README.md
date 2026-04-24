# @le-relief/renderer

Headless-Chromium, template-based social-post renderer. Ports the EdLight News
IG Engine and generalizes it across Instagram, Facebook, X, WhatsApp, TikTok,
LinkedIn, Threads, and YouTube Shorts.

## Install

```bash
pnpm add @le-relief/renderer
# Chromium binary (dev container / CI):
sudo apt-get install -y chromium
```

## Environment

| var                         | meaning                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `PLAYWRIGHT_CHROMIUM_PATH`  | Absolute path to a Chromium / Chrome binary (probed first) |

If `PLAYWRIGHT_CHROMIUM_PATH` is unset the renderer also tries
`/usr/bin/chromium-browser`, `/usr/bin/chromium`, `/usr/bin/google-chrome-stable`,
`/usr/bin/google-chrome`, then falls back to whatever `playwright-core` ships.

## Brand customization

All visual identity lives in a single `BrandConfig` object. Consumers override
it at runtime via `setBrand(partial)` — there is no need to edit template HTML.

```ts
import { setBrand } from "@le-relief/renderer";

setBrand({
  name: "Friend News",
  wordmark: { left: "FRIEND", right: "NEWS" },
  website: "friendnews.ht",
  socials: {
    instagram: "@friendnews",
    x: "@friendnews",
    whatsappNumber: "+50912345678",
  },
  colors: { primary: "#0ea5e9" },
});
```

`BRAND` is a proxy: templates imported *before* `setBrand` still pick up the
new values on their next render.

## Multi-platform render

```ts
import {
  renderForAllPlatforms,
  listPlatformIds,
} from "@le-relief/renderer";

const result = await renderForAllPlatforms(
  {
    topic: "Headline",
    sourceSummary: "Summary…",
    category: "news",
    preferredLanguage: "fr",
  },
  { platforms: listPlatformIds(), outputDir: "./out" },
);
```

Each platform gets its own subfolder under `./out`:

```
./out/
├── instagram-feed/
│   ├── ig-feed-news-carousel-2026-04-23-slide-01.png
│   ├── caption.txt
│   └── meta.json
├── instagram-story/…
├── facebook-feed/…
├── whatsapp-sticker/…        ← 512×512 transparent WebP (≤ 100 KB)
└── x-portrait/…
```

`caption.txt` is generated per-platform through the matching adapter:

- **Instagram** — full caption + hashtags, hashtags also written as first
  comment.
- **Facebook** — full caption; link-card variant uses the 1200×630 spec.
- **X / Twitter** — split into 280-char thread chunks (`thread: string[]` is
  stored in `meta.json`).
- **Threads** — 500-char chunks.
- **WhatsApp** — hashtags stripped; status gets a plain-text caption; sticker
  outputs a transparent 512×512 WebP-shaped PNG.
- **LinkedIn** — up to 3000 chars; link-card variant uses 1200×627.
- **TikTok / YouTube Shorts** — 9:16 cover frames.

## Adding a new platform

1. Append an id to `PlatformId` in `@le-relief/types`.
2. Create a `PlatformSpec` file under `src/platforms/` and register it in
   `src/platforms/index.ts`.
3. Optionally add a caption adapter in `src/engine/adapters/index.ts`. If you
   skip this step the platform falls back to the closest family adapter
   (instagram/facebook/x/threads/…).

## Adding a new template

1. Author a `buildFooSlide(slide, contentType, slideIndex, totalSlides)` in
   `src/engine/templates/FooTemplate.ts`. Stay at 1080×1350; the platform
   wrapper handles rescaling.
2. Add a matching `TemplateConfig` in `src/engine/config/templateLimits.ts`.
3. Register it in `src/engine/templates/index.ts` and add the template id to
   the `TemplateId` union in `src/engine/types/post.ts`.

## Test

```bash
pnpm --filter @le-relief/renderer test
```

Unit tests cover each `PlatformSpec`'s internal consistency and the
`wrapForPlatform` rescaler. Full Chromium-backed render tests live under the
`smoke` script:

```bash
pnpm --filter @le-relief/renderer smoke
```
