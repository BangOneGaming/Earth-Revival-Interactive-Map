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
  // Create custom CRS
  const crsSimple = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0)
  });

  // Create map instance
  map = L.map('map', {
    crs: crsSimple,
    minZoom: MAP_CONFIG.zoom.min,
    maxZoom: MAP_CONFIG.zoom.max,
    zoomControl: true,
    attributionControl: false
  }).setView([MAP_CONFIG.center.lat, MAP_CONFIG.center.lng], MAP_CONFIG.zoom.initial);

  // Add tile layer
  const tileLayer = L.tileLayer(MAP_CONFIG.tiles.url, {
    minZoom: MAP_CONFIG.zoom.min,
    maxZoom: MAP_CONFIG.zoom.max,
    noWrap: true,
    crossOrigin: true,
    errorTileUrl: MAP_CONFIG.tiles.errorTileUrl
  }).addTo(map);

  // Add center marker
  addCenterMarker();

  return map;
}

/**
 * Add a marker at the map center
 */
function addCenterMarker() {
  L.marker([MAP_CONFIG.center.lat, MAP_CONFIG.center.lng])
    .addTo(map)
    .bindPopup(`Titik Tengah (${MAP_CONFIG.center.lat},${MAP_CONFIG.center.lng})`);
}

/**
 * Get the map instance
 * @returns {L.Map} The Leaflet map instance
 */
function getMap() {
  return map;
}