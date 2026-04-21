/**
 * Image optimization utilities for Le Relief
 * 
 * Provides functions for:
 * - Responsive image sizing calculation
 * - Blur hash placeholder generation
 * - Image quality optimization
 * - Format optimization (webp, etc.)
 */

/**
 * Image quality presets optimized for web
 */
export const IMAGE_QUALITY = {
  hero: 80, // Hero images can afford slightly higher quality
  article: 75, // Standard article content
  thumbnail: 70, // Small thumbnails in lists
  social: 75, // Social media shares
};

/**
 * Image format strategy
 * Uses webp with fallback to jpeg/png
 */
export const IMAGE_FORMATS = {
  modern: "webp", // Primary format, ~30% smaller
  fallback: "jpeg", // Fallback for older browsers
  animated: "webp", // GIFs should be served as webp animation
};

/**
 * Calculate responsive image dimensions
 * 
 * @param fullWidth - Width of the image at full desktop size
 * @returns Object with dimensions at different breakpoints
 * 
 * @example
 * ```ts
 * const dims = calculateResponsiveDimensions(1200);
 * // { mobile: 320, tablet: 768, desktop: 1200 }
 * ```
 */
export function calculateResponsiveDimensions(
  fullWidth: number,
): { mobile: number; tablet: number; desktop: number } {
  return {
    mobile: Math.min(320, fullWidth),
    tablet: Math.min(768, fullWidth),
    desktop: fullWidth,
  };
}

/**
 * Generate aspect-ratio CSS for responsive containers
 * Prevents Cumulative Layout Shift (CLS)
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns CSS aspect-ratio value
 * 
 * @example
 * ```ts
 * const ar = getAspectRatioCss(800, 600);
 * // "4 / 3"
 * ```
 */
export function getAspectRatioCss(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor} / ${height / divisor}`;
}

/**
 * Image metadata for responsive sizing
 * 
 * Contains all info needed to optimize an image
 */
export interface ImageMetadata {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
  priority?: boolean;
  /** 'article-hero', 'article-card', 'author-avatar', etc. */
  context?: string;
}

/**
 * Static images used in the project
 * 
 * This is a manifest of all images to enable:
 * - Static optimization (imports)
 * - Preloading strategy
 * - Performance auditing
 */
export const STATIC_IMAGES: Record<string, ImageMetadata> = {
  logo: {
    src: "/logo.png",
    alt: "Le Relief",
    width: 40,
    height: 40,
    priority: true,
    context: "logo",
  },
  // Add more as needed
};

/**
 * Generate blur hash for image placeholder
 * 
 * A blur hash is a compact representation of an image's color palette
 * Used for Low-Quality Image Placeholder (LQIP) strategy
 * 
 * For production, consider using blurhash library:
 * https://github.com/woltapp/blurhash
 * 
 * @param imageUrl - URL of the image
 * @returns Data URI of blurred placeholder
 * 
 * @example
 * ```ts
 * const placeholder = await generateBlurHash('/images/article.jpg');
 * <Image src="..." placeholder="blur" blurDataURL={placeholder} />
 * ```
 */
export async function generateBlurHash(imageUrl: string): Promise<string> {
  // Note: This is a simplified implementation
  // For production, use blurhash library with proper image processing
  
  // Return a simple gray placeholder
  // Real implementation would:
  // 1. Fetch the image
  // 2. Resize to small size (e.g., 32x32)
  // 3. Extract dominant colors
  // 4. Encode as blurhash
  
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) {
    // Server-side: return default placeholder
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjNmMyIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiLz48L3N2Zz4=";
  }

  // Client-side placeholder generation (simplified)
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, 10, 10);
        resolve(canvas.toDataURL("image/jpeg"));
      } else {
        resolve(
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjNmMyIgd3lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiLz48L3N2Zz4="
        );
      }
    };
    img.onerror = () => {
      resolve(
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjNmMyIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiLz48L3N2Zz4="
      );
    };
    img.src = imageUrl;
  });
}

/**
 * Image optimization recommendations
 * 
 * These are the standard sizes to use for different image contexts
 */
export const IMAGE_OPTIMIZATION_GUIDE = {
  heroImage: {
    description: "Full-width hero images on article pages",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px",
    minWidth: 640,
    maxWidth: 1920,
    aspectRatio: "16/9 or 4/3",
    quality: 80,
    preload: true,
  },
  articleCard: {
    description: "Images in article card list views",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 500px, 300px",
    minWidth: 300,
    maxWidth: 800,
    aspectRatio: "4/3 or 16/9",
    quality: 75,
  },
  thumbnail: {
    description: "Small images in compact lists",
    sizes: "80px",
    minWidth: 80,
    maxWidth: 240,
    aspectRatio: "1/1 or 4/3",
    quality: 70,
  },
  categoryTile: {
    description: "Category grid images",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    minWidth: 300,
    maxWidth: 600,
    aspectRatio: "3/2 or 4/3",
    quality: 75,
  },
  authorAvatar: {
    description: "Author profile images",
    sizes: "100px",
    minWidth: 100,
    maxWidth: 300,
    aspectRatio: "1/1",
    quality: 70,
  },
};

/**
 * Optimization checklist for images
 * 
 * Run through this when adding new images:
 */
export const IMAGE_OPTIMIZATION_CHECKLIST = [
  "✓ Image has width and height specified (or fill with aspect-ratio)",
  "✓ Image has appropriate sizes attribute for responsive loading",
  "✓ Hero/above-fold images have priority={true}",
  "✓ Image quality is set appropriately (70-80 range)",
  "✓ Image is in optimized format (webp preferred)",
  "✓ Alt text is descriptive and meaningful",
  "✓ Image is not larger than necessary (e.g., 1920px max width)",
  "✓ Server response time for image is < 1 second",
];
