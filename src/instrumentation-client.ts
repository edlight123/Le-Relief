/**
 * Register the Le Relief service worker for PWA support.
 * Runs on the client before the app becomes interactive.
 */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  });
}
