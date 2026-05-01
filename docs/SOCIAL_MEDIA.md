# Le Relief Social Renderer — Status & Roadmap

**Last updated:** May 2026  
**Engine packages:** `packages/renderer` · `packages/renderer-server`

---

## Implementation Status

The renderer has moved well beyond the original PRD. Below is an honest audit of what is shipped, partially done, and still pending.

---

## ✅ Phase 1 — Brand Refactor — COMPLETE

The renderer is Le Relief-native. No EdLight News branding remains in any template.

### Brand config (`packages/renderer/src/engine/config/brand.ts`)

| Item | Status |
|---|---|
| Name, wordmark (LE / RELIEF) | ✅ |
| Website: `lereliefhaiti.com` | ✅ |
| Instagram: `@lereliefhaiti` | ✅ |
| X: `@lereliefhaiti` | ✅ |
| Facebook page URL | ✅ |
| Threads: `@lereliefhaiti` | ✅ |
| Color palette (`#5090E0` primary, `#1E4D87` dark, breaking red, dark backgrounds) | ✅ |
| Category-specific accent + background colors (politique, sécurité, économie, culture, sport, diaspora…) | ✅ |
| Fonts: DM Sans (headline), Inter (body), Playfair Display (editorial) | ✅ |
| French category labels: ACTUALITÉ, FLASH, ANALYSE, DONNÉES, RÉSUMÉ, CARICATURE… | ✅ |
| Logo embed — data URI, file-system fallback, `LE_RELIEF_LOGO_DATA_URI` env override | ✅ |
| Logo + wordmark header HTML helper | ✅ |
| Footer bar HTML helper (source line + brand mark + platform handle) | ✅ |
| Category pill HTML helper | ✅ |
| `BRAND` proxy — runtime-overridable without re-importing any template | ✅ |
| `setBrand()` / `getBrand()` / `resetBrand()` API | ✅ |
| `getBrandAccent()`, `getBrandBackground()`, `getBrandLabel()` helpers | ✅ |

### Multi-brand architecture note

The brand system is fully abstracted and runtime-configurable via `setBrand()`. A dedicated `brands/` folder structure (with separate `edlight-news/` and `le-relief/` subdirectories) has **not** been created — the runtime approach covers the current Le Relief use case. This scaffold only becomes necessary when a second client brand is actively onboarded.

---

## ✅ Phase 2 — Templates — COMPLETE

Ten production templates registered in `packages/renderer/src/engine/templates/`.

| Template ID | Content type | Notes |
|---|---|---|
| `breaking-news-single` | Breaking News | FLASH label, high-contrast layout |
| `news-carousel` | Standard Article | Used for politique, sécurité, international, etc. |
| `explainer-carousel` | Explainer | Background → actors → implications structure |
| `quote-stat-card` | Quote / Stat | Large stat value with dynamic font scaling |
| `quote-pull` | Pull Quote | Person, role, context |
| `data-card` | Data / Fact | Number-first layout with source line |
| `weekly-recap-carousel` | Daily / Weekly Recap | "À retenir" multi-headline format |
| `opportunity-carousel` | Opportunity / Bourse | Deadline field support |
| `caricature-card` | Caricature | Image-forward layout |
| `story-cover` | Story Format | 1080 × 1920, teaser + CTA |

**Gap:** A dedicated **Opinion / Analysis** template was called out in the PRD. In practice the `news-carousel` with `analyse` category maps to its own accent color and `ANALYSE` label. A distinct magazine-style layout would add visual differentiation — candidate for V1.5.

---

## ✅ Phase 3 — Platform Export — COMPLETE

Fourteen platform specs registered in `packages/renderer/src/platforms/`.

