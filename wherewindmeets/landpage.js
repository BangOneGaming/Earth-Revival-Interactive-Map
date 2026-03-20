/**
 * RegionPicker — Where Winds Meet
 * 5 tabs: Region · Mystic Skills · Innerway · Knowledge · Tales & Echoes
 *
 * Perubahan utama:
 * - Semua struktur DOM (hero, tabs, region panel) sudah ada di HTML statis
 * - JS hanya menangani: event listeners, tab loading, mystic renderer, show/close
 * - _buildDOM() dan _buildRegionPanel() dihapus — tidak diperlukan lagi
 * - _fallbackData() dan _getData() dihapus — data sudah hardcode di HTML
 */

const RegionPicker = (function () {
  'use strict';

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  let _resolve           = null;
  let _appReadyDone      = false;
  let _appReadyCallbacks = [];

  // ─────────────────────────────────────────
  // APP-READY TRIGGER
  // ─────────────────────────────────────────

  async function _ensureAppReady() {
    if (_appReadyDone) return;
    if (!window.__triggerAppReady) {
      console.warn('[RegionPicker] window.__triggerAppReady not found');
      return;
    }
    _appReadyDone = true;
    try {
      await window.__triggerAppReady();
      console.log('[RegionPicker] app-ready complete');
      _appReadyCallbacks.forEach(fn => fn());
      _appReadyCallbacks = [];
    } catch(e) {
      console.error('[RegionPicker] app-ready failed:', e);
    }
  }

  function _waitForData(key, timeout = 15000) {
    return new Promise((res, rej) => {
      if (window[key] && Object.keys(window[key]).length > 0) { res(); return; }
      const start = Date.now();
      const iv = setInterval(() => {
        if (window[key] && Object.keys(window[key]).length > 0) {
          clearInterval(iv); res();
        } else if (Date.now() - start > timeout) {
          clearInterval(iv); rej(new Error(`Timeout waiting for window.${key}`));
        }
      }, 150);
    });
  }

  // ─────────────────────────────────────────
  // TAB DEFINITIONS
  // ─────────────────────────────────────────

  const TABS = [
    { id: 'region',    label: 'Interactive Map Region' },
    { id: 'mystic',    label: 'Mystic Skills',  dataKey: 'tehnik' },
    { id: 'innerway',  label: 'Innerway',        dataKey: 'innerway' },
    { id: 'Knowledge', label: 'Wandering Tales', dataKey: 'knowledge' },
    { id: 'tales',     label: 'Tales & Echoes',  dataKey: 'tales' },
  ];

  // ─────────────────────────────────────────
  // LOADING STAGE HELPERS
  // ─────────────────────────────────────────

  function _setStage(tabId, label, sub, pct) {
    const lbl  = document.getElementById(`lplabel-${tabId}`);
    const sub_ = document.getElementById(`lpsub-${tabId}`);
    const bar  = document.getElementById(`lpbar-${tabId}`);
    if (lbl)  lbl.textContent  = label || '';
    if (sub_) sub_.textContent = sub   || '';
    if (bar)  bar.style.width  = (pct || 0) + '%';
  }

  function _showContent(tabId) {
    const stage   = document.getElementById(`stage-${tabId}`);
    const content = document.getElementById(`content-${tabId}`);
    if (stage)   stage.style.display   = 'none';
    if (content) content.style.display = 'block';
  }

  // ─────────────────────────────────────────
  // TAB LOADED STATE
  // ─────────────────────────────────────────

  const _tabDone = {};

  async function _loadTab(tabId) {
    if (_tabDone[tabId]) return;
    _tabDone[tabId] = true;

    const tab     = TABS.find(t => t.id === tabId);
    const content = document.getElementById(`content-${tabId}`);
    if (!tab || !content) return;

    // Tab 3-5: coming soon
    if (tabId !== 'mystic') {
      content.innerHTML = `<div class="rp-empty"><strong>${tab.label}</strong> coming soon.</div>`;
      _showContent(tabId);
      return;
    }

    // Mystic: trigger app-ready + tunggu data
    try {
      _setStage(tabId, 'Initializing map...', 'Loading scripts and tiles', 10);
      await _ensureAppReady();

      _setStage(tabId, 'Loading marker data...', 'Please wait', 40);
      _setStage(tabId, 'Preparing content...', 'Loading Mystic Skills data', 70);
      await _waitForData(tab.dataKey);

      _setStage(tabId, 'Almost ready...', '', 90);
      await new Promise(r => setTimeout(r, 200));

      _renderMystic(content);
      _showContent(tabId);

    } catch(e) {
      console.error(`[RegionPicker] Tab ${tabId} load failed:`, e);
      content.innerHTML = `<div class="rp-empty">Failed to load ${tab.label}. Please try again.</div>`;
      _showContent(tabId);
    }
  }

  // ─────────────────────────────────────────
  // MYSTIC RENDERER
  // ─────────────────────────────────────────

  function _renderMystic(container) {
    const data = window.tehnik;
    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = `<div class="rp-empty">No mystic skill data available.</div>`;
      return;
    }

    const groups = {};
    Object.entries(data).forEach(([key, item]) => {
      const base = item.name.replace(/\s*\(Part\s*\d+\)\s*/gi, '').trim();
      if (!groups[base]) groups[base] = { base, icon: item.special_icon, catId: item.category_id, parts: [] };
      groups[base].parts.push({ key, ...item });
    });
    Object.values(groups).forEach(g => {
      g.parts.sort((a, b) => _partNum(a.name) - _partNum(b.name));
    });

    const grid = document.createElement('div');
    grid.className = 'rp-skill-grid';

    Object.values(groups).forEach(group => {
      const iconUrl = _getIconUrl(group.catId, group.icon);
      const card = document.createElement('button');
      card.className = 'rp-skill-card';
      card.innerHTML = `
        <img class="rp-skill-icon" src="${iconUrl}" alt="${group.base}"
             onerror="this.style.opacity='0.3'">
        <span class="rp-skill-name">${group.base}</span>
        ${group.parts.length > 1
          ? `<span class="rp-skill-parts">${group.parts.length} parts</span>`
          : ''}
      `;
      card.addEventListener('click', () => _showMysticDetail(container, group));
      grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
  }

  function _showMysticDetail(container, group) {
    const iconUrl = _getIconUrl(group.catId, group.icon);

    const partsHtml = group.parts.map((part, i) => {
      const num = group.parts.length > 1
        ? `<div class="rp-detail-part-label">Part ${_partNum(part.name) || i + 1}</div>`
        : '';

      let detailsHtml = '';
      if (part.details) {
        try {
          const d = JSON.parse(part.details);
          const rows = [
            ['Type',     d.type],
            ['Tags',     d.tags],
            ['Cost',     d.cost_tier4],
            ['Cooldown', d.cooldown_tier4],
          ].filter(r => r[1]);
          if (rows.length || d.effect) {
            detailsHtml = `
              <div class="rp-detail-section">
                <div class="rp-detail-section-label">Skill Details</div>
                ${rows.map(r => `
                  <div class="rp-detail-row">
                    <span class="rp-detail-key">${r[0]}</span>
                    <span class="rp-detail-val">${r[1]}</span>
                  </div>`).join('')}
                ${d.effect ? `<div class="rp-detail-effect">${d.effect}</div>` : ''}
              </div>`;
          }
        } catch(e) {}
      }

      let btHtml = '';
      if (part.breakthrough && part.breakthrough !== '[]') {
        try {
          const rows = JSON.parse(part.breakthrough);
          if (rows.length) {
            btHtml = `
              <div class="rp-detail-section">
                <div class="rp-detail-section-label">Breakthrough</div>
                ${rows.map(r => `
                  <div class="rp-detail-row">
                    <span class="rp-detail-badge">T${r.tier}</span>
                    <span class="rp-detail-val">${r.bonus}</span>
                  </div>`).join('')}
              </div>`;
          }
        } catch(e) {}
      }

      return `
        <div class="rp-detail-part">
          ${num}
          <button class="rp-detail-loc-btn" data-key="${part.key}">
            Go to Location
          </button>
          ${part.desc
            ? `<div class="rp-detail-desc">${part.desc}</div>`
            : '<div class="rp-detail-empty">No description yet.</div>'}
          ${detailsHtml}
          ${btHtml}
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="rp-detail-view">
        <button class="rp-detail-back">← Back</button>
        <div class="rp-detail-header">
          <img class="rp-detail-hero-icon" src="${iconUrl}" alt="${group.base}">
          <div class="rp-detail-title">${group.base}</div>
        </div>
        <div class="rp-detail-body">${partsHtml}</div>
      </div>
    `;

    container.querySelector('.rp-detail-back')
      .addEventListener('click', () => _renderMystic(container));

    container.querySelectorAll('.rp-detail-loc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key  = btn.dataset.key;
        const item = window.tehnik?.[key];
        if (!item) return;

        _closePicker();

        if (window.MysticSkillPanel?.goToLocation) {
          window.MysticSkillPanel.goToLocation(key);
        } else {
          const doFly = () => {
            if (!window.map) { setTimeout(doFly, 200); return; }
            if (typeof _applyMapPreset === 'function' && item.preset_map && item.preset_map !== 'main') {
              _applyMapPreset(item.preset_map, false);
            }
            if (window.MarkerManager) {
              const catId = String(item.category_id);
              MarkerManager.activeFilters.add(catId);
              MarkerManager.updateMarkersInView();
            }
            window.map.flyTo([item.lat, item.lng], 6, { animate: true, duration: 2 });
            const tryClick = (attempt) => {
              if (attempt >= 25) return;
              const marker = MarkerManager?.activeMarkers?.[key];
              if (marker && marker._icon) {
                window.map.once('moveend', () => {
                  marker._icon.dispatchEvent(
                    new MouseEvent('click', { bubbles: true, cancelable: true })
                  );
                });
              } else {
                setTimeout(() => tryClick(attempt + 1), 200);
              }
            };
            setTimeout(() => tryClick(0), 400);
          };
          setTimeout(doFly, 300);
        }
      });
    });
  }

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────

  function _partNum(name) {
    const m = name.match(/Part\s*(\d+)/i);
    return m ? parseInt(m[1]) : 0;
  }

  function _getIconUrl(catId, specialIcon) {
    if (window.IconManager?.getIconUrlWithSpecial) {
      return window.IconManager.getIconUrlWithSpecial(catId, specialIcon);
    }
    const base = 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/';
    return specialIcon ? base + specialIcon : base + 'default.png';
  }

  function _closePicker() {
    const page = document.getElementById('regionPickerPage');
    if (page) {
      page.classList.add('leaving');
      document.body.style.overflow = '';
      page.style.zIndex = '-1';
      setTimeout(() => page.remove(), 320);
    }
    if (_resolve) { _resolve(null); _resolve = null; }
  }

  function _resolveWith(result) {
    if (!_resolve) return;
    const page = document.getElementById('regionPickerPage');
    if (page) {
      page.classList.add('leaving');
      document.body.style.overflow = '';
      page.style.zIndex = '-1';
      setTimeout(() => page.remove(), 320);
    }
    _resolve(result);
    _resolve = null;
  }

  // ─────────────────────────────────────────
  // PUBLIC: show()
  // Tidak lagi build DOM — cukup attach event listeners ke HTML yang sudah ada
  // ─────────────────────────────────────────

  function show() {
    // Skip landing page jika marker link params ada
    if (window.__markerLinkParams && window.__markerLinkParams.skipLandingPage) {
      console.log('[RegionPicker] Skipping landing page - marker link detected');
      return Promise.resolve(window.__markerLinkParams);
    }

    return new Promise(resolve => {
      _resolve = resolve;

      const page = document.getElementById('regionPickerPage');
      if (!page) {
        console.error('[RegionPicker] #regionPickerPage not found in HTML');
        resolve(null);
        return;
      }

      // Fade in
      requestAnimationFrame(() => requestAnimationFrame(() => page.classList.add('active')));

      // Skip button
      document.getElementById('rpSkip')
        ?.addEventListener('click', () => _resolveWith(null));

      // Escape key
      const onKey = e => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', onKey);
          _resolveWith(null);
        }
      };
      document.addEventListener('keydown', onKey);

      // Tab switching
      page.querySelectorAll('.rp-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const id = tab.dataset.tab;
          page.querySelectorAll('.rp-tab').forEach(t => t.classList.remove('active'));
          page.querySelectorAll('.rp-panel').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const panel = document.getElementById(`panel-${id}`);
          if (panel) panel.classList.add('active');
          if (id !== 'region') _loadTab(id);
        });
      });

      // Region accordion (major)
      page.querySelectorAll('.rp-major-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const sec    = btn.closest('.rp-major');
          const isOpen = sec.classList.contains('open');
          page.querySelectorAll('.rp-major').forEach(s => s.classList.remove('open'));
          if (!isOpen) sec.classList.add('open');
        });
      });

      // Sub region pick — baca koordinat dari data-* attribute di HTML
      page.querySelectorAll('.rp-sub-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.removeEventListener('keydown', onKey);
          _resolveWith({
            lat:    parseFloat(btn.dataset.lat),
            lng:    parseFloat(btn.dataset.lng),
            preset: btn.dataset.preset || 'main',
            zoom:   parseInt(btn.dataset.zoom)  || 5,
          });
        });
      });
    });
  }

  return { show };
})();

window.RegionPicker = RegionPicker;