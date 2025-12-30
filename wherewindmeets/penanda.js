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
  hot : {
    title: 'Hot',
    icon: '',
    categories: [2, 3, 13, 24, 36, 37]  // Teleport + Treasure Chest
  },
  discover: {
    title: 'Discover',
    icon: '',
    categories: [1]  // Teleport + Treasure Chest
  },
  collection: {
    title: 'Collection',
    icon: '',
    categories: [5, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20]
  },
    minigame: {
    title: "Mini Game's",
    icon: '',
    categories: [29, 30, 31, 32, 33, 34, 35]
  },
  traveler: {
    title: 'Traveler',
    icon: '️',
    categories: [21, 22, 23, 38]
  },
  combat: {
    title: 'Combat Challenge',
    icon: '',
    categories: [25, 26, 27, 39]
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
    
window.toggleReportPopup = function(markerKey) {
  const popup = document.querySelector(`.report-popup[data-report="${markerKey}"]`);
  if (!popup) return;
  popup.style.display = popup.style.display === "flex" ? "none" : "flex";
};
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
    window.gulat,
    window.tehnik,
    window.innerwaylist,
    window.npc,
    window.kemah,
    window.terbaru
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

  // Convert newlines to <br> for HTML display
  const formattedDesc = description !== 'No description available' 
    ? description.replace(/\n/g, '<br>') 
    : description;

  // Check visited status from localStorage
  const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  const isVisited = visitedMarkers[markerKey] || false;

  // Check if X, Y coordinates exist and are valid
  const hasCoords = markerData.x && markerData.y && 
                   !isNaN(parseFloat(markerData.x)) && 
                   !isNaN(parseFloat(markerData.y));
  
  const coordX = hasCoords ? parseFloat(markerData.x).toFixed(2) : '';
  const coordY = hasCoords ? parseFloat(markerData.y).toFixed(2) : '';
  
  const hasValidLink =
    markerData.links_info &&
    markerData.links_info !== "0" &&
    markerData.links_info !== 0 &&
    markerData.links_info !== "[]" &&
    markerData.links_info !== "null" &&
    markerData.links_info !== "undefined" &&
    markerData.links_info.trim() !== "";
  
  // SVG Icons
  const SVG_ICONS = {
    location: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    description: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
    cancel: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    comment: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    email: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`
  };
  
  // Coordinates section HTML
  let coordsHTML = '';
  if (editState.editingCoords) {
    coordsHTML = `
      <div class="marker-popup-coords">
        <div class="marker-popup-section-header">
          <div class="marker-popup-coords-title">
            ${SVG_ICONS.location}
            <span>In-Game Coordinates (Editing)</span>
          </div>
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
            ${SVG_ICONS.save}
            <span>Save</span>
          </button>
          <button class="marker-popup-edit-btn cancel" onclick="cancelEdit('${markerKey}')">
            ${SVG_ICONS.cancel}
            <span>Cancel</span>
          </button>
        </div>
      </div>
    `;
  } else if (hasCoords) {
    coordsHTML = `
      <div class="marker-popup-coords">
        <div class="marker-popup-section-header">
          <div class="marker-popup-coords-title">
            ${SVG_ICONS.location}
            <span>In-Game Coordinates</span>
          </div>
          <button class="marker-popup-section-edit-btn" data-tooltip="Edit Coordinates" onclick="event.stopPropagation(); startEdit('${markerKey}', 'coords')">
            <img src="https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/edit.png?updatedAt=1762987960006" alt="Edit">
          </button>
        </div>
        <div class="marker-popup-coords-grid">
          <div class="marker-popup-coord-item" onclick="copyToClipboard('${coordX}', 'X')" title="Click to copy X coordinate">
            <span class="marker-popup-coord-label">X:</span>
            <span class="marker-popup-coord-value">${coordX}</span>
            <span class="marker-popup-copy-icon">${SVG_ICONS.copy}</span>
          </div>
          <div class="marker-popup-coord-item" onclick="copyToClipboard('${coordY}', 'Y')" title="Click to copy Y coordinate">
            <span class="marker-popup-coord-label">Y:</span>
            <span class="marker-popup-coord-value">${coordY}</span>
            <span class="marker-popup-copy-icon">${SVG_ICONS.copy}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    coordsHTML = `
      <div class="marker-popup-coords marker-popup-coords-empty">
        <div class="marker-popup-section-header">
          <div class="marker-popup-coords-title">
            ${SVG_ICONS.location}
            <span>In-Game Coordinates</span>
          </div>
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
          <div class="marker-popup-desc-title">
            ${SVG_ICONS.description}
            <span>Description (Editing)</span>
          </div>
        </div>
        <textarea id="editDesc_${markerKey}" class="marker-popup-desc-edit" placeholder="Enter description...">${description !== 'No description available' ? description : ''}</textarea>
        <div class="marker-popup-section-actions">
          <button class="marker-popup-edit-btn editing" onclick="saveEdit('${markerKey}', 'desc')">
            ${SVG_ICONS.save}
            <span>Save</span>
          </button>
          <button class="marker-popup-edit-btn cancel" onclick="cancelEdit('${markerKey}')">
            ${SVG_ICONS.cancel}
            <span>Cancel</span>
          </button>
        </div>
      </div>
    `;
  } else {
    descHTML = `
      <div class="marker-popup-desc">
        <div class="marker-popup-section-header">
          <div class="marker-popup-desc-title">
            ${SVG_ICONS.description}
            <span>Description</span>
          </div>
          <button class="marker-popup-section-edit-btn" onclick="event.stopPropagation(); startEdit('${markerKey}', 'desc')" title="Edit Description">
            <img src="https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/edit.png?updatedAt=1762987960006" alt="Edit">
          </button>
        </div>
        <div class="marker-popup-desc-text">${formattedDesc !== 'No description available' ? formattedDesc : '<span class="marker-popup-empty">No description available</span>'}</div>
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

  // Updated createPopupContent function dengan struktur baru
  return `
    <div class="marker-popup" data-marker-key="${markerKey}" onclick="event.stopPropagation()">
      <!-- Category Section -->
      <div class="marker-popup-category">
        <img src="${categoryIcon}" alt="${categoryName}" class="marker-popup-category-icon">
        <span class="marker-popup-category-name">${categoryName}</span>
      </div>
      
      <!-- Image Section -->
      ${imageHTML}
      
      <!-- Header Section -->
      <div class="marker-popup-header">
        <h3>${markerData.name || 'Unnamed Location'}</h3>
      </div>
      
      <!-- Description Section -->
      ${descHTML}
      
      <!-- Footer Section (Visited + ys_id + links_info) -->
      <div class="marker-popup-footer">
        
        <!-- Left: Visited -->
        <div class="marker-popup-visited" onclick="event.stopPropagation(); toggleVisited('${markerKey}')">
          <input type="checkbox" ${isVisited ? 'checked' : ''} onchange="event.stopPropagation()">
          <span class="marker-popup-visited-label">
            ${SVG_ICONS.check}
            <span>Visited</span>
          </span>
        </div>

        <!-- Right container: LINK + YSID -->
        <div class="footer-right-group">

          <!-- Link dulu -->
          ${hasValidLink ? `
            <div class="marker-popup-link-info">
              <a href="${markerData.links_info}" 
                 target="_blank" 
                 class="marker-popup-link-btn">
                ${SVG_ICONS.link}
                <span>Videos Hint</span>
              </a>
            </div>
          ` : ''}

          <!-- Baru YSID -->
          ${markerData.ys_id ? `
            <div class="marker-popup-ysid">
              <span class="marker-popup-ysid-label">@${markerData.ys_id}</span>
            </div>
          ` : ''}

        </div>

      </div>
      
      <!-- Comments Section -->
      <div class="marker-popup-comments-section">
        <button class="marker-popup-comments-btn" onclick="event.stopPropagation(); openCommentsModal('${markerKey}')">
          ${SVG_ICONS.comment}
          <span>Comments</span>
        </button>
      </div>
      
      <!-- Report Section -->
      <div class="marker-popup-report-section">
        <button 
          class="marker-popup-report-btn"
          onclick="event.stopPropagation(); toggleReportPopup('${markerKey}')">
          ${SVG_ICONS.alert}
          <span>Report</span>
        </button>
        <div class="report-popup" data-report="${markerKey}">
          <a class="report-link" href="https://discord.gg/Mt65qFprs" target="_blank">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffd88a">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.036c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.622-1.25.07.07 0 0 0-.073-.036A19.736 19.736 0 0 0 4.69 4.37a.064.064 0 0 0-.03.027C.7 10.053-.42 15.58.13 21.053a.078.078 0 0 0 .028.053 19.9 19.9 0 0 0 6.072 3.073.07.07 0 0 0 .076-.027c.466-.638.883-1.313 1.246-2.017a.07.07 0 0 0-.041-.098 13.1 13.1 0 0 1-1.872-.892.07.07 0 0 1-.01-.116 10.2 10.2 0 0 0 .372-.292.07.07 0 0 1 .073-.01c3.927 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .074.009c.12.098.247.2.373.293a.07.07 0 0 1-.01.116c-.6.35-1.245.654-1.872.892a.07.07 0 0 0-.04.099c.385.703.802 1.378 1.245 2.016a.07.07 0 0 0 .077.027 19.87 19.87 0 0 0 6.072-3.073.07.07 0 0 0 .028-.053c.5-5.251-.838-10.755-3.983-16.656a.06.06 0 0 0-.029-.028ZM8.02 15.33c-1.183 0-2.154-1.084-2.154-2.412 0-1.328.955-2.412 2.154-2.412 1.21 0 2.168 1.093 2.154 2.412 0 1.328-.955 2.412-2.154 2.412Zm7.975 0c-1.183 0-2.154-1.084-2.154-2.412 0-1.328.955-2.412 2.154-2.412 1.21 0 2.168 1.093 2.154 2.412 0 1.328-.944 2.412-2.154 2.412Z"/>
            </svg>
            Discord
          </a>
          <a class="report-link" href="https://www.tiktok.com/@bangonegaming97" target="_blank">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffd88a">
              <path d="M12.58 2h3.22a5.73 5.73 0 0 0 4.1 4.08v3.22a8.92 8.92 0 0 1-4.13-1.17v7.72a6.69 6.69 0 1 1-6.69-6.69 6.6 6.6 0 0 1 1.5.17v3.36a3.33 3.33 0 1 0 2.42 3.21V2Z"/>
            </svg>
            TikTok
          </a>
          <a class="report-link"
            href="mailto:square.spon@gmail.com?subject=Report%20Marker%20|%20Key:%20${markerKey}%20|%20Category:%20${markerData.category_id}&body=Hello,%0D%0AI want to report a marker.%0D%0A%0D%0AKey: ${markerKey}%0D%0ACategory ID: ${markerData.category_id}%0D%0AReason:%0D%0A">
            ${SVG_ICONS.email}
            Email
          </a>
        </div>
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
 * SIMPLIFIED: createAndAddMarker - No zoom-based resizing
 * Icon menggunakan ukuran default dari icon-manager.js
 */

createAndAddMarker(markerData, lat, lng, markerKey) {
  const specialIcon = markerData.special_icon || null;
  const markerFloor = markerData.floor || '';

  const needsBadge = typeof UndergroundManager !== 'undefined'
    ? UndergroundManager.needsFloorBadge(markerFloor)
    : false;

  // ✅ Gunakan default icon size (no zoom calculation)
  const baseIcon = typeof getIconByCategoryWithSpecial !== 'undefined'
    ? getIconByCategoryWithSpecial(markerData.category_id, specialIcon)
    : getIconByCategory(markerData.category_id);

  // Add badge if needed
  let finalIcon = baseIcon;
  if (needsBadge) {
    finalIcon = this.createIconWithBadge(baseIcon, markerFloor);
  }

  const popupContent = this.createPopupContent(markerData);

  const leafletMarker = L.marker([lat, lng], { icon: finalIcon })
    .bindPopup(popupContent);

  if (needsBadge) {
    leafletMarker.on('click', () => {
      this.map.closePopup();
      UndergroundManager?.setActiveFloor(markerFloor);
      this.showFloorSwitchNotification(markerFloor);
    });
  }

  // ✅ Check visited status and hidden marker setting
  const visitedMarkers = JSON.parse(localStorage.getItem("visitedMarkers") || "{}");
  const isVisited = visitedMarkers[markerKey] || false;
  const isHiddenEnabled = window.SettingsManager && window.SettingsManager.isHiddenMarkerEnabled();
  
  if (isVisited) {
    if (isHiddenEnabled) {
      // Don't add to map if visited and hidden mode is enabled
      console.log(`🙈 Skipping marker ${markerKey} (visited + hidden mode)`);
      
      // ✅ Store metadata (for potential future use)
      leafletMarker.categoryId = markerData.category_id;
      leafletMarker.markerKey = markerKey;
      leafletMarker.floor = markerFloor;
      leafletMarker.specialIcon = specialIcon;
      leafletMarker.hasBadge = needsBadge;
      
      this.activeMarkers[markerKey] = leafletMarker;
      return; // Don't add to map
    } else {
      // Add to map but with reduced opacity
      leafletMarker.addTo(this.map);
      leafletMarker.setOpacity(0.5);
    }
  } else {
    // Not visited - add normally
    leafletMarker.addTo(this.map);
  }

  // ✅ Store metadata
  leafletMarker.categoryId = markerData.category_id;
  leafletMarker.markerKey = markerKey;
  leafletMarker.floor = markerFloor;
  leafletMarker.specialIcon = specialIcon;
  leafletMarker.hasBadge = needsBadge;

  this.activeMarkers[markerKey] = leafletMarker;
},

/**
 * SIMPLIFIED: createIconWithBadge - Use default size from baseIcon
 */
createIconWithBadge(baseIcon, markerFloor) {
  const baseHtml = baseIcon.options.html || "";
  
  // ✅ Ambil size dari baseIcon (default size)
  const iconSize = baseIcon.options.iconSize || [48, 48];
  const badgeSize = Math.floor(iconSize[0] * 0.3);

  return L.divIcon({
    html: `
      <div style="position:relative;width:${iconSize[0]}px;height:${iconSize[1]}px;">
        ${baseHtml}
        <img src="${ICON_BASE_URL}layericon.png"
          style="
            position:absolute;
            bottom:0;
            right:0;
            width:${badgeSize}px;
            height:${badgeSize}px;
            border:2px solid rgba(0,0,0,0.5);
            border-radius:50%;
            background:rgba(0,0,0,0.7);
            box-shadow:0 2px 4px rgba(0,0,0,0.5);
            z-index:10;
          ">
      </div>
    `,
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]],
    className: "no-default-icon-bg marker-with-badge"
  });
},

  /**
   * Show notification when switching floor
   */
  showFloorSwitchNotification(floorId) {
    const oldNotif = document.querySelector(".floor-switch-notification");
    if (oldNotif) oldNotif.remove();

    let floorName = "Unknown Floor";

    if (typeof UndergroundManager !== "undefined") {
      const floorInfo = UndergroundManager.floors.find(f => f.id === floorId);
      if (floorInfo) floorName = floorInfo.name;
    }

    const notif = document.createElement("div");
    notif.className = "floor-switch-notification";
    notif.innerHTML = `
      <img src="${ICON_BASE_URL}layericon.png" style="width:20px;height:20px;margin-right:8px;">
      <span>Switched to <strong>${floorName}</strong></span>
    `;
    document.body.appendChild(notif);

    notif.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      font-size: 14px;
      z-index: 10000;
      animation: slideDown .3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;

    setTimeout(() => {
      notif.style.animation = "slideDown .3s ease-in reverse";
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  },

  /**
   * Update markers in view
   */
  updateMarkersInView() {
    const bounds = this.getBufferedBounds();
    const markers = this.getAllMarkers();

    this.removeOutOfBoundsMarkers(bounds);
    this.addMarkersBatch(markers, bounds);
  },

  /**
   * Update stats
   */
  updateStats() {
    const statsEl = document.getElementById("filterStats");
    if (!statsEl) return;

    const count = Object.keys(this.activeMarkers).length;

    let floorInfo = "";
    if (typeof UndergroundManager !== "undefined") {
      const activeFloorData = UndergroundManager.getActiveFloorInfo();
      if (activeFloorData) {
        let floorName = activeFloorData.name.split("(")[0].trim();
        floorInfo = ` <span style="color:#f3d59b;">| ${floorName}</span>`;
      }
    }

    statsEl.innerHTML = `Showing <strong>${count}</strong> markers${floorInfo}`;
  },

  /**
   * Refresh markers after floor change
   */
  forceRefreshMarkers() {
    this.removeAllMarkers();
    this.updateMarkersInView();
  },

  /**
   * Debounce
   */
  debounce(fn, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}; // ✅ Penutup MarkerManager yang benar
// ========================================
// VISITED MARKER FUNCTIONS
// ========================================

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} label - Label for notification
 */
window.copyToClipboard = function(text, label) {
  navigator.clipboard.writeText(text).then(() => {
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
 * Toggle visited status - SIMPAN LOKAL SAJA (tidak kirim ke server)
 * @param {string} markerKey - Marker key
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
 * Visited Marker Functions - Enhanced with Hidden Marker Support
 * Updated to support both dimmed and hidden visited markers
 */

// ========================================
// SYNC PROTECTION FLAGS
// ========================================
let isLoadingVisitedMarkers = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN = 5000; // 5 detik cooldown

/**
 * Toggle visited status - SAVE LOCAL ONLY
 * @param {string} markerKey - Marker key
 */
window.toggleVisited = function (markerKey) {
  const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  const newStatus = !visitedMarkers[markerKey];
  
  // Save to local
  visitedMarkers[markerKey] = newStatus;
  localStorage.setItem('visitedMarkers', JSON.stringify(visitedMarkers));
  
  // Update marker based on hidden setting
  const marker = MarkerManager.activeMarkers[markerKey];
  if (!marker) return;
  
  const isHiddenEnabled = window.SettingsManager && window.SettingsManager.isHiddenMarkerEnabled();
  
  if (newStatus) {
    // Marker is now visited
    if (isHiddenEnabled) {
      // Hide completely
      marker.remove();
      console.log(`🙈 Marker ${markerKey} hidden (visited)`);
    } else {
      // Dim opacity
      marker.setOpacity(0.5);
      console.log(`🌗 Marker ${markerKey} dimmed (visited)`);
    }
  } else {
    // Marker is now unvisited
    if (!marker._map) {
      marker.addTo(MarkerManager.map);
    }
    marker.setOpacity(1.0);
    console.log(`✨ Marker ${markerKey} restored (unvisited)`);
  }
  
  // Refresh popup
  const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
  if (markerData) {
    marker.getPopup().setContent(MarkerManager.createPopupContent(markerData));
  }
};

/**
 * Load visited markers - BATCH VERSION with Hidden Marker Support
 * ✅ Send all markers at once in 1 request
 * ✅ Support hidden marker setting
 */
async function loadVisitedMarkersFromServer() {
  // ✅ Protection: Prevent if already syncing
  if (isLoadingVisitedMarkers) {
    console.log("⏭️ Already syncing visited markers, skipping...");
    return;
  }
  
  // ✅ Cooldown to prevent spam
  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN) {
    console.log("⏱️ Sync cooldown active, skipping...");
    return;
  }
  
  const localVisited = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
  const isHiddenEnabled = window.SettingsManager && window.SettingsManager.isHiddenMarkerEnabled();
  
  // If not logged in, only update from local
  if (!isLoggedIn()) {
    Object.entries(localVisited).forEach(([key, isVisited]) => {
      const marker = MarkerManager.activeMarkers[key];
      if (!marker) return;
      
      if (isVisited) {
        if (isHiddenEnabled) {
          marker.remove();
        } else {
          marker.setOpacity(0.5);
        }
      } else {
        if (!marker._map) {
          marker.addTo(MarkerManager.map);
        }
        marker.setOpacity(1.0);
      }
    });
    return;
  }
  
  // Set flags
  isLoadingVisitedMarkers = true;
  lastSyncTime = now;
  
  try {
    const token = getUserToken();
    
    console.log("📥 Fetching visited markers from server...");
    
    const res = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/visitedmarker", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    let data;
    try {
      data = JSON.parse(await res.text());
    } catch (e) {
      console.error("❌ Failed to parse server response");
      return;
    }
    
    const serverVisited = data.visitedMarkers || {};
    const merged = { ...serverVisited, ...localVisited };
    
    localStorage.setItem("visitedMarkers", JSON.stringify(merged));
    
    // ✅ Find differences to sync
    const keysToSync = Object.keys(localVisited).filter(key => 
      localVisited[key] !== serverVisited[key]
    );
    
    // ✅ SEND BATCH (not one by one!)
    if (keysToSync.length > 0) {
      console.log(`📤 Syncing ${keysToSync.length} markers to server (BATCH)...`);
      
      try {
        const batchRes = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/visitedmarker/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            markers: keysToSync.map(markerKey => ({
              markerKey: markerKey,
              visited: localVisited[markerKey]
            }))
          })
        });
        
        if (batchRes.ok) {
          const batchData = await batchRes.json();
          console.log(`✅ Batch sync complete! Updated ${batchData.updated} markers`);
        } else {
          const errorText = await batchRes.text();
          console.error("❌ Batch sync failed:", batchRes.status, errorText);
          
          // Fallback: if batch fails, try one by one (backward compatible)
          console.log("⚠️ Falling back to individual requests...");
          await fallbackIndividualSync(keysToSync, localVisited, token);
        }
        
      } catch (err) {
        console.error("❌ Batch request error:", err);
        
        // Fallback to individual sync
        console.log("⚠️ Falling back to individual requests...");
        await fallbackIndividualSync(keysToSync, localVisited, token);
      }
      
    } else {
      console.log("✅ No changes to sync");
    }
    
    // Update marker visibility based on hidden setting
    console.log(`🔄 Applying markers (hidden mode: ${isHiddenEnabled ? 'ON' : 'OFF'})...`);
    
    Object.entries(merged).forEach(([key, isVisited]) => {
      const marker = MarkerManager.activeMarkers[key];
      if (!marker) return;
      
      if (isVisited) {
        if (isHiddenEnabled) {
          // Hide completely
          marker.remove();
        } else {
          // Dim opacity
          if (!marker._map) {
            marker.addTo(MarkerManager.map);
          }
          marker.setOpacity(0.5);
        }
      } else {
        // Unvisited - always visible
        if (!marker._map) {
          marker.addTo(MarkerManager.map);
        }
        marker.setOpacity(1.0);
      }
    });
    
    console.log(`✅ Applied visibility to ${Object.keys(merged).length} markers`);
    
  } catch (err) {
    console.error("❌ Error syncing visited markers:", err);
    
    // Fallback: update from local only
    Object.entries(localVisited).forEach(([key, isVisited]) => {
      const marker = MarkerManager.activeMarkers[key];
      if (!marker) return;
      
      if (isVisited) {
        if (isHiddenEnabled) {
          marker.remove();
        } else {
          marker.setOpacity(0.5);
        }
      } else {
        if (!marker._map) {
          marker.addTo(MarkerManager.map);
        }
        marker.setOpacity(1.0);
      }
    });
  } finally {
    // ✅ Reset flag
    isLoadingVisitedMarkers = false;
  }
}

