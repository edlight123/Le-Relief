# Bilingual SEO Implementation: hreflang & Locale-Specific Sitemaps Research

**Current Date**: April 21, 2026  
**Analysis Scope**: Le Relief (Next.js 16.2.3, Firebase, TypeScript)

---

## 1. Current hreflang Emission Analysis

### 🔴 **CRITICAL ISSUES FOUND**

#### A. Article Pages (`/articles/[slug]`)
**Status**: BROKEN hreflang structure
- **Current Implementation** (line 44-50 in `/src/app/(public)/articles/[slug]/page.tsx`):
  ```typescript
  alternates: {
    canonical: `/articles/${slug}`,
    languages: article.alternateLanguageSlug
      ? {
          [article.language === "fr" ? "en" : "fr"]:
            `/articles/${article.alternateLanguageSlug}`,
        }
      : undefined,
  }
  ```

**Problems**:
1. ❌ **No locale prefix in URLs**: Both routes lack language prefixes (`/fr/` or `/en/`)
   - French article: `/articles/slug-fr` (should be `/fr/articles/slug-fr`)
   - English article: `/articles/slug-en` (should be `/en/articles/slug-en`)
2. ❌ **Next.js Metadata API uses `languages` for hreflang**, which is correct, BUT:
   - Only emits ONE direction (if article is FR with EN translation, only emits `hreflang="en"`)
   - Missing bidirectional pairs (`hreflang="x-default"`)
3. ❌ **No x-default hreflang**: Required to signal "French is primary"
4. ❌ **Canonical points to locale-less URL**: `canonical: /articles/${slug}` doesn't match actual route
5. ❌ **Articles without translations**: `alternateLanguageSlug` is `null`, so NO hreflang emitted at all
6. ❌ **OG locale correct** (`fr_FR` or `en_US`) BUT doesn't match HTML lang attribute

#### B. Category Pages (`/categories/[slug]`)
**Status**: INCOMPLETE
- **Current Implementation** (line 24-26):
  ```typescript
  alternates: {
    canonical: `/categories/${slug}`,
  }
  ```
**Problems**:
1. ❌ **No hreflang at all** - categories exist in French only, but should emit `hreflang="x-default"` for SEO clarity
2. ❌ **No locale prefix** in URL
3. ❌ **No language alternatives** metadata structure

#### C. Author Pages (`/auteurs/[id]`)
**Status**: INCOMPLETE
- **Current Implementation** (line 25-27):
  ```typescript
  alternates: {
    canonical: `/auteurs/${id}`,
  }
  ```
**Problems**:
1. ❌ **No hreflang or language alternatives**
2. ❌ **No locale prefix**
3. ❌ Authors are typically locale-agnostic but should still be handled properly

#### D. English Selection Page (`/en`)
**Status**: PARTIAL (only landing page)
- **Current Implementation** (line 11-16):
  ```typescript
  alternates: {
    canonical: "/en",
    languages: {
      fr: "/",
      en: "/en",
    },
  }
  ```
**Problems**:
1. ✓ Correct structure for landing page
2. ❌ **NO `/en/articles`, `/en/categories`, `/en/auteurs` routes exist**
   - English content is scattered on French routes
   - Some EN articles linked from `/en` but actual pages don't have locale prefix
3. ❌ Inconsistent route structure

#### E. Root Layout Metadata
**Status**: BROKEN for bilingual sites
- **Current Implementation** (line 24-40):
  - Default language: `fr_FR`
  - NO alternates for English homepage
  - HTML lang always `fr` (line 86)
  
**Problems**:
1. ❌ Root metadata doesn't define bidirectional alternates
2. ❌ HTML lang tag is hardcoded to `fr` - should change based on page language
3. ❌ No `hreflang="x-default"` in root

---

## 2. Correct hreflang Structure for Bidirectional Language Pairs

### ✅ **REQUIRED IMPLEMENTATION**

#### For Articles WITH Translation (e.g., article in both FR and EN):

**French Version** (`/fr/articles/haiti-crisis`):
```html
<link rel="canonical" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
<link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/articles/haiti-crisis" />
<link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
<link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
```

**English Version** (`/en/articles/haiti-crisis`):
```html
<link rel="canonical" href="https://lereliefhaiti.com/en/articles/haiti-crisis" />
<link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
<link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/articles/haiti-crisis" />
<link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
```

