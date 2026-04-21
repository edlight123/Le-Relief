# EN Category & Author Pages — Phase 3 Design Research

**Date**: April 21, 2026  
**Purpose**: Design specification for English-language category and author pages  
**Status**: Research Phase (pre-implementation)

---

## Executive Summary

This document provides detailed research and recommendations for implementing EN-specific category and author pages in Le Relief's Phase 3. The current architecture uses single category/author pages with FR-only content. The proposal creates parallel EN pages while maintaining a shared data model.

**Key Decision**: Use a **dual-URL architecture** (`/categories/[slug]` for FR + `/en/categories/[slug]` for EN) with **language-aware filtering** rather than i18n routing, allowing independent curation and gradual expansion.

---

## 1. Category Curation Strategy: AUTO-GENERATED vs. MANUALLY CURATED

### Current State
- FR categories are global (all categories exist, used by FR articles)
- Each category has a fixed schema: `id`, `name`, `slug`, `description`
- Categories are **shared across languages** — articles link to same category regardless of language

### Recommendation: **MANUALLY CURATED** (with smart defaults)

**Rationale:**
1. **Quality Control**: EN articles are fewer and more strategic. EN readers benefit from curated, high-value categories only
2. **UX Clarity**: Showing only categories with actual EN content prevents empty category pages and broken navigation
3. **SEO**: Reduces thin content pages (categories with 0-1 articles rank poorly)
4. **Flexibility**: Allows different category hierarchies for FR vs EN (e.g., "Politique Haïtienne" is FR-only)
5. **Future Scalability**: Sets pattern for other languages

### Implementation Approach
- Create a **category visibility/curation layer** (not a schema change initially)
- Store an `enabledLanguages: string[]` field on Category (default: `["fr"]`)
- When displaying `/en/categories`, filter to only categories where `enabledLanguages.includes("en")`
- When publishing EN articles, editors must explicitly enable category for EN AND ensure category is available
- Provide admin UI to manage per-language category visibility

### Migration Path
```
Phase 3a (MVP): Hard-code EN-enabled categories (e.g., 3-5 categories)
Phase 3b (v1): Add admin UI toggle for per-category EN visibility
Phase 3c (v2): Implement category name translations (schema change)
```

---

## 2. EN Category Page Structure

### Template: Same as FR with Language-Specific Content & Metadata

**File Structure:**
```
src/app/(public)/en/categories/[slug]/page.tsx
src/app/(public)/en/categories/page.tsx (directory page)
```

**Page Structure** (identical to FR, but with EN articles only):

```
Breadcrumb: Home > Categories > [Category Name]

Header
├─ Label: "Category" (EN-localized)
├─ Title: Category name (in FR or translated?)
└─ Description: Category description

Featured Section (if exists)
├─ Label: "Featured in this category"
└─ Article Card (latest EN article in category)

Archive Section
├─ Label: "All articles"
└─ LatestArticlesFeed (paginated, EN + category filtered)

Empty State
└─ "No articles published in this category yet."
```

**Key Differences from FR:**
- Language metadata in alternates (see section 9)
- EN-only article filter in queries
- Different CTAs/section labels (localized to EN)
- Different date format handling (English dates)

### Data Flow
```
[slug] → GET /api/categories/{slug}?language=en
  ↓
Filter articles: language='en' AND categoryId=<id> AND status='published'
  ↓
Hydrate: author + category → render page
```

---

## 3. Category Names: SHOW FR NAMES or TRANSLATE?

### Recommendation: **SHOW FR NAMES** (in Phase 3, plan for translation in Phase 3c)

**Rationale:**

**For FR Names (recommended for Phase 3):**
- ✅ No schema changes required
- ✅ Maintains brand consistency (categories are part of editorial voice)
- ✅ Categories like "Politique" are clearly understandable to EN readers
- ✅ Simpler implementation (0 additional data)
- ✅ Preserves French editorial identity (intentional — the publication is French-first)
- ⚠️  Slight friction for EN-only speakers unfamiliar with French

**Against Translations:**
- ❌ Requires adding `nameEn` or translating all 20+ existing categories
- ❌ SEO impact: duplicate content if both "Politics" and "Politique" exist
- ❌ Increases data maintenance burden

