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

// ========================================
// FILTER GROUP CONFIGURATION
// Category IDs berdasarkan ICON_CONFIG
// ========================================
const filterGroupConfig = {
  discover: {
    title: 'Discover',
    icon: '',
    categories: [1]  // Teleport + Treasure Chest
  },
  collection: {
    title: 'Collection',
    icon: '',
    categories: [2, 3, 5, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  },
    minigame: {
    title: "Mini Game's",
    icon: '',
    categories: [29, 30, 31, 32, 33, 34, 35]
  },
  traveler: {
    title: 'Traveler',
    icon: '️',
    categories: [21, 22, 23, 24]
  },
  combat: {
    title: 'Combat Challenge',
    icon: '',
    categories: [25, 26, 27]
  },
  materialart: {
    title: 'Material Art',
    icon: '',
    categories: [28]
  }

};

// ========================================
// MARKER MANAGER
// ========================================
const MarkerManager = {
  map: null,
  activeMarkers: {},
  filterItems: [],
  activeFilters: new Set(),

  /**
   * Initialize marker manager
   * @param {L.Map} map - Leaflet map instance
   */
  init(map) {
    this.map = map;
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


  // 🔁 Aktifkan semua kategori di discover secara default
  const discoverCategories = filterGroupConfig.discover.categories || [];
  discoverCategories.forEach(catId => this.activeFilters.add(String(catId)));


  // 🔁 Coba restore filter dari localStorage
  const savedFilters = JSON.parse(localStorage.getItem("activeFilters")) || null;
  if (savedFilters && Array.isArray(savedFilters) && savedFilters.length > 0) {
    savedFilters.forEach(id => this.activeFilters.add(id));
  }

},

  /**
   * Setup filter UI with grouping
   */
  setupFilterUI() {
    
    const container = document.getElementById("filterContent");
    if (!container) {
      console.error("❌ filterContent container not found!");
      return;
    }

    container.innerHTML = '';

    // Loop through each group
    Object.keys(filterGroupConfig).forEach(groupKey => {
      const group = filterGroupConfig[groupKey];
      
      // Create group container
// Create group container
const groupDiv = document.createElement('div');
groupDiv.className = 'filter-group';
groupDiv.dataset.group = groupKey;

// 🔹 Hide discover group
if (groupKey === "discover") {
  groupDiv.style.display = "none";
}
      // Create group header
      const groupHeader = document.createElement('div');
      groupHeader.className = 'filter-group-header';
      groupHeader.innerHTML = `
        <span class="filter-group-title">${group.title}</span>
        <span class="filter-group-toggle">▼</span>
      `;
      
      // Add click listener for toggle
      groupHeader.addEventListener('click', () => {
        groupDiv.classList.toggle('collapsed');

      });
      
      // Create items container
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'filter-group-items';

      let itemsAdded = 0;

      // Add items for this group
      group.categories.forEach(categoryId => {
        const item = this.filterItems.find(f => String(f.categoryId) === String(categoryId));
        
        if (!item) {
          console.warn(`⚠️ Category ${categoryId} not found in filterItems!`);
          return;
        }

        const isActive = this.activeFilters.has(String(categoryId));
        
        const filterItem = document.createElement('div');
        filterItem.className = `filter-item ${isActive ? 'active' : ''}`;
        filterItem.dataset.categoryId = categoryId;

        filterItem.innerHTML = `
          <img src="${item.icon}" alt="${item.name}" class="filter-icon" onerror="this.src='${ICON_CONFIG.baseIcon}'">
          <span class="filter-label">${item.name}</span>
          <input 
            type="checkbox" 
            class="filter-checkbox" 
            ${isActive ? 'checked' : ''} 
            data-category="${categoryId}">
        `;

        itemsDiv.appendChild(filterItem);
        itemsAdded++;
      });



      groupDiv.appendChild(groupHeader);
      groupDiv.appendChild(itemsDiv);
      container.appendChild(groupDiv);
    });

    this.updateStats();
  },

  /**
   * Setup map and filter event listeners
   */
  setupEventListeners() {
    
    
    const debouncedUpdate = this.debounce(() => this.updateMarkersInView(), MARKER_CONFIG.debounceDelay);
    this.map.on('move', debouncedUpdate);

    const toggleBtn = document.getElementById("filterToggle");
    const panel = document.getElementById("filterPanel");

    if (toggleBtn && panel) {
      toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        toggleBtn.textContent = panel.classList.contains("hidden") ? "▶" : "◀";
      });
    }

    const container = document.getElementById("filterContent");
    if (container) {
      container.addEventListener("click", (e) => {
        const filterItem = e.target.closest(".filter-item");
        if (!filterItem) return;

        const checkbox = filterItem.querySelector(".filter-checkbox");
        const categoryId = filterItem.dataset.categoryId;

        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }

        
        this.toggleFilter(categoryId, checkbox.checked, filterItem);
      });
    }

    const btnSelectAll = document.getElementById("btnSelectAll");
    if (btnSelectAll) {
      btnSelectAll.addEventListener("click", () => {
        
        this.selectAllFilters();
      });
    }

    const btnSelectNone = document.getElementById("btnSelectNone");
    if (btnSelectNone) {
      btnSelectNone.addEventListener("click", () => {
        console.log("❌ Clear All clicked");
        this.clearAllFilters();
      });
    }
