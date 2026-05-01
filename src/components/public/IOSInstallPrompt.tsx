"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import type { Locale } from "@/lib/locale";

/**
 * Shows a "Add to Home Screen" nudge on iOS Safari when the site is NOT
 * already running as a standalone PWA. Dismissed state persists in
 * sessionStorage so it only shows once per session.
 */
export default function IOSInstallPrompt({ locale = "fr" }: { locale?: Locale }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone =
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("ios-install-dismissed") === "1";

    if (isIOS && !isStandalone && !dismissed) {
      // Small delay so it doesn't flash on initial paint
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("ios-install-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  const isFr = locale === "fr";

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={isFr ? "Ajouter à l'écran d'accueil" : "Add to Home Screen"}
      className="fixed bottom-20 left-4 right-4 z-50 border border-border-strong bg-surface shadow-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="shrink-0 pt-0.5 text-primary">
          <PlusSquare className="h-6 w-6" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="font-label text-xs font-extrabold uppercase tracking-wide text-foreground">
            {isFr ? "Accès rapide" : "Quick access"}
          </p>
          <p className="mt-0.5 font-body text-sm text-muted">
            {isFr ? (
              <>
                Ajoutez Le Relief à votre écran d&apos;accueil : appuyez sur{" "}
                <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden />{" "}
                puis «{" "}
                <span className="font-semibold text-foreground">Sur l&apos;écran d&apos;accueil</span>
                {" »"}.
              </>
            ) : (
              <>
                Add Le Relief to your home screen: tap{" "}
                <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden />{" "}
                then &ldquo;
                <span className="font-semibold text-foreground">Add to Home Screen</span>
                &rdquo;.
              </>
            )}
          </p>
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
