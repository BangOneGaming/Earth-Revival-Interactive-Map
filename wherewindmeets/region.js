/**
 * Region Label Manager
 * Displays region/area names on the map based on zoom level
 * Labels are text-only (no popup), with black text and white stroke
 * 
 * @author Where Wind Meet Map
 * @version 1.1.0 - Added show/hide methods
 */

const RegionLabelManager = (function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
const LABEL_CONFIG = {
  // Zoom level 3–4: Major regions (PALING BESAR)
  zoom_3_4: [
    { name: 'Kaifeng', lat: 159.1016220096778, lng: 167.6629340648651, size: 60 },
    { name: 'Qinghe',  lat: 130.2765, lng: 187.7205, size: 60 }
  ],

// Zoom level 5: Sub-regions (SEDANG)
zoom_5: [
  // Existing
  { name: 'Verdant Wilds',      lat: 130.92766841618575, lng: 198.2494502067566, size: 26 },
  { name: 'Moonveil Mountain',  lat: 131.34873125328068, lng: 182.43181371688843, size: 26 },
  { name: 'Sundara Land',       lat: 120.95253073067192, lng: 187.95543956756592, size: 26 },

  // Kaifeng surroundings
  { name: 'Kaifeng City',       lat: 148.45886927147313, lng: 167.75539636611938, size: 26 },
  { name: 'Granary of Plenty',  lat: 165.93423477511217, lng: 175.93012166023254,    size: 26 },
  { name: 'Jadewood Court',     lat: 161.8376638217751, lng: 161.29809069633484,    size: 26 },
  { name: 'Roaring Sands',      lat: 141.4049587992937, lng: 155.73852682113647,    size: 26 }
],

// Zoom level 6: Subareas
zoom_6:[
  {
    "name": "General's Shrine",
    "lat": 126.59796527592282,
    "lng": 199.10370540618896,
    "size": 24
  },
  {
    "name": "Battlecrest Slope",
    "lat": 131.52268447793867,
    "lng": 197.35526585578918,
    "size": 24
  },
  {
    "name": "Bamboo Abode",
    "lat": 129.73471708631573,
    "lng": 203.6599099636078,
    "size": 24
  },
  {
    "name": "Stonewash Strand",
    "lat": 130.86946666642726,
    "lng": 194.40923023223877,
    "size": 24
  },
  {
    "name": "Heaven's Pier",
    "lat": 130.916586318673,
    "lng": 188.7513885498047,
    "size": 24
  },
  {
    "name": "Kilnfire Ridge",
    "lat": 129.78432780622546,
    "lng": 183.92233777046204,
    "size": 24
  },
  {
    "name": "Blissful Retreat",
    "lat": 127.12438554913957,
    "lng": 182.99103021621704,
    "size": 24
  },
  {
    "name": "Still Shore",
    "lat": 128.45357022518095,
    "lng": 180.81885075569153,
    "size": 24
  },
  {
    "name": "Witherwilds",
    "lat": 132.3101869396634,
    "lng": 178.53326153755188,
    "size": 24
  },
  {
    "name": "Palace of Annals",
    "lat": 139.28523420380762,
    "lng": 188.06394863128662,
    "size": 24
  },
  {
    "name": "Harvestfall Village",
    "lat": 127.75071038168889,
    "lng": 175.62401056289673,
    "size": 24
  },
  {
    "name": "Crimson Cliff",
    "lat": 134.21989715401813,
    "lng": 192.42726707458496,
    "size": 24
  },
  {
    "name": "Gleaming Abyss",
    "lat": 132.98367045899263,
    "lng": 175.09477710723877,
    "size": 24
  },
  {
    "name": "Peace Bell Tower",
    "lat": 132.47593180588146,
    "lng": 185.66406679153442,
    "size": 24
  },
  {
    "name": "Riverview Terrace",
    "lat": 135.15185999864502,
    "lng": 176.26929903030396,
    "size": 24
  },
  {
    "name": "Twinbeast Ridge",
    "lat": 138.0148942475086,
    "lng": 181.1453709602356,
    "size": 24
  },
  {
    "name": "Sage's Knoll",
    "lat": 136.90784398678176,
    "lng": 185.75070571899414,
    "size": 24
  },
  {
    "name": "Encircling Lake",
    "lat": 141.92103297366836,
    "lng": 182.9059567451477,
    "size": 24
  },
  {
    "name": "Riverside Station",
    "lat": 132.21474461735212,
    "lng": 172.29927253723145,
    "size": 24
  },
  {
    "name": "Halo Peak",
    "lat": 119.79133309588832,
    "lng": 188.4454526901245,
    "size": 24
  },
  {
    "name": "Bodhi Sea",
    "lat": 122.29576329772985,
    "lng": 195.81764221191406,
    "size": 24
  },
  {
    "name": "Mercyheart Town",
    "lat": 119.99953143271846,
    "lng": 181.5227644443512,
    "size": 24
  },
  {
    "name": "Finesteed Hamlet",
    "lat": 120.44150986689361,
    "lng": 200.13313150405884,
    "size": 24
  },
  {
    "name": "Flower Expanse",
    "lat": 122.84122433594338,
    "lng": 183.351393699646,
    "size": 24
  },
  {
    "name": "Mercyheart Monastery",
    "lat": 114.37499158233308,
    "lng": 182.61848187446594,
    "size": 24
  },
  {
    "name": "Jadebrook Mountain",
    "lat": 124.86853631161664,
    "lng": 189.51390266418457,
    "size": 24
  },
  {
    "name": "Buddha Fort",
    "lat": 120.57231831428079,
    "lng": 205.0333957672119,
    "size": 24
  },
  {
    "name": "Wildmane Ranch",
    "lat": 124.41562653599976,
    "lng": 200.94988346099854,
    "size": 24
  },
  {
    "name": "Thousand-Buddha Village",
    "lat": 115.23659172427595,
    "lng": 190.29075527191162,
    "size": 24
  },
  {
    "name": "Floral Expanse Beyond",
    "lat": 118.13743418010517,
    "lng": 195.66948986053467,
    "size": 24
  }
]

  // Zoom level 7–8: No labels
};

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let map = null;
  let activeLabels = [];
  let currentZoom = 0;
  let isVisible = true; // Track visibility state (NEW!)

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Create label icon with text
   * @param {string} text - Label text
   * @returns {L.DivIcon}
   */
function createLabelIcon(text, fontSize) {
  return L.divIcon({
    html: `
      <div class="region-label">
        <span class="region-label-text" style="font-size:${fontSize}px">
          ${text}
        </span>
      </div>
    `,
    className: 'region-label-container',
    iconSize: [200, 40],
    iconAnchor: [100, 20]
  });
}

  /**
   * Get labels for current zoom level
   * @param {number} zoom - Current zoom level
   * @returns {Array}
   */
  function getLabelsForZoom(zoom) {
    if (zoom >= 3 && zoom <= 4) {
      return LABEL_CONFIG.zoom_3_4;
    } else if (zoom === 5) {
      return LABEL_CONFIG.zoom_5;
    } else if (zoom === 6) {
      return LABEL_CONFIG.zoom_6;
    } else if (zoom >= 7) {
      // Zoom 7 dan 8: tidak ada label
      return [];
    }
    return [];
  }

  /**
   * Clear all active labels from map
   */
  function clearLabels() {
    activeLabels.forEach(label => {
      if (map && map.hasLayer(label)) {
        map.removeLayer(label);
      }
    });
    activeLabels = [];
    console.log('🗑️ Cleared all region labels');
  }

  /**
   * Add labels to map
   * @param {Array} labels - Array of label configs
   */
  function addLabels(labels) {
    // Only add if visible (NEW!)
    if (!isVisible) {
      console.log('⏭️ Skipped adding labels (hidden)');
      return;
    }

    labels.forEach(labelConfig => {
      const icon = createLabelIcon(
  labelConfig.name,
  labelConfig.size || 18 // fallback default
);
      const marker = L.marker(
        [labelConfig.lat, labelConfig.lng],
        { 
          icon: icon,
          interactive: false, // No popup, no click events
          keyboard: false,
          zIndexOffset: 1000 // Di ATAS marker lain agar terlihat
        }
      ).addTo(map);

      activeLabels.push(marker);
      
      // Debug log
      console.log(`📍 Added label "${labelConfig.name}" at [${labelConfig.lat}, ${labelConfig.lng}]`);
    });

    console.log(`✅ Added ${labels.length} region labels`);
  }

  /**
   * Update labels based on zoom level
   * @param {number} zoom - Current zoom level
   */
  function updateLabels(zoom) {
    // Skip if zoom hasn't changed significantly
    if (Math.floor(zoom) === Math.floor(currentZoom)) {
      return;
    }

    currentZoom = zoom;
    const labels = getLabelsForZoom(Math.floor(zoom));

    // Clear existing labels
    clearLabels();

    // Add new labels if any (will check isVisible inside)
    if (labels.length > 0) {
      addLabels(labels);
      console.log(`🔄 Updated labels for zoom ${Math.floor(zoom)}`);
    }
  }

  /**
   * Setup map event listeners
   */
  function setupEventListeners() {
    if (!map) return;

    // Update on zoom end
    map.on('zoomend', function() {
      const zoom = map.getZoom();
      updateLabels(zoom);
    });

    console.log('✅ Region label event listeners setup');
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Initialize region label manager
   * @param {L.Map} leafletMap - Leaflet map instance
   */
  function init(leafletMap) {
    if (!leafletMap) {
      console.error('❌ Map instance is required for RegionLabelManager');
      return;
    }

    map = leafletMap;
    currentZoom = map.getZoom();
    isVisible = true; // Reset to visible on init

    console.log(`🗺️ RegionLabelManager init at zoom ${currentZoom}`);
    console.log(`📍 Map center:`, map.getCenter());

    // Add initial labels
    const initialLabels = getLabelsForZoom(Math.floor(currentZoom));
    console.log(`📋 Initial labels for zoom ${Math.floor(currentZoom)}:`, initialLabels);
    
    if (initialLabels.length > 0) {
      addLabels(initialLabels);
    } else {
      console.log('⚠️ No labels to show at current zoom level');
    }

    // Setup event listeners
    setupEventListeners();

    console.log('✅ RegionLabelManager initialized');
  }

  /**
   * Show labels (NEW!)
   * Re-displays labels if hidden
   */
  function show() {
    if (isVisible) {
      console.log('ℹ️ Labels already visible');
      return;
    }

    isVisible = true;
    
    // If map not initialized, do nothing
    if (!map) {
      console.warn('⚠️ Map not initialized, cannot show labels');
      return;
    }

    // Re-add labels for current zoom
    const labels = getLabelsForZoom(Math.floor(currentZoom || map.getZoom()));
    if (labels.length > 0) {
      clearLabels(); // Clear any stale labels
      addLabels(labels);
      console.log('✅ Region labels shown');
    }
  }

  /**
   * Hide labels (NEW!)
   * Removes labels without destroying manager
   */
  function hide() {
    if (!isVisible) {
      console.log('ℹ️ Labels already hidden');
      return;
    }

    isVisible = false;
    clearLabels();
    console.log('✅ Region labels hidden');
  }

  /**
   * Add or update label configuration
   * @param {number} zoomLevel - Zoom level (3-4, 5, or 6)
   * @param {Array} labels - Array of label configs
   */
  function addLabelConfig(zoomLevel, labels) {
    if (zoomLevel >= 3 && zoomLevel <= 4) {
      LABEL_CONFIG.zoom_3_4 = labels;
    } else if (zoomLevel === 5) {
      LABEL_CONFIG.zoom_5 = labels;
    } else if (zoomLevel === 6) {
      LABEL_CONFIG.zoom_6 = labels;
    }

    // Refresh if currently at this zoom level
    if (map && isVisible) {
      updateLabels(map.getZoom());
    }

    console.log(`✅ Updated label config for zoom ${zoomLevel}`);
  }

  /**
   * Manually refresh labels
   */
  function refresh() {
    if (!map) return;
    if (!isVisible) {
      console.log('⏭️ Skipped refresh (hidden)');
      return;
    }
    updateLabels(map.getZoom());
  }

  /**
   * Destroy manager and remove all labels
   */
  function destroy() {
    clearLabels();
    if (map) {
      map.off('zoomend');
    }
    map = null;
    currentZoom = 0;
    isVisible = true;
    console.log('❌ RegionLabelManager destroyed');
  }

  /**
   * Check if labels are visible (NEW!)
   * @returns {boolean}
   */
  function isLabelsVisible() {
    return isVisible;
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  return {
    init,
    show,        // NEW!
    hide,        // NEW!
    addLabelConfig,
    refresh,
    destroy,
    isVisible: isLabelsVisible // NEW!
  };

})();

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.RegionLabelManager = RegionLabelManager;

console.log('✅ RegionLabelManager module loaded (v1.1.0 with show/hide)');