this.map.on('popupopen', (e) => {
  const popup = e.popup;
  const content = popup.getElement();
  if (!content) return;

  const popupDiv = content.querySelector('.marker-popup');
  if (!popupDiv) return;

  const markerKey = popupDiv.dataset.markerKey;

  // ⬇️ BAGIAN PALING PENTING — load image
  const imageContainer = content.querySelector('.marker-image-container');
  if (imageContainer) {
    MarkerImageHandler.loadImages(markerKey);
  }
});

  },

  toggleFilter(categoryId, enabled, filterItem) {
    if (enabled) {
      this.activeFilters.add(String(categoryId));
      filterItem.classList.add("active");
    } else {
      this.activeFilters.delete(String(categoryId));
      filterItem.classList.remove("active");
      this.removeMarkersByCategory(String(categoryId));
    }

    // 💾 Simpan ke localStorage
    localStorage.setItem("activeFilters", JSON.stringify([...this.activeFilters]));
    

    this.updateMarkersInView();
    this.updateStats();
  },

  selectAllFilters() {
    this.filterItems.forEach(item => {
      this.activeFilters.add(String(item.categoryId));
    });

    document.querySelectorAll(".filter-checkbox").forEach(cb => {
      cb.checked = true;
    });
    document.querySelectorAll(".filter-item").forEach(item => {
      item.classList.add("active");
    });

    localStorage.setItem("activeFilters", JSON.stringify([...this.activeFilters]));
    console.log("✅ All filters selected:", [...this.activeFilters]);

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

    localStorage.setItem("activeFilters", JSON.stringify([]));
    console.log("❌ All filters cleared");

    this.removeAllMarkers();
    this.updateStats();
  },

  isFilterActive(categoryId) {
    return this.activeFilters.has(String(categoryId));
  },

