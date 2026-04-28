export const adminUiTokens = {
  density: {
    compact: "py-1.5 px-2",
    default: "py-2 px-3",
    relaxed: "py-3 px-4",
  },
  radius: {
    card: "rounded-sm",
    button: "rounded-sm",
    input: "rounded-md",
    badge: "rounded-full",
    table: "rounded-sm",
  },
  statusVariants: {
    ok: "success",
    warning: "warning",
    critical: "danger",
    info: "info",
    pending: "warning",
    draft: "gray",
    review: "info",
    approved: "success",
    published: "success",
    scheduled: "info",
    rejected: "danger",
  },
  severityIcons: {
    info: "ℹ️",
    warning: "⚠️",
    critical: "🚨",
    success: "✅",
  },
  severityColors: {
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400",
    success: "text-emerald-600 dark:text-emerald-400",
  },
  severityBg: {
    info: "bg-blue-50 dark:bg-blue-950",
    warning: "bg-amber-50 dark:bg-amber-950",
    critical: "bg-red-50 dark:bg-red-950",
    success: "bg-emerald-50 dark:bg-emerald-950",
  },
  emptyState: {
    iconSize: "h-12 w-12",
    title: "text-lg font-headline font-bold text-foreground",
    description: "text-sm text-muted max-w-md",
    actionWrapper: "mt-5",
  },
  onboarding: {
    tipBg: "bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500",
    tipText: "text-sm text-blue-800 dark:text-blue-200",
    tipTitle: "font-label text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider",
  },
} as const;

export type AdminUiTokens = typeof adminUiTokens;