### Approved Approach
1. **Phase 3**: Use FR category names on EN pages (e.g., `/en/categories/politique`)
   - Breadcrumb: `Home > Categories > Politique`
   - Heading: `Politique`
   - URL slug: `/en/categories/politique` (matches FR)

2. **Phase 3c (optional)**: Add category translation schema
   ```typescript
   interface Category {
     id: string;
     name: string;          // "Politique"
     nameEn?: string;       // "Politics"
     slug: string;
     description: string | null;
     descriptionEn?: string | null;
     enabledLanguages: string[];
   }
   ```

3. **If translated later:**
   - Use `nameEn` if present, fallback to `name`
   - Update URL slug strategy (either keep FR slugs or create EN slugs)

---

## 4. EN Author Pages: SAME AUTHOR or LANGUAGE-AWARE FILTERING?

### Recommendation: **SAME AUTHOR, LANGUAGE-AWARE FILTERING**

**Architecture:**
- Authors are **global entities** (not duplicated per language)
- EN author page shows only EN articles by that author
- Author profile (name, bio, image, role) is shared across languages
- Future: Allow language-specific author bios

### Page Structure

```
File: src/app/(public)/en/auteurs/[id]/page.tsx

Header
├─ Author avatar/initials
├─ Name (shared across languages)
├─ Role (shared across languages)
└─ Bio (FR bio shown; could add bioEn in Phase 3c)

Content
└─ LatestArticlesFeed: author=<id> AND language='en' AND status='published'

Empty State
└─ "No English articles published by this author yet."
```

### Rationale
1. **Single Author Identity**: Authors are people, not localized entities
2. **Simpler UX**: Don't confuse readers with duplicate author pages
3. **Future Growth**: As EN coverage expands, same author naturally gets more EN articles
4. **Analytics**: Track all author articles in one place regardless of language
5. **Linking**: Article author cards can link to `/auteurs/[id]` (shows all languages) or `/en/auteurs/[id]` (shows EN only) depending on context

### Implementation
```typescript
// src/lib/public-content.ts

export async function getAuthorPageContent(id: string, language?: 'en' | 'fr') {
  const author = await usersRepo.getUser(id);
  if (!author) return null;

  const articles = await articlesRepo.getArticles({
    status: 'published',
    authorId: id,
    language: language,  // Filter by language if provided
    take: 12,
  });

  return { author, articles };
}
```

---

## 5. Filter Logic: Core Query Pattern

### Standard Filter Pattern for All EN Pages

**All EN pages must apply both filters:**

```typescript
filter: {
  language: 'en',
  status: 'published',
  categoryId: '<category.id>' OR authorId: '<author.id>' (if applicable)
}
```

### Repository Query Examples

**Category Page:**
```typescript
const articles = await articlesRepo.getArticles({
  status: 'published',
  language: 'en',           // ← EN filter
  categoryId: category.id,  // ← Category filter
  take: 11,
});
```

**Author Page:**
```typescript
const articles = await articlesRepo.getArticles({
  status: 'published',
  language: 'en',           // ← EN filter
  authorId: author.id,      // ← Author filter
  take: 12,
});
```

**EN Homepage (English Selection):**
```typescript
const articles = await articlesRepo.getArticles({
  status: 'published',
  language: 'en',           // ← EN filter (no category/author)
  take: 24,
});
```

### Important: Firestore Index Requirement
Current Firestore indexes may need updates for compound queries:
```
Collection: articles
Indexes needed:
  - (status, language)
  - (status, language, categoryId)
  - (status, language, authorId)
  - (status, language, categoryId, publishedAt)
  - (status, language, authorId, publishedAt)
```

✅ **Check:** `firestore.indexes.json` for existing indexes (or let Firebase auto-index)

---

## 6. Sitemap Updates

### Current Sitemap Pattern
```typescript
// src/app/sitemap.ts
[
  /articles/<slug>                    // 500+ articles
  /categories/<slug>                  // ~20 categories
  /auteurs/<id>                       // ~15 authors
]
```

### Updated Sitemap Strategy

**Add EN routes:**

```typescript
// For each enabled EN category:
/en/categories/<slug>

// For each author with EN articles:
/en/auteurs/<id>

// Static EN routes:
/en
```

### Implementation