getAllMarkers() {
  const allMarkers = [];
  const markerEdits = JSON.parse(localStorage.getItem('markerEdits') || '{}');

  const sources = [
    window.chest,
    window.batutele,
    window.strangecollection,
    window.yellow,
    window.gua,
    window.blue,
    window.red,
    window.peninggalan,
    window.kucing,
    window.ketidakadilan,
    window.petualangan,
    window.meong,
    window.pengetahuan,
    window.cerita,
    window.bulan,
    window.tidakterhitung,
    window.berharga,
    window.kulinari,
    window.spesial,
    window.wc,
    window.penyembuhan,
    window.buatteman,
    window.perdebatan,
    window.buku,
    window.penjaga,
    window.benteng,
    window.bos,
    window.jurus,
    window.pemancing,
    window.mabuk,
    window.kartu,
    window.panah,
    window.melodi,
    window.tebakan,
    window.gulat
  ];

    sources.forEach(source => {
      if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
          const marker = { ...source[key], _key: key };
          
          if (markerEdits[key]) {
            if (markerEdits[key].x) marker.x = markerEdits[key].x;
            if (markerEdits[key].y) marker.y = markerEdits[key].y;
            if (markerEdits[key].desc !== undefined) marker.desc = markerEdits[key].desc;
          }
          
          allMarkers.push(marker);
        });
      }
    });

    return allMarkers;
  },

  getBufferedBounds() {
    let bounds = this.map.getBounds();
    const bufferLat = (bounds.getNorth() - bounds.getSouth()) * MARKER_CONFIG.bufferPercent;
    const bufferLng = (bounds.getEast() - bounds.getWest()) * MARKER_CONFIG.bufferPercent;

    return L.latLngBounds(
      [bounds.getSouth() - bufferLat, bounds.getWest() - bufferLng],
      [bounds.getNorth() + bufferLat, bounds.getEast() + bufferLng]
    );
  },

  removeOutOfBoundsMarkers(bounds) {
    for (const key in this.activeMarkers) {
      const marker = this.activeMarkers[key];
      if (!bounds.contains(marker.getLatLng())) {
        this.map.removeLayer(marker);
        delete this.activeMarkers[key];
      }
    }
  },

  removeMarkersByCategory(categoryId) {
    for (const key in this.activeMarkers) {
      const marker = this.activeMarkers[key];
      if (String(marker.categoryId) === String(categoryId)) {
        this.map.removeLayer(marker);
        delete this.activeMarkers[key];
      }
    }
    
    this.updateStats();
  },

  removeAllMarkers() {
    for (const key in this.activeMarkers) {
      this.map.removeLayer(this.activeMarkers[key]);
    }
    this.activeMarkers = {};
  },

