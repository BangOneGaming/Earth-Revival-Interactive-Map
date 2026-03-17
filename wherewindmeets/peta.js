/**
 * Map initialization module
 * 🔥 Optimized Performance + Smooth Fractional Zoom
 */

// ============================================
// CONFIG
// ============================================

const TILE_VERSION = "20251121";

const MAP_PRESETS = {
  main: {
    center: [128, 180],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp",
    tileBounds: { minX: 0, maxX: 255, minY: 0, maxY: 255 }
  },

  hutuo: {
    center: [34, 18],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/hutuo/{z}_{x}_{y}.webp",
    tileBounds: { minX: 0, maxX: 63, minY: 0, maxY: 63 }
  },

  royal_palace: {
    center: [30, 30],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/royal_palace/{z}_{x}_{y}.webp",
    tileBounds: { minX: 0, maxX: 63, minY: 0, maxY: 63 }
  },

  dreamspace: {
    center: [36, 18],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/dreamscape/{z}_{x}_{y}.webp",
    tileBounds: { minX: 0, maxX: 63, minY: 0, maxY: 63 }
  }
};

const FALLBACK_TILE = "https://tiles.bgonegaming.win/wherewindmeet/tiles/7_127_126.webp";

const MAP_ZOOM = {
  initial: 5,
  min: 3,
  max: 8
};

// ============================================
// PRECONNECT
// ============================================

(function () {
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://tiles.bgonegaming.win";
  preconnect.crossOrigin = "";
  document.head.appendChild(preconnect);
})();

// ============================================
// STATE
// ============================================

let map;
let currentTileLayer = null;
let currentPreset = "main";

// ============================================
// INIT MAP
// ============================================

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

  map = L.map("map", {
    crs: crsSimple,
    minZoom: MAP_ZOOM.min,
    maxZoom: MAP_ZOOM.max,
    maxBounds: mapBounds,
    maxBoundsViscosity: 0.7,
    zoomControl: true,
    attributionControl: false,

    // ✅ FRACTIONAL ZOOM — kunci smooth zoom
    zoomSnap: 0.1,    // snap ke 0.1 increments (5.0, 5.1, 5.2, dst)
    zoomDelta: 0.5,   // setiap klik zoom button bergerak 0.5 level
    wheelPxPerZoomLevel: 120, // scroll wheel sensitivity (lebih besar = lebih lambat)

    // ✅ PERFORMANCE
    preferCanvas: true,
    inertia: true,
    inertiaDeceleration: 3000,
    inertiaMaxSpeed: 1500,
    updateWhenIdle: true,

    // ✅ SMOOTH ANIMATION
    zoomAnimation: true,
    zoomAnimationThreshold: 4,
    fadeAnimation: true,
    markerZoomAnimation: true
  });

  _applyMapPreset("main", false);

  return map;
}

// ============================================
// TILE OPTIONS
// ============================================

function getTileOptions(maxNativeZoom) {
  return {
    minZoom: MAP_ZOOM.min,
    maxZoom: MAP_ZOOM.max,
    maxNativeZoom: maxNativeZoom,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
    reuseTiles: true,
    noWrap: true,
    crossOrigin: true,
    errorTileUrl: FALLBACK_TILE,
    tileSize: 256,
    className: 'map-tiles'
  };
}

// ============================================
// APPLY MAP PRESET
// ============================================

function _applyMapPreset(type, animate = true) {

  if (!map || !MAP_PRESETS[type]) return;

  const preset = MAP_PRESETS[type];
  currentPreset = type;

  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  const forcedMaxZoom =
    type === "hutuo"        ? 6 :
    type === "dreamspace"   ? 6 :
    type === "royal_palace" ? 7 : 7;

  const bounds = preset.tileBounds;

  currentTileLayer = L.tileLayer(
    preset.tiles + `?v=${TILE_VERSION}`,
    getTileOptions(forcedMaxZoom)
  );

  // ============================================
  // TILE PRIORITY
  // ============================================

  currentTileLayer.on("tileloadstart", function(e) {
    if (!e.tile) return;
    e.tile.setAttribute("loading", "eager");
    e.tile.setAttribute("fetchpriority", "high");
    e.tile.setAttribute("decoding", "async");
    e.tile.style.contentVisibility = "auto";
  });

  currentTileLayer.on("tileload", function(e) {
    if (e.tile) {
      e.tile.style.willChange = "transform";
    }
  });

  // ============================================
  // TILE FILTER (BOUND SAFE)
  // ============================================

  currentTileLayer.getTileUrl = function(coords) {
    const z = Math.min(coords.z, forcedMaxZoom);

    const scale = Math.pow(2, forcedMaxZoom - z);
    const minTX = Math.floor(bounds.minX / scale);
    const maxTX = Math.floor(bounds.maxX / scale);
    const minTY = Math.floor(bounds.minY / scale);
    const maxTY = Math.floor(bounds.maxY / scale);

    if (
      coords.x < minTX || coords.x > maxTX ||
      coords.y < minTY || coords.y > maxTY
    ) {
      return FALLBACK_TILE;
    }

    return L.Util.template(this._url, {
      x: coords.x,
      y: coords.y,
      z: z
    });
  };

  currentTileLayer.addTo(map);

  map.setView(
    preset.center,
    MAP_ZOOM.initial,
    animate
      ? { animate: true, duration: 0.4 }
      : { animate: false }
  );

  // ============================================
  // FORCE FAST RENDER
  // ============================================

  map.whenReady(() => {
    requestAnimationFrame(() => {
      map.invalidateSize(true);
    });
  });

  // ============================================
  // REFRESH SYSTEM
  // ============================================

  if (typeof RegionLabelManager !== "undefined") {
    RegionLabelManager._clearLayerCache();
    RegionLabelManager._forceRefresh();
  }

  if (typeof MarkerManager !== "undefined" &&
      MarkerManager.forceRefreshMarkers)
    MarkerManager.forceRefreshMarkers();

  if (typeof TimeUndergroundMarker !== "undefined") {
    TimeUndergroundMarker.onMapPresetChange(type);
  }
}

// ============================================
// SWITCH MAP
// ============================================

function switchMapPreset(type, animate = true) {

  if (!map || !MAP_PRESETS[type]) return;
  if (type === currentPreset) return;

  if (typeof MapTransition !== "undefined") {
    MapTransition.play(type, () => {
      _applyMapPreset(type, animate);
    });
    return;
  }

  _applyMapPreset(type, animate);
}

// ============================================
// HELPERS
// ============================================

function toggleMapPreset() {
  const order = ["main", "hutuo", "royal_palace", "dreamspace"];
  const currentIndex = order.indexOf(currentPreset);
  const next = order[(currentIndex + 1) % order.length];
  switchMapPreset(next);
}

function getCurrentMapPreset() {
  return currentPreset;
}