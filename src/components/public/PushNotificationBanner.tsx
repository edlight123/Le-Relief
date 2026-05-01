"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { Locale } from "@/lib/locale";

const STORAGE_KEY = "push-banner-dismissed";

/**
 * Dismissible banner that prompts public readers to enable push notifications.
 * - Only appears if the browser supports push & permission is not yet granted/denied.
 * - Hides permanently (localStorage) once dismissed.
 * - Sits just above the mobile bottom nav.
 */
export default function PushNotificationBanner({ locale = "fr" }: { locale?: Locale }) {
  const { permission, subscribed, loading, error, subscribe } = usePushNotifications(locale);
  const [visible, setVisible] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (permission === "unsupported" || permission === "denied" || permission === "granted") return;
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") return;
    // Short delay — don't interrupt page load
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, [permission]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  async function handleSubscribe() {
    const ok = await subscribe();
    if (ok) {
      setSuccess(true);
      setTimeout(() => setVisible(false), 2500);
    }
    // error is surfaced from the hook via the `error` field below
  }

  if (!visible || subscribed) return null;

  const isFr = locale === "fr";

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-16 left-4 right-4 z-50 flex items-center gap-3 border border-green-300 bg-green-50 px-4 py-3 shadow-lg dark:border-green-800 dark:bg-green-950/40 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
      >
        <Bell className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
        <p className="font-label text-xs font-bold text-green-800 dark:text-green-300">
          {isFr ? "Notifications activées !" : "Notifications enabled!"}
        </p>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={isFr ? "Activer les notifications" : "Enable notifications"}
      className="fixed bottom-16 left-4 right-4 z-50 border border-border-strong bg-surface shadow-xl md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="shrink-0 pt-0.5 text-primary">
          <Bell className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="font-label text-xs font-extrabold uppercase tracking-wide text-foreground">
            {isFr ? "Restez informé·e" : "Stay informed"}
          </p>
          <p className="mt-0.5 font-body text-sm text-muted">
            {isFr
              ? "Activez les notifications pour recevoir les nouveaux articles du Relief directement sur votre appareil."
              : "Enable notifications to receive new Le Relief articles directly on your device."}
          </p>
          {error && (
            <p className="mt-1.5 font-body text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 font-label text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              <Bell className="h-3 w-3" aria-hidden />
              {loading
                ? isFr ? "Activation…" : "Activating…"
                : isFr ? "Activer" : "Enable"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-muted hover:text-foreground"
            >
              <BellOff className="h-3 w-3" aria-hidden />
              {isFr ? "Non merci" : "No thanks"}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={isFr ? "Fermer" : "Dismiss"}
          className="shrink-0 text-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
