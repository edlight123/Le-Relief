"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Wraps a promise with a timeout; rejects with a clear message on expiry. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[push] ${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

function getInitialPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission as PushPermission;
}

export function usePushNotifications(locale?: string) {
  const [permission, setPermission] = useState<PushPermission>(getInitialPermission);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial state
  useEffect(() => {
    if (permission === "unsupported") return;

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => null);
  }, [permission]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!VAPID_PUBLIC_KEY) {
      setError("Configuration manquante (clé VAPID absente).");
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") {
        setError(perm === "denied"
          ? "Notifications bloquées dans les paramètres du navigateur."
          : "Permission refusée.");
        return false;
      }

      const reg = await withTimeout(
        navigator.serviceWorker.ready,
        10_000,
        "serviceWorker.ready",
      );

      const sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
        }),
        10_000,
        "pushManager.subscribe",
      );

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys?: { p256dh?: string; auth?: string };
      };

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...subJson, locale }),
      });

      if (!res.ok) throw new Error("Erreur serveur lors de l'enregistrement.");

      setSubscribed(true);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[push] subscribe failed", err);
      setError(msg.includes("timed out")
        ? "Le service worker ne répond pas. Rechargez la page et réessayez."
        : "Activation impossible. Vérifiez les paramètres de notifications.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setSubscribed(false);
        return true;
      }
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      setSubscribed(false);
      return true;
    } catch (err) {
      console.error("[push] unsubscribe failed", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, subscribed, loading, error, subscribe, unsubscribe };
}
