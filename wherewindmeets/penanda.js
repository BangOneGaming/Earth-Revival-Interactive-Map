/**
 * Marker management module with lazy loading and filtering
 */

console.log("📦 Loading marker-manager.js...");

// Marker loading configuration
const MARKER_CONFIG = {
  batchSize: 200,
  bufferPercent: 0.2,
  debounceDelay: 120
};

const MarkerManager = {
  activeMarkers: {},
  activeFilters: new Set(),
  filterItems: [],

  /**
   * Initialize marker manager
   * @param {L.Map} mapInstance - The Leaflet map instance
   */
  init(mapInstance) {
    this.map = mapInstance;
    this.initializeFilters();
    this.setupFilterUI();
    this.setupEventListeners();
    this.updateMarkersInView();
  },

  /**
   * Initialize filter configuration
   */
  initializeFilters() {
    // Ambil semua kategori dari konfigurasi ikon
    this.filterItems = getAllCategories().map(cat => ({
      id: `category_${cat.id}`,
      categoryId: cat.id,
      name: cat.name,
      icon: cat.iconUrl
    }));

    // 🔁 Coba ambil filter aktif terakhir dari localStorage
    const savedFilters = JSON.parse(localStorage.getItem("activeFilters")) || null;

    if (savedFilters && Array.isArray(savedFilters) && savedFilters.length > 0) {
      savedFilters.forEach(id => this.activeFilters.add(id));
      console.log(`🔁 Restored ${savedFilters.length} filters from last session`);
    } else {
      // ✅ Default hanya Category 2 aktif
      this.activeFilters.add("2");
      console.log("✨ Default: only Category 2 active");
    }

    console.log(`✅ ${this.filterItems.length} filters initialized`);
  },

  /**
   * Setup filter UI
   */
  setupFilterUI() {
    const container = document.getElementById("filterContent");
    if (!container) return;

    container.innerHTML = "";

    this.filterItems.forEach(item => {
      const isActive = this.activeFilters.has(item.categoryId); // 🟢 cek status tersimpan
      const filterItem = document.createElement("div");
      filterItem.className = `filter-item ${isActive ? "active" : ""}`;
      filterItem.dataset.categoryId = item.categoryId;

      filterItem.innerHTML = `
        <img src="${item.icon}" alt="${item.name}" class="filter-icon">
        <span class="filter-label">${item.name}</span>
        <input 
          type="checkbox" 
          class="filter-checkbox" 
          ${isActive ? "checked" : ""} 
          data-category="${item.categoryId}">
      `;

      container.appendChild(filterItem);
    });

    this.updateStats();
  },

  /**
   * Setup map and filter event listeners
   */
  setupEventListeners() {
    // Map move event
    const debouncedUpdate = this.debounce(() => this.updateMarkersInView(), MARKER_CONFIG.debounceDelay);
    this.map.on('move', debouncedUpdate);

    // Toggle panel button
    const toggleBtn = document.getElementById("filterToggle");
    const panel = document.getElementById("filterPanel");

    if (toggleBtn && panel) {
      toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        toggleBtn.textContent = panel.classList.contains("hidden") ? "▶" : "◀";
      });
    }

    // Filter item clicks
    const container = document.getElementById("filterContent");
    if (container) {
      container.addEventListener("click", (e) => {
        const filterItem = e.target.closest(".filter-item");
        if (!filterItem) return;

        const checkbox = filterItem.querySelector(".filter-checkbox");
        const categoryId = filterItem.dataset.categoryId;

        // Toggle checkbox if clicked on item (not checkbox itself)
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }

        this.toggleFilter(categoryId, checkbox.checked, filterItem);
      });
    }

    // Select All button
    const btnSelectAll = document.getElementById("btnSelectAll");
    if (btnSelectAll) {
      btnSelectAll.addEventListener("click", () => this.selectAllFilters());
    }

    // Clear All button
    const btnSelectNone = document.getElementById("btnSelectNone");
    if (btnSelectNone) {
      btnSelectNone.addEventListener("click", () => this.clearAllFilters());
    }
  },

  /**
   * Toggle filter on/off
   * @param {string} categoryId - Category ID to toggle
   * @param {boolean} enabled - Enable or disable
   * @param {HTMLElement} filterItem - The filter item element
   */
  toggleFilter(categoryId, enabled, filterItem) {
    if (enabled) {
      this.activeFilters.add(categoryId);
      filterItem.classList.add("active");
    } else {
      this.activeFilters.delete(categoryId);
      filterItem.classList.remove("active");
      this.removeMarkersByCategory(categoryId);
    }

    // 💾 Simpan ke localStorage
    localStorage.setItem("activeFilters", JSON.stringify([...this.activeFilters]));

    this.updateMarkersInView();
    this.updateStats();
  },

  /**
   * Select all filters
   */
  selectAllFilters() {
    this.filterItems.forEach(item => {
      this.activeFilters.add(item.categoryId);
    });

    document.querySelectorAll(".filter-checkbox").forEach(cb => {
      cb.checked = true;
    });
    document.querySelectorAll(".filter-item").forEach(item => {
      item.classList.add("active");
    });

    // 💾 Simpan ke localStorage
    localStorage.setItem("activeFilters", JSON.stringify([...this.activeFilters]));

    this.updateMarkersInView();
    this.updateStats();
  },

  clearAllFilters() {
    this.activeFilters.clear();

    document.querySelectorAll(".filter-checkbox").forEach(cb => {
      cb.checked = false;
    });
    document.querySelectorAll(".filter-item").forEach(item => {
      item.classList.remove("active");
    });

    // 💾 Simpan ke localStorage
    localStorage.setItem("activeFilters", JSON.stringify([]));

    this.removeAllMarkers();
    this.updateStats();
  },

  /**
   * Check if category is active in filter
   * @param {string} categoryId - Category ID to check
   * @returns {boolean}
   */
  isFilterActive(categoryId) {
    return this.activeFilters.has(categoryId);
  },

  /**
   * Get all markers from data sources
   * @returns {Array} Combined array of all markers with keys
   */
  getAllMarkers() {
    const allMarkers = [];
    
    const sources = [
      window.chest,
      window.batutele,
      window.strangecollection,
      window.gua,
      window.yellow,
      window.blue,
      window.red,
      window.peninggalan,
      window.kucing,
      window.ketidakadilan,
      window.petualangan,
      window.meong,
      window.pengetahuan,
      window.cerita
    ];

    sources.forEach(source => {
      if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
          const marker = source[key];
          allMarkers.push({ ...marker, _key: key });
        });
      }
    });

    return allMarkers;
  },

  /**
   * Get buffered bounds for marker loading
   * @returns {L.LatLngBounds} Buffered bounds
   */
  getBufferedBounds() {
    let bounds = this.map.getBounds();
    const bufferLat = (bounds.getNorth() - bounds.getSouth()) * MARKER_CONFIG.bufferPercent;
    const bufferLng = (bounds.getEast() - bounds.getWest()) * MARKER_CONFIG.bufferPercent;

    return L.latLngBounds(
      [bounds.getSouth() - bufferLat, bounds.getWest() - bufferLng],
      [bounds.getNorth() + bufferLat, bounds.getEast() + bufferLng]
    );
  },

  /**
   * Remove markers outside current bounds
   * @param {L.LatLngBounds} bounds - The current bounds
   */
  removeOutOfBoundsMarkers(bounds) {
    for (const key in this.activeMarkers) {
      const marker = this.activeMarkers[key];
      if (!bounds.contains(marker.getLatLng())) {
        this.map.removeLayer(marker);
        delete this.activeMarkers[key];
      }
    }
  },

  /**
   * Remove markers by category ID
   * @param {string} categoryId - Category ID to remove
   */
  removeMarkersByCategory(categoryId) {
    for (const key in this.activeMarkers) {
      const marker = this.activeMarkers[key];
      if (marker.categoryId === categoryId) {
        this.map.removeLayer(marker);
        delete this.activeMarkers[key];
      }
    }
    
    this.updateStats();
  },

  /**
   * Remove all markers from map
   */
  removeAllMarkers() {
    for (const key in this.activeMarkers) {
      this.map.removeLayer(this.activeMarkers[key]);
    }
    this.activeMarkers = {};
  },

  /**
   * Create popup content for a marker
   * @param {Object} markerData - The marker data
   * @returns {string} HTML popup content
   */
  createPopupContent(markerData) {
    const categoryName = getCategoryName(markerData.category_id);
    const categoryIcon = getIconUrl(markerData.category_id);
    const description = markerData.desc || 'No description available';
    
    // Parse image info
    let imageUrl = 'https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-1n85i.jpg';
    try {
      const imagesInfo = JSON.parse(markerData.images_info || '[]');
      if (imagesInfo.length > 0 && imagesInfo[0]) {
        imageUrl = imagesInfo[0];
      }
    } catch (e) {
      // Use fallback image
    }

    // Check if X, Y coordinates exist and are valid
    const hasCoords = markerData.x && markerData.y && 
                     !isNaN(parseFloat(markerData.x)) && 
                     !isNaN(parseFloat(markerData.y));
    
    const coordX = hasCoords ? parseFloat(markerData.x).toFixed(2) : null;
    const coordY = hasCoords ? parseFloat(markerData.y).toFixed(2) : null;

    // Coordinates section HTML
    let coordsHTML = '';
    if (hasCoords) {
      coordsHTML = `
        <div class="marker-popup-coords">
          <div class="marker-popup-coords-title">📍 In-Game Coordinates</div>
          <div class="marker-popup-coords-grid">
            <div class="marker-popup-coord-item" onclick="copyToClipboard('${coordX}', 'X')" title="Click to copy X coordinate">
              <span class="marker-popup-coord-label">X:</span>
              <span class="marker-popup-coord-value">${coordX}</span>
              <span class="marker-popup-copy-icon">📋</span>
            </div>
            <div class="marker-popup-coord-item" onclick="copyToClipboard('${coordY}', 'Y')" title="Click to copy Y coordinate">
              <span class="marker-popup-coord-label">Y:</span>
              <span class="marker-popup-coord-value">${coordY}</span>
              <span class="marker-popup-copy-icon">📋</span>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="marker-popup">
        <div class="marker-popup-header">
          <h3>${markerData.name || 'Unnamed Location'}</h3>
        </div>
        
        <div class="marker-popup-image">
          <img src="${imageUrl}" alt="${markerData.name || 'Location'}" onerror="this.src='https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-1n85i.jpg'">
        </div>
        
        <div class="marker-popup-category">
          <img src="${categoryIcon}" alt="${categoryName}" class="marker-popup-category-icon">
          <span class="marker-popup-category-name">${categoryName}</span>
        </div>
        
        ${coordsHTML}
        
        <div class="marker-popup-desc">
          <div class="marker-popup-desc-title">📝 Description</div>
          <div class="marker-popup-desc-text">${description !== 'No description available' ? description : '<span class="marker-popup-empty">No description available</span>'}</div>
        </div>
      </div>
    `;
  },

  /**
   * Add markers in batches for better performance
   * @param {Array} markers - Array of marker data
   * @param {L.LatLngBounds} bounds - The current bounds
   */
  addMarkersBatch(markers, bounds) {
    const batchSize = MARKER_CONFIG.batchSize;
    let index = 0;

    const addNextBatch = () => {
      const end = Math.min(index + batchSize, markers.length);

      for (let i = index; i < end; i++) {
        const markerData = markers[i];
        const lat = parseFloat(markerData.lat);
        const lng = parseFloat(markerData.lng);
        const markerKey = markerData._key;

        // Check if marker passes filter
        const passesFilter = this.isFilterActive(markerData.category_id);

        if (bounds.contains([lat, lng]) && !this.activeMarkers[markerKey] && passesFilter) {
          this.createAndAddMarker(markerData, lat, lng, markerKey);
        }
      }

      index = end;
      if (index < markers.length) {
        requestAnimationFrame(addNextBatch);
      } else {
        // Update stats after all markers are loaded
        this.updateStats();
      }
    };

    addNextBatch();
  },

  /**
   * Create and add a marker to the map
   * @param {Object} markerData - The marker data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} markerKey - Unique key for the marker
   */
  createAndAddMarker(markerData, lat, lng, markerKey) {
    const icon = getIconByCategory(markerData.category_id);
    const popupContent = this.createPopupContent(markerData);

    const leafletMarker = L.marker([lat, lng], { icon })
      .bindPopup(popupContent)
      .addTo(this.map);

    // Store marker with its category ID for easy filtering
    leafletMarker.categoryId = markerData.category_id;
    this.activeMarkers[markerKey] = leafletMarker;
  },

  /**
   * Update markers visible in current view
   */
  updateMarkersInView() {
    const bounds = this.getBufferedBounds();
    const markers = this.getAllMarkers();

    this.removeOutOfBoundsMarkers(bounds);
    this.addMarkersBatch(markers, bounds);
  },

  /**
   * Update stats display
   */
  updateStats() {
    const statsEl = document.getElementById("filterStats");
    if (!statsEl) return;

    const count = Object.keys(this.activeMarkers).length;
    statsEl.innerHTML = `Showing <strong>${count}</strong> markers`;
  },

  /**
   * Debounce helper function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} label - Label for notification
 */
window.copyToClipboard = function(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = `${label} coordinate copied: ${text}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
};

console.log("✅ marker-manager.js loaded successfully");