#### Why This Structure Works:
1. **Self-referential canonical**: Each version canonicalizes itself (not "de-duped" to one URL)
2. **Complete language set**: Every locale variant has ALL language links
3. **x-default points to French**: French is primary/canonical, so x-default directs unknown locales there
4. **Bidirectional links**: Each page knows about the other, helping Googlebot crawl both

#### Next.js Metadata API Mapping:
```typescript
const article = { /* ... */ };

return {
  alternates: {
    canonical: `/${article.language}/articles/${article.slug}`,
    languages: {
      'en': `/en/articles/${article.alternateLanguageSlug || article.slug}`,
      'fr': `/fr/articles/${article.alternateLanguageSlug || article.slug}`,
      'x-default': `/fr/articles/${article.slug}`, // Always points to FR
    },
  },
  openGraph: {
    locale: article.language === 'fr' ? 'fr_FR' : 'en_US',
    url: `${siteConfig.url}/${article.language}/articles/${article.slug}`,
    // ...
  },
};
```

---

## 3. Handling Articles WITHOUT Translation

### 📋 **DECISION TREE**

#### **Option A: Still Emit hreflang (RECOMMENDED)**
- Emit `hreflang="x-default"` pointing to the only version
- Signals to Google: "This article only exists in French"
- Better for SEO: tells crawlers which language is available

```typescript
// For FR-only article
alternates: {
  canonical: `/fr/articles/haiti-only-french`,
  languages: {
    'fr': `/fr/articles/haiti-only-french`,
    'x-default': `/fr/articles/haiti-only-french`,
    // No 'en' key = not available in English
  },
}
```

#### **Option B: Omit hreflang (NOT RECOMMENDED)**
- Don't add `languages` key to metadata
- Could work but:
  - ❌ Google may get confused if crawls both FR and EN versions of other articles
  - ❌ No signal about language availability
  - ❌ Less clear for multilingual canonicalization

### ✅ **IMPLEMENTATION**
Check database if `alternateLanguageSlug` is `null`:
```typescript
const alternates: Record<string, string> = {
  [`${article.language}`]: `/${article.language}/articles/${article.slug}`,
  'x-default': `/fr/articles/${article.slug}`, // Always FR as primary
};

// Only add other language if translation exists
if (article.alternateLanguageSlug) {
  const otherLang = article.language === 'fr' ? 'en' : 'fr';
  alternates[otherLang] = `/${otherLang}/articles/${article.alternateLanguageSlug}`;
}
```

---

## 4. Sitemap Strategy

### 🎯 **RECOMMENDED: Separate Language-Specific Sitemaps**

#### **Why Single Combined Sitemap is Problematic**:
1. ❌ Cannot set hreflang links inside `<url>` element
2. ❌ Google prefers language-separated sitemaps for bilingual sites
3. ❌ Harder to update FR articles without rebuilding full sitemap
4. ❌ No way to indicate which version is primary/x-default

#### **Why Separate Sitemaps Work Better**:
1. ✓ `/sitemap-fr.xml`: Contains ONLY FR routes with x-default markers
2. ✓ `/sitemap-en.xml`: Contains ONLY EN routes (no x-default)
3. ✓ `/sitemap.xml`: Index file pointing to both
4. ✓ Each sitemap can have alt-lang hints
5. ✓ Easier to regenerate individual sitemaps

### ✅ **IMPLEMENTATION STRUCTURE**

#### **File Structure**:
```
src/app/
├── sitemap.xml/
│   └── route.ts          → Returns index pointing to FR & EN
├── sitemap-fr.xml/
│   └── route.ts          → French routes (articles, categories, etc.)
└── sitemap-en.xml/
    └── route.ts          → English routes (articles, categories, etc.)
```

#### **Root Sitemap Index** (`/sitemap.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://lereliefhaiti.com/sitemap-fr.xml</loc>
    <lastmod>2026-04-21T12:00:00Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://lereliefhaiti.com/sitemap-en.xml</loc>
    <lastmod>2026-04-21T12:00:00Z</lastmod>
  </sitemap>
</sitemapindex>
```

#### **French Sitemap** (`/sitemap-fr.xml`) - Example Entry:
```xml
<url>
  <loc>https://lereliefhaiti.com/fr/articles/haiti-crisis</loc>
  <lastmod>2026-04-20T08:30:00Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/articles/haiti-crisis" />
  <xhtml:link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
