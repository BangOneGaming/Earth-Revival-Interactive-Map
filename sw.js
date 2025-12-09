// ===============================
//  CONFIG
// ===============================
const TILE_VERSION = "20251121"; // Samakan dengan peta.js
const CACHE_NAME = "wwm-tiles-" + TILE_VERSION;

const TILE_URL_PREFIX = "https://tiles.bgonegaming.win/wherewindmeet/tiles/";

// ===============================
//  LOG RELAY ke halaman
// ===============================
function logToClients(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "SW_LOG", message: msg });
    });
  });
}

// ===============================
//  INSTALL
// ===============================
self.addEventListener("install", (event) => {
  console.log("[SW] Installed");
  logToClients("Installed");
  self.skipWaiting();
});

// ===============================
//  ACTIVATE
// ===============================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  logToClients("Activated");

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith("wwm-tiles-") && key !== CACHE_NAME) {
            console.log("[SW] Delete old cache:", key);
            logToClients("Delete old cache: " + key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ===============================
//  FETCH INTERCEPTOR
// ===============================
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Hanya intercept tile
  if (!url.startsWith(TILE_URL_PREFIX)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        console.log("🟡 [SW] TILE from CACHE:", url);
        logToClients("🟡 CACHE → " + url);
        return cachedResponse;
      }

      console.log("🟢 [SW] TILE from SERVER:", url);
      logToClients("🟢 SERVER → " + url);

      try {
        const fetchResponse = await fetch(event.request);
        if (fetchResponse.status === 200) {
          cache.put(event.request, fetchResponse.clone());
        }
        return fetchResponse;
      } catch (e) {
        console.error("🔴 [SW] Network error:", e);
        logToClients("🔴 Network error (fallback to cache): " + url);
        return cachedResponse || Response.error();
      }
    })
  );
});