```typescript
// src/app/sitemap.ts (additions)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ... existing routes ...

  // New: EN category routes (filtered to enabled categories)
  let enCategoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await categoriesRepo.getCategories();
    const enEnabledCategories = categories.filter(
      (cat) => (cat.enabledLanguages as string[])?.includes('en') ?? false
    );
    enCategoryRoutes = enEnabledCategories
      .filter((cat) => cat.slug)
      .map((cat) => ({
        url: `${siteConfig.url}/en/categories/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
  } catch {
    enCategoryRoutes = [];
  }

  // New: EN author routes (only authors with EN articles)
  let enAuthorRoutes: MetadataRoute.Sitemap = [];
  try {
    const authors = await usersRepo.getUsers();
    for (const author of authors) {
      const { total } = await articlesRepo.getArticles({
        status: 'published',
        language: 'en',
        authorId: author.id,
      });
      if (total > 0) {
        enAuthorRoutes.push({
          url: `${siteConfig.url}/en/auteurs/${author.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        });
      }
    }
  } catch {
    enAuthorRoutes = [];
  }

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...authorRoutes,
    ...enCategoryRoutes,      // NEW
    ...enAuthorRoutes,        // NEW
  ];
}
```

---

## 7. Routing Architecture: Separate Trees vs. Locale Grouping

### Current Structure
```
src/app/(public)/
  ├─ layout.tsx (global layout + nav)
  ├─ page.tsx (FR homepage)
  ├─ categories/
  │   ├─ page.tsx (category listing)
  │   └─ [slug]/page.tsx (category detail)
  ├─ auteurs/
  │   └─ [id]/page.tsx (author detail)
  └─ en/
      └─ page.tsx (EN homepage)
```

### Recommendation: **SEPARATE TREES** (don't use `(locale)` grouping)

**Rationale:**
1. **Simplicity**: Avoids complex i18n routing patterns
2. **Next.js Standard**: Matches typical multi-region patterns
3. **Explicit**: Clear URL structure: `/categories/` vs `/en/categories/`
4. **Navigation**: Easy to build language switchers
5. **Caching**: Can set different cache strategies per-language
6. **SEO**: Clear hreflang relationships

### Proposed Structure
```
src/app/(public)/
  ├─ layout.tsx (shared: navbar, footer, structure)
  ├─ page.tsx (FR homepage)
  ├─ categories/
  │   ├─ page.tsx (FR category list)
  │   └─ [slug]/page.tsx (FR category detail)
  ├─ auteurs/
  │   └─ [id]/page.tsx (author detail, can show all languages or FR-only)
  └─ en/
      ├─ page.tsx (EN homepage / English selection)
      ├─ categories/
      │   ├─ page.tsx (EN category list)
      │   └─ [slug]/page.tsx (EN category detail)
      └─ auteurs/
          └─ [id]/page.tsx (EN author detail)
```

### Route URLs
```
FR:
  /                            (FR homepage)
  /categories                  (FR category list)
  /categories/politique        (FR category detail)
  /auteurs/author-id           (author detail - all languages)

EN:
  /en                          (EN homepage)
  /en/categories               (EN category list)
  /en/categories/politique     (EN category detail)
  /en/auteurs/author-id        (EN author detail)
```

### Why NOT use `(locale)` grouping
```
❌ NOT RECOMMENDED:
src/app/(public)/[locale]/
  ├─ layout.tsx
  ├─ page.tsx
  ├─ categories/[slug]/page.tsx
  ├─ auteurs/[id]/page.tsx

Problems:
- Shared layout but duplicated routes for FR vs EN
- Complex routing logic needed to handle "default" locale
- `/` serves both FR and EN (redirect logic needed)
- More abstraction overhead
```

---

## 8. EN Category Pages: Linking from EN Homepage

### Current EN Homepage (`/en`)
```typescript
// src/app/(public)/en/page.tsx
- Shows: English selection (4 featured EN articles)
- Has: Newsletter signup section
- Does NOT show: categories or author links
```

### Recommendation: Add Category Navigation Section

**Add to EN homepage:**

```tsx
<section className="mt-14 border-t-2 border-border-strong pt-5">
  <p className="section-kicker mb-2">Explore</p>
  <h2 className="font-headline text-3xl font-extrabold leading-tight text-foreground">
    Browse by category
  </h2>
  
  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {categories.map((cat) => (
      <Link 
        key={cat.id} 
        href={`/en/categories/${cat.slug}`}
        className="border border-border-subtle p-4 hover:bg-surface-newsprint"
      >
        <h3 className="font-headline font-bold text-foreground">
          {cat.name}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {cat.count || 0} articles
        </p>
      </Link>
    ))}
  </div>
</section>
```

**Implementation:**
```typescript
// src/lib/public-content.ts - NEW function

export async function getEnglishCategoryListing() {
  const rawCategories = await categoriesRepo.getCategories();
  const articles = await articlesRepo.getArticles({
    status: 'published',
    language: 'en',
    take: 500,
  });

  const categoriesWithCounts = rawCategories
    .filter((cat) => (cat.enabledLanguages as string[])?.includes('en') ?? false)
    .map((cat) => {
      const count = articles.filter(
        (a) => a.categoryId === cat.id
      ).length;
      return { ...normalizeCategory(cat), count };
    })
    .filter((cat) => cat.count > 0)
    .sort((a, b) => b.count - a.count);

  return categoriesWithCounts;
}
```

**On EN homepage:**
```tsx
const categories = await getEnglishCategoryListing();

return (
  <div>
    {/* ... existing hero + articles ... */}
    
    {categories.length > 0 && (
      <section className="mt-14 border-t-2 border-border-strong pt-5">
        {/* categories grid */}
      </section>
    )}
  </div>
);
```

---

## 9. SEO & Metadata for EN Pages

### Metadata Strategy

**EN Category Page:**
```typescript
// src/app/(public)/en/categories/[slug]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getEnglishCategoryContent(slug);
  if (!content) return {};

  return {
    title: `${content.category.name} | Le Relief - English`,
    description:
      content.category.description ||
      `English articles in the ${content.category.name} category from Le Relief.`,
    alternates: {
      canonical: `/en/categories/${slug}`,
      languages: {
        fr: `/categories/${slug}`,
        en: `/en/categories/${slug}`,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${siteConfig.url}/en/categories/${slug}`,
      siteName: 'Le Relief',
      title: `${content.category.name} | Le Relief`,
      description: content.category.description || '',
    },
  };
}
```

**EN Author Page:**
```typescript
// src/app/(public)/en/auteurs/[id]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const content = await getEnglishAuthorContent(id);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!author) return {};

  return {
    title: `${author.name} | Le Relief - English`,
    description:
      author.bio ||
      `English articles by ${author.name} on Le Relief.`,
    alternates: {
      canonical: `/en/auteurs/${id}`,
      languages: {
        fr: `/auteurs/${id}`,
        en: `/en/auteurs/${id}`,
      },
    },
    openGraph: {
      type: 'profile',
      locale: 'en_US',
      url: `${siteConfig.url}/en/auteurs/${id}`,
    },
  };
}
```

### hreflang & Alternate Links

**For FR category → EN equivalent:**
```html
<link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/categories/politique" />
<link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/categories/politique" />
<link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/categories/politique" />
```

**For EN category → FR equivalent:**
```html
<link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/categories/politique" />
<link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/categories/politique" />
<link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/categories/politique" />
```

### Locale Metadata
```typescript
export const metadata = {
  // For /en/* pages:
  openGraph: {
    locale: 'en_US',  // Not 'en' — use regional variant
  },
  // For /categories (FR):
  openGraph: {
    locale: 'fr_FR',  // French (Haiti)
  },
};
```

### Robots & Indexing
- ✅ Index all EN category pages (good content)
- ✅ Index all EN author pages with articles
- ❌ Block categories with 0 articles (add to robots.ts if needed)

---

## 10. Implementation Order & Files to Create/Modify

### Phase 3 Milestone: EN Category & Author Pages

#### Phase 3a: Foundation (Week 1-2)

**1. Schema Update: Enable Language Visibility on Categories**

Files to modify:
- [firestore.indexes.json](firestore.indexes.json) — add compound indexes
- Create: `scripts/migrate-categories-enable-languages.ts` — add `enabledLanguages: ['fr']` to all existing categories

**Change:**
```typescript
// types/category.ts
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  enabledLanguages: string[];  // NEW — default to ['fr']
  createdAt: Date;
  updatedAt: Date;
}
```

**Files to update:**
- [src/types/category.ts](src/types/category.ts) — add `enabledLanguages` field
- [src/lib/repositories/categories.ts](src/lib/repositories/categories.ts) — handle `enabledLanguages` in create/update

---

**2. New Public Content Functions**

Files to create/modify:
- [src/lib/public-content.ts](src/lib/public-content.ts) — add new functions:

```typescript
/**
 * Get category page content (EN or FR)
 */