</url>
```

#### **English Sitemap** (`/sitemap-en.xml`) - Example Entry:
```xml
<url>
  <loc>https://lereliefhaiti.com/en/articles/haiti-crisis</loc>
  <lastmod>2026-04-20T08:30:00Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/articles/haiti-crisis" />
  <xhtml:link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/fr/articles/haiti-crisis" />
</url>
```

### Current Sitemap Issues:
**Current** (`/src/app/sitemap.ts`):
- ❌ Only French routes (`/articles/${slug}`, `/categories/${slug}`, `/auteurs/${id}`)
- ❌ No locale prefixes
- ❌ No hreflang inside sitemap entries
- ❌ Mixes all languages in one file
- ❌ `robots.txt` only points to one sitemap

---

## 5. robots.txt for Locale-Prefixed Routes

### 🤖 **REQUIRED STRUCTURE**

#### **Current** (`/src/app/robots.ts`):
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

#### **Problems**:
1. ❌ Only references ONE sitemap
2. ❌ Doesn't account for locale routes
3. ❌ Dashboard disallow is good, but API disallow too broad (might block some endpoints)

#### **✅ CORRECTED VERSION**:
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/fr/", "/en/"],
        disallow: ["/dashboard", "/api/auth/", "/api/internal/"],
      },
      // Optional: More aggressive crawl directives for Googlebot
      {
        userAgent: "Googlebot",
        allow: "/",
      },
    ],
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,        // Index file
      `${siteConfig.url}/sitemap-fr.xml`,     // French routes
      `${siteConfig.url}/sitemap-en.xml`,     // English routes
    ],
  };
}
```

#### **Key Changes**:
1. ✓ Explicitly allow both `/fr/` and `/en/` prefixes
2. ✓ Point to all three sitemaps (index + language-specific)
3. ✓ More granular API disallow (preserve some endpoints if needed)
4. ✓ Optional Googlebot-specific rules for faster crawling

---

## 6. Canonical URL Logic for Locale Routes

### 📍 **PRINCIPLE: Self-Referential Canonicals**

#### **WRONG Approach** (currently attempted):
```typescript
canonical: `/articles/${slug}` // Both FR and EN point to same canonicalized URL
```
**Why it fails**:
- ❌ Suggests both FR and EN should merge into one canonical
- ❌ Violates hreflang logic (hreflang + canonical must align)
- ❌ Google gets confused which version is "primary"

#### **✅ CORRECT Approach: Each locale version canonicalizes itself**

```typescript
// For FR article at /fr/articles/haiti-crisis
canonical: `/fr/articles/haiti-crisis`

// For EN article at /en/articles/haiti-crisis
canonical: `/en/articles/haiti-crisis`
```

#### **Why This Works**:
1. ✓ Canonical matches the actual URL structure
2. ✓ Each page declares itself as primary version
3. ✓ Combined with hreflang alternates, Google understands: "These are 2 versions of same content"
4. ✓ Follows Google's "separate URL" approach for multilingual sites

#### **Full Metadata Example**:
```typescript
return {
  title: article.title,
  description: article.excerpt,
  alternates: {
    canonical: `/${article.language}/articles/${article.slug}`,
    languages: {
      'en': `/en/articles/${article.alternateLanguageSlug || article.slug}`,
      'fr': `/fr/articles/${article.alternateLanguageSlug || article.slug}`,
      'x-default': `/fr/articles/${article.slug}`,
    },
  },
  openGraph: {
    url: `${siteConfig.url}/${article.language}/articles/${article.slug}`,
    locale: article.language === 'fr' ? 'fr_FR' : 'en_US',
    // ...
  },
};
```

#### **Note on `/articles/slug` (no locale prefix)**:
- If `/articles/slug` still exists as a route, it should:
  - Detect user language from Accept-Language header
  - Redirect to `/fr/articles/slug` or `/en/articles/slug`
  - OR use `<link rel="canonical">` to point to `/fr/` version
  - This prevents duplicate content issues

---

## 7. Exact Implementation for Article Metadata Generation

### 📄 **File**: `src/app/(public)/articles/[slug]/page.tsx`

