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
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp"
  },

  hutuo: {
    center: [32, 32],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/hutuo/{z}_{x}_{y}.webp"
  },

  royal_palace: {
    center: [30, 30],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/royal_palace/{z}_{x}_{y}.webp"
  },

  // 🔥 NEW MAP
  dreamspace: {
    center: [36, 18], // sesuaikan jika ukuran berbeda
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/dreamscape/{z}_{x}_{y}.webp"
  }
};

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

    // 🔥 PERFORMANCE BOOST
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
    reuseTiles: true,

    noWrap: true,
    crossOrigin: true,
    errorTileUrl:
      "https://tiles.bgonegaming.win/wherewindmeet/tiles/7_127_126.webp"
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

  // SPECIAL MAPS (ZOOM CLAMP)
  if (type === "hutuo" || type === "royal_palace" || type === "dreamspace") {

    let forcedMaxZoom = 7;

    if (type === "hutuo") forcedMaxZoom = 6;
    if (type === "royal_palace") forcedMaxZoom = 7;
    if (type === "dreamspace") forcedMaxZoom = 6;

    currentTileLayer = L.tileLayer(
      preset.tiles + `?v=${TILE_VERSION}`,
      getTileOptions(forcedMaxZoom)
    );

    currentTileLayer.getTileUrl = function(coords) {
      const forcedZoom = Math.min(coords.z, forcedMaxZoom);
      return L.Util.template(this._url, {
        x: coords.x,
        y: coords.y,
        z: forcedZoom
      });
    };

  } else {

    currentTileLayer = L.tileLayer(
      preset.tiles + `?v=${TILE_VERSION}`,
      getTileOptions(7)
    );

  }

  currentTileLayer.addTo(map);

  map.setView(
    preset.center,
    MAP_ZOOM.initial,
    animate
      ? { animate: true, duration: 0.4 }
      : { animate: false }
  );

  // REFRESH UI
  if (typeof RegionLabelManager !== "undefined")
    RegionLabelManager._forceRefresh();

  if (typeof MarkerManager !== "undefined" &&
      MarkerManager.forceRefreshMarkers)
    MarkerManager.forceRefreshMarkers();
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
