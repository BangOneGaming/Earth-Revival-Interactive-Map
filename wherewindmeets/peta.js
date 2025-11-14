/**
 * Map initialization module
 */

// Map configuration
const MAP_CONFIG = {
  center: { lat: 128, lng: 128 },
  zoom: {
    initial: 3,
    min: 3,
    max: 8
  },
  tiles: {
    url: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/tiles/{z}_{x}_{y}.webp",
    errorTileUrl: ""
  }
};

let map;

/**
 * Initialize the Leaflet map
 */
function initializeMap() {
  // Tile bounds (EDIT SESUAI TILE KAMU)
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
  }).setView([MAP_CONFIG.center.lat, MAP_CONFIG.center.lng], MAP_CONFIG.zoom.initial);

  const tileLayer = L.tileLayer(MAP_CONFIG.tiles.url, {
    minZoom: MAP_CONFIG.zoom.min,
    maxZoom: MAP_CONFIG.zoom.max,
    noWrap: true,
    crossOrigin: true,
    errorTileUrl: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/tiles/7_127_126.webp"
  }).addTo(map);

  return map;
}