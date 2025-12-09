/**
 * ======================================================
 * COMBINED: Leaflet Map + Embedded Service Worker
 * Caching Optimized for Cloudflare R2
 * ======================================================
 */

// Map configuration
const MAP_CONFIG = {
  center: { lat: 128, lng: 180 },
  zoom: {
    initial: 5,
    min: 3,
    max: 8
  },
  tiles: {
    url: "https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp",
    errorTileUrl: ""
  },
  tileVersion: "20251121" // MUST match cache version
};

let map;

/* ======================================================
   1. REGISTER SERVICE WORKER (INLINE BLOB VERSION)
====================================================== */
function registerInlineServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("SW not supported");
    return;
  }

  const swCode = `
    const TILE_VERSION = "${MAP_CONFIG.tileVersion}";
    const CACHE_NAME = "wwm-tiles-" + TILE_VERSION;

    self.addEventListener("install", (event) => {
      console.log("[SW] Install version:", TILE_VERSION);
      self.skipWaiting();
    });

    self.addEventListener("activate", (event) => {
      console.log("[SW] Activated. Using cache:", CACHE_NAME);

      event.waitUntil(
        caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("wwm-tiles-") && key !== CACHE_NAME)
              .map((oldKey) => {
                console.log("[SW] Deleting old cache:", oldKey);
                return caches.delete(oldKey);
              })
          )
        )
      );

      self.clients.claim();
    });

    self.addEventListener("fetch", (event) => {
      const url = event.request.url;

      if (!url.includes("/wherewindmeet/tiles/")) return;

      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(event.request);

          if (cached) {
            console.log("[SW] Cache hit:", url);
            return cached;
          }

          console.log("[SW] Cache miss → fetch:", url);

          try {
            const response = await fetch(event.request, { mode: "cors" });

            if (response.ok) {
              cache.put(event.request, response.clone());
              console.log("[SW] Stored to cache:", url);
            } else {
              console.warn("[SW] Network error:", response.status, url);
            }

            return response;
          } catch (err) {
            console.error("[SW] Fetch failed, fallback to cache:", url);
            return cached || Response.error();
          }
        })
      );
    });
  `;

  // Buat blob file sw dari kode string
  const blob = new Blob([swCode], { type: "application/javascript" });
  const swURL = URL.createObjectURL(blob);

  navigator.serviceWorker.register(swURL).then(() => {
    console.log("[SW] Registered via Blob URL");
  }).catch(err => {
    console.error("[SW] Registration failed:", err);
  });
}

/* ======================================================
   2. INITIALIZE LEAFLET MAP
====================================================== */
function initializeMap() {
  const TILE_BOUNDS = {
    minX: 0,
    maxX: 256,
    minY: 0,
    maxY: 256
  };

  const PAN_BUFFER = 50;

  const mapBounds = [
    [TILE_BOUNDS.minY - PAN_BUFFER, TILE_BOUNDS.minX - PAN_BUFFER],
    [TILE_BOUNDS.maxY + PAN_BUFFER, TILE_BOUNDS.maxX + PAN_BUFFER]
  ];

  const crsSimple = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0)
  });

  map = L.map('map', {
    crs: crsSimple,
    minZoom: MAP_CONFIG.zoom.min,
    maxZoom: MAP_CONFIG.zoom.max,
    maxBounds: mapBounds,
    maxBoundsViscosity: 0.7,
    zoomControl: true,
    attributionControl: false
  }).setView(
    [MAP_CONFIG.center.lat, MAP_CONFIG.center.lng],
    MAP_CONFIG.zoom.initial
  );

  // Tile layer with version
  const tileURL = MAP_CONFIG.tiles.url + `?v=${MAP_CONFIG.tileVersion}`;
  const tileLayer = L.tileLayer(tileURL, {
    minZoom: MAP_CONFIG.zoom.min,
    maxZoom: MAP_CONFIG.zoom.max,
    maxNativeZoom: 7,
    noWrap: true,
    crossOrigin: true,
    errorTileUrl: "https://tiles.bgonegaming.win/wherewindmeet/tiles/7_127_126.webp"
  });

  // Add Leaflet load logs
  tileLayer.on("tileloadstart", (e) => {
    console.log("[Leaflet] Start loading:", e.tile.src);
  });

  tileLayer.on("tileload", (e) => {
    console.log("[Leaflet] Tile loaded:", e.tile.src);
  });

  tileLayer.on("tileerror", (e) => {
    console.error("[Leaflet] Tile failed:", e.tile.src);
  });

  tileLayer.addTo(map);

  return map;
}

/* ======================================================
   3. AUTO EXECUTE WHEN PAGE LOADS
====================================================== */
window.addEventListener("load", () => {
  registerInlineServiceWorker();
  initializeMap();
});