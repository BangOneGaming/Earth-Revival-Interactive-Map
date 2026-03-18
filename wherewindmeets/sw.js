// ===============================
//  CONFIG
// ===============================
const TILE_VERSION = "20251121"; // Samakan dengan peta.js
const CACHE_NAME       = "wwm-tiles-"  + TILE_VERSION;
const ICON_CACHE_NAME  = "wwm-icons-"  + TILE_VERSION;

const TILE_URL_PREFIX = "https://tiles.bgonegaming.win/wherewindmeet/tiles/";
const ICON_URL_PREFIX = "https://tiles.bgonegaming.win/wherewindmeet/Simbol/";

// ===============================
//  INSTALL
// ===============================
self.addEventListener("install", (event) => {
  console.log("[SW] Installed");
  self.skipWaiting();
});

// ===============================
//  ACTIVATE — hapus cache lama
// ===============================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          const isOldTile = key.startsWith("wwm-tiles-") && key !== CACHE_NAME;
          const isOldIcon = key.startsWith("wwm-icons-") && key !== ICON_CACHE_NAME;
          if (isOldTile || isOldIcon) {
            console.log("[SW] Delete old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===============================
//  FETCH INTERCEPTOR
// ===============================
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // ── MAP TILES ── CacheFirst
  if (url.startsWith(TILE_URL_PREFIX)) {
    event.respondWith(handleCacheFirst(event.request, CACHE_NAME, "TILE"));
    return;
  }

  // ── ICON / SIMBOL ── CacheFirst (persistent, lintas tab & session)
  if (url.startsWith(ICON_URL_PREFIX)) {
    event.respondWith(handleCacheFirst(event.request, ICON_CACHE_NAME, "ICON"));
    return;
  }
});

// ===============================
//  HELPER — CacheFirst strategy
// ===============================
async function handleCacheFirst(request, cacheName, label) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log(`🟡 [SW] ${label} from CACHE:`, request.url);
    return cachedResponse;
  }

  console.log(`🟢 [SW] ${label} from SERVER:`, request.url);

  try {
    const fetchResponse = await fetch(request);
    if (fetchResponse.status === 200) {
      cache.put(request, fetchResponse.clone());
    }
    return fetchResponse;
  } catch (e) {
    console.error(`🔴 [SW] Network error (${label}):`, e);
    return Response.error();
  }
}