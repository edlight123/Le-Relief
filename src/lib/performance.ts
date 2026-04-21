/**
 * Performance utilities for Le Relief
 * 
 * This module provides utilities for optimizing Core Web Vitals:
 * - LCP (Largest Contentful Paint): Image optimization, preloading
 * - INP (Interaction to Next Paint): Code splitting, lazy loading
 * - CLS (Cumulative Layout Shift): Proper sizing, dimension specification
 */

/**
 * Configuration for code splitting hints
 * Marks components that should be dynamically imported to reduce main bundle size
 */
export const HEAVY_COMPONENTS = {
  /**
   * TableOfContents: Interactive table of contents
   * Only needed on article pages, can be code-split
   */
  TableOfContents: {
    name: "TableOfContents",
    size: "~15KB",
    shouldDynamicImport: true,
    benefit: "Reduces article page JS by deferring non-critical rendering",
  },
  /**
   * AnalyticsCharts: Dashboard visualization charts
   * Heavy dependency on Recharts, only needed in dashboard
   */
  AnalyticsCharts: {
    name: "AnalyticsCharts",
    size: "~45KB",
    shouldDynamicImport: true,
    benefit: "Prevents loading chart library on non-dashboard pages",
  },
  /**
   * RelatedArticles: Related articles section
   * Can be lazy-loaded below the fold on article pages
   */
  RelatedArticles: {
    name: "RelatedArticles",
    size: "~8KB",
    shouldDynamicImport: true,
    benefit: "Below-fold content, can be deferred",
  },
};

/**
 * Font strategy configuration
 * 
 * Fonts are critical for LCP when used in hero text:
 * - System fonts are preloaded (var(--font-*) in CSS)
 * - Google Fonts should be preloaded if used
 * - Variable fonts reduce file size
 */
export const FONT_STRATEGY = {
  // System fonts: Already included via Tailwind, prioritized in HTML
  system: {
    strategy: "preload",
    impact: "Reduces layout shift and improves perceived performance",
  },
  // If adding web fonts, use preconnect + preload
  webFonts: {
    strategy: "preconnect + preload",
    preconnectUrl: "https://fonts.googleapis.com",
    preloadUrl: "https://fonts.gstatic.com",
    note: "Only add if necessary - system fonts are sufficient",
  } as const,
};

/**
 * Script loading strategy for third-party scripts
 * 
 * Using Next.js Script component with appropriate strategy:
 * - afterInteractive: Analytics, tracking (default)
 * - beforeInteractive: Critical functionality only (rare)
 * - lazyOnload: Non-critical features (ads, social widgets)
 */
export const SCRIPT_STRATEGY = {
  analytics: {
    src: "/analytics.js",
    strategy: "afterInteractive",
    reason: "Analytics can wait until after page is interactive",
  },
  thirdPartyWidgets: {
    strategy: "lazyOnload",
    reason: "Widgets load after main content is ready",
  },
};

/**
 * Image optimization metrics
 * Track image impact on Core Web Vitals
 */
export interface ImageOptimizationMetrics {
  // Width in pixels at different breakpoints
  sizes: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  // Format strategy: webp with fallback
  formats: string[];
  // Quality setting: 75-85 for web
  quality: number;
}

/**
 * Standard image breakpoints for responsive images
 * Matches Tailwind breakpoints:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 */
export const IMAGE_BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

/**
 * Calculate optimal image sizes attribute for Next.js Image
 * 
 * @param context - Where the image is used
 * @returns sizes attribute value for Next.js Image
 * 
 * @example
 * ```tsx
 * <Image
 *   src="..."
 *   alt="..."
 *   sizes={getImageSizesAttribute('article-hero')}
 * />
 * ```
 */
export function getImageSizesAttribute(context: string): string {
  const sizesMap: Record<string, string> = {
    // Full-width hero images
    "article-hero":
      "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px",
    // Article cover in cards (list view)
    "article-card":
      "(max-width: 640px) 100vw, (max-width: 1024px) 500px, 300px",
    // Compact article card thumbnail
    "article-thumb":
      "(max-width: 640px) 80px, (max-width: 1024px) 120px, 150px",
    // Category grid images
    "category-grid":
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    // Author avatar
    "author-avatar": "100px",
    // Logo (fixed size)
    "logo": "40px",
    // Sidebar image
    "sidebar-image":
      "(max-width: 768px) 100vw, 300px",
    // Homepage featured section
    "homepage-featured":
      "(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 60vw",
  };

  return sizesMap[context] || "(max-width: 640px) 100vw, 1024px";
}

