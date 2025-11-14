/**
 * Data loader module for fetching marker data from API endpoints
 */

console.log("📦 Loading data-loader.js...");

// API endpoints configuration
const DATA_ENDPOINTS = {
  list: 'https://autumn-dream-8c07.square-spon.workers.dev/list',
  batu: 'https://autumn-dream-8c07.square-spon.workers.dev/batu',
  aneh: 'https://autumn-dream-8c07.square-spon.workers.dev/aneh',
  cave: 'https://autumn-dream-8c07.square-spon.workers.dev/cave',
  soundofheaven: 'https://autumn-dream-8c07.square-spon.workers.dev/soundofheaven',
  windofpath: 'https://autumn-dream-8c07.square-spon.workers.dev/windofpath',
  windofsacriface: 'https://autumn-dream-8c07.square-spon.workers.dev/windofsacriface',
  relic: 'https://autumn-dream-8c07.square-spon.workers.dev/relic',
  cat: 'https://autumn-dream-8c07.square-spon.workers.dev/cat',
  injustice: 'https://autumn-dream-8c07.square-spon.workers.dev/injustice',
    adventure: 'https://autumn-dream-8c07.square-spon.workers.dev/adventure',
  meow: 'https://autumn-dream-8c07.square-spon.workers.dev/meow',
  knowladge: 'https://autumn-dream-8c07.square-spon.workers.dev/knowladge',
  story: 'https://autumn-dream-8c07.square-spon.workers.dev/story'
};

// Mapping endpoint keys to window global variables (for compatibility)
const ENDPOINT_TO_GLOBAL = {
  list: 'chest',
  batu: 'batutele',
  aneh: 'strangecollection',
  cave: 'gua',
  soundofheaven: 'yellow',
  windofpath: 'blue',
  windofsacriface: 'red',
  relic: 'peninggalan',
  cat: 'kucing',
  injustice: 'ketidakadilan',
  adventure: 'petualangan',
  meow: 'meong',
  knowladge: 'pengetahuan',
  story: 'cerita'
  
};

