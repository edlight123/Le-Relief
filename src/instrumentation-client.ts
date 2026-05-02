/**
 * Register the Le Relief service worker for PWA support.
 * Runs on the client before the app becomes interactive.
 */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      // updateViaCache: 'none' forces the browser to bypass its HTTP cache when
      // fetching sw.js for update checks — critical for PWA auto-updates.
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  });
}
