/**
 * Map initialization module
 * Optimized Performance Version
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

    // 🔥 PERFORMANCE MODE
    preferCanvas: true,
    inertia: true,
    inertiaDeceleration: 3000,
    inertiaMaxSpeed: 1500,
    updateWhenIdle: true
  });

  // Default map — NO transition on initial load
  _applyMapPreset("main", false);

  return map;
}

// ============================================
// TILE OPTIONS (REUSABLE)
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
    errorTileUrl: FALLBACK_TILE
  };
}
// ============================================
// APPLY MAP PRESET (RAW SWITCH)
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

  // ✅ Override getTileUrl — tile di luar bounds → fallback langsung
  currentTileLayer.getTileUrl = function(coords) {
    const z = Math.min(coords.z, forcedMaxZoom);

    // Hitung tile range untuk zoom ini berdasarkan bounds di zoom forcedMaxZoom
    // Scale factor: setiap zoom turun 1, range dibagi 2
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

  // REFRESH UI
  if (typeof RegionLabelManager !== "undefined") {
    RegionLabelManager._clearLayerCache();
    RegionLabelManager._forceRefresh();
  }

  if (typeof MarkerManager !== "undefined" &&
      MarkerManager.forceRefreshMarkers)
    MarkerManager.forceRefreshMarkers();

  // ★ Clock marker — hanya tampil di preset "main"
  if (typeof TimeUndergroundMarker !== "undefined") {
    TimeUndergroundMarker.onMapPresetChange(type);
  }
}

// ============================================
// PUBLIC SWITCH (WITH TRANSITION)
// ============================================

function switchMapPreset(type, animate = true) {

  if (!map || !MAP_PRESETS[type]) return;

  if (type === currentPreset) return;

  // With transition if available
  if (typeof MapTransition !== "undefined") {
    MapTransition.play(type, () => {
      _applyMapPreset(type, animate);
    });
    return;
  }

  // Fallback
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
