"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Shows a slim toast when a new service worker is waiting to activate.
 * Tapping "Update" sends the SW a SKIP_WAITING message then reloads the page.
 */
export default function PWAUpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function checkForWaiting(r: ServiceWorkerRegistration) {
      if (r.waiting) {
        setWaiting(r.waiting);
        return;
      }
      // Watch for a new SW entering the waiting state
      r.addEventListener("updatefound", () => {
        const installing = r.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(installing);
          }
        });
      });
    }

    navigator.serviceWorker.ready.then((r) => {
      checkForWaiting(r);
      // Poll for updates every 60 s (browsers also check on navigation)
      intervalId = setInterval(() => r.update(), 60_000);
    });

    // When the SW takes control after SKIP_WAITING, reload
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  function applyUpdate() {
    if (!waiting) return;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  if (!waiting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 border border-border-strong bg-surface px-4 py-3 shadow-xl md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <div className="flex items-center gap-2.5">
        <RefreshCw className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="font-label text-xs font-bold text-foreground">
          Une mise à jour est disponible.
        </p>
      </div>
      <button
        type="button"
        onClick={applyUpdate}
        className="shrink-0 bg-primary px-3 py-1.5 font-label text-[11px] font-extrabold uppercase tracking-wide text-white hover:bg-primary-dark"
      >
        Mettre à jour
      </button>
    </div>
  );
}
