/**
 * Caching & Revalidation Strategy for Le Relief
 * 
 * ISR (Incremental Static Regeneration) configuration
 * Balances between freshness and performance
 * 
 * Current configuration:
 * - Homepage: 60s (fast updates, high traffic)
 * - Article pages: 300s (5 min, editorial updates less frequent)
 * - Category pages: 120s (2 min, moderate update frequency)
 * - Author pages: 300s (5 min, rarely updated)
 * - Search pages: 0s (server-only, no static generation)
 */

// ============================================================================
// REVALIDATION STRATEGY
// ============================================================================

/**
 * Homepage revalidation: 60 seconds
 * 
 * Path: src/app/(public)/(locale)/[locale]/page.tsx
 * Path: src/app/(public)/page.tsx
 * Path: src/app/(public)/en/page.tsx
 * 
 * Reasoning:
 * - High traffic page (most users see this first)
 * - May feature latest articles
 * - 60s allows fresh content while caching most requests
 * - Prevents thundering herd on regeneration
 */
export const HOMEPAGE_REVALIDATE = 60;

/**
 * Article page revalidation: 300 seconds (5 minutes)
 * 
 * Path: src/app/(public)/(locale)/[locale]/articles/[slug]/page.tsx
 * Path: src/app/(public)/articles/[slug]/page.tsx
 * 
 * Reasoning:
 * - Individual articles rarely updated after publication
 * - 5 min window is acceptable for corrections/updates
 * - Reduces server load on high-traffic articles
 * - User sees consistent article across multiple visits
 */
export const ARTICLE_REVALIDATE = 300;

/**
 * Category page revalidation: 120 seconds (2 minutes)
 * 
 * Path: src/app/(public)/(locale)/[locale]/categories/[slug]/page.tsx
 * Path: src/app/(public)/categories/[slug]/page.tsx
 * Path: src/app/(public)/(locale)/[locale]/categories/page.tsx
 * Path: src/app/(public)/categories/page.tsx
 * 
 * Reasoning:
 * - Shows list of articles, more dynamic than single article
 * - New articles appear in category ~2 min after publication
 * - 2 min is acceptable lag for news content
 * - Multiple categories share similar cache invalidation
 */
export const CATEGORY_REVALIDATE = 120;

/**
 * Author page revalidation: 300 seconds (5 minutes)
 * 
 * Path: src/app/(public)/(locale)/[locale]/auteurs/[id]/page.tsx
 * Path: src/app/(public)/auteurs/[id]/page.tsx
 * 
 * Reasoning:
 * - Author info rarely changes
 * - List of articles by author may update (new articles)
 * - 5 min is reasonable for author pages
 */
export const AUTHOR_REVALIDATE = 300;

/**
 * Search page: Server-side rendering ONLY (no static generation)
 * 
 * Path: src/app/(public)/search/page.tsx
 * 
 * Reasoning:
 * - Search results are user-specific (query parameter based)
 * - Cannot pre-generate all possible search results
 * - Server renders on-demand
 * - Caching via CDN/browser for repeat queries
 * 
 * Implementation: No export const revalidate (defaults to dynamic)
 */
export const SEARCH_DYNAMIC = true;

// ============================================================================
// CACHE HEADERS FOR STATIC ASSETS
// ============================================================================

/**
 * Cache strategy for different asset types
 * 
 * Applies to assets in /public directory
 */
export const STATIC_ASSET_CACHE = {
  // Immutable assets with hash in filename
  immutable: {
    maxAge: 31536000, // 1 year (365 days)
    immutable: true,
    extensions: [".woff2", ".woff", ".ttf", ".eot"],
  },

  // Logo and branding (rarely changes, version via release)
  branding: {
    maxAge: 604800, // 7 days
    extensions: [".png", ".svg", ".ico"],
  },

  // Robots and manifests
  metadata: {
    maxAge: 86400, // 24 hours
    extensions: ["robots.txt", "manifest.json"],
  },
};

/**
 * Next.js headers to implement cache strategy
 * 
 * Add to next.config.ts or middleware:
 * 
 * ```typescript
 * async headers() {
 *   return [
 *     {
 *       source: "/fonts/:path*",
 *       headers: [
 *         { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
 *       ]
 *     },
 *     {
 *       source: "/images/:path*",
 *       headers: [
 *         { key: "Cache-Control", value: "public, max-age=604800" }
 *       ]
 *     }
 *   ];
 * }
 * ```
 */

// ============================================================================
// REVALIDATION RULES
// ============================================================================

/**
 * Manual revalidation triggers
 * 
 * When content changes, trigger revalidation:
 * 
 * ```typescript
 * // On article publication
 * revalidatePath("/articles/[slug]");
 * revalidatePath("/categories/[slug]");
 * revalidatePath("/");
 * 
 * // On category update
 * revalidatePath("/categories/[slug]");
 * revalidatePath("/");
 * 
 * // On author update
 * revalidatePath("/auteurs/[id]");
 * ```
 */

export const MANUAL_REVALIDATION_EVENTS = [
  {
    trigger: "Article published",
    paths: ["/articles/[slug]", "/categories/[slug]", "/"],
  },
  {
    trigger: "Article updated",
    paths: ["/articles/[slug]"],
  },
  {
    trigger: "Category updated",
    paths: ["/categories/[slug]", "/"],
  },
  {
    trigger: "Author updated",
    paths: ["/auteurs/[id]"],
  },
];

// ============================================================================
// CLIENT-SIDE CACHE (Browser Cache)
// ============================================================================

/**
 * Browser caching strategy
 * 
 * Set via response headers or next.config.ts
 */
export const BROWSER_CACHE = {
  // HTML pages: revalidate frequently (don't cache)
  html: {
    cacheControl: "no-store, must-revalidate",
    reason: "ISR handles freshness, client should always check",
  },

  // Static assets: cache long-term
  staticAssets: {
    cacheControl: "public, max-age=31536000, immutable",
    reason: "Versioned files, never change",
  },

  // API responses: short cache
  api: {
    cacheControl: "public, max-age=60",
    reason: "API responses may change frequently",
  },
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Recommended monitoring:
 * 
 * 1. Track ISR regeneration time
 *    - Goal: < 1 second regeneration
 *    - Monitor: Check build logs
 * 
 * 2. Monitor cache hit/miss ratio
 *    - Use CDN analytics (Vercel, Cloudflare)
 *    - Goal: > 80% cache hit rate
 * 
 * 3. Check First Contentful Paint (FCP)
 *    - Tools: Lighthouse, Web Vitals
 *    - Goal: < 1.8 seconds
 * 
 * 4. Monitor Largest Contentful Paint (LCP)
 *    - Goal: < 2.5 seconds
 *    - Requires image optimization
 */

export const MONITORING_TARGETS = {
  isrRegenerationTime: "< 1 second",
  cacheHitRate: "> 80%",
  fcp: "< 1.8 seconds",
  lcp: "< 2.5 seconds",
  cls: "< 0.1",
};
