const CACHE_NAME = "wwm-tiles-20251121";

console.log("[SW] Loaded. Cache =", CACHE_NAME);

self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log("[SW] Existing caches:", keys);
      return Promise.all(
        keys
          .filter((key) => key.startsWith("wwm-tiles-") && key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
  console.log("[SW] Activated.");
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Hanya cache tiles
  if (!url.includes("/wherewindmeet/tiles/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      if (cached) {
        console.log("SW: CACHE HIT →", url);
        return cached;
      }

      try {
        console.log("SW: NETWORK →", url);
        const response = await fetch(event.request, { mode: "cors" });

        if (response.ok) {
          console.log("SW: SAVED →", url);
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (err) {
        console.error("SW: NETWORK FAIL → using cache", url);
        return cached || Response.error();
      }
    })
  );
});