createPopupContent(markerData, editState = {}) {
  const categoryName = getCategoryName(markerData.category_id);
  const categoryIcon = getIconUrl(markerData.category_id);
  const description = markerData.desc || 'No description available';
  const markerKey = markerData._key;

  // Check visited status from localStorage
  const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  const isVisited = visitedMarkers[markerKey] || false;

  // Check if X, Y coordinates exist and are valid
  const hasCoords = markerData.x && markerData.y && 
                   !isNaN(parseFloat(markerData.x)) && 
                   !isNaN(parseFloat(markerData.y));
  
  const coordX = hasCoords ? parseFloat(markerData.x).toFixed(2) : '';
  const coordY = hasCoords ? parseFloat(markerData.y).toFixed(2) : '';

  // Coordinates section HTML
  let coordsHTML = '';
  if (editState.editingCoords) {
    coordsHTML = `
      <div class="marker-popup-coords">
        <div class="marker-popup-section-header">
          <div class="marker-popup-coords-title">📍 In-Game Coordinates (Editing)</div>
        </div>
        <div class="marker-popup-coords-edit">
          <div class="marker-popup-coord-edit-field">
            <label class="marker-popup-coord-edit-label">X:</label>
            <input type="number" step="0.01" id="editX_${markerKey}" class="marker-popup-coord-edit-input" value="${coordX}" placeholder="X">
          </div>
          <div class="marker-popup-coord-edit-field">
            <label class="marker-popup-coord-edit-label">Y:</label>
            <input type="number" step="0.01" id="editY_${markerKey}" class="marker-popup-coord-edit-input" value="${coordY}" placeholder="Y">
          </div>
        </div>
        <div class="marker-popup-section-actions">
          <button class="marker-popup-edit-btn editing" onclick="saveEdit('${markerKey}', 'coords')">
            💾 Save
          </button>
          <button class="marker-popup-edit-btn cancel" onclick="cancelEdit('${markerKey}')">
            ✖ Cancel
          </button>
        </div>
      </div>
    `;
  } else if (hasCoords) {
    coordsHTML = `
      <div class="marker-popup-coords">
        <div class="marker-popup-section-header">
          <div class="marker-popup-coords-title">📍 In-Game Coordinates</div>
          <button class="marker-popup-section-edit-btn" data-tooltip="Edit Coordinates" onclick="event.stopPropagation(); startEdit('${markerKey}', 'coords')">
            <img src="https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/edit.png?updatedAt=1762987960006" alt="Edit">
          </button>
        </div>
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
  } else {
    coordsHTML = `
      <div class="marker-popup-coords marker-popup-coords-empty">
        <div class="marker-popup-section-header">
          <div class="marker-popup-coords-title">📍 In-Game Coordinates</div>
          <button class="marker-popup-section-edit-btn" onclick="event.stopPropagation(); startEdit('${markerKey}', 'coords')" title="Edit Coordinates">
            <img src="https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/edit.png?updatedAt=1762987960006" alt="Edit">
          </button>
        </div>
        <div class="marker-popup-coords-fallback">
          No coordinate, come fill it
        </div>
      </div>
    `;
  }

  // Description section HTML
  let descHTML = '';
  if (editState.editingDesc) {
    descHTML = `
      <div class="marker-popup-desc">
        <div class="marker-popup-section-header">
          <div class="marker-popup-desc-title">📝 Description (Editing)</div>
        </div>
        <textarea id="editDesc_${markerKey}" class="marker-popup-desc-edit" placeholder="Enter description...">${description !== 'No description available' ? description : ''}</textarea>
        <div class="marker-popup-section-actions">
          <button class="marker-popup-edit-btn editing" onclick="saveEdit('${markerKey}', 'desc')">
            💾 Save
          </button>
          <button class="marker-popup-edit-btn cancel" onclick="cancelEdit('${markerKey}')">
            ✖ Cancel
          </button>
        </div>
      </div>
    `;
  } else {
    descHTML = `
      <div class="marker-popup-desc">
        <div class="marker-popup-section-header">
          <div class="marker-popup-desc-title">📝 Description</div>
          <button class="marker-popup-section-edit-btn" onclick="event.stopPropagation(); startEdit('${markerKey}', 'desc')" title="Edit Description">
            <img src="https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/edit.png?updatedAt=1762987960006" alt="Edit">
          </button>
        </div>
        <div class="marker-popup-desc-text">${description !== 'No description available' ? description : '<span class="marker-popup-empty">No description available</span>'}</div>
      </div>
    `;
  }

  // ✅ GUNAKAN MarkerImageHandler untuk bagian gambar
  const imageHTML = typeof MarkerImageHandler !== 'undefined' 
    ? MarkerImageHandler.createImageContainerHTML(markerData)
    : `<div class="marker-popup-image">
        <img src="https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-1n85i.jpg" 
             alt="${markerData.name || 'Location'}"
             onerror="this.src='https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-1n85i.jpg'">
       </div>`;

  return `
    <div class="marker-popup" data-marker-key="${markerKey}" onclick="event.stopPropagation()">

      <div class="marker-popup-category">
        <img src="${categoryIcon}" alt="${categoryName}" class="marker-popup-category-icon">
        <span class="marker-popup-category-name">${categoryName}</span>
      </div>

      ${imageHTML}

      <div class="marker-popup-header">
        <h3>${markerData.name || 'Unnamed Location'}</h3>
      </div>

      ${descHTML}
      
      <div class="marker-popup-footer">
        <div class="marker-popup-visited" onclick="event.stopPropagation(); toggleVisited('${markerKey}')">
          <input type="checkbox" ${isVisited ? 'checked' : ''} onchange="event.stopPropagation()">
          <span class="marker-popup-visited-label">✓ Visited</span>
        </div>

        <button class="marker-popup-comments-btn" onclick="event.stopPropagation(); openCommentsModal('${markerKey}')">
          💬 Comments
        </button>

        ${markerData.ys_id ? `
          <div class="marker-popup-ysid">
            <span class="marker-popup-ysid-label">@${markerData.ys_id}</span>
          </div>
        ` : '<div class="marker-popup-ysid-spacer"></div>'}
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

      // Skip if already exists
      if (this.activeMarkers[markerKey]) {
        continue;
      }

      // Check bounds
      if (!bounds.contains([lat, lng])) {
        continue;
      }

      // Check if marker passes category filter
      const passesFilter = this.isFilterActive(markerData.category_id);
      if (!passesFilter) {
        continue;
      }

      // Check if marker passes floor filter
      let passesFloorFilter = true;
      if (typeof UndergroundManager !== 'undefined') {
        passesFloorFilter = UndergroundManager.shouldShowMarker(markerData);
      }
      if (!passesFloorFilter) {
        continue;
      }

      // Create and add marker
      this.createAndAddMarker(markerData, lat, lng, markerKey);
    }

    index = end;
    if (index < markers.length) {
      requestAnimationFrame(addNextBatch);
    } else {
      // Update stats after all markers are loaded
      this.updateStats();
      
      // Update underground stats if available
      if (typeof UndergroundManager !== 'undefined') {
        UndergroundManager.updateStats();
      }
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

  // Check if marker is visited and apply opacity
  const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  if (visitedMarkers[markerKey]) {
    leafletMarker.setOpacity(0.5);
  }

  // Store marker with its category ID and floor for easy filtering
  leafletMarker.categoryId = markerData.category_id;
  leafletMarker.markerKey = markerKey;
  leafletMarker.floor = markerData.floor || ''; // ← FLOOR DATA
  
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
  
  // Get floor info if available
  let floorInfo = '';
  if (typeof UndergroundManager !== 'undefined') {
    const activeFloorData = UndergroundManager.getActiveFloorInfo();
    if (activeFloorData) {
      let floorName = activeFloorData.name;
      if (floorName.includes('(')) {
        floorName = floorName.split('(')[0].trim();
      }
      floorInfo = ` <span style="color: #f3d59b;">| ${floorName}</span>`;
    }
  }
  
  statsEl.innerHTML = `Showing <strong>${count}</strong> markers${floorInfo}`;
},

/**
 * Force refresh all markers (untuk floor change)
 */
/**
 * GANTI BAGIAN INI - Dari forceRefreshMarkers sampai window.copyToClipboard
 * 
 * PENTING: Tambahkan closing bracket }; setelah forceRefreshMarkers
 * dan SEBELUM window.copyToClipboard
 */

/**
 * Force refresh all markers (untuk floor change)
 */
forceRefreshMarkers() {
  
  this.removeAllMarkers();
  this.updateMarkersInView();
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
}; // ← INI CLOSING BRACKET MarkerManager - HARUS ADA!

// ========================================
// FUNCTIONS DI LUAR MarkerManager
// ========================================

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

/**
 * Toggle visited status of a marker (supports login and localStorage)
 * @param {string} markerKey - Marker key
 */
/**
 * Toggle visited status - SIMPAN LOKAL SAJA (tidak kirim ke server)
 */
window.toggleVisited = function (markerKey) {
  const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  const newStatus = !visitedMarkers[markerKey];
  
  // Simpan ke lokal saja
  visitedMarkers[markerKey] = newStatus;
  localStorage.setItem('visitedMarkers', JSON.stringify(visitedMarkers));
  
  // Update opacity marker
  const marker = MarkerManager.activeMarkers[markerKey];
  if (marker) marker.setOpacity(newStatus ? 0.5 : 1.0);
  
  // Refresh popup
  const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
  if (markerData) marker.getPopup().setContent(MarkerManager.createPopupContent(markerData));
};

/**
 * Load visited markers - GABUNG server + lokal (lokal menang)
 */
async function loadVisitedMarkersFromServer() {
  const localVisited = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  
  if (!isLoggedIn()) {
    Object.entries(localVisited).forEach(([key, v]) => {
      const marker = MarkerManager.activeMarkers[key];
      if (marker) marker.setOpacity(v ? 0.5 : 1.0);
    });
    return;
  }
  
  try {
    const token = getUserToken();
    
    const res = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/visitedmarker", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    let data;
    try {
      data = JSON.parse(await res.text());
    } catch (e) {
      return;
    }
    
    const serverVisited = data.visitedMarkers || {};
    const merged = { ...serverVisited, ...localVisited };
    
    localStorage.setItem("visitedMarkers", JSON.stringify(merged));
    
    // ✅ Kirim ke server: hanya key yang lokal berbeda dari server
    const keysToSync = Object.keys(localVisited).filter(key => 
      localVisited[key] !== serverVisited[key]
    );
    
    if (keysToSync.length > 0) {
      console.log(`📤 Syncing ${keysToSync.length} markers to server...`);
      
      for (const markerKey of keysToSync) {
        await fetch("https://autumn-dream-8c07.square-spon.workers.dev/visitedmarker", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            markerKey: markerKey, 
            visited: localVisited[markerKey] 
          })
        });
      }
      
      console.log("✅ Sync complete");
    }
    
    // Update opacity
    Object.entries(merged).forEach(([key, v]) => {
      const marker = MarkerManager.activeMarkers[key];
      if (marker) marker.setOpacity(v ? 0.5 : 1.0);
    });
    
  } catch (err) {
    Object.entries(localVisited).forEach(([key, v]) => {
      const marker = MarkerManager.activeMarkers[key];
      if (marker) marker.setOpacity(v ? 0.5 : 1.0);
    });
  }
}
/**
 * Start editing mode
 * @param {string} markerKey - Marker key
 * @param {string} type - Edit type ('coords' or 'desc')
 */
