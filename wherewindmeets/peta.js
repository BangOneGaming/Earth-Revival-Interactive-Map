/**
 * Map initialization module
 * Supports runtime tile + center switching
 */

// ============================================
// CONFIG
// ============================================

const TILE_VERSION = "20251121"; // samakan dengan SW

// preset map
const MAP_PRESETS = {
  main: {
    center: [128, 180],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp"
  },

  hutuo: {
    center: [32, 32],
    tiles: "https://tiles.bgonegaming.win/wherewindmeet/tiles/hutuo/{z}_{x}_{y}.webp"
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
    attributionControl: false
  });

  // load default preset
  switchMapPreset("main", false);

  return map;
}

// ============================================
// SWITCH MAP PRESET
// ============================================

function switchMapPreset(type, animate = true) {
  if (!map || !MAP_PRESETS[type]) return;
  const preset = MAP_PRESETS[type];
  currentPreset = type;

  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  currentTileLayer = L.tileLayer(
    preset.tiles + `?v=${TILE_VERSION}`,
    {
      minZoom: MAP_ZOOM.min,
      maxZoom: MAP_ZOOM.max,
      maxNativeZoom: 7,
      noWrap: true,
      crossOrigin: true,
      errorTileUrl: "https://tiles.bgonegaming.win/wherewindmeet/tiles/7_127_126.webp"
    }
  ).addTo(map);

  map.setView(
    preset.center,
    MAP_ZOOM.initial,
    animate ? { animate: true, duration: 0.6 } : { animate: false }
  );

  // ✅ Sembunyikan/tampilkan RegionManager & RegionLabelManager
  if (type === 'hutuo') {
    // Sembunyikan region UI
    const regionContainer = document.querySelector('.region-container');
    if (regionContainer) regionContainer.style.display = 'none';
    
    // Sembunyikan region labels
    if (typeof RegionLabelManager !== 'undefined') {
      RegionLabelManager.hide();
    }
    
    // Reset region ke 'all' tanpa trigger refresh dulu
    if (typeof RegionManager !== 'undefined') {
      RegionManager.activeRegion = 'all';
    }
  } else {
    // Tampilkan kembali region UI
    const regionContainer = document.querySelector('.region-container');
    if (regionContainer) regionContainer.style.display = '';
    
    // Tampilkan region labels
    if (typeof RegionLabelManager !== 'undefined') {
      RegionLabelManager.show();
    }
  }

  // Refresh markers sesuai map baru
  if (typeof MarkerManager !== 'undefined' && MarkerManager.forceRefreshMarkers) {
    MarkerManager.forceRefreshMarkers();
  }
}

// ============================================
// OPTIONAL HELPERS
// ============================================

function toggleMapPreset() {
  const next = currentPreset === "main" ? "hutuo" : "main";
  switchMapPreset(next);
}

function getCurrentMapPreset() {
  return currentPreset;
}