| Platform ID | Dimensions | Notes |
|---|---|---|
| `instagram-feed` | 1080 × 1080 | carousel |
| `instagram-story` | 1080 × 1920 | single |
| `instagram-reel-cover` | 1080 × 1920 | single |
| `facebook-feed` | 1200 × 630 | landscape |
| `facebook-link` | 1200 × 630 | link preview |
| `x-landscape` | 1600 × 900 | card |
| `x-portrait` | 1080 × 1080 | square card |
| `linkedin-feed` | 1200 × 627 | |
| `linkedin-link` | 1080 × 1080 | |
| `threads` | 1080 × 1080 | |
| `tiktok` | 1080 × 1920 | cover |
| `youtube-short-cover` | 1080 × 1920 | cover |
| `whatsapp-status` | 1080 × 1920 | |
| `whatsapp-sticker` | 512 × 512 | bonus |

### renderer-server (`packages/renderer-server`)

Cloud Run HTTP server wrapping the renderer:

```
POST /render   { article, platforms[] }
  → { brandName, warnings, platforms: { [id]: { slides, caption, firstComment, thread, meta } } }
GET  /healthz
```

Article input fields accepted:

```typescript
{
  id: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  body: string;
  slug: string;
  language?: "fr" | "en";
  contentType?: string;
  isBreaking?: boolean;
  coverImage?: string | null;
  author?: { name?: string };
  category?: { slug?: string };
}
```

- Renders all requested platforms **in parallel**
- Returns PNG as base64 per slide per platform
- Returns structured caption: `text` (full), `shortText` (≤ 220 chars for X/Threads), `cta` URL, `hashtags[]`
- Returns `firstComment` and `thread` for platforms that support them
- Auth: Bearer token + Google Cloud Run IAM (`x-renderer-token` side-channel)

### File naming gap

Current export names from `renderWithEngine`: `slide_1.png`, `slide_2.png`.  
PRD naming convention (`le-relief-{slug}-ig-slide-01.png`) is **not yet applied** to the download/export side. The `slug` field is available in the article input — this is a small formatting pass.

---

## ✅ Phase 4 — Editorial QA — COMPLETE

| QA check | Status |
|---|---|
| Per-field copy limits (`maxWords`, `maxChars`, `maxLines`) | ✅ |
| Pixel-level text measurement (canvas-based) | ✅ |
| Dynamic font-size scaling by word / char count | ✅ |
| Overflow detection → automatic copy rewrite | ✅ |
| Overflow gate blocks export (status stays `draft`) | ✅ |
| Fit report: per-slide, per-field, linesUsed vs maxLines | ✅ |
| `isExportReady()` guard before rendering | ✅ |
| Missing title → throws, surfaces in `/render` error response | ✅ |
| Platform carousel max-slide clamping | ✅ |

---

## ✅ Phase 5 — Caption & Platform Formatting — COMPLETE