window.startEdit = function(markerKey, type) {
  // 🔒 Pastikan login dulu
  if (!isLoggedIn()) {
    showLoginPopup();
    return;
  }

  const marker = MarkerManager.activeMarkers[markerKey];
  if (!marker) return;
  
  const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
  if (!markerData) return;
  
  const editState = type === 'coords' ? { editingCoords: true } : { editingDesc: true };
  marker.getPopup().setContent(MarkerManager.createPopupContent(markerData, editState));
  
  window.currentEditMarker = markerKey;
  window.currentEditType = type;
  
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true);
  }, 5000);
};

/**
 * Handle click outside popup
 * @param {Event} e - Click event
 */
function handleClickOutside(e) {
  const popup = document.querySelector('.marker-popup');
  if (popup && !popup.contains(e.target) && !e.target.closest('.leaflet-popup')) {
    cancelEdit(window.currentEditMarker);
  }
}

/**
 * Cancel editing
 * @param {string} markerKey - Marker key
 */
window.cancelEdit = function(markerKey) {
  document.removeEventListener('click', handleClickOutside, true);
  
  const marker = MarkerManager.activeMarkers[markerKey];
  if (!marker) return;
  
  const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
  if (markerData) {
    marker.getPopup().setContent(MarkerManager.createPopupContent(markerData));
  }
  
  window.currentEditMarker = null;
  window.currentEditType = null;
};

