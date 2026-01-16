/**
 * Region Manager - Filter markers by loc_type
 * Similar to Underground Floor Manager
 */

const RegionManager = {
  map: null,
  activeRegion: 'all',
  availableRegions: [],
  isOpen: false,
  
  /**
   * Initialize region manager
   */
  async init(map) {
    this.map = map;
    
    // Extract unique regions from markers
    this.extractRegions();
    
    // Setup UI
    this.setupUI();
    this.setupEventListeners();
    
// Always reset to All Regions on page load
this.setActiveRegion('all', false);
    
    // Show hint after delay
    setTimeout(() => {
      this.showRegionHint();
    }, 3000);
  },

  /**
   * Extract unique regions from all markers
   */
  extractRegions() {
    const regionsSet = new Set();
    
    // Get all markers
    if (typeof MarkerManager !== 'undefined' && MarkerManager.getAllMarkers) {
      const markers = MarkerManager.getAllMarkers();
      
      markers.forEach(marker => {
        if (marker.loc_type && marker.loc_type.trim() !== '') {
          regionsSet.add(marker.loc_type.trim());
        }
      });
    }
    
    // Sort regions alphabetically
    const regionsList = Array.from(regionsSet).sort();
    
    // Build regions array with 'All Regions' first
    this.availableRegions = [
      {
        id: 'all',
        name: 'All Regions',
        icon: `${ICON_BASE_URL}region.webp`
      },
      ...regionsList.map(region => ({
        id: region,
        name: region,
        icon: `${ICON_BASE_URL}layericon.png`
      }))
    ];
    
    console.log(`📍 Found ${regionsList.length} unique regions:`, regionsList);
  },

  /**
   * Setup region selection UI
   */
  setupUI() {
    // Create container if not exists
    let container = document.querySelector('.region-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'region-container';
      document.body.appendChild(container);
    }
    
    // Create toggle button
    let toggleBtn = document.getElementById('regionToggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'regionToggle';
      toggleBtn.className = 'region-toggle';
      toggleBtn.title = 'Switch Region';
      toggleBtn.innerHTML = `<img src="${ICON_BASE_URL}outland.png" alt="Region">`;
      container.appendChild(toggleBtn);
    }
    
    // Create panel
    let panel = document.getElementById('regionPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'regionPanel';
      panel.className = 'region-panel';
      container.appendChild(panel);
    }
    
    // Create content
    let content = document.getElementById('regionContent');
    if (!content) {
      content = document.createElement('div');
      content.id = 'regionContent';
      content.className = 'region-content';
      panel.appendChild(content);
    }
    
    // Populate regions
    content.innerHTML = '';
    
    this.availableRegions.forEach((region) => {
      const isActive = this.activeRegion === region.id;
      
      const regionItem = document.createElement('div');
      regionItem.className = `region-item ${isActive ? 'active' : ''}`;
      regionItem.dataset.regionId = region.id;
      
      regionItem.innerHTML = `
        <img src="${region.icon}" alt="${region.name}" class="region-icon">
        <div class="region-info">
          <div class="region-name">${region.name}</div>
        </div>
      `;
      
      content.appendChild(regionItem);
    });
    
    this.updateStats();
  },

/**
 * Focus map to one marker in active region
 */
focusToRegion(regionId) {
  if (!this.map || regionId === 'all') return;
  if (typeof MarkerManager === 'undefined') return;

  const markers = MarkerManager.getAllMarkers?.();
  if (!markers || !markers.length) return;

  // Cari SEMUA marker region (data level)
  const regionMarkers = markers.filter(m =>
    m.loc_type && m.loc_type.trim() === regionId
  );

  if (!regionMarkers.length) return;

  // Prioritas 1: marker leaflet yang sudah ada
  const leafletReady = regionMarkers.find(m => m.marker);

  let latlng = null;

  if (leafletReady) {
    latlng = leafletReady.marker.getLatLng();
  } 
  // Fallback: pakai data koordinat mentah
  else {
    const raw = regionMarkers[0];

    if (raw.latitude != null && raw.longitude != null) {
      latlng = L.latLng(raw.latitude, raw.longitude);
    }
  }

  if (!latlng) return;

  this.map.flyTo(latlng, Math.max(this.map.getZoom(), 6), {
    duration: 0.8
  });

  console.log(`🎯 Focused to region (lazy-safe): ${regionId}`, latlng);
},


  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const toggleBtn = document.getElementById('regionToggle');
    const panel = document.getElementById('regionPanel');
    
    if (!toggleBtn || !panel) return;
    
    // Toggle button click
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !panel.contains(e.target) && 
          !toggleBtn.contains(e.target)) {
        this.closePanel();
      }
    });
    
    // Region item clicks
    const content = document.getElementById('regionContent');
    if (content) {
      content.addEventListener('click', (e) => {
        const regionItem = e.target.closest('.region-item');
        if (!regionItem) return;
        
        const regionId = regionItem.dataset.regionId;
        this.setActiveRegion(regionId);
        
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
    
    const panel = document.getElementById('regionPanel');
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
    const panel = document.getElementById('regionPanel');
    if (!panel) return;
    
    this.isOpen = false;
    panel.classList.remove('visible');
  },

  /**
   * Set active region and update markers
   */
  setActiveRegion(regionId, updateMarkers = true) {
    this.activeRegion = regionId;
    
    // Update UI
    document.querySelectorAll('.region-item').forEach(item => {
      const itemRegionId = item.dataset.regionId;
      
      if (itemRegionId === regionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update markers
    if (updateMarkers && typeof MarkerManager !== 'undefined') {
      MarkerManager.forceRefreshMarkers();
    }
    this.focusToRegion(regionId);
    this.updateStats();
    
    // Show notification
    this.showRegionNotification(regionId);
  },

  /**
   * Check if a marker should be visible based on active region
   */
  shouldShowMarker(marker) {
    // If 'All Regions' is active, show all markers
    if (this.activeRegion === 'all') {
      return true;
    }
    
    // Check if marker has loc_type
    const markerRegion = marker.loc_type ? marker.loc_type.trim() : '';
    
    // Show only if matches active region
    return markerRegion === this.activeRegion;
  },

  /**
   * Get active region info
   */
  getActiveRegionInfo() {
    return this.availableRegions.find(r => r.id === this.activeRegion);
  },

  /**
   * Update stats display
   */
  updateStats() {
    const regionInfo = this.getActiveRegionInfo();
    
    // Update toggle button icon if needed
    const toggleBtn = document.getElementById('regionToggle');
    if (toggleBtn && regionInfo) {
      const img = toggleBtn.querySelector('img');
      if (img) {
        img.src = regionInfo.icon;
      }
    }
  },

  /**
   * Show notification when switching region
   */
  showRegionNotification(regionId) {
    const oldNotif = document.querySelector('.region-notification');
    if (oldNotif) oldNotif.remove();
    
    const regionInfo = this.availableRegions.find(r => r.id === regionId);
    if (!regionInfo) return;
    
    const notif = document.createElement('div');
    notif.className = 'region-notification';
 notif.innerHTML = `
  <span>Region: <strong>${regionInfo.name}</strong></span>
`;
    document.body.appendChild(notif);
    
    setTimeout(() => {
      notif.style.animation = 'slideDown .3s ease-in reverse';
      setTimeout(() => notif.remove(), 300);
    }, 2000);
  },

  /**
   * Show hint for region toggle button
   */
  showRegionHint() {
    const toggleBtn = document.getElementById('regionToggle');
    if (!toggleBtn) return;
    
    const old = document.querySelector('.region-hint');
    if (old) old.remove();
    
    const hint = document.createElement('div');
    hint.className = 'region-hint';
    hint.textContent = 'Beta Feature — Minor issues may occur.';
    document.body.appendChild(hint);
    
    const rect = toggleBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      hint.style.position = 'fixed';
      hint.style.left = (rect.right + 15) + 'px';
      hint.style.top = (rect.top + rect.height / 2) + 'px';
      hint.style.transform = 'translateY(-50%)';
    } else {
      hint.style.position = 'fixed';
      hint.style.left = (rect.left + rect.width / 2) + 'px';
      hint.style.top = (rect.bottom + 15) + 'px';
      hint.style.transform = 'translateX(-50%)';
    }
    
    setTimeout(() => hint.classList.add('show'), 50);
    
    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 300);
    }, 10000);
  }
};

// Make available globally
window.RegionManager = RegionManager;