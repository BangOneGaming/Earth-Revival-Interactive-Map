// ===============================
// CONFIG
// ===============================
const TILE_VERSION = "20251121"; // Samakan dengan peta.js

const CACHE_MAIN = "wwm-main-" + TILE_VERSION;
const CACHE_HUTUO = "wwm-hutuo-" + TILE_VERSION;
const CACHE_ROYAL = "wwm-royal-" + TILE_VERSION;

const TILE_URL_PREFIX =
  "https://tiles.bgonegaming.win/wherewindmeet/tiles/";

// ===============================
// LOG RELAY ke halaman
// ===============================
function logToClients(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "SW_LOG", message: msg });
    });
  });
}

// ===============================
// INSTALL
// ===============================
self.addEventListener("install", () => {
  console.log("[SW] Installed");
  logToClients("Installed");
  self.skipWaiting();
});

// ===============================
// ACTIVATE (cleanup cache lama)
// ===============================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  logToClients("Activated");

  const validCaches = [
    CACHE_MAIN,
    CACHE_HUTUO,
    CACHE_ROYAL
  ];

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          const isTileCache =
            key.startsWith("wwm-main-") ||
            key.startsWith("wwm-hutuo-") ||
            key.startsWith("wwm-royal-") ||
            key.startsWith("wwm-tiles-"); // purge legacy

          if (isTileCache && !validCaches.includes(key)) {
            console.log("[SW] Delete old cache:", key);
            logToClients("Delete old cache: " + key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ===============================
// FETCH INTERCEPTOR (tile cache)
// ===============================
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // hanya intercept tile
  if (!url.startsWith(TILE_URL_PREFIX)) return;

  const isHutuo = url.includes("/hutuo/");
  const isRoyal = url.includes("/royal_palace/");

  let cacheName = CACHE_MAIN;

  if (isHutuo) {
    cacheName = CACHE_HUTUO;
  } else if (isRoyal) {
    cacheName = CACHE_ROYAL;
  }

  event.respondWith(
    caches.open(cacheName).then(async (cache) => {

      const cached = await cache.match(event.request);

      if (cached) {
        console.log("🟡 [SW] CACHE:", url);
        logToClients("CACHE → " + url);
        return cached;
      }

      try {
        const network = await fetch(event.request);

        if (network.status === 200) {
          cache.put(event.request, network.clone());
        }

        console.log("🟢 [SW] SERVER:", url);
        logToClients("SERVER → " + url);

        return network;
      } catch (err) {
        console.error("🔴 [SW] Network error:", err);
        logToClients("NETWORK ERROR → " + url);

        return cached || Response.error();
      }
    })
  );
});