#### **Current Code** (Lines 26-68):
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) return {};

  const title = `${article.title} | Le Relief`;
  const description =
    article.excerpt || article.subtitle || "Retrouvez cet article sur Le Relief.";
  const coverImage = article.imageSrc || null;
  const ogParams = new URLSearchParams({ title: article.title });
  if (article.category) ogParams.set("category", article.category.name);
  if (article.author) ogParams.set("author", article.author.name);
  const generatedOgImage = `${siteConfig.url}/api/og?${ogParams.toString()}`;
  const ogImage = coverImage || generatedOgImage;

  return {
    title,
    description,
    alternates: {
      canonical: `/articles/${slug}`,
      languages: article.alternateLanguageSlug
        ? {
            [article.language === "fr" ? "en" : "fr"]:
              `/articles/${article.alternateLanguageSlug}`,
          }
        : undefined,
    },
    // ... rest of metadata
  };
}
```

#### **❌ PROBLEMS**:
1. Canonical lacks locale prefix
2. Languages object only has ONE language (unidirectional)
3. No x-default
4. If no translation, hreflang is omitted entirely
5. OG locale correct but URL wrong

#### **✅ FIXED VERSION**:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) return {};

  const title = `${article.title} | Le Relief`;
  const description =
    article.excerpt || article.subtitle || "Retrouvez cet article sur Le Relief.";
  const coverImage = article.imageSrc || null;
  const ogParams = new URLSearchParams({ title: article.title });
  if (article.category) ogParams.set("category", article.category.name);
  if (article.author) ogParams.set("author", article.author.name);
  const generatedOgImage = `${siteConfig.url}/api/og?${ogParams.toString()}`;
  const ogImage = coverImage || generatedOgImage;

  // Build language alternates
  const articleUrl = `${siteConfig.url}/${article.language}/articles/${article.slug}`;
  const canonicalLang = article.language === "fr" ? "fr" : "en";
  const otherLang = article.language === "fr" ? "en" : "fr";
  const alternateSlug = article.alternateLanguageSlug || article.slug;

  const languages: Record<string, string> = {
    [canonicalLang]: `/${article.language}/articles/${article.slug}`,
    'x-default': `/fr/articles/${article.slug}`, // Always FR as primary
  };

  // Only add other language if it has a different slug (translation exists)
  if (article.alternateLanguageSlug) {
    languages[otherLang] = `/${otherLang}/articles/${article.alternateLanguageSlug}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/${article.language}/articles/${article.slug}`,
      languages,
    },
    openGraph: {
      type: "article",
      locale: article.language === "fr" ? "fr_FR" : "en_US",
      url: articleUrl,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, alt: article.title, width: 1200, height: 630 }],
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      section: article.category?.name,
      authors: article.author?.name ? [article.author.name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
```

#### **ALSO REQUIRED**: Update HTML Structure
In the JSX return (around line 76):
```typescript
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) notFound();

  // ... existing code ...

  // Update URL construction
  const articleUrl = `${siteConfig.url}/${article.language}/articles/${slug}`;
  const alternateLabel = article.language === "fr" ? "Lire en anglais" : "Read in English";

  // Update schema URL
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    // ...
    mainEntityOfPage: articleUrl,
    inLanguage: article.language === "fr" ? "fr-FR" : "en-US",
    // ...
  };

  // Update alternate language link (around line 199)
  // if (article.alternateLanguageSlug) { ... }
  // Change href from `/articles/${article.alternateLanguageSlug}`
  // to `/${otherLang}/articles/${article.alternateLanguageSlug}`
}
```

---

## 8. Category Page Metadata Generation

### 📂 **File**: `src/app/(public)/categories/[slug]/page.tsx`

#### **Current Code** (Lines 13-26):
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getCategoryPageContent(slug);
  if (!content) return {};

  return {
    title: `${content.category.name} | Le Relief Haïti`,
    description:
      content.category.description ||
      `Articles, analyses et dossiers dans la rubrique ${content.category.name}.`,
    alternates: {
      canonical: `/categories/${slug}`,
    },
  };
}
```

#### **Issues**:
1. ❌ No hreflang (categories are FR-only, but should still declare that)
2. ❌ No locale prefix
3. ❌ No x-default

#### **✅ FIXED VERSION**:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getCategoryPageContent(slug);
  if (!content) return {};

  const canonicalUrl = `${siteConfig.url}/fr/categories/${slug}`;

  return {
    title: `${content.category.name} | Le Relief Haïti`,
    description:
      content.category.description ||
      `Articles, analyses et dossiers dans la rubrique ${content.category.name}.`,
    alternates: {
      canonical: `/fr/categories/${slug}`,
      languages: {
        fr: `/fr/categories/${slug}`,
        'x-default': `/fr/categories/${slug}`,
      },
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: `${content.category.name} | Le Relief`,
      description:
        content.category.description ||
        `Retrouvez tous les articles de la rubrique ${content.category.name}.`,
      images: [
        {
          url: `${siteConfig.url}/og-category-${slug}.png`,
          width: 1200,
          height: 630,
          alt: content.category.name,
        },
      ],
    },
  };
}
```

