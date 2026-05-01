/**
 * Le Relief — Service Worker
 * Strategy: Network-first for navigation, Cache-first for static assets.
 * Only caches GET requests; never caches API routes or admin pages.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `le-relief-static-${CACHE_VERSION}`;
const PAGES_CACHE = `le-relief-pages-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/offline",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

const NEVER_CACHE = ["/api/", "/admin", "/_next/webpack-hmr", "/feed.xml"];

function shouldSkip(url) {
  const { pathname } = new URL(url);
  return NEVER_CACHE.some((prefix) => pathname.startsWith(prefix));
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Le Relief", body: "Nouvelle publication", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // ignore parse errors
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) => c.url === url && "focus" in c);
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
});

// ── Updates ──────────────────────────────────────────────────────────────────
// Allow the page to trigger a SW swap via postMessage({ type: 'SKIP_WAITING' }).
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (shouldSkip(request.url)) return;

  const url = new URL(request.url);

  // Static assets (_next/static, images, fonts) → cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpg|jpeg|gif|svg|webp|avif|woff2?|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // HTML navigation → network-first, fall back to cache then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(
          () =>
            caches.match(request) ||
            caches.match("/offline") ||
            new Response("Hors connexion", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        )
    );
  }
});
