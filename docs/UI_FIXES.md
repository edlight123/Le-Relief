# UI/UX Fix Tracker — Le Relief

Source of truth for all identified UI, typography, color, and UX issues.
Each item maps to a specific file and is checked off when merged.

---

## Priority 1 — Critical (broken or misleading)

- [x] **Search input oversized on mobile** — `font-headline text-3xl` on `<input>` renders as 30px+ on mobile. Change to `font-body text-xl sm:text-2xl`.  
  File: `src/app/(public)/search/page.tsx`

- [x] **Translation status shown to readers** — `getTranslationStatusLabel(article.translationStatus)` exposes internal workflow states (e.g. "generated_draft") in the public byline. Hide unless status is `"published"`.  
  File: `src/app/(public)/articles/[slug]/page.tsx`

- [x] **Facebook social link is `href="#"`** — broken placeholder. Remove the Facebook icon until the link is real.  
  File: `src/components/public/SocialLinks.tsx`

- [x] **Instagram hover colour hardcoded** — `hover:text-pink-500` bypasses the design system and breaks in dark mode.  
  File: `src/components/public/SocialLinks.tsx`

- [x] **`aria-label="Toggle theme"` is English** — must be French on a French-language platform.  
  File: `src/components/public/ThemeToggle.tsx`

- [x] **Social link `aria-label` values are raw keys** — renders "instagram" / "x" instead of human-readable French labels.  
  File: `src/components/public/SocialLinks.tsx`

- [x] **Dark mode prose has hardcoded hex** — `--tw-prose-quote-borders: #E63946` should reference `var(--primary)`.  
  File: `src/app/globals.css`

- [x] **`font-semibold` used on Newsreader** — weight 600 is not loaded; browser synthesises it. Replace all `font-semibold` on serif elements with `font-bold` (700).  
  Files: grep across `src/`

---

## Priority 2 — High impact UX

- [x] **Mobile nav missing theme + language toggles** — burger menu shows links only; mobile readers cannot switch theme or language.  
  File: `src/components/layout/Navbar.tsx`

- [x] **No skip-to-content link** — keyboard and screen-reader users cannot bypass the navbar.  
  File: `src/app/(public)/layout.tsx`

- [x] **No active nav state** — the current page's link is visually identical to all others.  
  File: `src/components/layout/Navbar.tsx`

- [x] **`editorial-deck` line-height too tight** — `1.45` is below comfortable screen-reading threshold. Change to `1.625` (matches `leading-relaxed`).  
  File: `src/app/globals.css`

- [x] **Newsletter input has no bounding box** — `border-0 border-b-2` leaves a borderless invisible field on light backgrounds. Add a full border.  
  File: `src/components/public/NewsletterSignup.tsx`

- [x] **`updatedAt` never shown on articles** — corrections and updates are invisible to readers. Show "Mis à jour le …" below the published date when `updatedAt` differs from `publishedAt` by more than 1 hour.  
  File: `src/app/(public)/articles/[slug]/page.tsx`

- [x] **Breadcrumbs absent on article and category pages** — essential news platform navigation. Add `Accueil > Rubrique > Titre` on article pages; `Accueil > Rubriques > Nom` on category pages.  
  Files: `src/app/(public)/articles/[slug]/page.tsx`, `src/app/(public)/categories/[slug]/page.tsx`

- [x] **No result count in search** — after querying, readers don't know if there are 2 or 200 results. Show "X résultat(s) pour «query»".  
  File: `src/app/(public)/search/page.tsx`

- [x] **WhatsApp share missing** — WhatsApp is the dominant sharing channel for the target audience (diaspora, mobile-first). Add alongside email + X.  
  File: `src/app/(public)/articles/[slug]/page.tsx`

- [x] **No "Signaler une erreur" link on articles** — the corrections policy exists but there is no in-article entry point. Add a small link at the bottom of every article body pointing to `/corrections`.  
  File: `src/app/(public)/articles/[slug]/page.tsx`