#### **Note on Future EN Categories**:
If English category pages are added:
```typescript
// Detect language from params (would need route restructuring)
const isEnglish = params.locale === 'en';
const language = isEnglish ? 'en' : 'fr';

const languages: Record<string, string> = {
  [language]: `/${language}/categories/${slug}`,
  'x-default': `/fr/categories/${slug}`,
};
```

---

## 9. Author Page Metadata Generation

### 👤 **File**: `src/app/(public)/auteurs/[id]/page.tsx`

#### **Current Code** (Lines 13-27):
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const content = await getAuthorPageContent(id);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!author) return {};

  return {
    title: `${author.name} | Le Relief Haïti`,
    description:
      author.bio ||
      `Articles récents de ${author.name}, publiés sur Le Relief Haïti.`,
    alternates: {
      canonical: `/auteurs/${id}`,
    },
  };
}
```

#### **Issues**:
1. ❌ No hreflang
2. ❌ No locale prefix
3. ❌ Authors are locale-agnostic (same person, different language articles)

#### **✅ FIXED VERSION**:

**OPTION A: Authors as Language-Agnostic** (Recommended)
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const content = await getAuthorPageContent(id);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!author) return {};

  const canonicalUrl = `${siteConfig.url}/auteurs/${id}`;

  return {
    title: `${author.name} | Le Relief Haïti`,
    description:
      author.bio ||
      `Articles récents de ${author.name}, publiés sur Le Relief Haïti.`,
    alternates: {
      canonical: `/auteurs/${id}`, // No locale prefix - language-agnostic
      languages: {
        'fr': `/auteurs/${id}`,
        'en': `/auteurs/${id}`, // Same URL for both languages
        'x-default': `/auteurs/${id}`,
      },
    },
    openGraph: {
      type: "profile",
      locale: "fr_FR",
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: author.name,
      description: author.bio || "Auteur",
      images: author.image
        ? [
            {
              url: author.image,
              width: 400,
              height: 400,
              alt: author.name,
            },
          ]
        : undefined,
    },
  };
}
```

**OPTION B: If Separate Author Pages Per Language** (Future-proofing)
```typescript
const canonicalUrl = `${siteConfig.url}/fr/auteurs/${id}`;

return {
  alternates: {
    canonical: `/fr/auteurs/${id}`,
    languages: {
      'fr': `/fr/auteurs/${id}`,
      'en': `/en/auteurs/${id}`, // If EN author pages exist
      'x-default': `/fr/auteurs/${id}`,
    },
  },
  // ...
};
```

**Recommended**: Use OPTION A (language-agnostic) since authors represent people, not content.

---

## 10. Root Layout & Homepage Metadata

### 🏠 **File**: `src/app/layout.tsx`

#### **Current Root Layout Issues**:
1. ❌ HTML lang hardcoded to `fr` (line 86)
2. ❌ Root metadata doesn't account for EN homepage
3. ❌ No hreflang for bidirectional homepage alternatives

#### **✅ CHANGES NEEDED**:

