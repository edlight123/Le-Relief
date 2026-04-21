/**
 * Accessibility and mobile usability utilities for Le Relief
 * 
 * Ensures compliance with:
 * - WCAG 2.1 Level AA
 * - Mobile-friendly interaction targets (44x44px minimum)
 * - Keyboard navigation support
 * - Color contrast ratios
 */

/**
 * Minimum touch target size (WCAG guideline)
 * 
 * All interactive elements should be at least 44x44 CSS pixels
 * This accommodates various finger sizes and motor control abilities
 * 
 * Exception: If smaller targets exist, they must be spaced at least
 * 24x24 CSS pixels apart (center-to-center)
 */
export const MIN_TOUCH_TARGET_SIZE = 44; // pixels

/**
 * Touch target validation utility
 * 
 * @param element - HTML element to check
 * @returns true if element meets minimum touch target size
 * 
 * @example
 * ```ts
 * const isAccessible = isTouchTargetAccessible(buttonElement);
 * ```
 */
export function isTouchTargetAccessible(element: HTMLElement): boolean {
  if (typeof window === "undefined") return true; // SSR: assume valid
  
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Get Tailwind class for 44x44px button
 * 
 * Ensures buttons meet accessibility requirements
 * 
 * @returns Tailwind classes for accessible button size
 */
export function getAccessibleButtonClasses(): string {
  // min-h-11 = 44px (11 * 4px Tailwind unit)
  // min-w-11 = 44px
  // padding ensures proper spacing
  return "min-h-11 min-w-11 px-3 py-2 flex items-center justify-center";
}

/**
 * Touch target verification checklist
 * 
 * Run through this when designing interactive elements:
 */
export const TOUCH_TARGET_CHECKLIST = [
  "All buttons are at least 44x44px (min-h-11 min-w-11 in Tailwind)",
  "Links have sufficient padding around text to reach 44x44px",
  "Form inputs (text, select) are 44px tall minimum",
  "Smaller interactive elements (< 44x44px) are spaced 24px+ apart (center-to-center)",
  "Touch targets have visible focus indicator for keyboard navigation",
  "No touch target is surrounded by clickable area (clear separation)",
] as const;

/**
 * Mobile-friendly form optimization
 * 
 * Recommendations for forms on mobile devices
 */
export const MOBILE_FORM_OPTIMIZATION = {
  inputHeight: "44px minimum",
  inputFontSize: "16px (prevents zoom on iOS)",
  selectHeight: "44px minimum",
  buttonHeight: "48px recommended",
  spacing: "8-16px between inputs",
  autocomplete: "Use autocomplete attributes for better UX",
  validation: "Show errors inline, not in modal dialogs",
  label: "Always use associated label, clickable for checkbox/radio",
};

/**
 * Color contrast verification
 * 
 * WCAG 2.1 requirements:
 * - Normal text: 4.5:1 (Level AA)
 * - Large text (18pt+): 3:1 (Level AA)
 * - Graphical elements: 3:1 (Level AA)
 */
export const COLOR_CONTRAST = {
  normalText: {
    ratio: 4.5,
    level: "AA",
    pixels: "14-17px",
  },
  largeText: {
    ratio: 3.0,
    level: "AA",
    pixels: "18px+ (bold) or 24px+ (regular)",
  },
  graphical: {
    ratio: 3.0,
    level: "AA",
    note: "Applies to icons, buttons without text",
  },
};

/**
 * Calculate contrast ratio between two colors
 * 
 * @param foreground - Foreground color (hex, rgb, or named)
 * @param background - Background color
 * @returns Contrast ratio (1-21)
 * 
 * @example
 * ```ts
 * const ratio = getContrastRatio('#ffffff', '#111111');
 * // 21 (perfect contrast)
 * ```
 */
export function getContrastRatio(foreground: string, background: string): number {
  // Simplified implementation - returns relative luminance ratio
  // In production, use accessible-colors or similar library
  
  const getLuminance = (color: string): number => {
    // This is a simplified luminance calculation
    // Real implementation would parse colors properly
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const luminance =
      0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)) +
      0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)) +
      0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4));

    return luminance;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Focus indicator best practices
 * 
 * Keyboard navigation is critical for accessibility
 * All interactive elements need visible focus indicators
 */
