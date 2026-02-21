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

  if (typeof MarkerManager !== 'undefined' && MarkerManager.getAllMarkers) {
    const markers = MarkerManager.getAllMarkers();

    markers.forEach(marker => {
      // ✅ Hanya ambil region dari marker main map
      const mapType = (marker.map_type || '').trim().toLowerCase();
      if (mapType === 'hutuo') return; // skip marker hutuo

      if (marker.loc_type && marker.loc_type.trim() !== '') {
        regionsSet.add(marker.loc_type.trim());
      }
    });
  }

  const regionsList = Array.from(regionsSet).sort();

  this.availableRegions = [
    { id: 'all', name: 'All Regions', icon: `${ICON_BASE_URL}region.webp` },
    ...regionsList.map(region => ({
      id: region,
      name: region,
      icon: `${ICON_BASE_URL}region.webp`
    }))
  ];

  console.log(`📍 Found ${regionsList.length} unique regions (main map only):`, regionsList);
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

  // === STICKY HEADER: All Regions ===
  let stickyHeader = document.getElementById('regionStickyHeader');
  if (!stickyHeader) {
    stickyHeader = document.createElement('div');
    stickyHeader.id = 'regionStickyHeader';
    stickyHeader.className = 'region-sticky-header';
    panel.appendChild(stickyHeader);
  }

  const allRegion = this.availableRegions.find(r => r.id === 'all');
  const allItem = document.createElement('div');
  allItem.className = `region-item ${this.activeRegion === 'all' ? 'active' : ''}`;
  allItem.dataset.regionId = 'all';
  allItem.innerHTML = `
    <img src="${allRegion.icon}" alt="${allRegion.name}" class="region-icon">
    <div class="region-info">
      <div class="region-name">${allRegion.name}</div>
    </div>
  `;
  stickyHeader.innerHTML = '';
  stickyHeader.appendChild(allItem);

  // === SCROLLABLE CONTENT: Region lainnya ===
  let content = document.getElementById('regionContent');
  if (!content) {
    content = document.createElement('div');
    content.id = 'regionContent';
    content.className = 'region-content';
    panel.appendChild(content);
  }
  content.innerHTML = '';

  const otherRegions = this.availableRegions.filter(r => r.id !== 'all');
  otherRegions.forEach((region) => {
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
 * Cek apakah region ini ada di map hutuo atau main
 * Berdasarkan marker yang punya loc_type tersebut
 */
getRegionMapType(regionId) {
  if (regionId === 'all') return 'main';
  
  if (typeof MarkerManager === 'undefined') return 'main';
  const markers = MarkerManager.getAllMarkers();
  
  // Cari marker pertama yang punya loc_type ini
  const found = markers.find(m => 
    m.loc_type && m.loc_type.trim() === regionId
  );
  
  if (!found) return 'main';
  return (found.map_type || '').trim().toLowerCase() === 'hutuo' ? 'hutuo' : 'main';
},

/**
 * Focus map to region — switch map dulu jika beda
 */
focusToRegion(regionId) {
  if (!this.map || regionId === 'all') return;

  const targetMapType = this.getRegionMapType(regionId);
  const currentMap = typeof getCurrentMapPreset === 'function' ? getCurrentMapPreset() : 'main';
  
  const doFly = () => {
    // Cari di zoom_6 labels dulu
    if (
      typeof RegionLabelManager !== 'undefined' &&
      typeof RegionLabelManager._getLabelConfig === 'function'
    ) {
      const zoom6Labels = RegionLabelManager._getLabelConfig('zoom_6');
      const matchedLabel = zoom6Labels?.find(
        label => label.name.trim().toLowerCase() === regionId.trim().toLowerCase()
      );
      if (matchedLabel) {
        this.map.flyTo([matchedLabel.lat, matchedLabel.lng], 6, { duration: 1.0 });
        console.log(`🎯 Focused to zoom_6 label: ${matchedLabel.name}`);
        return;
      }
    }

    // Fallback: pakai marker
    const markers = MarkerManager.getAllMarkers?.();
    if (!markers?.length) return;
    const regionMarkers = markers.filter(m => m.loc_type && m.loc_type.trim() === regionId);
    if (!regionMarkers.length) return;
    const raw = regionMarkers[0];
    if (raw.lat && raw.lng) {
      this.map.flyTo([parseFloat(raw.lat), parseFloat(raw.lng)], 6, { duration: 0.8 });
    }
  };

  // ✅ Jika beda map, switch dulu baru fly to
  if (targetMapType !== currentMap) {
    console.log(`🔄 Switching map dari ${currentMap} ke ${targetMapType} untuk region: ${regionId}`);
    switchMapPreset(targetMapType, true);
    setTimeout(doFly, 900); // Tunggu switch + refresh selesai
  } else {
    doFly();
  }
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
    // Sticky header click (All Regions)
const stickyHeader = document.getElementById('regionStickyHeader');
if (stickyHeader) {
  stickyHeader.addEventListener('click', (e) => {
    const regionItem = e.target.closest('.region-item');
    if (!regionItem) return;
    const regionId = regionItem.dataset.regionId;
    this.setActiveRegion(regionId);
    setTimeout(() => this.closePanel(), 300);
  });
}
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
  // Jika map hutuo aktif, skip region filter sepenuhnya
  const currentMap = typeof getCurrentMapPreset === 'function' 
    ? getCurrentMapPreset() : 'main';
  if (currentMap === 'hutuo') return true;

  // All Regions = tampilkan semua
  if (this.activeRegion === 'all') return true;

  const markerRegion = marker.loc_type ? marker.loc_type.trim() : '';
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