export async function getCategoryPageContent(
  slug: string,
  language?: 'en' | 'fr'
) {
  const rawCategory = await categoriesRepo.findBySlug(slug);
  if (!rawCategory) return null;
  
  // Check language availability
  if (language && !((rawCategory.enabledLanguages as string[]) || ['fr']).includes(language)) {
    return null;
  }

  const category = normalizeCategory(rawCategory);
  if (!category) return null;

  const articles = await articlesRepo.getArticles({
    status: 'published',
    language: language || 'fr',
    categoryId: category.id,
    take: 11,
  });

  return {
    category: { ...category, count: articles.length },
    featured: articles[0] || null,
    articles: articles.slice(1),
  };
}

/**
 * Get author page content (EN or FR)
 */
export async function getAuthorPageContent(
  id: string,
  language?: 'en' | 'fr'
) {
  const rawAuthor = await usersRepo.getUser(id);
  if (!rawAuthor) return null;

  const articles = await articlesRepo.getArticles({
    status: 'published',
    language: language || 'fr',
    authorId: id,
    take: 12,
  });

  return {
    author: rawAuthor,
    articles: await hydrateArticles(articles),
  };
}

/**
 * Get EN-enabled categories with article counts
 */
export async function getEnglishCategoryListing() {
  const rawCategories = await categoriesRepo.getCategories();
  const articles = await articlesRepo.getArticles({
    status: 'published',
    language: 'en',
    take: 500,
  });

  const enCategories = rawCategories.filter(
    (cat) => (cat.enabledLanguages as string[])?.includes('en') ?? false
  );

  return enCategories
    .map((cat) => {
      const count = articles.filter((a) => a.categoryId === cat.id).length;
      return { ...normalizeCategory(cat), count };
    })
    .filter((cat) => cat.count > 0)
    .sort((a, b) => b.count - a.count);
}
```

---

#### Phase 3b: EN Category Pages (Week 2-3)

**3. Create EN Category Pages**

Files to create:
- [src/app/(public)/en/categories/page.tsx](src/app/(public)/en/categories/page.tsx) — EN category list
- [src/app/(public)/en/categories/[slug]/page.tsx](src/app/(public)/en/categories/[slug]/page.tsx) — EN category detail

**Implementation** (mirror FR with language parameter):

```typescript
// src/app/(public)/en/categories/[slug]/page.tsx

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import Breadcrumb from "@/components/public/Breadcrumb";
import { getCategoryPageContent } from "@/lib/public-content";

