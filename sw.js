const CACHE_NAME = "nstore-shell-v1";
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
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Paths that change often — always try the network first so stock/price updates show immediately.
const NETWORK_FIRST_PREFIXES = ["/data/", "/lang/", "/images/"];

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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNetworkFirst = NETWORK_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
