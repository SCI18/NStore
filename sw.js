const CACHE_NAME = "nstore-shell-v2";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/css/styles.css",
  "/js/config.js",
  "/js/i18n.js",
  "/js/cart.js",
  "/js/app.js",
  "/js/nav.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// Network-first for everything: always serve the latest version when online.
// Falls back to cache only when the network request fails (offline).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