| Feature | Status |
|---|---|
| French captions (headline + excerpt + article URL) | ✅ |
| English captions when `language: "en"` | ✅ |
| Short caption for X / Threads (≤ 220 chars) | ✅ |
| Breaking style: `Flash 🚨\n\n🇭🇹 {headline}` | ✅ |
| Standard style: `🇭🇹 {headline}` | ✅ |
| Category-aware hashtags (#Politique, #Sécurité, #Économie, #Culture…) | ✅ |
| `#LeRelief #Haïti #Haiti` on every post | ✅ |
| `#Flash` on breaking posts | ✅ |
| `firstComment` field for hashtag-in-comment strategy | ✅ |
| `formatForPlatform()` per-platform caption shaping | ✅ |

---

## 🔲 Not Yet Implemented

### 1. Export file naming convention

Apply the convention on download/export:

```
le-relief-{article-slug}-ig-slide-01.png
le-relief-{article-slug}-x-card.png
le-relief-{article-slug}-facebook-card.png
```

`slug` is already present in the article input. Small change in `renderWithEngine` and the server response envelope.

### 2. AI-assisted generation layer

The PRD envisions an upstream LLM call that:
- Summarizes article body → carousel slides
- Generates per-platform caption variants (neutral / engaging / short)
- Suggests hashtags
- Generates "Pourquoi c'est important" slide
- Flags facts not present in the source article

Currently `articleToContent()` in renderer-server is a deterministic rule-based conversion. The `ContentIntakeInput` type and pipeline are already designed to accept pre-generated slide copy — an AI layer would sit upstream and populate `rawSlides[]` before calling `buildPost()`.

### 3. Dashboard UI

No web UI exists for:
- Browsing rendered posts by status (draft → approved → exported → published)
- Manual post creation (paste article URL or enter fields)
- Template and platform selection
- Editing slide text and captions before export
- Previewing before download
- Export history and audit trail

Requires: backoffice page(s), Firestore `social_posts` + `social_exports` collections, read/write service layer.

### 4. Post status and approval workflow

No review queue, no `needs_review → approved` step, no editor approval flow. The `PostStatus` type (`draft | validated | exported | failed`) exists in the engine types but is not persisted anywhere.

### 5. Per-platform caption variants

The PRD calls for three caption variants per platform (neutral / engaging / short). Currently one caption is generated and `shortText` is a trimmed version. The API could expose a `captionVariants` object per platform.

### 6. Dedicated Opinion / Analysis template

`news-carousel` + `analyse` category covers most cases. A distinct magazine-style layout for `opinion`, `décryptage`, `analyse` types would add visual clarity.

### 7. Article date forwarding

`publishedAt` is not forwarded from the `/render` request to `ContentIntakeInput.date`. Templates use a source line rather than a date stamp, so this is low priority.

---

## Rendering Pipeline

```
POST /render (article + platforms[])
  └─ articleToContent()
       └─ buildPost({ intake, rawSlides, caption })
            ├─ selectTemplate(intake)          → templateId
            ├─ validateCopyLimits(slide)        → per-field limits
            ├─ rewriteSlideCopy(slide)          → compress if overflow
            ├─ measureSlide(slide)              → pixel-level fit
            ├─ rewriteSlideCopy(slide)          → second pass if needed
            └─ ValidatedSlide[]  →  EnginePost
  └─ renderPost(post, contentType, platform)   → PNG buffers (Puppeteer)
  └─ formatForPlatform(platform, post)         → caption / thread / meta
  └─ Response: { brandName, warnings, platforms: { [id]: { slides, caption, … } } }
```

---

## V1.5 — Remaining Work (priority order)

1. **Export file naming** — apply `le-relief-{slug}-…` convention in `renderWithEngine` and server response.
2. **Dashboard UI** — backoffice page: browse, preview, edit, download rendered posts.
3. **Firestore social posts collection** — `social_posts`, `social_exports` schema and service layer.
4. **AI slide generation** — LLM upstream call producing `rawSlides[]` from article body.
5. **Per-platform caption variants** — expose neutral / engaging / short per platform.
6. **Opinion/Analysis template** — distinct magazine-style layout for `opinion` / `décryptage`.
7. **Date forwarding** — pass `publishedAt` to `ContentIntakeInput.date`.

## V2 — Long Term

- Full social media scheduling
- Auto-publishing via Meta Graph API (Facebook / Instagram)
- X posting integration
- Analytics dashboard + best-performing template tracking
- AI-assisted daily recap generator
- Video / reel generator
- Multi-brand renderer for other EdLight Labs clients
- White-label version for other Haitian media outlets

---

## Key Files

| File | Role |
|---|---|
| `packages/renderer/src/engine/config/brand.ts` | Brand config, logo, colors, HTML helpers |
| `packages/renderer/src/engine/types/post.ts` | Core data model (EnginePost, SlideContent, TemplateId…) |
| `packages/renderer/src/engine/templates/` | 10 HTML slide builder functions |
| `packages/renderer/src/engine/engine/` | Pipeline: buildSlides, renderSlides, exportSlides, measureText, rewriteCopy, selectTemplate, validateCopyLimits |
| `packages/renderer/src/engine/qa/` | Fit report, overflow QA helpers |
| `packages/renderer/src/platforms/` | 14 platform specs (dimensions, carousel rules, caption limits) |
| `packages/renderer/src/renderForAllPlatforms.ts` | Multi-platform render helper |
| `packages/renderer-server/src/index.ts` | Cloud Run HTTP server — POST /render |
| `src/lib/social/article-to-post.ts` | Next.js inline version of articleToContent() |
| `src/lib/social/cover-image-upgrade.ts` | Cover image URL resolution before rendering |