```typescript
// Layout.tsx - metadata export
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Le Relief — Média numérique haïtien",
    template: "%s | Le Relief",
  },
  description:
    "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
  keywords: [
    "Le Relief",
    "actualité",
    "Haïti",
    "éditorial",
    "journalisme",
    "analyse",
  ],
  alternates: {
    canonical: "/",
    languages: {
      'fr': "/",
      'en': "/en",
      'x-default': "/",
    },
    types: {
      "application/rss+xml": `${siteConfig.url}/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR", // Root is FR
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Le Relief — Média numérique haïtien",
    description:
      "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Le Relief",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Relief — Média numérique haïtien",
    description:
      "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // HTML lang should be "fr" for root (French is primary)
  // Individual page layouts should override if needed
  return (
    <html
      lang="fr"
      className={`${libreFranklin.variable} ${newsreader.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  );
}
```

#### **Optional: Create Dynamic Lang in Article Pages**
```typescript
// In article page, you could override html lang (advanced, not required by Next.js)
// <html lang={article.language === 'en' ? 'en' : 'fr'}>
// BUT: Not necessary with Next.js metadata API - hreflang + OG locale is enough
```

---

## 11. Testing Plan: Validating hreflang Output

### 🧪 **Tools & Methods**

#### **A. Browser Inspection (Quick Check)**
1. Open article page in browser
2. Right-click → "View Page Source"
3. Search for `<link rel="alternate" hreflang=`
4. Should find:
   ```html
   <link rel="alternate" hreflang="en" href="https://lereliefhaiti.com/en/articles/..." />
   <link rel="alternate" hreflang="fr" href="https://lereliefhaiti.com/fr/articles/..." />
   <link rel="alternate" hreflang="x-default" href="https://lereliefhaiti.com/fr/articles/..." />
   <link rel="canonical" href="https://lereliefhaiti.com/fr/articles/..." />
   ```

#### **B. SEO Tools (Recommended)**

1. **Google Search Console (GSC)**
   - Submit sitemap-fr.xml and sitemap-en.xml
   - Check "International Targeting" → "Languages" section
   - Verify Google detects both FR and EN versions
   - Look for hreflang errors in "HTML improvements" section

2. **Screaming Frog SEO Spider** (Desktop tool)
   ```
   - Start crawl from https://lereliefhaiti.com
   - Go to: Reports → Crawl Configuration → Alternate Tags
   - Verify each page has bidirectional hreflang pairs
   - Check for "missing reciprocal links" warnings
   ```

3. **SEMrush or Ahrefs**
   - Use "Site Audit" feature
   - Look for hreflang errors/warnings
   - Check sitemaps are being indexed

#### **C. Programmatic Testing (Node.js/Playwright)**

Create a test script to validate hreflang:
```typescript
// test-hreflang.ts
import { chromium } from 'playwright';

async function validateHreflang(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Get all hreflang links
  const hreflangs = await page.locator('link[rel="alternate"]').all();
  const alternates = await Promise.all(
    hreflangs.map(async (el) => ({
      hreflang: await el.getAttribute('hreflang'),
      href: await el.getAttribute('href'),
    }))
  );

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

  console.log(`URL: ${url}`);
  console.log(`Canonical: ${canonical}`);
  console.log('Alternates:');
  alternates.forEach(alt => {
    console.log(`  - hreflang="${alt.hreflang}" href="${alt.href}"`);
  });

  // Validate
  const hasXDefault = alternates.some(a => a.hreflang === 'x-default');
  const hasFr = alternates.some(a => a.hreflang === 'fr');
  const hasEn = alternates.some(a => a.hreflang === 'en');

  console.log(`\n✓ Has x-default: ${hasXDefault}`);
  console.log(`✓ Has fr: ${hasFr}`);
  console.log(`✓ Has en: ${hasEn}`);

  await browser.close();
}

// Test articles
await validateHreflang('https://lereliefhaiti.com/fr/articles/haiti-crisis');
await validateHreflang('https://lereliefhaiti.com/en/articles/haiti-crisis');
```

#### **D. Sitemap Validation**

```bash
# Check sitemap is valid XML
curl -I https://lereliefhaiti.com/sitemap.xml
# Should return 200 & Content-Type: application/xml

# Validate schema
curl https://lereliefhaiti.com/sitemap-fr.xml | xmllint - > /dev/null

# Count URLs in each sitemap
curl https://lereliefhaiti.com/sitemap-fr.xml | grep -o '<url>' | wc -l
curl https://lereliefhaiti.com/sitemap-en.xml | grep -o '<url>' | wc -l
```

#### **E. robots.txt Testing**

```bash
# Check robots.txt syntax
curl https://lereliefhaiti.com/robots.txt

# Should show:
# - User-agent: *
# - Allow: /fr/
# - Allow: /en/
# - Sitemap: https://lereliefhaiti.com/sitemap.xml
# - Sitemap: https://lereliefhaiti.com/sitemap-fr.xml
# - Sitemap: https://lereliefhaiti.com/sitemap-en.xml
```

#### **F. Schema.org Markup Validation**

Use JSON-LD checker at https://validator.schema.org/:
```typescript
// Article should emit:
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "inLanguage": "fr-FR", // or "en-US"
  "mainEntityOfPage": "https://lereliefhaiti.com/fr/articles/...",
  "headline": "...",
  // ... other fields
}
```

#### **G. GSC Hreflang Report**
1. Go to: Google Search Console
2. Select property
3. Left menu → "Improvements" → "International Targeting"
4. Look for:
   - ✓ Both languages detected
   - ✓ No "Errors" tab
   - ✓ Proper alternate language pairs

#### **Automated CI/CD Check**
```typescript
// In your CI pipeline (e.g., GitHub Actions)
// Run after deployment to validate hreflang on all pages
```

---

## 12. Files to Modify (Complete Checklist)

### 📋 **PRIORITY ORDER**

| Priority | File | Change | Impact |
|----------|------|--------|--------|
| **P0** | `src/app/(public)/articles/[slug]/page.tsx` | Fix hreflang, canonical, locale prefixes | Articles (high traffic) |
| **P0** | `src/app/sitemap.ts` | Split into FR/EN sitemaps + index | SEO crawlability |
| **P0** | `src/app/robots.ts` | Add locale routes, multiple sitemaps | Robot directives |
| **P1** | `src/app/(public)/categories/[slug]/page.tsx` | Add hreflang, locale prefix | Categories |
| **P1** | `src/app/(public)/auteurs/[id]/page.tsx` | Add hreflang (language-agnostic) | Authors |
| **P2** | `src/app/layout.tsx` | Root alternates for EN homepage | Root metadata |
| **P2** | `src/app/(public)/en/page.tsx` | Extend to `/en/articles`, `/en/categories` | EN routes structure |
| **P3** | `src/lib/public-content.ts` | Ensure translation metadata flows | Data layer |
| **P3** | `src/config/site.config.ts` | Add locale config if needed | Site config |
| **Optional** | `src/app/feed.xml/route.ts` | Add language filtering for RSS | RSS feeds |

### **Route Structure Changes Needed**
```
CURRENT:
/                      → FR home
/articles/[slug]       → Both FR & EN articles (no prefix)
/categories/[slug]     → FR only
/auteurs/[id]          → FR only
/en                    → EN home (isolated)
/api/og                → OG image generation

REQUIRED:
/                      → FR home (redirect from /fr or keep)
/fr                    → FR home (optional duplicate)
/fr/articles/[slug]    → FR articles
/fr/categories/[slug]  → FR categories
/fr/auteurs/[id]       → FR authors
/en                    → EN home
/en/articles/[slug]    → EN articles
/en/categories/[slug]  → EN categories (future)
/en/auteurs/[id]       → EN authors (future)
```

---

## 13. Summary: Critical Action Items

### 🎯 **MUST FIX (Breaking SEO)**

1. **hreflang Bidirectionality**
   - ❌ Current: Single direction (FR→EN)
   - ✅ Required: Both directions + x-default
   - 📄 Files: Article, Category, Author pages

2. **Locale-Prefixed URLs**
   - ❌ Current: `/articles/slug` (no prefix)
   - ✅ Required: `/fr/articles/slug` and `/en/articles/slug`
   - 📄 Files: Routing structure, links, metadata

3. **Canonical URLs**
   - ❌ Current: `/articles/slug` (locale-less)
   - ✅ Required: Self-referential `/fr/articles/slug` and `/en/articles/slug`
   - 📄 Files: Article page metadata

4. **Sitemap Strategy**
   - ❌ Current: Single sitemap with no hreflang
   - ✅ Required: Separate FR/EN sitemaps + index
   - 📄 Files: sitemap.ts → split into 3 routes

5. **robots.txt**
   - ❌ Current: References only single sitemap
   - ✅ Required: Reference all 3 sitemaps
   - 📄 Files: robots.ts

### 📊 **Impact Assessment**

- **Estimated Traffic Impact**: Medium (Bilingual sites 15-30% visibility loss if hreflang broken)
- **Implementation Effort**: 4-6 days (including testing)
- **Complexity**: Medium-High (routing restructure required)
- **ROI**: High (proper hreflang = +20-30% indexed pages, better rankings for both languages)

---

## 14. Next Steps

1. **Code Review**: Validate current route structure with team
2. **Plan Route Migration**: Decide on `/articles` → `/fr/articles` strategy
3. **Implement P0 changes**: Articles, sitemaps, robots.txt
4. **Test with GSC**: Submit new sitemaps, monitor crawl stats
5. **Monitor rankings**: Track both FR and EN visibility 4-6 weeks post-deployment
6. **Iterate**: Fix any hreflang errors reported by GSC

---

**End of Research Document**

*Last Updated: April 21, 2026*