export const KEYBOARD_NAVIGATION = {
  focusIndicator: {
    style: "outline-2 outline-offset-2 outline-primary",
    important: "Must be visible on all backgrounds",
  },
  tabOrder: {
    rule: "Tab order should follow visual order (auto, no tabindex hacks)",
    exception: "Modal dialogs may reorder focus",
  },
  skipLink: {
    needed: true,
    example: "Allow users to skip to main content",
  },
};

/**
 * Accessible form label patterns
 * 
 * Each input must be associated with a label
 */
export const FORM_LABEL_PATTERNS = {
  implicit: {
    description: "Label wraps input",
    example: "<label><input type='text'/> Email</label>",
    best: "Works for simple cases",
  },
  explicit: {
    description: "Label linked via htmlFor attribute",
    example: "<label htmlFor='email'>Email</label><input id='email'/>",
    best: "Preferred approach, more flexible layout",
  },
  visuallyHidden: {
    description: "Label is present but visually hidden",
    class: "sr-only (screen-reader only)",
    benefit: "Allows clean design while maintaining semantics",
  },
};

/**
 * Mobile viewport optimization
 * 
 * Ensures proper rendering on mobile devices
 */
export const MOBILE_VIEWPORT = {
  metaTag: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  required: true,
  prevents: "Zoomed-out page, horizontal scroll",
  note: "Already configured in Next.js layout",
};

/**
 * Font sizes for mobile readability
 * 
 * WCAG recommendation: body text should be 16px minimum
 * Prevents iOS from zooming to 16px when form is focused
 */
export const MOBILE_FONT_SIZES = {
  body: {
    mobile: "16px", // iOS won't zoom
    desktop: "16px", // Can stay same
    reason: "Readable without zooming, prevents iOS zoom",
  },
  heading1: {
    mobile: "28px",
    desktop: "48px",
    rule: "Scale proportionally from mobile",
  },
  heading2: {
    mobile: "24px",
    desktop: "36px",
  },
  heading3: {
    mobile: "20px",
    desktop: "28px",
  },
  button: {
    minimum: "16px",
    reason: "Small button text is harder to click on mobile",
  },
};

/**
 * Readable line length
 * 
 * Optimal line length is 50-75 characters for comfortable reading
 */
export const LINE_LENGTH = {
  optimal: "50-75 characters",
  maxWidth: "65em or 80 characters",
  implementation: "max-w-prose in Tailwind (~65ch)",
  mobile: "Can be full width (single column)",
};

/**
 * Line height for mobile readability
 * 
 * Tighter line-height on mobile makes text harder to read
 */
export const LINE_HEIGHT = {
  body: {
    mobile: "1.6 to 1.8",
    desktop: "1.5 to 1.7",
    reason: "Extra spacing helps with mobile readability",
  },
};

/**
 * Dark mode considerations for mobile
 * 
 * Dark mode can be harder on eyes on mobile (higher brightness)
 */
export const DARK_MODE_MOBILE = {
  contrastImportance: "Extra important on mobile (often in bright sunlight)",
  brightness: "May need darker backgrounds and lighter text",
  testing: "Test in various lighting conditions",
};

/**
 * Accessibility audit checklist
 */
export const ACCESSIBILITY_AUDIT_CHECKLIST = [
  "All interactive elements have focus indicators",
  "All form inputs have associated labels",
  "All images have descriptive alt text",
  "Color is not sole means of conveying information",
  "Contrast ratio is 4.5:1 for normal text",
  "Touch targets are 44x44px minimum",
  "No page functionality requires hover",
  "Page keyboard navigable without mouse",
  "Error messages are associated with inputs",
  "Dialogs properly trap focus",
] as const;
