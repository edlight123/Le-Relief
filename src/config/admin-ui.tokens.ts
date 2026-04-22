export const adminUiTokens = {
  density: {
    compact: "py-1.5 px-2",
    default: "py-2 px-3",
    relaxed: "py-3 px-4",
  },
  radius: {
    card: "rounded-sm",
    button: "rounded-sm",
  },
  statusVariants: {
    ok: "success",
    warning: "warning",
    critical: "danger",
    info: "info",
  },
} as const;

export type AdminUiTokens = typeof adminUiTokens;
