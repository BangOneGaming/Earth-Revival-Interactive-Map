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

  init() {
    this.createToggleButton();
    this.createOverlay();
    this.attachEventListeners();
    console.log('✅ Mystic Skill Panel initialized');
  },

  createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'mysticToggleBtn';
    btn.innerHTML = `<img src="${window.IconManager.ICON_CONFIG.baseIcon.replace('default.png', 'tehnik.webp')}" alt="Mystic Skills">`;
    btn.title = 'Open Mystic Skills';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => this.openPanel());
  },

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'mysticOverlay';
    overlay.innerHTML = `
      <div class="mystic-container">
        <div class="mystic-header">
          <h1 class="mystic-title">
            <img src="${window.IconManager.ICON_CONFIG.baseIcon.replace('default.png', 'tehnik.webp')}"
                 alt="Mystic"
                 class="mystic-title-icon">
            Mystic Skills Collection
          </h1>
          <button class="mystic-close-btn" id="mysticCloseBtn">×</button>
        </div>

        <div class="mystic-grid-view" id="mysticGridView">
          <div class="mystic-grid-container" id="mysticGridContainer"></div>
        </div>

        <div class="mystic-detail-view" id="mysticDetailView">
          <button class="mystic-back-btn" id="mysticBackBtn">←</button>
          <div class="mystic-detail-content">
            <div class="mystic-detail-left">
              <h2 class="mystic-detail-header" id="mysticDetailHeader"></h2>
              <div class="mystic-guide-label">Guide</div>
              <div class="mystic-detail-desc-container" id="mysticDetailDescContainer"></div>
            </div>
            <div class="mystic-detail-right"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay   = overlay;
    this.gridView  = document.getElementById('mysticGridView');
    this.detailView = document.getElementById('mysticDetailView');
  },

  attachEventListeners() {
    document.getElementById('mysticCloseBtn').addEventListener('click', () => this.closePanel());
    document.getElementById('mysticBackBtn').addEventListener('click', () => this.showGridView());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.closePanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.detailView.classList.contains('active') ? this.showGridView() : this.closePanel();
      }
    });
  },

  openPanel() {
    this.loadMysticData();
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.showGridView();
  },

  closePanel() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  // ─────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────

  loadMysticData() {
    if (!window.tehnik) {
      this.showEmptyState('Mystic data not loaded yet');
      return;
    }
    this.currentData  = window.tehnik;
    this.groupedData  = this.groupMysticsByName();
    this.renderGridView();
  },

  groupMysticsByName() {
    const groups = {};

    Object.entries(this.currentData).forEach(([key, mystic]) => {
      const baseName = mystic.name
        .replace(/\s*\(Part\s+\d+\)\s*/gi, '')
        .trim();

      if (!groups[baseName]) {
        groups[baseName] = {
          baseName,
          special_icon: mystic.special_icon,
          category_id: mystic.category_id,
          parts: []
        };
      }

      groups[baseName].parts.push({ key, ...mystic });
    });

    Object.values(groups).forEach(group => {
      group.parts.sort((a, b) =>
        this.extractPartNumber(a.name) - this.extractPartNumber(b.name)
      );
    });

    return groups;
  },

  extractPartNumber(name) {
    const match = name.match(/Part\s+(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  },

  // ─────────────────────────────────────────
  // GRID VIEW
  // ─────────────────────────────────────────

  renderGridView() {
    const container = document.getElementById('mysticGridContainer');
    container.innerHTML = '';

    const groups = Object.values(this.groupedData);
    if (groups.length === 0) {
      this.showEmptyState('No mystic skills available');
      return;
    }

    groups.forEach(group => container.appendChild(this.createGridItem(group)));
  },

  createGridItem(group) {
    const item = document.createElement('div');
    item.className = 'mystic-grid-item';

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

    item.addEventListener('click', () => this.showDetailView(group));
    return item;
  },

  showEmptyState(message) {
    document.getElementById('mysticGridContainer').innerHTML = `
      <div class="mystic-empty-state">
        <div class="mystic-empty-icon">🔮</div>
        <div class="mystic-empty-text">${message}</div>
      </div>
    `;
  },

  showGridView() {
    this.gridView.classList.remove('hidden');
    this.detailView.classList.remove('active');
  },

  // ─────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────

  showDetailView(group) {
    this.gridView.classList.add('hidden');

    const header        = document.getElementById('mysticDetailHeader');
    const descContainer = document.getElementById('mysticDetailDescContainer');
    const rightPanel    = document.querySelector('.mystic-detail-right');

    header.textContent = group.baseName;

    // ── Right panel: icon + videos ──
    rightPanel.innerHTML = '';

    const iconUrl = window.IconManager.getIconUrlWithSpecial(
      group.category_id,
      group.special_icon
    );

    const iconDiv = document.createElement('div');
    iconDiv.className = 'mystic-detail-icon-container';
    iconDiv.innerHTML = `<img src="${iconUrl}" alt="${group.baseName}" class="mystic-detail-icon">`;
    rightPanel.appendChild(iconDiv);

    group.parts.forEach((part, index) => {
      const videoUrl = this.extractVideoUrl(part.links_info);
      if (videoUrl) {
        rightPanel.appendChild(this.createVideoPlayer(videoUrl, index, group.parts.length));
      }
    });

    // ── Left panel: part sections ──
    descContainer.innerHTML = '';
    group.parts.forEach((part, index) => {
      descContainer.appendChild(
        this.createPartSection(part, index, group.parts.length)
      );
    });

    this.detailView.classList.add('active');
    descContainer.scrollTop = 0;
  },

  // ─────────────────────────────────────────
  // VIDEO
  // ─────────────────────────────────────────

  /**
   * Ekstrak URL bersih dari field links_info
   */
  extractVideoUrl(linksInfo) {
    if (!linksInfo || linksInfo.trim() === '' || linksInfo === '[]') return null;
    const url = linksInfo.replace(/[\[\]"']/g, '').trim();
    return url || null;
  },

  /**
   * Buat video player dengan label section bergaya
   * @param {string} url       - YouTube URL
   * @param {number} index     - indeks part (0-based)
   * @param {number} totalParts - total parts dalam group
   */
  createVideoPlayer(url, index, totalParts) {
    const container = document.createElement('div');
    container.className = 'mystic-video-container';

    const videoId = this.extractYouTubeId(url);
    if (!videoId) return container;

    // Label hanya tampilkan nomor part jika multi-part
    const label = totalParts > 1
      ? `Video Guide — Part ${index + 1}`
      : `Video Guide`;

    container.innerHTML = `
      <div class="mystic-video-label">${label}</div>
      <div class="mystic-video-wrapper">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?rel=0"
          title="${label}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    `;

    return container;
  },

  /**
   * Ekstrak YouTube video ID
   * Support: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, embed/
   */
  extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  },

  // ─────────────────────────────────────────
  // PART SECTION
  // ─────────────────────────────────────────

  /**
   * Urutan: Part Header → Video Indicator → Go to Location
   *         → Description → Details → Breakthrough → Requirements
   */
  createPartSection(part, index, totalParts) {
    const section = document.createElement('div');
    section.className = 'mystic-part-section';

    // Part header — hanya jika multi-part
    if (totalParts > 1) {
      const partNum = this.extractPartNumber(part.name) || (index + 1);
      section.innerHTML = `
        <div class="mystic-part-header">Part ${partNum}</div>
        <div class="mystic-part-divider"></div>
      `;
    }

    // Video indicator — hanya jika ada video
    const videoUrl = this.extractVideoUrl(part.links_info);
    if (videoUrl) {
      const indicator = document.createElement('div');
      indicator.className = 'mystic-video-indicator';
      indicator.textContent = 'Video guide tersedia di panel kanan';
      section.appendChild(indicator);
    }

    // Go to Location button
    const locationBtn = document.createElement('button');
    locationBtn.className = 'mystic-location-btn';
    locationBtn.innerHTML = `
      <span class="mystic-location-icon">📍</span>
      <span>Go to Location</span>
    `;
    locationBtn.addEventListener('click', () => this.goToLocation(part.key));
    section.appendChild(locationBtn);

    // Description
    const descDiv = document.createElement('div');
    if (part.desc && part.desc.trim() !== '') {
      descDiv.innerHTML = `<div class="mystic-detail-desc">${part.desc}</div>`;
    } else {
      descDiv.innerHTML = `<div class="mystic-detail-placeholder">No description available for now</div>`;
    }
    section.appendChild(descDiv);

    // Skill Details
    const detailsHTML = this.renderDetails(part);
    if (detailsHTML) {
      const d = document.createElement('div');
      d.innerHTML = detailsHTML;
      section.appendChild(d);
    }

    // Breakthrough Table
    const breakthroughHTML = this.renderBreakthroughTable(part);
    if (breakthroughHTML) {
      const d = document.createElement('div');
      d.innerHTML = breakthroughHTML;
      section.appendChild(d);
    }

    // Requirements Table
    const requirementsHTML = this.renderRequirementsTable(part);
    if (requirementsHTML) {
      const d = document.createElement('div');
      d.innerHTML = requirementsHTML;
      section.appendChild(d);
    }

    return section;
  },

  // ─────────────────────────────────────────
  // GO TO LOCATION
  // ─────────────────────────────────────────

  goToLocation(key) {
    const item = this.currentData[key];
    if (!item) return;

    if (window.map) window.map.closePopup();

    if (typeof MarkerManager !== 'undefined') {
      MarkerManager.activeFilters.add('36');

      const checkbox = document.querySelector('[data-category-id="36"] .filter-checkbox');
      if (checkbox) checkbox.checked = true;

      const filterItem = document.querySelector('[data-category-id="36"]');
      if (filterItem) filterItem.classList.add('active');

      localStorage.setItem('activeFilters', JSON.stringify([...MarkerManager.activeFilters]));
      MarkerManager.updateMarkersInView();
    }

    if (!window.map || !item.lat || !item.lng) return;

    window.map.flyTo([item.lat, item.lng], 6, { animate: true, duration: 2 });
    window.map.once('moveend', () => this.waitForMarkerAndClick(key, 0));

    setTimeout(() => this.closePanel(), 200);
  },

  waitForMarkerAndClick(key, attempt) {
    if (attempt >= 20) {
      console.warn('Marker tidak ditemukan setelah 20 attempts:', key);
      return;
    }

    const marker = MarkerManager.activeMarkers?.[key];

    if (marker && marker._icon) {
      marker._icon.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return;
    }

    setTimeout(() => this.waitForMarkerAndClick(key, attempt + 1), 150);
  },

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────

  renderDetails(part) {
    if (!part.details || part.details.trim() === '') return '';

    try {
      const d = JSON.parse(part.details);

      let html = '<div class="mystic-details-section">';
      html += '<div class="mystic-details-header">⚔️ Skill Details</div>';
      html += '<div class="mystic-details-grid">';

      const fields = [
        ['Type',          d.type],
        ['Tags',          d.tags],
        ['Cost (T4)',     d.cost_tier4],
        ['Cooldown (T4)', d.cooldown_tier4],
      ];

      fields.forEach(([label, val]) => {
        if (val) {
          html += `<div class="mystic-details-label">${label}</div>`;
          html += `<div class="mystic-details-value">${val}</div>`;
        }
      });

      html += '</div>';

      if (d.effect) {
        html += `<div class="mystic-effect-text"><strong>Effect:</strong> ${d.effect}</div>`;
      }

      html += '</div>';
      return html;
    } catch (e) {
      console.error('Failed to parse details:', e);
      return '';
    }
  },

  renderBreakthroughTable(part) {
    if (!part.breakthrough || part.breakthrough.trim() === '' || part.breakthrough === '[]') return '';

    try {
      const rows = JSON.parse(part.breakthrough);
      if (!Array.isArray(rows) || rows.length === 0) return '';

      let html = '<div class="mystic-table-container">';
      html += '<div class="mystic-details-header">🌟 Breakthrough Bonuses</div>';
      html += '<table class="mystic-table"><thead><tr><th>Tier</th><th>Bonus</th></tr></thead><tbody>';

      rows.forEach(r => {
        html += `<tr>
          <td><span class="mystic-tier-badge">Tier ${r.tier}</span></td>
          <td>${r.bonus}</td>
        </tr>`;
      });

      html += '</tbody></table></div>';
      return html;
    } catch (e) {
      console.error('Failed to parse breakthrough:', e);
      return '';
    }
  },

  renderRequirementsTable(part) {
    if (!part.requirements || part.requirements.trim() === '' || part.requirements === '[]') return '';

    try {
      const rows = JSON.parse(part.requirements);
      if (!Array.isArray(rows) || rows.length === 0) return '';

      let html = '<div class="mystic-table-container">';
      html += '<div class="mystic-details-header">📦 Material Requirements</div>';
      html += '<table class="mystic-table"><thead><tr><th>Tier</th><th>Rank</th><th>Materials</th></tr></thead><tbody>';

      let currentTier = null;

      rows.forEach(r => {
        const isNewTier = r.tier !== currentTier;
        const materials = Array.isArray(r.materials) ? r.materials.join(', ') : r.materials;

        html += '<tr>';
        html += isNewTier
          ? `<td><span class="mystic-tier-badge">Tier ${r.tier}</span></td>`
          : `<td class="tier-grouped"></td>`;
        html += `<td>${r.rank}</td><td>${materials}</td>`;
        html += '</tr>';

        if (isNewTier) currentTier = r.tier;
      });

      html += '</tbody></table></div>';
      return html;
    } catch (e) {
      console.error('Failed to parse requirements:', e);
      return '';
    }
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.IconManager
      ? MysticSkillPanel.init()
      : setTimeout(() => MysticSkillPanel.init(), 1000);
  });
} else {
  window.IconManager
    ? MysticSkillPanel.init()
    : setTimeout(() => MysticSkillPanel.init(), 1000);
}

window.MysticSkillPanel = MysticSkillPanel;