/**
 * Save edit changes
 * @param {string} markerKey - Marker key
 * @param {string} type - Edit type
 *
window.saveEdit = async function(markerKey, type) {
  document.removeEventListener('click', handleClickOutside, true);
  
  const markerEdits = JSON.parse(localStorage.getItem('markerEdits') || '{}');
  if (!markerEdits[markerKey]) markerEdits[markerKey] = {};

  // --- Ambil data dari form edit
  if (type === 'coords') {
    const x = document.getElementById(`editX_${markerKey}`).value.trim();
    const y = document.getElementById(`editY_${markerKey}`).value.trim();

    // Validasi angka
    if (x && isNaN(parseFloat(x))) {
      showNotification('❌ X coordinate must be a number!', 'error');
      return;
    }
    if (y && isNaN(parseFloat(y))) {
      showNotification('❌ Y coordinate must be a number!', 'error');
      return;
    }

    markerEdits[markerKey].x = x;
    markerEdits[markerKey].y = y;

  } else if (type === 'desc') {
    const desc = document.getElementById(`editDesc_${markerKey}`).value.trim();
    markerEdits[markerKey].desc = desc;
  }

  // Simpan lokal (fallback kalau offline)
  localStorage.setItem('markerEdits', JSON.stringify(markerEdits));

  // --- Update UI (refresh popup sementara)
  const marker = MarkerManager.activeMarkers[markerKey];
  if (marker) {
    const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
    if (markerData) {
      marker.getPopup().setContent(MarkerManager.createPopupContent(markerData));
    }
  }

  // --- Reset edit state
  window.currentEditMarker = null;
  window.currentEditType = null;

  // --- Kirim ke server
  try {
    showNotification('⏳ Saving to server...', 'info');

    // Fungsi ini berasal dari feedback-marker.js
    await saveFeedbackMarker(markerKey, markerEdits[markerKey]);

    showNotification('✅ Changes saved & synced to server!', 'success');
  } catch (err) {
    console.error('Failed to save to server:', err);
    showNotification('⚠️ Saved locally, but failed to sync with server.', 'error');
  }
};

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success' or 'error')
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  
  if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.95))';
    notification.style.borderColor = 'rgba(239, 83, 80, 0.8)';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 2000);
}