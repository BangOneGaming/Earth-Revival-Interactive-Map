/**
 * Region Manager - Filter markers by loc_type
 * With hierarchical grouping based on zoom_3_4 / zoom_5 labels
 */

const RegionManager = {
  map: null,
  activeRegion: 'all',
  availableRegions: [],
  groupedRegions: [],   // Hierarchical structure
  isOpen: false,
  expandedGroups: {},   // Track which groups are expanded
  
  /**
   * Initialize region manager
   */
  async init(map) {
    this.map = map;
    this.majorRegionIds = new Set();
    // Extract unique regions from markers
    this.extractRegions();
    
    // Build grouped structure from label config
    this.buildGroupedRegions();
    
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

  },

  /**
   * Build hierarchical grouped regions from label config
   * zoom_3_4 = top-level groups
   * zoom_5 = sub-regions inside each group (matched by map_type)
   * anything not matched = "Other"
   */
  buildGroupedRegions() {
    if (typeof RegionLabelManager === 'undefined') {
      // Fallback: flat list
      this.groupedRegions = this.availableRegions.filter(r => r.id !== 'all');
      return;
    }

    const zoom34 = RegionLabelManager._getLabelConfig('zoom_3_4'); // e.g. Qinghe, Kaifeng
    const zoom5  = RegionLabelManager._getLabelConfig('zoom_5');   // e.g. Verdant Wilds (map_type=Qinghe)
    const zoom6  = RegionLabelManager._getLabelConfig('zoom_6');   // e.g. Bamboo Abode (sub_regions=Verdant Wilds)

    // Build map: parentName → list of zoom5 children
    // zoom5 entries have map_type = name of their zoom34 parent
    const zoom5ByParent = {};
  zoom34.forEach(z34 => {
    zoom5ByParent[z34.name] = zoom5
      .filter(z5 => (z5.map_type || '').trim().toLowerCase() === z34.name.trim().toLowerCase()) // ← tambah .toLowerCase()
      .map(z5 => ({
        id: z5.name,
        name: z5.name,
        icon: `${ICON_BASE_URL}region.webp`,
        children: zoom6
          .filter(z6 => (z6.sub_regions || '').trim().toLowerCase() === z5.name.trim().toLowerCase()) // ← tambah .toLowerCase()
          .map(z6 => ({
            id: z6.name,
            name: z6.name,
            icon: `${ICON_BASE_URL}region.webp`
          }))
      }));
  });

    // Collect all region IDs that are accounted for in zoom3_4 hierarchy
    const accountedIds = new Set();
    zoom34.forEach(z34 => accountedIds.add(z34.name));
    zoom5.forEach(z5 => accountedIds.add(z5.name));
    zoom6.forEach(z6 => accountedIds.add(z6.name));

    // Build top-level groups from zoom_3_4
    const groups = zoom34.map(z34 => ({
      id: z34.name,
      name: z34.name,
      icon: `${ICON_BASE_URL}region.webp`,
      isGroup: true,
      children: zoom5ByParent[z34.name] || []
    }));
    this.majorRegionIds = new Set(zoom34.map(z => z.name.trim().toLowerCase()));
    
    // "Other" group: any loc_type from markers not in the hierarchy
    const otherRegions = this.availableRegions
      .filter(r => r.id !== 'all' && !accountedIds.has(r.id))
      .map(r => ({ ...r, children: [] }));

    if (otherRegions.length > 0) {
      groups.push({
        id: 'other',
        name: 'Other',
        icon: `${ICON_BASE_URL}region.webp`,
        isGroup: true,
        children: otherRegions
      });
    }

    this.groupedRegions = groups;

  },

  /**
   * Setup region selection UI
   */
  setupUI() {
    let container = document.querySelector('.region-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'region-container';
      document.body.appendChild(container);
    }

    let toggleBtn = document.getElementById('regionToggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'regionToggle';
      toggleBtn.className = 'region-toggle';
      toggleBtn.title = 'Switch Region';
      toggleBtn.innerHTML = `<img src="${ICON_BASE_URL}outland.png" alt="Region">`;
      container.appendChild(toggleBtn);
    }

    let panel = document.getElementById('regionPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'regionPanel';
      panel.className = 'region-panel';
      container.appendChild(panel);
    }

    // Build panel content
    this.buildPanelContent(panel);
  },

  /**
   * Build panel inner content (scrollable groups + sticky All Regions)
   */
  buildPanelContent(panel) {
    panel.innerHTML = '';

    // === SCROLLABLE CONTENT: Groups ===
    let content = document.createElement('div');
    content.id = 'regionContent';
    content.className = 'region-content';
    panel.appendChild(content);

    this.renderGroupedList(content);

    // === STICKY FOOTER: All Regions ===
    let stickyFooter = document.createElement('div');
    stickyFooter.id = 'regionStickyHeader';
    stickyFooter.className = 'region-sticky-header';

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
    stickyFooter.appendChild(allItem);
    panel.appendChild(stickyFooter);
  },

  /**
   * Render grouped list into content element
   */
  renderGroupedList(content) {
    content.innerHTML = '';

    this.groupedRegions.forEach(group => {
      const isExpanded = !!this.expandedGroups[group.id];
      const isGroupActive = this.activeRegion === group.id;

      // Group header row
      const groupEl = document.createElement('div');
      groupEl.className = `region-item region-group-header ${isGroupActive ? 'active' : ''}`;
      groupEl.dataset.regionId = group.id;
      groupEl.dataset.isGroup = 'true';
      groupEl.innerHTML = `
        <img src="${group.icon}" alt="${group.name}" class="region-icon">
        <div class="region-info">
          <div class="region-name">${group.name}</div>
        </div>
        ${group.children && group.children.length > 0 
          ? `<span class="region-chevron ${isExpanded ? 'expanded' : ''}">▶</span>` 
          : ''}
      `;
      content.appendChild(groupEl);

      // Children (zoom5 sub-regions)
      if (group.children && group.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = `region-children ${isExpanded ? 'expanded' : ''}`;
        childrenContainer.dataset.groupId = group.id;

        group.children.forEach(child => {
          const isChildActive = this.activeRegion === child.id;
          const hasGrandchildren = child.children && child.children.length > 0;
          const isChildExpanded = !!this.expandedGroups[child.id];

          const childEl = document.createElement('div');
          childEl.className = `region-item region-sub-item ${isChildActive ? 'active' : ''}`;
          childEl.dataset.regionId = child.id;
          childEl.dataset.isGroup = hasGrandchildren ? 'true' : 'false';
          childEl.innerHTML = `
            <img src="${child.icon}" alt="${child.name}" class="region-icon">
            <div class="region-info">
              <div class="region-name">${child.name}</div>
            </div>
            ${hasGrandchildren 
              ? `<span class="region-chevron ${isChildExpanded ? 'expanded' : ''}">▶</span>` 
              : ''}
          `;
          childrenContainer.appendChild(childEl);

          // Grandchildren (zoom6)
          if (hasGrandchildren) {
            const grandContainer = document.createElement('div');
            grandContainer.className = `region-children region-grandchildren ${isChildExpanded ? 'expanded' : ''}`;
            grandContainer.dataset.groupId = child.id;

            child.children.forEach(grand => {
              const isGrandActive = this.activeRegion === grand.id;
              const grandEl = document.createElement('div');
              grandEl.className = `region-item region-grand-item ${isGrandActive ? 'active' : ''}`;
              grandEl.dataset.regionId = grand.id;
              grandEl.dataset.isGroup = 'false';
              grandEl.innerHTML = `
                <img src="${grand.icon}" alt="${grand.name}" class="region-icon">
                <div class="region-info">
                  <div class="region-name">${grand.name}</div>
                </div>
              `;
              grandContainer.appendChild(grandEl);
            });

            childrenContainer.appendChild(grandContainer);
          }
        });

        content.appendChild(childrenContainer);
      }
    });
  },

  /**
   * Check if a region ID is a group (has children)
   */
  isGroupId(regionId) {
    return this.groupedRegions.some(g => g.id === regionId) ||
      this.groupedRegions.some(g => 
        g.children && g.children.some(c => c.id === regionId && c.children && c.children.length > 0)
      );
  },

  /**
   * Toggle expand/collapse a group
   */
  toggleGroup(groupId) {
    this.expandedGroups[groupId] = !this.expandedGroups[groupId];
    
    // Animate children container
    const childrenContainer = document.querySelector(`.region-children[data-group-id="${groupId}"]`);
    const chevron = document.querySelector(`[data-region-id="${groupId}"] .region-chevron`);
    
    if (childrenContainer) {
      if (this.expandedGroups[groupId]) {
        childrenContainer.classList.add('expanded');
      } else {
        childrenContainer.classList.remove('expanded');
      }
    }
    if (chevron) {
      if (this.expandedGroups[groupId]) {
        chevron.classList.add('expanded');
      } else {
        chevron.classList.remove('expanded');
      }
    }
  },

/**
 * Cek map_type dominan dari suatu region
 */
getRegionMapType(regionId) {

  if (regionId === 'all') return 'main';
  if (typeof MarkerManager === 'undefined') return 'main';

  const markers = MarkerManager.getAllMarkers();

  const regionMarkers = markers.filter(m =>
    m.loc_type && m.loc_type.trim() === regionId
  );

  if (!regionMarkers.length) return 'main';

  // Hitung jumlah tiap map_type
  const mapCounts = {};

  regionMarkers.forEach(m => {
    const type = (m.map_type || 'main').trim().toLowerCase();
    mapCounts[type] = (mapCounts[type] || 0) + 1;
  });

  // Cari map_type dengan jumlah terbanyak
  let dominantMap = 'main';
  let maxCount = 0;

  Object.keys(mapCounts).forEach(type => {
    if (mapCounts[type] > maxCount) {
      maxCount = mapCounts[type];
      dominantMap = type;
    }
  });

  console.log(
    "[RegionMapType]",
    regionId,
    "→",
    dominantMap,
    mapCounts
  );

  return dominantMap;
},

  /**
   * Focus map to region
   */
focusToRegion(regionId) {
  if (!this.map || regionId === 'all') return;

  // ============================================
  // SPECIAL: Region/sub-area yang butuh map sendiri
  // ============================================
  const REGION_MAP_OVERRIDE = {
    'Hutuo': 'hutuo',
    // Royal Palace nanti:
    // 'Royal Palace': 'royal_palace',
  };

  // Cari override berdasarkan regionId sendiri,
  // ATAU dari parent group-nya di zoom_5
  const getTargetMap = (id) => {
    // Cek langsung
    if (REGION_MAP_OVERRIDE[id]) return REGION_MAP_OVERRIDE[id];

    // Cek apakah dia sub-area dari region yang punya override
    // Cari di zoom_6: ambil sub_regions-nya, lalu cek apakah sub_regions itu ada di override
    const zoom6Labels = RegionLabelManager._getLabelConfig('zoom_6');
    const z6 = zoom6Labels?.find(
      l => l.name.trim().toLowerCase() === id.trim().toLowerCase()
    );
    if (z6 && z6.sub_regions && REGION_MAP_OVERRIDE[z6.sub_regions]) {
      return REGION_MAP_OVERRIDE[z6.sub_regions];
    }

    // Cek map_type langsung di zoom_6 (kasus Yunqiu yg pakai map_type)
    if (z6 && z6.map_type) {
      const mapTypeKey = Object.keys(REGION_MAP_OVERRIDE).find(
        k => REGION_MAP_OVERRIDE[k] === z6.map_type.toLowerCase()
      );
      if (mapTypeKey) return REGION_MAP_OVERRIDE[mapTypeKey];
      // Atau langsung pakai map_type sebagai preset name
      if (z6.map_type.toLowerCase() === 'hutuo') return 'hutuo';
    }

    return 'main';
  };

  const currentMap = typeof getCurrentMapPreset === 'function'
    ? getCurrentMapPreset()
    : 'main';

  const targetMap = getTargetMap(regionId);

  const doFly = () => {
    if (typeof RegionLabelManager !== 'undefined') {
      const zoom6Labels = RegionLabelManager._getLabelConfig('zoom_6');
      const matchedZ6 = zoom6Labels?.find(
        l => l.name.trim().toLowerCase() === regionId.trim().toLowerCase()
      );
      if (matchedZ6) {
        this.map.flyTo([matchedZ6.lat, matchedZ6.lng], 6, { duration: 1.0 });
        return;
      }

      const zoom5Labels = RegionLabelManager._getLabelConfig('zoom_5');
      const matchedZ5 = zoom5Labels?.find(
        l => l.name.trim().toLowerCase() === regionId.trim().toLowerCase()
      );
      if (matchedZ5) {
        this.map.flyTo([matchedZ5.lat, matchedZ5.lng], 5, { duration: 1.0 });
        return;
      }

      const zoom34Labels = RegionLabelManager._getLabelConfig('zoom_3_4');
      const matchedZ34 = zoom34Labels?.find(
        l => l.name.trim().toLowerCase() === regionId.trim().toLowerCase()
      );
      if (matchedZ34) {
        this.map.flyTo([matchedZ34.lat, matchedZ34.lng], 4, { duration: 1.0 });
        return;
      }
    }

    const markers = MarkerManager.getAllMarkers?.();
    if (!markers?.length) return;
    const regionMarkers = markers.filter(m =>
      m.loc_type && m.loc_type.trim() === regionId
    );
    if (!regionMarkers.length) return;
    const raw = regionMarkers[0];
    if (raw.lat && raw.lng) {
      this.map.flyTo([parseFloat(raw.lat), parseFloat(raw.lng)], 6, { duration: 0.8 });
    }
  };

  // ============================================
  // Switch map hanya jika perlu, lalu fly
  // ============================================
  if (currentMap === targetMap) {
    // Sudah di map yang benar → langsung fly, tidak reload tile
    doFly();
  } else {
    console.log(`🔄 Switch map: "${currentMap}" → "${targetMap}" untuk region: ${regionId}`);
    switchMapPreset(targetMap, true);
    setTimeout(doFly, 900);
  }
},

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const toggleBtn = document.getElementById('regionToggle');
    const panel = document.getElementById('regionPanel');
    
    if (!toggleBtn || !panel) return;
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });
    
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !panel.contains(e.target) && 
          !toggleBtn.contains(e.target)) {
        this.closePanel();
      }
    });

    // Sticky footer (All Regions)
    const stickyFooter = document.getElementById('regionStickyHeader');
    if (stickyFooter) {
      stickyFooter.addEventListener('click', (e) => {
        const regionItem = e.target.closest('.region-item');
        if (!regionItem) return;
        const regionId = regionItem.dataset.regionId;
        this.setActiveRegion(regionId);
        setTimeout(() => this.closePanel(), 300);
      });
    }

    // Region content clicks (delegated)
    const content = document.getElementById('regionContent');
    if (content) {
      content.addEventListener('click', (e) => {
        const regionItem = e.target.closest('.region-item');
        if (!regionItem) return;
        
        const regionId = regionItem.dataset.regionId;
        const isGroup = regionItem.dataset.isGroup === 'true';

        if (isGroup) {
          // Toggle expand
          this.toggleGroup(regionId);
          // Also select this region
          this.setActiveRegion(regionId);
        } else {
          this.setActiveRegion(regionId);
          setTimeout(() => this.closePanel(), 300);
        }
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

  document.querySelectorAll('.region-item').forEach(item => {
    item.classList.toggle('active', item.dataset.regionId === regionId);
  });

  // Major regions → tidak filter marker, tidak fly
  const isMajorRegion = RegionLabelManager._getLabelConfig('zoom_3_4')
    .some(l => l.name.trim().toLowerCase() === regionId.trim().toLowerCase());

  if (!isMajorRegion) {
    if (updateMarkers && typeof MarkerManager !== 'undefined') {
      MarkerManager.forceRefreshMarkers();
    }
    this.focusToRegion(regionId);
  }

  this.updateStats();
  this.showRegionNotification(regionId);
},

  /**
   * Check if a marker should be visible based on active region
   */
  shouldShowMarker(marker) {
  if (this.activeRegion === 'all') return true;

  // Major regions → tampilkan semua marker, tidak ada filter
  if (this.majorRegionIds?.has(this.activeRegion.trim().toLowerCase())) return true;

  // If active region is a top-level group (zoom_3_4 name),
  // show all markers whose loc_type belongs to that group's subtree
  const group = this.groupedRegions.find(g => g.id === this.activeRegion);
  if (group && group.isGroup) {
    const leafIds = this.collectLeafIds(group);
    const markerRegion = marker.loc_type ? marker.loc_type.trim() : '';
    return leafIds.has(markerRegion) || markerRegion === this.activeRegion;
  }

  // Check if activeRegion is a zoom5 group with children
  const zoom5Group = this.findZoom5Group(this.activeRegion);
  if (zoom5Group && zoom5Group.children && zoom5Group.children.length > 0) {
    const leafIds = this.collectLeafIds(zoom5Group);
    const markerRegion = marker.loc_type ? marker.loc_type.trim() : '';
    return leafIds.has(markerRegion) || markerRegion === this.activeRegion;
  }

  const markerRegion = marker.loc_type ? marker.loc_type.trim() : '';
  return markerRegion === this.activeRegion;
},

  /**
   * Collect all leaf region IDs under a group node
   */
  collectLeafIds(node) {
    const ids = new Set();
    const traverse = (n) => {
      if (!n.children || n.children.length === 0) {
        ids.add(n.id);
      } else {
        n.children.forEach(traverse);
      }
    };
    traverse(node);
    return ids;
  },

  /**
   * Find a zoom5-level group by id
   */
  findZoom5Group(id) {
    for (const group of this.groupedRegions) {
      if (group.children) {
        const found = group.children.find(c => c.id === id);
        if (found) return found;
      }
    }
    return null;
  },

  /**
   * Get active region info
   */
  getActiveRegionInfo() {
    // Check all regions first
    const found = this.availableRegions.find(r => r.id === this.activeRegion);
    if (found) return found;
    // Check groups
    const group = this.groupedRegions.find(g => g.id === this.activeRegion);
    if (group) return group;
    return null;
  },

  /**
   * Update stats display
   */
  updateStats() {
    const regionInfo = this.getActiveRegionInfo();
    const toggleBtn = document.getElementById('regionToggle');
    if (toggleBtn && regionInfo) {
      const img = toggleBtn.querySelector('img');
      if (img) img.src = regionInfo.icon;
    }
  },

  /**
   * Show notification when switching region
   */
  showRegionNotification(regionId) {
    const oldNotif = document.querySelector('.region-notification');
    if (oldNotif) oldNotif.remove();
    
    const regionInfo = this.getActiveRegionInfo();
    if (!regionInfo) return;
    
    const notif = document.createElement('div');
    notif.className = 'region-notification';
    notif.innerHTML = `<span>Region: <strong>${regionInfo.name}</strong></span>`;
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

window.RegionManager = RegionManager;