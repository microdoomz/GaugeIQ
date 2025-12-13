const CACHE_NAME = "gaugeiq-cache-v1";

const URLS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-1024.png",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch event (GET requests only)
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only cache GET requests
  if (request.method !== "GET") {
    return; // allow browser to handle POST normally
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // Try network first
      return (
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, clone)
            );
            return response;
          })
          // fallback to cache
          .catch(() => cached)
      );
    })
  );
});
