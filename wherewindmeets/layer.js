/**
 * Underground Floor Manager - Popup Version (FIXED Icons + Hint)
 * Container muncul di sebelah tombol (kiri bawah)
 */

console.log("🏔️ Loading underground-manager.js (Popup Version - FIXED)...");

const UndergroundManager = {
  map: null,
  activeFloor: 'surface',
  overlayLayers: {},
  overlayData: null,
  isOpen: false,
  mapReady: false,
  
  floors: [
    { 
      id: 'surface', 
      name: 'Jianghua', 
      icon: `${ICON_BASE_URL}outland.png`,
      description: 'Ground level',
      filterValue: null,
      brightness: 1.0,
      blur: 0
    },
    { 
      id: '1', 
      name: 'Cave Level 1', 
      icon: `${ICON_BASE_URL}layericon.png`,
      description: 'First level',
      filterValue: '1',
      brightness: 0.3,
      blur: 2
    },
    { 
      id: '2', 
      name: 'Cave Level 2', 
      icon: `${ICON_BASE_URL}layericon.png`,
      description: 'Second level',
      filterValue: '2',
      brightness: 0.2,
      blur: 3
    },
    { 
      id: '3', 
      name: 'Cave Level 3', 
      icon: `${ICON_BASE_URL}layericon.png`,
      description: 'Third level',
      filterValue: '3',
      brightness: 0.1,
      blur: 3
    },
    { 
      id: '4', 
      name: 'Deepest Cave', 
      icon: `${ICON_BASE_URL}layericon.png`,
      description: 'Deepest level',
      filterValue: '4',
      brightness: 0.025,
      blur: 3
    }
  ],

  /**
   * ✨ Apply visual effects to map (brightness + blur)
   */
  applyMapEffects(brightness, blur) {
    if (!this.map) return;
    
    const mapContainer = this.map.getContainer();
    
    // Get all tile layers (base map)
    const tileLayers = [];
    this.map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        tileLayers.push(layer);
      }
    });
    
    // Apply effects to tile layers
    tileLayers.forEach(layer => {
      const element = layer.getContainer();
      if (element) {
        element.style.filter = `brightness(${brightness}) blur(${blur}px)`;
        element.style.transition = 'filter 0.5s ease-in-out';
      }
    });
  },

  /**
   * ✨ Reset map to normal (remove all effects)
   */
  resetMapEffects() {
    if (!this.map) return;
    
    this.map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        const element = layer.getContainer();
        if (element) {
          element.style.filter = 'none';
        }
      }
    });
  },

  /**
   * Initialize underground manager
   */
  async init(map) {
    this.map = map;
    
    // 🔥 WAIT for map to be fully ready
    await this.waitForMapReady();
    
    // Check if DOM elements exist
    const panel = document.getElementById("undergroundPanel");
    const toggleBtn = document.getElementById("undergroundToggle");
    const content = document.getElementById("undergroundContent");
    
    if (!panel || !toggleBtn || !content) {
      console.error("❌ CRITICAL: Required DOM elements missing!");
      return;
    }
    
    // Load overlay data
    console.log("⏳ Loading overlay data...");
    await this.loadOverlayData();
    console.log("✅ Overlay data loading complete");
    
    // Setup UI
    this.setupUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load saved floor or default to surface
    const savedFloor = localStorage.getItem('activeFloor') || 'surface';
    this.setActiveFloor(savedFloor, false);
    
    // 🎯 Show hint after everything is loaded (delay 2 seconds)
    setTimeout(() => {
      this.showUndergroundHint();
    }, 2000);
  },

  /**
   * 🔥 NEW: Wait for map to be fully ready
   */
  async waitForMapReady() {
    return new Promise((resolve) => {
      if (this.isMapReady()) {
        this.mapReady = true;
        resolve();
        return;
      }
      
      // Try every 100ms, max 5 seconds
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (this.isMapReady()) {
          this.mapReady = true;
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn("⚠️ Map not ready after 5s, proceeding anyway");
          this.mapReady = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  },

  /**
   * 🔥 NEW: Check if map is ready
   */
  isMapReady() {
    return this.map && 
           typeof this.map.hasLayer === 'function' &&
           typeof this.map.addLayer === 'function' &&
           typeof this.map.removeLayer === 'function';
  },

  /**
   * Create Leaflet overlay layers from data
   */
  createOverlayLayers() {
    if (!this.overlayData || this.overlayData.length === 0) {
      console.warn("⚠️ No overlay data available");
      return;
    }

    this.overlayData.forEach((overlay, index) => {
      const underground = String(overlay.underground);

      if (!overlay.path) {
        console.warn(`⚠️ Overlay #${index + 1} has no path!`, overlay);
        return;
      }

      const bounds = L.latLngBounds(
        [overlay.bounds.sw.lat, overlay.bounds.sw.lng],
        [overlay.bounds.ne.lat, overlay.bounds.ne.lng]
      );

      const imageOverlay = L.imageOverlay(overlay.path, bounds, {
        opacity: 0.95,
        interactive: false,
        className: 'underground-overlay'
      });

      if (!this.overlayLayers[underground]) {
        this.overlayLayers[underground] = [];
      }
      this.overlayLayers[underground].push(imageOverlay);
    });
  },

  /**
   * Load overlay data from API
   */
  async loadOverlayData() {
    try {
      const response = await fetch('https://autumn-dream-8c07.square-spon.workers.dev/bellow');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.overlayData = await response.json();
      
      // Create overlay layers
      this.createOverlayLayers();
      
    } catch (error) {
      console.error("❌ Failed to load overlay data:", error);
      this.overlayData = [];
    }
  },

  /**
   * Setup floor selection UI
   */
  setupUI() {
    const container = document.getElementById("undergroundContent");
    if (!container) {
      console.error("❌ undergroundContent container not found!");
      return;
    }

    container.innerHTML = '';

    this.floors.forEach((floor, index) => {
      const isActive = this.activeFloor === floor.id;
      
      const floorItem = document.createElement('div');
      floorItem.className = `floor-item ${isActive ? 'active' : ''}`;
      floorItem.dataset.floorId = floor.id;
      
      // ✨ Add depth indicator for underground floors
      let depthIndicator = '';
      if (floor.id !== 'surface') {
        const depth = '▼'.repeat(parseInt(floor.id));
        depthIndicator = `<span class="floor-depth">${depth}</span>`;
      }
      
      floorItem.innerHTML = `
        <img src="${floor.icon}" alt="${floor.name}" class="floor-icon">
        <div class="floor-info">
          <div class="floor-name">${floor.name}</div>
          ${depthIndicator}
        </div>
      `;
      
      container.appendChild(floorItem);
    });

    this.updateStats();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const toggleBtn = document.getElementById("undergroundToggle");
    const panel = document.getElementById("undergroundPanel");

    if (!toggleBtn || !panel) {
      console.error("❌ ERROR: Required elements not found!");
      return;
    }

    // Toggle button
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePanel();
    });
    
    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isOpen && 
          !panel.contains(e.target) && 
          !toggleBtn.contains(e.target)) {
        this.closePanel();
      }
    });

    // Floor item clicks
    const container = document.getElementById("undergroundContent");
    if (container) {
      container.addEventListener("click", (e) => {
        const floorItem = e.target.closest(".floor-item");
        if (!floorItem) return;

        const floorId = floorItem.dataset.floorId;
        this.setActiveFloor(floorId);
        
        setTimeout(() => {
          this.closePanel();
        }, 300);
      });
    }
  },

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    this.isOpen = !this.isOpen;
    
    const panel = document.getElementById("undergroundPanel");
    if (!panel) return;
    
    if (this.isOpen) {
      panel.classList.add('visible');
    } else {
      panel.classList.remove('visible');
    }
  },

  /**
   * Close panel
   */
  closePanel() {
    const panel = document.getElementById("undergroundPanel");
    if (!panel) return;
    
    this.isOpen = false;
    panel.classList.remove('visible');
  },

  /**
   * Set active floor and update markers
   */
  setActiveFloor(floorId, updateMarkers = true) {
    const previousFloor = this.activeFloor;
    this.activeFloor = floorId;
    
    // Get floor config for effects
    const floorConfig = this.floors.find(f => f.id === floorId);
    
    // Update UI
    document.querySelectorAll('.floor-item').forEach(item => {
      const itemFloorId = item.dataset.floorId;
      
      if (itemFloorId === floorId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Save to localStorage
    localStorage.setItem('activeFloor', floorId);
    
    // ✨ Apply visual effects BEFORE updating overlays
    if (floorConfig) {
      if (floorId === 'surface') {
        this.resetMapEffects();
      } else {
        this.applyMapEffects(floorConfig.brightness, floorConfig.blur);
      }
    }
    
    // Update overlays
    this.updateOverlays(previousFloor, floorId);
    
    // 🔥 FORCE REFRESH ALL MARKERS saat floor berubah
    if (updateMarkers && typeof MarkerManager !== 'undefined') {
      MarkerManager.forceRefreshMarkers();
    }
    
    this.updateStats();
  },

  /**
   * Update map overlays based on active floor
   */
  updateOverlays(previousFloor, newFloor) {
    // 🔥 SAFETY CHECK: Ensure map is ready
    if (!this.mapReady || !this.isMapReady()) {
      console.warn("⚠️ Map not ready, skipping overlay update");
      return;
    }
    
    // Remove previous floor overlays
    if (previousFloor && previousFloor !== 'surface') {
      const prevOverlays = this.overlayLayers[previousFloor];
      if (prevOverlays) {
        prevOverlays.forEach((overlay, i) => {
          try {
            if (this.map.hasLayer(overlay)) {
              this.map.removeLayer(overlay);
            }
          } catch (err) {
            console.error(`❌ Error removing overlay:`, err);
          }
        });
      }
    }

    // Add new floor overlays
    if (newFloor && newFloor !== 'surface') {
      const newOverlays = this.overlayLayers[newFloor];
      if (newOverlays) {
        newOverlays.forEach((overlay, i) => {
          try {
            overlay.addTo(this.map);
          } catch (err) {
            console.error(`❌ Error adding overlay:`, err);
          }
        });
      }
    }
  },

  /**
   * Update markers in current view
   */
  updateMarkersInView() {
    if (typeof MarkerManager !== 'undefined' && MarkerManager.updateMarkersInView) {
      MarkerManager.updateMarkersInView();
    }
  },

  /**
   * Check if a marker should be visible based on current floor
   */
  shouldShowMarker(marker) {
    const currentFloorConfig = this.floors.find(f => f.id === this.activeFloor);
    if (!currentFloorConfig) return false;

    const markerFloor = marker.floor || '';
    const filterValue = currentFloorConfig.filterValue;

    // Surface: show markers without floor data
    if (filterValue === null) {
      return markerFloor === '' || markerFloor === null || markerFloor === undefined;
    }

    // Underground levels: exact match
    return String(markerFloor) === String(filterValue);
  },

  /**
   * Get current active floor info
   */
  getActiveFloorInfo() {
    return this.floors.find(f => f.id === this.activeFloor);
  },

  /**
   * Update stats display
   */
  updateStats() {
    const floorInfo = this.getActiveFloorInfo();
    const floorNameEl = document.getElementById('activeFloorName');
    const markersCountEl = document.getElementById('visibleFloorMarkers');
    
    if (floorNameEl && floorInfo) {
      floorNameEl.textContent = floorInfo.name;
    }
    
    if (markersCountEl && typeof MarkerManager !== 'undefined') {
      const visibleCount = Object.keys(MarkerManager.activeMarkers || {}).length;
      markersCountEl.textContent = visibleCount;
    }
  },

  /**
   * 🎯 Show hint for underground toggle button
   */
  showUndergroundHint() {
    const toggleBtn = document.getElementById("undergroundToggle");
    if (!toggleBtn) return;
    
    // Hapus hint lama jika ada
    const old = document.querySelector('.underground-hint');
    if (old) old.remove();
    
    // Create hint element
    const hint = document.createElement('div');
    hint.className = 'underground-hint';
    hint.textContent = 'Switch Underground Layer';
    document.body.appendChild(hint);
    
    // Get button position
    const rect = toggleBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    // Set position based on device
    if (isMobile) {
      // MOBILE: Hint di kanan tombol
      hint.style.position = "fixed";
      hint.style.left = (rect.right + 15) + "px";
      hint.style.top = (rect.top + rect.height / 2) + "px";
      hint.style.transform = "translateY(-50%)";
    } else {
      // PC: Hint di bawah tombol
      hint.style.position = "fixed";
      hint.style.left = (rect.left + rect.width / 2) + "px";
      hint.style.top = (rect.bottom + 15) + "px";
      hint.style.transform = "translateX(-50%)";
    }
    
    // Animasi muncul
    setTimeout(() => hint.classList.add('show'), 50);
    
    // Hilang sendiri setelah 19 detik
    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 300);
    }, 19000);
  }
};

// Make available globally
window.UndergroundManager = UndergroundManager;

// 🎯 Update hint position on window resize
let undergroundHintResizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(undergroundHintResizeTimeout);
  undergroundHintResizeTimeout = setTimeout(() => {
    const hint = document.querySelector('.underground-hint');
    if (hint && hint.classList.contains('show')) {
      // Recreate hint with new position
      hint.remove();
      UndergroundManager.showUndergroundHint();
    }
  }, 250);
});

console.log("✅ underground-manager.js loaded successfully (FIXED + Hint)");