/**
 * Fallback: Individual sync (backward compatible)
 * Called if batch endpoint fails
 */
async function fallbackIndividualSync(keysToSync, localVisited, token) {
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < keysToSync.length; i++) {
    const markerKey = keysToSync[i];
    
    try {
      const res = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/visitedmarker", {
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
      
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Delay to avoid rate limit
      if (i < keysToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (err) {
      console.error(`Failed to sync marker ${markerKey}:`, err);
      failCount++;
    }
  }
  
  console.log(`✅ Fallback sync complete: ${successCount} success, ${failCount} failed`);
}


// ========================================
// MARKER EDITING FUNCTIONS
// ========================================

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
  }, 100);
};

/**
 * Handle click outside popup to cancel edit
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
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'info')
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  
  if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.95))';
    notification.style.borderColor = 'rgba(239, 83, 80, 0.8)';
  } else if (type === 'info') {
    notification.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(25, 118, 210, 0.95))';
    notification.style.borderColor = 'rgba(66, 165, 245, 0.8)';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 2000);
}
// ========================================
// GLOBAL EXPORTS
// ========================================
window.MarkerManager = MarkerManager;
window.loadVisitedMarkersFromServer = loadVisitedMarkersFromServer;

console.log('✅ MarkerManager exported to window');
console.log('✅ loadVisitedMarkersFromServer exported to window');