export const revalidate = 120;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getCategoryPageContent(slug, 'en');
  if (!content) return {};

  return {
    title: `${content.category.name} | Le Relief`,
    description:
      content.category.description ||
      `English articles in ${content.category.name} on Le Relief.`,
    alternates: {
      canonical: `/en/categories/${slug}`,
      languages: {
        fr: `/categories/${slug}`,
        en: `/en/categories/${slug}`,
      },
    },
    openGraph: {
      locale: 'en_US',
    },
  };
}

export default async function EnglishCategoryPage({ params }: Props) {
  const { slug } = await params;
  const content = await getCategoryPageContent(slug, 'en');
  if (!content) notFound();

  const { category, featured, articles } = content;

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <Breadcrumb
        crumbs={[
          { label: "Home", href: "/en" },
          { label: "Categories", href: "/en/categories" },
          { label: category.name },
        ]}
      />
      {/* ... rest mirrors FR page ... */}
    </div>
  );
}
```

**4. Update EN Homepage**

File to modify:
- [src/app/(public)/en/page.tsx](src/app/(public)/en/page.tsx) — add category section

Add before newsletter section:
```tsx
const categories = await getEnglishCategoryListing();

// In JSX:
{categories.length > 0 && (
  <section className="mt-14 border-t-2 border-border-strong pt-5">
    <p className="section-kicker mb-2">Explore</p>
    <h2 className="font-headline text-3xl font-extrabold leading-tight text-foreground">
      Browse by category
    </h2>
    <CategoryGrid categories={categories} href="/en/categories" />
  </section>
)}
```

---

#### Phase 3c: EN Author Pages (Week 3)

**5. Create EN Author Pages**

Files to create:
- [src/app/(public)/en/auteurs/[id]/page.tsx](src/app/(public)/en/auteurs/[id]/page.tsx) — EN author detail

Mirror [src/app/(public)/auteurs/[id]/page.tsx](src/app/(public)/auteurs/[id]/page.tsx) but add `language: 'en'` to article queries.

---

**6. Create EN Category Listing Page**

Files to create:
- [src/app/(public)/en/categories/page.tsx](src/app/(public)/en/categories/page.tsx)

Mirror [src/app/(public)/categories/page.tsx](src/app/(public)/categories/page.tsx) but show only EN-enabled categories.

---

#### Phase 3d: Sitemap & SEO (Week 4)

**7. Update Sitemap**

File to modify:
- [src/app/sitemap.ts](src/app/sitemap.ts) — add EN routes (see section 6)

**8. Update robots.ts**

File to modify:
- [src/app/robots.ts](src/app/robots.ts) — ensure EN pages are indexed

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/en/'],
        disallow: ['/dashboard', '/api'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

---

### File Change Summary

#### Create (New Files)
```
✅ src/app/(public)/en/categories/page.tsx
✅ src/app/(public)/en/categories/[slug]/page.tsx
✅ src/app/(public)/en/auteurs/[id]/page.tsx
✅ scripts/migrate-categories-enable-languages.ts
```

#### Modify (Existing Files)
```
⚠️  src/types/category.ts — add enabledLanguages field
⚠️  src/lib/repositories/categories.ts — handle enabledLanguages
⚠️  src/lib/public-content.ts — add new functions + update existing
⚠️  src/app/(public)/en/page.tsx — add category section
⚠️  src/app/sitemap.ts — add EN routes
⚠️  firestore.indexes.json — add compound indexes (if needed)
```

#### No Changes Needed
```
✓ src/app/(public)/categories/* — FR pages unchanged
✓ src/app/(public)/auteurs/* — shared author pages unchanged
✓ src/app/(public)/layout.tsx — shared nav/layout unchanged
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review current Firestore indexes (may need compound indexes for language filters)
- [ ] Coordinate with editorial team on which categories to enable for EN in Phase 3a
- [ ] Decide on category names (FR names vs. translation—recommend FR for Phase 3)
- [ ] Test article filtering in dev environment

### Phase 3a: Foundation
- [ ] Update Category type with `enabledLanguages: string[]`
- [ ] Update category repository (create/update methods)
- [ ] Create migration script to add `enabledLanguages: ['fr']` to all existing categories
- [ ] Add new public-content functions (getCategoryPageContent + language param, getEnglishCategoryListing, etc.)
- [ ] Add Firestore indexes if needed

### Phase 3b: EN Category Pages
- [ ] Create `/en/categories/[slug]/page.tsx`
- [ ] Create `/en/categories/page.tsx`
- [ ] Test EN category page filtering (language + category)
- [ ] Update `/en` homepage with category section
- [ ] Verify Breadcrumb uses correct EN labels

### Phase 3c: EN Author Pages
- [ ] Create `/en/auteurs/[id]/page.tsx`
- [ ] Test EN author page filtering (language + author)
- [ ] Verify author pages work for authors with and without EN articles

### Phase 3d: SEO & Sitemap
- [ ] Update sitemap.ts to include EN routes
- [ ] Add hreflang links in metadata
- [ ] Verify OpenGraph locale is set correctly
- [ ] Test robots.txt allows /en/* paths

### Testing
- [ ] Empty state pages (category/author with 0 EN articles)
- [ ] Pagination on category pages (load more functionality)
- [ ] Language-specific article filtering
- [ ] Breadcrumb navigation
- [ ] Internal linking consistency (category cards, author links)
- [ ] SEO metadata in browser DevTools
- [ ] Sitemap XML includes all EN routes
- [ ] hreflang alternate links correct

---

## Future Considerations (Phase 4+)

### Category Translation System
- Add `nameEn` and `descriptionEn` fields to Category
- Create admin UI for category translation
- Route strategy for `/en/categories/politics` vs `/en/categories/politique`

### Author Localization
- Add `bioEn` field to User
- Author bios can be language-specific
- Future: author landing pages showing only "home language" articles

### Advanced Curation
- Pin featured articles per category/language
- Create category-specific article sorting
- Hero image per category
- Category "About" section with rich content

### Analytics
- Track EN category page views separately
- Track language breakdown per category
- Author article output by language

---

## Questions & Decisions Log

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Categories: auto-generated or curated? | **Curated** (enabledLanguages) | Quality, UX clarity, SEO value |
| 2 | EN category page template? | **Same as FR + language filter** | Consistent UX, content-driven |
| 3 | Category names: translate or FR? | **FR names (Phase 3), translate later** | No schema change, brand identity, simpler |
| 4 | EN author pages: same author or separate? | **Same author, language-aware filter** | Single identity, natural growth |
| 5 | Filter logic for EN pages? | **language='en' + category/author ID** | Standard, composable, Firestore-friendly |
| 6 | Sitemap: include EN routes? | **Yes, filtered to enabled categories/EN authors** | SEO, crawlability, no thin pages |
| 7 | Routing: separate trees or i18n grouping? | **Separate trees** (`/en/categories` not `/[locale]/categories`) | Simplicity, standard pattern, clear URLs |
| 8 | Link EN categories from EN homepage? | **Yes, add category grid** | Navigation, discovery, UX completeness |
| 9 | SEO metadata per language? | **Yes, language-specific alternates + hreflang** | SEO best practices, clear canonical |
| 10 | Files to create/modify + order? | **See section 10 + checklist** | Phased, testable, clear dependencies |

---

## Appendix: Code Examples

### Example: Updated getCategoryPageContent

```typescript
// src/lib/public-content.ts

export async function getCategoryPageContent(
  slug: string,
  language: 'en' | 'fr' = 'fr'
) {
  const rawCategory = await categoriesRepo.findBySlug(slug);
  if (!rawCategory) return null;

  // Check if category is enabled for this language
  const enabledLanguages = (rawCategory.enabledLanguages as string[]) || ['fr'];
  if (!enabledLanguages.includes(language)) {
    return null;
  }

  const category = normalizeCategory(rawCategory);
  if (!category) return null;

  let articles: PublicArticle[] = [];
  try {
    const result = await articlesRepo.getArticles({
      status: 'published',
      language: language,
      categoryId: category.id,
      take: 11,
    });
    articles = await hydrateArticles(result.articles);
  } catch {
    articles = [];
  }

  return {
    category: {
      ...category,
      count: articles.length,
    },
    featured: articles[0] || null,
    articles: articles.slice(1),
  };
}
```

### Example: Updated getAuthorPageContent

```typescript
// src/lib/public-content.ts

export async function getAuthorPageContent(
  id: string,
  language: 'en' | 'fr' = 'fr'
) {
  const rawAuthor = await usersRepo.getUser(id);
  if (!rawAuthor) return null;

  let articles: PublicArticle[] = [];
  try {
    const result = await articlesRepo.getArticles({
      status: 'published',
      language: language,
      authorId: id,
      take: 12,
    });
    articles = await hydrateArticles(result.articles);
  } catch {
    articles = [];
  }

  return {
    author: rawAuthor,
    articles,
  };
}
```

### Example: EN Category Migration Script

```typescript
// scripts/migrate-categories-enable-languages.ts

import * as categoriesRepo from '@/lib/repositories/categories';

async function migrate() {
  const categories = await categoriesRepo.getCategories();
  
  for (const category of categories) {
    await categoriesRepo.updateCategory(category.id as string, {
      enabledLanguages: ['fr'], // Default all to FR
    });
  }
  
  console.log(`✅ Migrated ${categories.length} categories`);
}

migrate().catch(console.error);
```

---

## Sign-Off

**Document Version:** 1.0  
**Research Completed:** April 21, 2026  
**Status:** Ready for Implementation Phase  
**Next Steps:** Approval → Phase 3a Foundation work