- [x] **Byline author not linked on ArticleCard** — author name appears in cards but does not link to `/auteurs/[id]`. Readers cannot discover an author's work from a card.  
  File: `src/components/public/ArticleCard.tsx`

- [x] **Author avatar sizes inconsistent** — 120px on author page, 72px in article author box. Both are fine; standardise in-article to 72px (already correct) and ensure author page uses 120px consistently.  
  File: `src/app/(public)/auteurs/[id]/page.tsx` — audit only, already 120px, verify markup

- [x] **"Most read" has no time window** — old articles with high lifetime views permanently dominate the list. Filter to articles published in the last 90 days.  
  File: `src/lib/public-content.ts`

---

## Priority 3 — Polish & conventions

- [x] **Kicker text minimum size** — `text-[10px]` falls below WCAG SC 1.4.4 minimum. Raise all kicker/label text to `text-[11px]` minimum.  
  Files: `src/app/globals.css`, `src/components/public/LanguageToggle.tsx`, various pages

- [x] **Search filter dropdowns unstyled** — raw `<select>` elements look like browser defaults. Apply design-system border + bg + font styles.  
  File: `src/app/(public)/search/page.tsx`

- [x] **Search debounce 400ms → 300ms** — 400ms feels sluggish for fast typists.  
  File: `src/app/(public)/search/page.tsx`

- [x] **Card hover state too subtle** — only a title colour change and grayscale removal. Add a minimal `box-shadow` or border highlight on card hover.  
  File: `src/components/public/ArticleCard.tsx`

- [x] **Category page: featured ≠ archive visually** — both use the same card; the featured article should use the `list` variant to stand out.  
  File: `src/app/(public)/categories/[slug]/page.tsx`

- [x] **Newsletter "already subscribed" state** — after subscribing, a return visit shows the full form again. Check `localStorage` for a flag and show a confirmation message instead.  
  File: `src/components/public/NewsletterSignup.tsx`

- [x] **Open Graph fallback image is `/logo.png`** — articles without a cover image produce a small logo tile when shared. Use a wide fallback OG image (`/og-default.jpg` 1200×630) or omit the image key entirely.  
  File: `src/app/(public)/articles/[slug]/page.tsx`

- [x] **Print stylesheet missing** — add `@media print` rules to strip navbar, sidebars, and format the article body cleanly.  
  File: `src/app/globals.css`

- [x] **`Table.tsx` "No data found" is English** — change to "Aucune donnée trouvée".  
  File: `src/components/ui/Table.tsx`

- [x] **`font-semibold` sweep** — Libre Franklin supports 600 (semibold) but Newsreader does not. Any `font-semibold` on a `font-headline` or `font-body` element must become `font-bold`.  
  Files: all `src/` — confirmed none remain after Priority 1 fix

---

## Deferred / Needs content or schema work

- [ ] **Article figcaption hardcoded** — "Le Relief Haïti" appears on every image. Requires a new `caption` field on the article schema and editor UI. Tracked separately.

- [ ] **Breadcrumbs use category slug** — requires `article.category.slug` to be reliably populated. Verify in `normalizeArticle` before shipping.

- [ ] **Category pagination** — `take: 30` hardcoded in `getCategoryPageContent`. Implement cursor-based pagination or "load more". Tracked separately.

- [ ] **Corrections/editor's note block** — needs a new `correction` field on articles and a styled callout component. Tracked separately.

- [ ] **Breaking/Developing story badge** — needs a boolean field on articles. Tracked separately.

- [ ] **Privacy policy "last updated" date** — editorial content, not a code fix.

---

## Notes

- All French-language fixes: the platform is 100% French. Any English string in UI-visible code (aria-label, placeholder, user-facing copy) is a bug.
- Dark mode: every colour fix must be verified in both themes.
- WCAG target: AA compliance (4.5:1 for normal text, 3:1 for large text / UI components).