/**
 * Verifies that an image sizes attribute is properly formatted
 * 
 * @param sizes - sizes attribute to validate
 * @returns true if valid format
 */
export function validateImageSizes(sizes: string): boolean {
  // Basic check: should contain media queries and dimension values
  const hasMediaQuery = /\([^)]*\)/.test(sizes);
  const hasDimension = /\d+(px|vw)/.test(sizes);
  return hasMediaQuery || hasDimension;
}

/**
 * CLS (Cumulative Layout Shift) prevention checklist
 * 
 * Strategies to prevent layout shift:
 * 1. Always specify width/height on images
 * 2. Use aspect-ratio CSS for responsive containers
 * 3. Reserve space for dynamic content
 * 4. Use skeletons/placeholders for deferred content
 * 5. Avoid inserting content above existing content
 */
export const CLS_PREVENTION = {
  images: {
    rule: "Always specify width and height or use fill with aspect-ratio",
    example: '<Image src="..." width={800} height={600} />',
  },
  dynamicContent: {
    rule: "Reserve space before content loads (e.g., fixed-height container)",
    example: '<div style={{minHeight: "200px"}}> ... </div>',
  },
  animations: {
    rule: "Use CSS transforms (translateX/Y) instead of margin/width changes",
    reason: "Transforms don't trigger layout recalculation",
  },
};

/**
 * LCP (Largest Contentful Paint) optimization
 * 
 * LCP is the render time of the largest visible element:
 * - Hero image
 * - Main heading
 * - Large text block
 * 
 * Strategies:
 * 1. Preload critical images
 * 2. Inline critical CSS
 * 3. Minimize render-blocking resources
 * 4. Optimize server response time
 */
export const LCP_OPTIMIZATION = {
  heroImage: {
    strategy: "Preload + fetchPriority='high'",
    sizes: "(max-width: 640px) 100vw, 1200px",
    quality: 80,
    format: "webp",
  },
  textContent: {
    strategy: "Use system fonts (no web font download required)",
    benefit: "Hero text renders immediately without waiting for font",
  },
};

/**
 * INP (Interaction to Next Paint) optimization
 * 
 * INP measures latency of user interactions:
 * - Click to button highlight
 * - Scroll response
 * - Input field response
 * 
 * Strategies:
 * 1. Debounce/throttle expensive operations
 * 2. Use useTransition for non-blocking updates
 * 3. Avoid long tasks on main thread
 * 4. Code split heavy components
 */
export const INP_OPTIMIZATION = {
  searchInput: {
    strategy: "Debounce 300ms to avoid excessive re-renders",
    implementation: "useDebounce hook",
  },
  filterButtons: {
    strategy: "Lazy transition with useTransition",
    benefit: "UI stays responsive during data fetching",
  },
  heavyComponents: {
    strategy: "Dynamic import with Suspense",
    components: ["AnalyticsCharts", "TableOfContents"],
  },
};

/**
 * Bundle size targets
 * 
 * Baseline budgets per page type:
 * - Homepage: < 150KB JS
 * - Article page: < 120KB JS
 * - Dashboard: < 200KB JS (includes charts)
 * - Search: < 100KB JS
 */
export const BUNDLE_TARGETS = {
  homepage: {
    target: 150000, // bytes
    description: "Homepage should load quickly",
  },
  article: {
    target: 120000,
    description: "Article pages should be lightweight",
  },
  dashboard: {
    target: 200000,
    description: "Dashboard includes heavy chart library",
  },
  search: {
    target: 100000,
    description: "Search is a simple page",
  },
};

/**
 * Mobile-first CSS approach verification
 * 
 * Best practices:
 * 1. Default styles apply to mobile
 * 2. Use @media (min-width: ...) for larger screens
 * 3. Tailwind applies this automatically with sm:, md:, lg: prefixes
 * 4. Verify no max-width: constraints on base styles
 */
export const MOBILE_FIRST_APPROACH = {
  philosophy: "Mobile layout first, enhance for larger screens",
  tailwindBreakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  example: "Text should be 16px on mobile, can be larger on desktop",
};
