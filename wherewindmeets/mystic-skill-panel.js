/**
 * MYSTIC SKILL PANEL MANAGER
 * Mengelola overlay fullscreen untuk menampilkan mystic skills
 * Support: Multi-part grouping, Video links, Guide sections
 */

const MysticSkillPanel = {
  overlay: null,
  gridView: null,
  detailView: null,
  currentData: null,
  groupedData: null,

  /**
   * Initialize panel
   */
  init() {
    this.createToggleButton();
    this.createOverlay();
    this.attachEventListeners();
    console.log('✅ Mystic Skill Panel initialized');
  },

  /**
   * Create toggle button
   */
  createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'mysticToggleBtn';
    btn.innerHTML = `<img src="${window.IconManager.ICON_CONFIG.baseIcon.replace('default.png', 'tehnik.webp')}" alt="Mystic Skills">`;
    btn.title = 'Open Mystic Skills';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => this.openPanel());
  },

  /**
   * Create overlay structure
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'mysticOverlay';
    overlay.innerHTML = `
      <div class="mystic-container">
        <!-- Header -->
        <div class="mystic-header">
          <h1 class="mystic-title">
            <img src="${window.IconManager.ICON_CONFIG.baseIcon.replace('default.png', 'tehnik.webp')}" 
                 alt="Mystic" 
                 class="mystic-title-icon">
            Mystic Skills Collection
          </h1>
          <button class="mystic-close-btn" id="mysticCloseBtn">×</button>
        </div>

        <!-- Grid View -->
        <div class="mystic-grid-view" id="mysticGridView">
          <div class="mystic-grid-container" id="mysticGridContainer"></div>
        </div>

        <!-- Detail View -->
        <div class="mystic-detail-view" id="mysticDetailView">
          <button class="mystic-back-btn" id="mysticBackBtn">←</button>
          <div class="mystic-detail-content">
            <div class="mystic-detail-left">
              <h2 class="mystic-detail-header" id="mysticDetailHeader"></h2>
              <div class="mystic-guide-label">Guide:</div>
              <div class="mystic-detail-desc-container" id="mysticDetailDescContainer"></div>
            </div>
            <div class="mystic-detail-right"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Store references
    this.overlay = overlay;
    this.gridView = document.getElementById('mysticGridView');
    this.detailView = document.getElementById('mysticDetailView');
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    document.getElementById('mysticCloseBtn').addEventListener('click', () => {
      this.closePanel();
    });

    // Back button
    document.getElementById('mysticBackBtn').addEventListener('click', () => {
      this.showGridView();
    });

    // Close on overlay click (optional)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.closePanel();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        if (this.detailView.classList.contains('active')) {
          this.showGridView();
        } else {
          this.closePanel();
        }
      }
    });
  },

  /**
   * Open panel and load data
   */
  openPanel() {
    // Load mysticlist data
    this.loadMysticData();
    
    // Show overlay
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Show grid view by default
    this.showGridView();
  },

  /**
   * Close panel
   */
  closePanel() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
  },

  /**
   * Load mystic data from window.tehnik
   */
  loadMysticData() {
    if (!window.tehnik) {
      this.showEmptyState('Mystic data not loaded yet');
      return;
    }

    this.currentData = window.tehnik;
    this.groupedData = this.groupMysticsByName();
    this.renderGridView();
  },

  /**
   * Group mystics by base name (without Part X)
   * Example: "Golden Body (Part 1)" & "Golden Body (Part 2)" → "Golden Body"
   */
  groupMysticsByName() {
    const groups = {};

    Object.entries(this.currentData).forEach(([key, mystic]) => {
      // Extract base name (remove "Part X" pattern)
      const baseName = mystic.name
        .replace(/\s*\(Part\s+\d+\)\s*/gi, '')
        .trim();

      if (!groups[baseName]) {
        groups[baseName] = {
          baseName: baseName,
          special_icon: mystic.special_icon,
          category_id: mystic.category_id,
          parts: []
        };
      }

      // Simpan key asli dan data mystic
      groups[baseName].parts.push({ key, ...mystic });
    });

    // Sort parts by name (Part 1, Part 2, etc)
    Object.values(groups).forEach(group => {
      group.parts.sort((a, b) => {
        const partA = this.extractPartNumber(a.name);
        const partB = this.extractPartNumber(b.name);
        return partA - partB;
      });
    });

    return groups;
  },

  /**
   * Extract part number from name
   */
  extractPartNumber(name) {
    const match = name.match(/Part\s+(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  },

  /**
   * Render grid view
   */
  renderGridView() {
    const container = document.getElementById('mysticGridContainer');
    container.innerHTML = '';

    const groups = Object.values(this.groupedData);

    if (groups.length === 0) {
      this.showEmptyState('No mystic skills available');
      return;
    }

    groups.forEach(group => {
      const item = this.createGridItem(group);
      container.appendChild(item);
    });
  },

  /**
   * Create grid item element
   */
  createGridItem(group) {
    const item = document.createElement('div');
    item.className = 'mystic-grid-item';
    
    // Get icon URL using special_icon
    const iconUrl = window.IconManager.getIconUrlWithSpecial(
      group.category_id, 
      group.special_icon
    );

    item.innerHTML = `
      <img src="${iconUrl}" 
           alt="${group.baseName}" 
           class="mystic-grid-icon"
           onerror="this.src='${window.IconManager.ICON_CONFIG.baseIcon}'">
      <div class="mystic-grid-name">${group.baseName}</div>
    `;

    // Click handler to show detail
    item.addEventListener('click', () => {
      this.showDetailView(group);
    });

    return item;
  },

  /**
   * Show empty state
   */
  showEmptyState(message) {
    const container = document.getElementById('mysticGridContainer');
    container.innerHTML = `
      <div class="mystic-empty-state">
        <div class="mystic-empty-icon">🔮</div>
        <div class="mystic-empty-text">${message}</div>
      </div>
    `;
  },

  /**
   * Show grid view
   */
  showGridView() {
    this.gridView.classList.remove('hidden');
    this.detailView.classList.remove('active');
  },

  /**
   * Show detail view with multi-part support
   */
  showDetailView(group) {
    // Hide grid view
    this.gridView.classList.add('hidden');
    
    // Populate detail view
    const header = document.getElementById('mysticDetailHeader');
    const descContainer = document.getElementById('mysticDetailDescContainer');
    const iconContainer = document.querySelector('.mystic-detail-right');

    header.textContent = group.baseName;

    // Clear and rebuild right panel (icon + videos)
    iconContainer.innerHTML = '';

    // Add icon
    const iconUrl = window.IconManager.getIconUrlWithSpecial(
      group.category_id, 
      group.special_icon
    );
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'mystic-detail-icon-container';
    iconDiv.innerHTML = `<img src="${iconUrl}" alt="${group.baseName}" class="mystic-detail-icon">`;
    iconContainer.appendChild(iconDiv);

    // Add video players for all parts that have videos
    group.parts.forEach((part, index) => {
      if (part.links_info && part.links_info.trim() !== '' && part.links_info !== '[]') {
        const videoUrl = part.links_info.replace(/[\[\]"']/g, '').trim();
        if (videoUrl) {
          const videoPlayer = this.createVideoPlayer(videoUrl, index);
          iconContainer.appendChild(videoPlayer);
        }
      }
    });

    // Render parts in left panel (desc akan di-handle di createPartSection)
    descContainer.innerHTML = '';

    group.parts.forEach((part, index) => {
      const partSection = this.createPartSection(part, index, group.parts.length);
      descContainer.appendChild(partSection);
    });

    // Show detail view
    this.detailView.classList.add('active');

    // Scroll to top
    descContainer.scrollTop = 0;
  },

  /**
   * Create video player from YouTube URL
   */
  createVideoPlayer(url, index) {
    const container = document.createElement('div');
    container.className = 'mystic-video-container';

    // Extract YouTube video ID
    const videoId = this.extractYouTubeId(url);
    
    if (!videoId) {
      return container; // Return empty if invalid URL
    }

    container.innerHTML = `
      <div class="mystic-video-wrapper">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?rel=0" 
          title="Video Guide ${index + 1}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    `;

    return container;
  },

  /**
   * Extract YouTube video ID from URL
   * Supports: youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/shorts/xxx
   */
  extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  },

  /**
   * Create part section HTML
   * Order: Part Header → Video Info → Go to Location → Description → Details → Breakthrough → Requirements
   */
  createPartSection(part, index, totalParts) {
    const section = document.createElement('div');
    section.className = 'mystic-part-section';

    // Part header (only if multiple parts)
    let partHeaderHTML = '';
    if (totalParts > 1) {
      const partNum = this.extractPartNumber(part.name);
      partHeaderHTML = `
        <div class="mystic-part-header">
          📍 Part ${partNum || (index + 1)}
        </div>
        <div class="mystic-part-divider"></div>
      `;
    }

    // Video indicator
    let videoHTML = '';
    if (part.links_info && part.links_info.trim() !== '' && part.links_info !== '[]') {
      videoHTML = `
        <div class="mystic-part-info" style="color: #DAA520;">
          <strong>📺 Video:</strong> Available in preview panel
        </div>
      `;
    }

    section.innerHTML = `
      ${partHeaderHTML}
      ${videoHTML}
    `;

    // Go to Location Button
    const locationBtn = document.createElement('button');
    locationBtn.className = 'mystic-location-btn';
    locationBtn.innerHTML = `
      <span class="mystic-location-icon">📍</span>
      <span>Go to Location</span>
    `;
    locationBtn.addEventListener('click', () => {
      this.goToLocation(part.key);
    });
    section.appendChild(locationBtn);

    // Description (harus di bawah Guide, di atas Details)
    let descHTML = '';
    if (part.desc && part.desc.trim() !== '') {
      descHTML = `<div class="mystic-detail-desc">${part.desc}</div>`;
    } else {
      descHTML = `<div class="mystic-detail-placeholder">No description available for now</div>`;
    }
    const descDiv = document.createElement('div');
    descDiv.innerHTML = descHTML;
    section.appendChild(descDiv);

    // Skill Details
    const detailsHTML = this.renderDetails(part);
    if (detailsHTML) {
      const detailsDiv = document.createElement('div');
      detailsDiv.innerHTML = detailsHTML;
      section.appendChild(detailsDiv);
    }

    // Breakthrough Table
    const breakthroughHTML = this.renderBreakthroughTable(part);
    if (breakthroughHTML) {
      const breakthroughDiv = document.createElement('div');
      breakthroughDiv.innerHTML = breakthroughHTML;
      section.appendChild(breakthroughDiv);
    }

    // Requirements Table
    const requirementsHTML = this.renderRequirementsTable(part);
    if (requirementsHTML) {
      const requirementsDiv = document.createElement('div');
      requirementsDiv.innerHTML = requirementsHTML;
      section.appendChild(requirementsDiv);
    }

    return section;
  },

  /**
   * Navigate to marker location - SAMA PERSIS SEPERTI KNOWLEDGEPANEL
   * + Retry mechanism untuk lazy loading
   */
  goToLocation(key) {
    const item = this.currentData[key];
    if (!item) return;

    // Tutup popup aktif
    if (window.map) {
      window.map.closePopup();
    }

    // Aktifkan kategori Mystic Skill (ID = 36)
    if (typeof MarkerManager !== 'undefined') {
      MarkerManager.activeFilters.add('36');

      const checkbox = document.querySelector('[data-category-id="36"] .filter-checkbox');
      if (checkbox) checkbox.checked = true;

      const filterItem = document.querySelector('[data-category-id="36"]');
      if (filterItem) filterItem.classList.add('active');

      localStorage.setItem("activeFilters", JSON.stringify([...MarkerManager.activeFilters]));
      MarkerManager.updateMarkersInView();
    }

    if (!window.map || !item.lat || !item.lng) return;

    const coords = [item.lat, item.lng];

    // Zoom ke lokasi
    window.map.flyTo(coords, 6, {
      animate: true,
      duration: 2
    });

    // Setelah zoom selesai → retry sampai marker muncul
    window.map.once("moveend", () => {
      this.waitForMarkerAndClick(key, 0);
    });

    // Tutup panel mystic
    setTimeout(() => this.closePanel(), 200);
  },

  /**
   * Retry mechanism untuk tunggu marker lazy load
   */
  waitForMarkerAndClick(key, attempt) {
    const maxAttempts = 20; // 20 x 150ms = 3 detik max
    const interval = 150; // Check tiap 150ms

    if (attempt >= maxAttempts) {
      console.warn('Marker tidak ditemukan setelah', maxAttempts, 'attempts:', key);
      return;
    }

    const marker = MarkerManager.activeMarkers?.[key];

    // Jika marker sudah ada dan icon sudah ter-render
    if (marker && marker._icon) {
      marker._icon.dispatchEvent(new MouseEvent("click", { 
        bubbles: true, 
        cancelable: true 
      }));
      return;
    }

    // Retry setelah interval
    setTimeout(() => {
      this.waitForMarkerAndClick(key, attempt + 1);
    }, interval);
  },

  /**
   * Render skill details (type, cost, cooldown, effect)
   */
  renderDetails(part) {
    if (!part.details || part.details.trim() === '') return '';

    try {
      const details = JSON.parse(part.details);
      
      let html = '<div class="mystic-details-section">';
      html += '<div class="mystic-details-header">⚔️ Skill Details</div>';
      html += '<div class="mystic-details-grid">';

      if (details.type) {
        html += `<div class="mystic-details-label">Type:</div>`;
        html += `<div class="mystic-details-value">${details.type}</div>`;
      }

      if (details.tags) {
        html += `<div class="mystic-details-label">Tags:</div>`;
        html += `<div class="mystic-details-value">${details.tags}</div>`;
      }

      if (details.cost_tier4) {
        html += `<div class="mystic-details-label">Cost (T4):</div>`;
        html += `<div class="mystic-details-value">${details.cost_tier4}</div>`;
      }

      if (details.cooldown_tier4) {
        html += `<div class="mystic-details-label">Cooldown (T4):</div>`;
        html += `<div class="mystic-details-value">${details.cooldown_tier4}</div>`;
      }

      html += '</div>'; // end grid

      if (details.effect) {
        html += `<div class="mystic-effect-text"><strong>Effect:</strong> ${details.effect}</div>`;
      }

      html += '</div>'; // end section

      return html;
    } catch (e) {
      console.error('Failed to parse details:', e);
      return '';
    }
  },

  /**
   * Render breakthrough table
   */
  renderBreakthroughTable(part) {
    if (!part.breakthrough || part.breakthrough.trim() === '' || part.breakthrough === '[]') return '';

    try {
      const breakthrough = JSON.parse(part.breakthrough);
      
      if (!Array.isArray(breakthrough) || breakthrough.length === 0) return '';

      let html = '<div class="mystic-table-container">';
      html += '<div class="mystic-details-header">🌟 Breakthrough Bonuses</div>';
      html += '<table class="mystic-table">';
      html += '<thead><tr><th>Tier</th><th>Bonus</th></tr></thead>';
      html += '<tbody>';

      breakthrough.forEach(item => {
        html += '<tr>';
        html += `<td><span class="mystic-tier-badge">Tier ${item.tier}</span></td>`;
        html += `<td>${item.bonus}</td>`;
        html += '</tr>';
      });

      html += '</tbody></table></div>';

      return html;
    } catch (e) {
      console.error('Failed to parse breakthrough:', e);
      return '';
    }
  },

  /**
   * Render requirements table dengan grouping by tier
   */
  renderRequirementsTable(part) {
    if (!part.requirements || part.requirements.trim() === '' || part.requirements === '[]') return '';

    try {
      const requirements = JSON.parse(part.requirements);
      
      if (!Array.isArray(requirements) || requirements.length === 0) return '';

      let html = '<div class="mystic-table-container">';
      html += '<div class="mystic-details-header">📦 Material Requirements</div>';
      html += '<table class="mystic-table">';
      html += '<thead><tr><th>Tier</th><th>Rank</th><th>Materials</th></tr></thead>';
      html += '<tbody>';

      let currentTier = null;

      requirements.forEach(item => {
        const tier = item.tier;
        const isNewTier = tier !== currentTier;
        
        html += '<tr>';
        
        // Tier column - hanya tampilkan badge di row pertama setiap tier
        if (isNewTier) {
          html += `<td><span class="mystic-tier-badge">Tier ${tier}</span></td>`;
          currentTier = tier;
        } else {
          html += `<td class="tier-grouped"></td>`;
        }
        
        // Rank column
        html += `<td>${item.rank}</td>`;
        
        // Materials column
        let materials = item.materials;
        if (Array.isArray(materials)) {
          materials = materials.join(', ');
        }
        html += `<td>${materials}</td>`;
        
        html += '</tr>';
      });

      html += '</tbody></table></div>';

      return html;
    } catch (e) {
      console.error('Failed to parse requirements:', e);
      return '';
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for IconManager to be ready
    if (window.IconManager) {
      MysticSkillPanel.init();
    } else {
      console.warn('⚠️ IconManager not found, waiting...');
      setTimeout(() => MysticSkillPanel.init(), 1000);
    }
  });
} else {
  if (window.IconManager) {
    MysticSkillPanel.init();
  } else {
    setTimeout(() => MysticSkillPanel.init(), 1000);
  }
}

// Export to window
window.MysticSkillPanel = MysticSkillPanel;