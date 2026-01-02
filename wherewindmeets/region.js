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
    { name: 'Qinghe',  lat: 130.2765, lng: 187.7205, size: 60 },
    { name: 'Bujian Mountain',  lat: 102.05143525952718, lng: 196.66018867492676, size: 60 }
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
zoom_6: [
  {
    "name": "General's Shrine",
    "lat": 126.906249,
    "lng": 199.624994,
    "size": 24
  },
  {
    "name": "Battlecrest Slope",
    "lat": 131.687499,
    "lng": 197.781244,
    "size": 24
  },
  {
    "name": "Bamboo Abode",
    "lat": 129.906249,
    "lng": 204.687494,
    "size": 24
  },
  {
    "name": "Stonewash Strand",
    "lat": 130.687499,
    "lng": 194.812494,
    "size": 24
  },
  {
    "name": "Kilnfire Ridge",
    "lat": 129.562499,
    "lng": 184.187494,
    "size": 24
  },
  {
    "name": "Pallace of Annals",
    "lat": 139.312499,
    "lng": 189.031244,
    "size": 24
  },
  {
    "name": "Heaven Pier's",
    "lat": 130.687499,
    "lng": 189.374994,
    "size": 24
  },
  {
    "name": "Blissful Retreat",
    "lat": 126.874999,
    "lng": 183.312494,
    "size": 24
  },
  {
    "name": "Harvest Village",
    "lat": 128.031249,
    "lng": 176.156244,
    "size": 24
  },
  {
    "name": "Witherwilds",
    "lat": 132.281249,
    "lng": 179.062494,
    "size": 24
  },
  {
    "name": "Crimson Cliff",
    "lat": 134.749999,
    "lng": 192.812494,
    "size": 24
  },
  {
    "name": "Peace Bell Tower",
    "lat": 132.406249,
    "lng": 186.687494,
    "size": 24
  },
  {
    "name": "Riverview Terrace",
    "lat": 135.593749,
    "lng": 176.687494,
    "size": 24
  },
  {
    "name": "Twinbeast Ridge",
    "lat": 138.343749,
    "lng": 181.531244,
    "size": 24
  },
  {
    "name": "Sage's Knoll",
    "lat": 137.374999,
    "lng": 185.781244,
    "size": 24
  },
  {
    "name": "Encircling Lake",
    "lat": 142.156249,
    "lng": 183.093744,
    "size": 24
  },
  {
    "name": "Gleaming Abbys",
    "lat": 133.187499,
    "lng": 175.374994,
    "size": 24
  },
  {
    "name": "Still Shores",
    "lat": 128.437499,
    "lng": 181.468744,
    "size": 24
  },
  {
    "name": "Mercyheart Town",
    "lat": 119.937499,
    "lng": 182.031244,
    "size": 24
  },
  {
    "name": "Hallo Peak",
    "lat": 119.781249,
    "lng": 188.906244,
    "size": 24
  },
  {
    "name": "Thousand Buddha Village",
    "lat": 115.843749,
    "lng": 190.749994,
    "size": 24
  },
  {
    "name": "Floral Expanse Beyond",
    "lat": 118.406249,
    "lng": 197.187494,
    "size": 24
  },
  {
    "name": "Bodhi Sea",
    "lat": 122.624999,
    "lng": 196.124994,
    "size": 24
  },
  {
    "name": "Finesteed",
    "lat": 120.468749,
    "lng": 200.812494,
    "size": 24
  },
  {
    "name": "Flower Expanse",
    "lat": 123.156249,
    "lng": 183.624994,
    "size": 24
  },
  {
    "name": "Mercyhearth Monastery",
    "lat": 114.624999,
    "lng": 183.499994,
    "size": 24
  },
  {
    "name": "Jadebrook Mountain",
    "lat": 125.031249,
    "lng": 190.093744,
    "size": 24
  },
  {
    "name": "Buddha Fort",
    "lat": 121.156249,
    "lng": 205.218744,
    "size": 24
  },
  {
    "name": "Wildmare Ranch",
    "lat": 124.687499,
    "lng": 201.781244,
    "size": 24
  },
  {
    "name": "Song Dynasty Palace",
    "lat": 144.812499,
    "lng": 168.562494,
    "size": 24
  },
  {
    "name": "Prosperity Haven ",
    "lat": 142.906249,
    "lng": 164.218744,
    "size": 24
  },
  {
    "name": "Kifeng Prefecture",
    "lat": 150.156249,
    "lng": 168.406244,
    "size": 24
  },
  {
    "name": "Furnace Area",
    "lat": 148.843749,
    "lng": 164.249994,
    "size": 24
  },
  {
    "name": "Imperial Artisan Court",
    "lat": 154.593749,
    "lng": 163.968744,
    "size": 24
  },
  {
    "name": "Velvet Shade",
    "lat": 143.249999,
    "lng": 172.124994,
    "size": 24
  },
  {
    "name": "Fairgrounds",
    "lat": 152.874999,
    "lng": 172.499994,
    "size": 24
  },
  {
    "name": "South Gate Avenue",
    "lat": 154.156249,
    "lng": 168.656244,
    "size": 24
  },
  {
    "name": "Stillhearth Grove",
    "lat": 143.437499,
    "lng": 176.906244,
    "size": 24
  },
  {
    "name": "Abandoned Mercy Hall",
    "lat": 146.999999,
    "lng": 181.812494,
    "size": 24
  },
  {
    "name": "Kaifeng Suburbs-East",
    "lat": 149.406249,
    "lng": 176.312494,
    "size": 24
  },
  {
    "name": "Mistveil Forest",
    "lat": 152.999999,
    "lng": 180.312494,
    "size": 24
  },
  {
    "name": "Heavenfall",
    "lat": 134.249999,
    "lng": 164.656244,
    "size": 24
  },
  {
    "name": "Baima Crossing",
    "lat": 137.218749,
    "lng": 171.749994,
    "size": 24
  },
  {
    "name": "Kaifeng Suburbs-North",
    "lat": 138.062499,
    "lng": 164.781244,
    "size": 24
  },
  {
    "name": "Fishwood River",
    "lat": 137.656249,
    "lng": 156.374994,
    "size": 24
  },
  {
    "name": "Enternal Mountain",
    "lat": 144.468749,
    "lng": 153.156244,
    "size": 24
  },
  {
    "name": "Kaifeng Suburbs-West",
    "lat": 143.749999,
    "lng": 160.093744,
    "size": 24
  },
  {
    "name": "Starveil Grassland",
    "lat": 148.749999,
    "lng": 154.343744,
    "size": 24
  },
  {
    "name": "Wansheng Town",
    "lat": 148.843749,
    "lng": 159.906244,
    "size": 24
  },
  {
    "name": "ghost market",
    "lat": 158.031249,
    "lng": 168.406244,
    "size": 24
  },
  {
    "name": "Forsaken Quarter",
    "lat": 155.718749,
    "lng": 172.718744,
    "size": 24
  },
  {
    "name": "Unbound Cavern",
    "lat": 155.968749,
    "lng": 174.874994,
    "size": 24
  },
  {
    "name": "Jiuliumen Station",
    "lat": 160.187499,
    "lng": 167.187494,
    "size": 24
  },
  {
    "name": "Jinming Pool",
    "lat": 156.156249,
    "lng": 157.812494,
    "size": 24
  },
  {
    "name": "Petalfall Crossing",
    "lat": 162.999999,
    "lng": 156.999994,
    "size": 24
  },
  {
    "name": "North Imperial Garrden",
    "lat": 159.812499,
    "lng": 159.656244,
    "size": 24
  },
  {
    "name": "South Imperial Garden",
    "lat": 163.624999,
    "lng": 161.374994,
    "size": 24
  },
  {
    "name": "Masterwood Hamlet",
    "lat": 160.718749,
    "lng": 164.562494,
    "size": 24
  },
  {
    "name": "Buddha Statue Site",
    "lat": 164.874999,
    "lng": 164.749994,
    "size": 24
  },
  {
    "name": "Grand Canal",
    "lat": 163.999999,
    "lng": 170.156244,
    "size": 24
  },
  {
    "name": "Pipa Chasm",
    "lat": 167.593749,
    "lng": 159.406244,
    "size": 24
  },
  {
    "name": "Dreamfall Cliff",
    "lat": 167.718749,
    "lng": 168.437494,
    "size": 24
  },
  {
    "name": "Sorrowfield Village",
    "lat": 157.124999,
    "lng": 177.687494,
    "size": 24
  },
  {
    "name": "Kaifeng Suburbs-South",
    "lat": 158.437499,
    "lng": 168.906244,
    "size": 24
  },
  {
    "name": "Plainfield",
    "lat": 161.999999,
    "lng": 174.562494,
    "size": 24
  },
  {
    "name": "Ever-Normal Granary",
    "lat": 164.562499,
    "lng": 177.968744,
    "size": 24
  },
  {
    "name": "Martial Temple",
    "lat": 167.906249,
    "lng": 164.531244,
    "size": 24
  },
  {
    "name": "Gracetown",
    "lat": 172.906249,
    "lng": 174.281244,
    "size": 24
  },
  {
    "name": "Desperation Ridge",
    "lat": 173.937499,
    "lng": 184.031244,
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
      

    });

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
      
      return;
    }

    map = leafletMap;
    currentZoom = map.getZoom();
    isVisible = true; // Reset to visible on init

    
    // Add initial labels
    const initialLabels = getLabelsForZoom(Math.floor(currentZoom));
    
    
    if (initialLabels.length > 0) {
      addLabels(initialLabels);
    } else {
      console.log('⚠️ No labels to show at current zoom level');
    }

    // Setup event listeners
    setupEventListeners();

    
  }

  /**
   * Show labels (NEW!)
   * Re-displays labels if hidden
   */
  function show() {
    if (isVisible) {
      
      return;
    }

    isVisible = true;
    
    // If map not initialized, do nothing
    if (!map) {
      
      return;
    }

    // Re-add labels for current zoom
    const labels = getLabelsForZoom(Math.floor(currentZoom || map.getZoom()));
    if (labels.length > 0) {
      clearLabels(); // Clear any stale labels
      addLabels(labels);
      
    }
  }

  /**
   * Hide labels (NEW!)
   * Removes labels without destroying manager
   */
  function hide() {
    if (!isVisible) {
      
      return;
    }

    isVisible = false;
    clearLabels();
    
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