const DataLoader = {
  loadedData: {},
  loadingProgress: {},
  isLoading: false,

  /**
   * Initialize and load all data from endpoints
   * @returns {Promise<void>}
   */
async init() {
  console.log("🌐 Starting data load from API endpoints...");
  this.showLoadingSpinner(true);
  this.isLoading = true;

  try {
    // 1️⃣ Muat semua endpoint utama
    await this.loadAllEndpoints();
    console.log("✅ All marker data loaded successfully");

    // 2️⃣ Muat data feedback user dari endpoint FEEDBACK_USER_ENDPOINT
    const feedbackRes = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/userfeedback");
    const feedbackData = await feedbackRes.json();
    console.log("💬 Feedback data loaded:", feedbackData);

    // 3️⃣ Sinkronkan feedback ke semua markers
    if (typeof syncFeedbackToMarkers === "function") {
      Object.keys(this.loadedData).forEach(endpointKey => {
        const endpointMarkers = this.loadedData[endpointKey];
        if (endpointMarkers && typeof endpointMarkers === "object") {
          console.log(`🔄 Sync feedback → endpoint: ${endpointKey}`);
          syncFeedbackToMarkers(endpointMarkers, feedbackData);
        }
      });
      console.log("✅ Feedback successfully synchronized with markers");
    } else {
      console.warn("⚠️ Fungsi syncFeedbackToMarkers belum terdefinisi!");
    }

    // 4️⃣ Tandai proses selesai
    this.isLoading = false;
    this.showLoadingSpinner(false);
    return true;

  } catch (error) {
    console.error("❌ Error loading data:", error);
    this.isLoading = false;
    this.showLoadingSpinner(false);
    throw error;
  }
},

  /**
   * Load data from all endpoints in parallel
   * @returns {Promise<void>}
   */
  async loadAllEndpoints() {
    const promises = Object.keys(DATA_ENDPOINTS).map(key => 
      this.loadEndpoint(key, DATA_ENDPOINTS[key])
    );

    await Promise.all(promises);
    
    // Debug: Show all unique category IDs in loaded data
    this.debugCategoryIds();
  },

  /**
   * Debug function to show all unique category IDs
   */
  debugCategoryIds() {
    const categoryIds = new Set();
    const categoryCounts = {};

    Object.keys(this.loadedData).forEach(endpointKey => {
      const data = this.loadedData[endpointKey];
      if (data && typeof data === 'object') {
        Object.values(data).forEach(marker => {
          if (marker.category_id) {
            const catId = String(marker.category_id);
            categoryIds.add(catId);
            categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
          }
        });
      }
    });

    console.log("%c📊 Category IDs found in data:", "color:cyan;font-weight:bold;");
    console.table(categoryCounts);
    
    // Check for missing icons
    const missingIcons = [];
    categoryIds.forEach(catId => {
      if (typeof ICON_CONFIG !== 'undefined' && !ICON_CONFIG.overlays[catId]) {
        missingIcons.push(catId);
      }
    });

    if (missingIcons.length > 0) {
      console.warn("%c⚠️ Missing icon configurations for categories:", "color:orange;font-weight:bold;", missingIcons);
    }
  },

  /**
   * Load data from a single endpoint
   * @param {string} key - Endpoint key
   * @param {string} url - API endpoint URL
   * @returns {Promise<void>}
   */
  async loadEndpoint(key, url) {
    console.log(`📥 Loading ${key} from ${url}...`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store in loadedData
      this.loadedData[key] = data;

      // Also store in window global for compatibility
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) {
        window[globalVar] = data;
      }

      console.log(`✅ Loaded ${key}: ${Object.keys(data).length} items`);
      
      return data;
    } catch (error) {
      console.error(`❌ Failed to load ${key}:`, error);
      // Set empty object on error to prevent crashes
      this.loadedData[key] = {};
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) {
        window[globalVar] = {};
      }
      throw error;
    }
  },

  /**
   * Reload a specific endpoint
   * @param {string} key - Endpoint key to reload
   * @returns {Promise<void>}
   */
  async reloadEndpoint(key) {
    if (!DATA_ENDPOINTS[key]) {
      console.error(`❌ Unknown endpoint: ${key}`);
      return;
    }

    console.log(`🔄 Reloading ${key}...`);
    await this.loadEndpoint(key, DATA_ENDPOINTS[key]);
    
    // Trigger marker update if MarkerManager is available
    if (typeof MarkerManager !== 'undefined' && MarkerManager.updateMarkersInView) {
      MarkerManager.updateMarkersInView();
    }
  },

  /**
   * Reload all endpoints
   * @returns {Promise<void>}
   */
  async reloadAll() {
    console.log("🔄 Reloading all data...");
    this.showLoadingSpinner(true);
    
    try {
      await this.loadAllEndpoints();
      
      // Trigger marker update
      if (typeof MarkerManager !== 'undefined' && MarkerManager.updateMarkersInView) {
        MarkerManager.updateMarkersInView();
      }
      
      console.log("✅ All data reloaded");
    } catch (error) {
      console.error("❌ Error reloading data:", error);
    } finally {
      this.showLoadingSpinner(false);
    }
  },

  /**
   * Get all loaded markers combined
   * @returns {Array} Combined array of all markers
   */
  getAllMarkers() {
    const allMarkers = [];
    const categoryCounts = {};

    Object.keys(this.loadedData).forEach(endpointKey => {
      const data = this.loadedData[endpointKey];
      if (data && typeof data === 'object') {
        const markers = Object.values(data);
        allMarkers.push(...markers);
        
        // Count by category for debugging
        markers.forEach(m => {
          const cat = String(m.category_id);
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    console.log(`📊 getAllMarkers() returning ${allMarkers.length} markers from ${Object.keys(this.loadedData).length} endpoints`);
    console.log("📋 Breakdown by category:", categoryCounts);

    return allMarkers;
  },

  /**
   * Get markers by endpoint key
   * @param {string} key - Endpoint key
   * @returns {Array} Array of markers
   */
  getMarkersByEndpoint(key) {
    const data = this.loadedData[key];
    return data ? Object.values(data) : [];
  },

  /**
   * Show/hide loading spinner
   * @param {boolean} show - Show or hide
   */
  showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.style.display = show ? 'block' : 'none';
    }
  },

  /**
   * Get loading status
   * @returns {object} Loading status info
   */
  getStatus() {
    return {
      isLoading: this.isLoading,
      loadedEndpoints: Object.keys(this.loadedData).length,
      totalEndpoints: Object.keys(DATA_ENDPOINTS).length,
      endpoints: Object.keys(DATA_ENDPOINTS)
    };
  }
};

// Export for global access
window.DataLoader = DataLoader;

console.log("✅ data-loader.js loaded successfully");
console.log(`📊 Configured ${Object.keys(DATA_ENDPOINTS).length} API endpoints`);