/**
 * Map initialization module
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
    url: "https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp"
  },
  tileVersion: "20251121" // Pastikan sama dengan SW
};

const TILE_VERSION = MAP_CONFIG.tileVersion;
const CACHE_NAME = "wwm-tiles-" + TILE_VERSION;

/* =====================================================
   SERVICE WORKER — INLINE BLOB (Pengganti sw.js)
   ===================================================== */
if ("serviceWorker" in navigator) {
  const swCode = `
    const CACHE_NAME = "${CACHE_NAME}";

    console.log("[SW] Loaded. Cache name:", CACHE_NAME);

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
      console.log("[SW] Ready.");
    });

    self.addEventListener("fetch", (event) => {
      const url = event.request.url;

      if (!url.includes("/wherewindmeet/tiles/")) return;

      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(event.request);
          if (cached) {
            console.log("SW: CACHE HIT →", url);
            return cached;
          }

          try {
            console.log("SW: NETWORK FETCH →", url);
            const fetchResponse = await fetch(event.request, { mode: "cors" });

            if (fetchResponse.ok) {
              console.log("SW: CACHED →", url);
              cache.put(event.request, fetchResponse.clone());
            } else {
              console.warn("SW: NETWORK ERROR (status not OK) →", url);
            }

            return fetchResponse;
          } catch (err) {
            console.error("SW: NETWORK FAIL → fallback to cache:", url);
            return cached || Response.error();
          }
        })
      );
    });
  `;

  const blob = new Blob([swCode], { type: "application/javascript" });
  const swURL = URL.createObjectURL(blob);

  navigator.serviceWorker.register(swURL).then(() => {
    console.log("Service Worker (inline) registered! URL:", swURL);
  }).catch((err) => {
    console.error("SW Registration Failed:", err);
  });
}

/* =====================================================
   LEAFLET MAP INITIALIZATION
   ===================================================== */

let map;

function initializeMap() {
  console.log("[MAP] Initializing Leaflet map...");

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

  map = L.map("map", {
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

  console.log("[MAP] Adding tile layer:", MAP_CONFIG.tiles.url);

  L.tileLayer(MAP_CONFIG.tiles.url + `?v=${MAP_CONFIG.tileVersion}`, {
    minZoom: MAP_CONFIG.zoom.min,
    maxZoom: MAP_CONFIG.zoom.max,
    maxNativeZoom: 7,
    noWrap: true,
    crossOrigin: true,
    errorTileUrl:
      "https://tiles.bgonegaming.win/wherewindmeet/tiles/7_127_126.webp"
  }).addTo(map);

  console.log("[MAP] Map ready.");
  return map;
}