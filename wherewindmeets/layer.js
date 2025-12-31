/**
 * Underground Floor Manager - Clean Version
 * Always starts at surface, no floor state persistence
 */

const UndergroundManager = {
  map: null,
  activeFloor: 'surface',
  overlayLayers: {},
  overlayData: null,
  isOpen: false,
  mapReady: false,
  seeAllMode: false, // Default: OFF
  
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
   * Apply visual effects to map (brightness + blur)
   */
  applyMapEffects(brightness, blur) {
    if (!this.map) return;
    
    const tileLayers = [];
    this.map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        tileLayers.push(layer);
      }
    });
    
    tileLayers.forEach(layer => {
      const element = layer.getContainer();
      if (element) {
        element.style.filter = `brightness(${brightness}) blur(${blur}px)`;
        element.style.transition = 'filter 0.5s ease-in-out';
      }
    });
  },

  /**
   * Reset map to normal (remove all effects)
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
    
    // Wait for map to be ready
    await this.waitForMapReady();
    
    // Check DOM elements
    const panel = document.getElementById("undergroundPanel");
    const toggleBtn = document.getElementById("undergroundToggle");
    const content = document.getElementById("undergroundContent");
    
    if (!panel || !toggleBtn || !content) {
      throw new Error("Required DOM elements missing");
    }
    
    // Load overlay data
    await this.loadOverlayData();
    
    // Load only See All preference (not floor state)
    const savedSeeAll = localStorage.getItem('seeAllMode');
    this.seeAllMode = savedSeeAll === 'true';
    
    // Setup UI
    this.createSeeAllToggle();
    this.setupUI();
    this.setupEventListeners();
    
    // Always start at surface
    this.setActiveFloor('surface', false);
    
    // Show hint after delay
    setTimeout(() => {
      this.showUndergroundHint();
    }, 2000);
  },

  /**
   * Wait for map to be fully ready
   */
  async waitForMapReady() {
    return new Promise((resolve) => {
      if (this.isMapReady()) {
        this.mapReady = true;
        resolve();
        return;
      }
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (this.isMapReady()) {
          this.mapReady = true;
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          this.mapReady = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  },

  /**
   * Check if map is ready
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
      return;
    }

    this.overlayData.forEach((overlay, index) => {
      const underground = String(overlay.underground);

      if (!overlay.path) {
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
   * Load overlay data from API with retry logic
   */
  async loadOverlayData() {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;
    const TIMEOUT = 10000;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch('https://autumn-dream-8c07.square-spon.workers.dev/bellow', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        this.overlayData = await response.json();
        
        if (!Array.isArray(this.overlayData)) {
          throw new Error("Invalid overlay data format");
        }
        
        this.createOverlayLayers();
        return true;
        
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          this.overlayData = [];
          return false;
        }
      }
    }
    
    return false;
  },

  /**
   * Create See All toggle button (outside panel)
   */
  createSeeAllToggle() {
    const container = document.querySelector('.underground-container');
    if (!container) return;

    // Check if already exists
    if (document.getElementById('seeAllToggle')) return;

    const seeAllBtn = document.createElement('button');
    seeAllBtn.id = 'seeAllToggle';
    seeAllBtn.className = 'see-all-toggle';
    seeAllBtn.title = 'See All Deeper Levels';
    seeAllBtn.innerHTML = `
      <span class="see-all-icon ${this.seeAllMode ? 'active' : ''}">👁️</span>
    `;
    
    // Insert after underground toggle button
    const undergroundToggle = document.getElementById('undergroundToggle');
    if (undergroundToggle && undergroundToggle.nextSibling) {
      container.insertBefore(seeAllBtn, undergroundToggle.nextSibling);
    } else {
      container.appendChild(seeAllBtn);
    }

    this.updateSeeAllButton();
    seeAllBtn.style.display = "none";
  },

  /**
   * Update See All button visual state
   */
  updateSeeAllButton() {
    const btn = document.getElementById('seeAllToggle');
    if (!btn) return;

    const icon = btn.querySelector('.see-all-icon');
    if (!icon) return;

    if (this.seeAllMode) {
      icon.classList.add('active');
      btn.style.background = 'linear-gradient(135deg, #f3d59b, #d4a74a)';
      btn.style.borderColor = '#f3d59b';
    } else {
      icon.classList.remove('active');
      btn.style.background = 'rgba(0, 0, 0, 0.7)';
      btn.style.borderColor = 'rgba(244, 229, 192, 0.3)';
    }
  },

  /**
   * Setup floor selection UI
   */
  setupUI() {
    const container = document.getElementById("undergroundContent");
    if (!container) return;

    container.innerHTML = '';

    this.floors.forEach((floor, index) => {
      const isActive = this.activeFloor === floor.id;
      
      const floorItem = document.createElement('div');
      floorItem.className = `floor-item ${isActive ? 'active' : ''}`;
      floorItem.dataset.floorId = floor.id;
      
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
    const seeAllBtn = document.getElementById("seeAllToggle");

    if (!toggleBtn || !panel) return;

    // Underground toggle button
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // See All toggle button
    if (seeAllBtn) {
      seeAllBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.seeAllMode = !this.seeAllMode;
        localStorage.setItem('seeAllMode', this.seeAllMode);
        
        this.updateSeeAllButton();
        
        if (typeof MarkerManager !== 'undefined') {
          MarkerManager.forceRefreshMarkers();
        }
        
        this.showSeeAllNotification();
      });
    }
    
    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isOpen && 
          !panel.contains(e.target) && 
          !toggleBtn.contains(e.target) &&
          !seeAllBtn?.contains(e.target)) {
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
   * Show notification when toggling See All
   */
  showSeeAllNotification() {
    const oldNotif = document.querySelector(".see-all-notification");
    if (oldNotif) oldNotif.remove();

    const notif = document.createElement("div");
    notif.className = "see-all-notification";
    notif.innerHTML = `
      <span style="font-size:20px;margin-right:8px;">👁️</span>
      <span>See All Mode: <strong>${this.seeAllMode ? 'ON' : 'OFF'}</strong></span>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = "slideDown .3s ease-in reverse";
      setTimeout(() => notif.remove(), 300);
    }, 2000);
  },

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    this.isOpen = !this.isOpen;
    
    const panel = document.getElementById("undergroundPanel");
    const seeAllBtn = document.getElementById("seeAllToggle");

    if (!panel) return;

    if (this.isOpen) {
      panel.classList.add('visible');
      if (seeAllBtn) seeAllBtn.style.display = "inline-flex";
    } else {
      panel.classList.remove('visible');
      if (seeAllBtn) seeAllBtn.style.display = "none";
    }
  },

  /**
   * Close panel
   */
  closePanel() {
    const panel = document.getElementById("undergroundPanel");
    const seeAllBtn = document.getElementById("seeAllToggle");

    if (!panel) return;

    this.isOpen = false;
    panel.classList.remove('visible');

    if (seeAllBtn) seeAllBtn.style.display = "none";
  },

  /**
   * Set active floor and update markers
   */
  setActiveFloor(floorId, updateMarkers = true) {
    const previousFloor = this.activeFloor;
    this.activeFloor = floorId;
    
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
    
    // NO LONGER SAVE FLOOR STATE
    // localStorage.setItem('activeFloor', floorId); // REMOVED
    
    // Apply visual effects
    if (floorConfig) {
      if (floorId === 'surface') {
        this.resetMapEffects();
      } else {
        this.applyMapEffects(floorConfig.brightness, floorConfig.blur);
      }
    }
    
    this.updateOverlays(previousFloor, floorId);
    
    if (updateMarkers && typeof MarkerManager !== 'undefined') {
      MarkerManager.forceRefreshMarkers();
    }
    
    this.updateStats();
  },

  /**
   * Update map overlays based on active floor
   */
  updateOverlays(previousFloor, newFloor) {
    if (!this.mapReady || !this.isMapReady()) {
      return;
    }
    
    // Remove previous floor overlays
    if (previousFloor && previousFloor !== 'surface') {
      const prevOverlays = this.overlayLayers[previousFloor];
      if (prevOverlays) {
        prevOverlays.forEach((overlay) => {
          try {
            if (this.map.hasLayer(overlay)) {
              this.map.removeLayer(overlay);
            }
          } catch (err) {
            // Silent fail
          }
        });
      }
    }

    // Add new floor overlays
    if (newFloor && newFloor !== 'surface') {
      const newOverlays = this.overlayLayers[newFloor];
      if (newOverlays) {
        newOverlays.forEach((overlay) => {
          try {
            overlay.addTo(this.map);
          } catch (err) {
            // Silent fail
          }
        });
      }
    }
  },

  /**
   * Check if a marker should be visible (with See All logic)
   */
  shouldShowMarker(marker) {
    const markerFloor = marker.floor || '';
    const currentFloorConfig = this.floors.find(f => f.id === this.activeFloor);
    
    if (!currentFloorConfig) return false;

    const filterValue = currentFloorConfig.filterValue;

    // Surface mode
    if (filterValue === null) {
      // Show surface markers
      if (markerFloor === '' || markerFloor === null || markerFloor === undefined) {
        return true;
      }
      
      // See All mode: show underground markers with badge
      if (this.seeAllMode) {
        const markerLevel = parseInt(markerFloor);
        return !isNaN(markerLevel) && markerLevel > 0;
      }
      
      return false;
    }

    // Exact match: always show
    if (String(markerFloor) === String(filterValue)) {
      return true;
    }

    // See All mode: show deeper levels only
    if (this.seeAllMode) {
      const currentLevel = parseInt(filterValue);
      const markerLevel = parseInt(markerFloor);
      
      // Show if marker is in deeper level (higher number)
      return !isNaN(markerLevel) && markerLevel > currentLevel;
    }

    return false;
  },

  /**
   * Check if marker needs badge (is from different floor)
   */
  needsFloorBadge(markerFloor) {
    if (!this.seeAllMode) return false;
    
    const currentFloorConfig = this.floors.find(f => f.id === this.activeFloor);
    if (!currentFloorConfig) return false;
    
    const markerFloorStr = String(markerFloor || '');
    const filterValue = currentFloorConfig.filterValue;
    
    // Surface mode: badge for all underground markers
    if (filterValue === null) {
      return markerFloorStr !== '' && !isNaN(parseInt(markerFloorStr));
    }
    
    // Underground mode: badge for markers from different floor
    const currentFloorStr = String(filterValue);
    return markerFloorStr !== currentFloorStr && markerFloorStr !== '';
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
   * Show hint for underground toggle button
   */
  showUndergroundHint() {
    const toggleBtn = document.getElementById("undergroundToggle");
    if (!toggleBtn) return;
    
    const old = document.querySelector('.underground-hint');
    if (old) old.remove();
    
    const hint = document.createElement('div');
    hint.className = 'underground-hint';
    hint.textContent = 'Switch Underground Layer';
    document.body.appendChild(hint);
    
    const rect = toggleBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      hint.style.position = "fixed";
      hint.style.left = (rect.right + 15) + "px";
      hint.style.top = (rect.top + rect.height / 2) + "px";
      hint.style.transform = "translateY(-50%)";
    } else {
      hint.style.position = "fixed";
      hint.style.left = (rect.left + rect.width / 2) + "px";
      hint.style.top = (rect.bottom + 15) + "px";
      hint.style.transform = "translateX(-50%)";
    }
    
    setTimeout(() => hint.classList.add('show'), 50);
    
    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 300);
    }, 19000);
  }
};

// Make available globally
window.UndergroundManager = UndergroundManager;