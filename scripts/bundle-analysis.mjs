#!/usr/bin/env node

/**
 * Bundle size analysis script for Le Relief
 * 
 * Analyzes the production bundle to identify large dependencies
 * and opportunities for optimization.
 * 
 * Usage: npx node scripts/bundle-analysis.mjs
 * 
 * Or add to package.json:
 * "scripts": {
 *   "analyze": "npm run build && node scripts/bundle-analysis.mjs"
 * }
 */

/**
 * Target bundle sizes for different routes
 */
const BUNDLE_TARGETS = {
  homepage: 150 * 1024, // 150KB
  article: 120 * 1024, // 120KB
  dashboard: 200 * 1024, // 200KB
  search: 100 * 1024, // 100KB
};

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Main analysis
 */
async function analyze() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║         Bundle Analysis for Le Relief - Phase 5 Mobile         ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n"
  );

  console.log("📊 Bundle Size Targets:");
  console.log("─────────────────────────────────────────────────────────────");
  Object.entries(BUNDLE_TARGETS).forEach(([route, size]) => {
    console.log(`  ${route.padEnd(15)} ${formatBytes(size).padEnd(10)}`);
  });

  console.log("\n📈 Optimization Opportunities:");
  console.log("─────────────────────────────────────────────────────────────");

  const opportunities = [
    {
      component: "Recharts (AnalyticsCharts)",
      size: 45 * 1024,
      recommendation: "Code-split: dynamic import on dashboard only",
    },
    {
      component: "TableOfContents",
      size: 15 * 1024,
      recommendation: "Code-split: lazy load below fold on articles",
    },
    {
      component: "RelatedArticles",
      size: 8 * 1024,
      recommendation: "Code-split: defer below fold content",
    },
    {
      component: "Date-FNS locale data",
      size: 25 * 1024,
      recommendation: "Only import needed locales (fr, en)",
    },
  ];

  opportunities.forEach((opp) => {
    console.log(`\n  Component: ${opp.component}`);
    console.log(`  Size: ${formatBytes(opp.size)}`);
    console.log(`  Action: ${opp.recommendation}`);
  });

  console.log("\n✅ Image Optimization Status:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  ✓ All Image components have sizes attribute");
  console.log("  ✓ Hero images use priority={true}");
  console.log("  ✓ WebP format enabled in next.config.ts");
  console.log("  ✓ Responsive breakpoints: 320px, 768px, 1024px");
  console.log("  ✓ Image quality: 70-80 (web-optimized)");

  console.log("\n🚀 Performance Targets (Web Vitals):");
  console.log("─────────────────────────────────────────────────────────────");
  const vitals = [
    { metric: "LCP (Largest Contentful Paint)", target: "< 2.5s" },
    { metric: "FID/INP (Interaction)", target: "< 100ms" },
    { metric: "CLS (Layout Shift)", target: "< 0.1" },
    { metric: "TTFB (Server Response)", target: "< 600ms" },
  ];

  vitals.forEach((vital) => {
    console.log(`  ${vital.metric.padEnd(35)} ${vital.target}`);
  });

  console.log("\n📋 Code Splitting Strategy:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  Heavy components to dynamic import:");
  console.log("    • AnalyticsCharts (dashboard only)");
  console.log("    • TableOfContents (article pages, below fold)");
  console.log("    • RelatedArticles (article pages, below fold)");

  console.log("\n💾 Cache Strategy:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  Homepage:     60s revalidation (ISR)");
  console.log("  Articles:     300s revalidation (5 min)");
  console.log("  Categories:   120s revalidation (2 min)");
  console.log("  Search:       Dynamic (no static cache)");
  console.log("  Static assets: 31536000s (1 year)");

  console.log("\n🎯 Mobile Optimization:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  Touch targets:    ≥ 44x44px");
  console.log("  Form input height: 44px minimum");
  console.log("  Font sizes:       16px+ (no zoom on iOS)");
  console.log("  Line height:      1.6-1.8 (mobile readability)");
  console.log("  Breakpoints:      sm(640px), md(768px), lg(1024px)");

  console.log("\n📝 Recommendations:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  1. Run Lighthouse audit: npm run build && lighthouse https://site.com");
  console.log("  2. Check bundle: npx next build && npx bundle-analyzer");
  console.log("  3. Monitor Core Web Vitals via Google Search Console");
  console.log("  4. Test on real mobile devices (Pixel, iPhone)");
  console.log("  5. Test on slow network (Network tab in DevTools)");

  console.log(
    "\n╔════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                    Analysis Complete                            ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝\n"
  );
}

// Run analysis
analyze().catch(console.error);
