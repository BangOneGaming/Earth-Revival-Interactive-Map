/**
 * RegionPicker — Where Winds Meet
 * 5 tabs: Region · Mystic Skills · Innerway · Knowledge · Tales & Echoes
 *
 * Tab 1 (Region): resolve langsung, tidak trigger app-ready
 * Tab 2-5 (Lazy): trigger window.__triggerAppReady() di background,
 *                 tunggu data siap, lalu render — landpage tetap di atas
 */

const RegionPicker = (function () {
  'use strict';

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  let _resolve      = null;
  let _appReadyDone = false;
  let _appReadyCallbacks = [];

  // ─────────────────────────────────────────
  // REGION DATA
  // ─────────────────────────────────────────

  function _getData() {
    const config = window.LABEL_CONFIG || (
      window.RegionLabelManager?._getLabelConfig
        ? {
            zoom_3_4: window.RegionLabelManager._getLabelConfig('zoom_3_4'),
            zoom_5:   window.RegionLabelManager._getLabelConfig('zoom_5'),
          }
        : null
    );
    if (config?.zoom_3_4 && config?.zoom_5) return _parseFromConfig(config);
    return _fallbackData();
  }

  function _parseFromConfig(config) {
    const majors = config.zoom_3_4.map(m => ({
      id: m.name.toLowerCase().replace(/\s+/g, '_'),
      name: m.name,
      cn: m.cn_name || '',
    }));
    const subs = config.zoom_5.map(s => ({
      name:     s.name,
      cn:       s.cn_name || '',
      major:    (s.map_type || '').toLowerCase().replace(/\s+/g, '_'),
      lat:      s.lat,
      lng:      s.lng,
      preset:   s.preset_map || 'main',
      zoom:     s.zoom ?? 5,
      mapLabel: s.preset_map
        ? s.preset_map.charAt(0).toUpperCase() + s.preset_map.slice(1) + ' Map'
        : '',
    }));
    return { majors, subs };
  }

  function _fallbackData() {
    const majors = [
      { id: 'qinghe',          name: 'Qinghe',         cn: '' },
      { id: 'kaifeng',         name: 'Kaifeng',         cn: '' },
      { id: 'hexi',            name: 'Hexi',            cn: '' },
      { id: 'bujian_mountain', name: 'Bujian Mountain', cn: '' },

    ];
    const subs = [
      { name: 'Verdant Wilds',     cn: '', major: 'qinghe',          lat: 130.9276, lng: 198.2494, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Moonveil Mountain', cn: '', major: 'qinghe',          lat: 131.3487, lng: 182.4318, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Sundara Land',      cn: '', major: 'qinghe',          lat: 120.9525, lng: 187.9554, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Kaifeng City',      cn: '', major: 'kaifeng',         lat: 148.4588, lng: 167.7553, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Granary of Plenty', cn: '', major: 'kaifeng',         lat: 165.9342, lng: 175.9301, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Jadewood Court',    cn: '', major: 'kaifeng',         lat: 161.8376, lng: 161.2980, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Roaring Sands',     cn: '', major: 'kaifeng',         lat: 141.4049, lng: 155.7385, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Suixiang',          cn: '', major: 'bujian_mountain', lat: 102.0355, lng: 196.3876, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Tianxing',          cn: '', major: 'bujian_mountain', lat: 91.8496,  lng: 197.9279, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Fukasawa',          cn: '', major: 'bujian_mountain', lat: 110.9978, lng: 197.5881, preset: 'main',  zoom: 5, mapLabel: '' },
      { name: 'Hutuo',    cn: '滹沱', major: 'bujian_mountain', lat: 34.2075, lng: 18.2715, preset: 'hutuo', zoom: 6, mapLabel: 'Hutuo Map' },
      { name: 'Jade Gate Pass', cn: '', major: 'hexi', lat: 34.1919, lng: 27.5562, preset: 'main', zoom: 5, mapLabel: '' },
      { name: 'Liangzhou',      cn: '', major: 'hexi', lat: 46.2395, lng: 51.3195, preset: 'main', zoom: 5, mapLabel: '' },
      { name: 'Qinchuan',       cn: '', major: 'hexi', lat: 76.3850, lng: 77.3876, preset: 'main', zoom: 5, mapLabel: '' },
    ];
    return { majors, subs };
  }

  // ─────────────────────────────────────────
  // APP-READY TRIGGER
  // Dipanggil saat user klik tab 2-5.
  // index.html harus expose: window.__triggerAppReady = async () => { ... }
  // yang berisi loadScripts(critical) + app-ready + loadScripts(secondary) + main.js
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

  // Tunggu sampai key tertentu tersedia di window
  function _waitForData(key, timeout = 15000) {
    return new Promise((res, rej) => {
      if (window[key] && Object.keys(window[key]).length > 0) { res(); return; }
      const start = Date.now();
      const iv = setInterval(() => {
        if (window[key] && Object.keys(window[key]).length > 0) {
          clearInterval(iv);
          res();
        } else if (Date.now() - start > timeout) {
          clearInterval(iv);
          rej(new Error(`Timeout waiting for window.${key}`));
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
    { id: 'Knowledge', label: 'Wandering Tales',       dataKey: 'knowledge' },
    { id: 'tales',     label: 'Tales & Echoes',  dataKey: 'tales' },
  ];

  // ─────────────────────────────────────────
  // BUILD DOM
  // ─────────────────────────────────────────

  function _buildDOM(regionData) {
    const page = document.createElement('div');
    page.id = 'regionPickerPage';

    const tabBtns = TABS.map((t, i) => `
      <button class="rp-tab${i === 0 ? ' active' : ''}" data-tab="${t.id}">
        ${t.label}
      </button>
    `).join('');

    const lazyPanels = TABS.slice(1).map(t => `
      <div class="rp-panel" id="panel-${t.id}">
        <div class="rp-lazy-wrap" id="lazy-${t.id}">
          <div class="rp-lazy-stage" id="stage-${t.id}">
            <div class="rp-lp-spinner"></div>
            <div class="rp-lp-label" id="lplabel-${t.id}">Initializing map...</div>
            <div class="rp-lp-bar-wrap"><div class="rp-lp-bar" id="lpbar-${t.id}"></div></div>
            <div class="rp-lp-sub" id="lpsub-${t.id}"></div>
          </div>
          <div class="rp-lazy-content" id="content-${t.id}" style="display:none"></div>
        </div>
      </div>
    `).join('');

    page.innerHTML = `
      <div class="rp-hero">
        <div class="rp-eyebrow">Where Winds Meet — Interactive Map</div>
        <div class="rp-title">Where do you want to explore?</div>
        <div class="rp-subtitle">Select a region or browse content to open the map</div>
        <div class="rp-divider"></div>
        <div class="rp-tabs">${tabBtns}</div>
      </div>

      <div class="rp-body">
        <div class="rp-panel active" id="panel-region">
          ${_buildRegionPanel(regionData)}
        </div>
        ${lazyPanels}
      </div>

      <div class="rp-footer">
        <button class="rp-skip" id="rpSkip">Skip — open map at default location</button>
      </div>
    `;

    document.body.appendChild(page);
    return page;
  }

  function _buildRegionPanel(data) {
    const { majors, subs } = data;
    const byMajor = {};
    subs.forEach(s => {
      if (!byMajor[s.major]) byMajor[s.major] = [];
      byMajor[s.major].push(s);
    });

    const sections = majors.map((m, mi) => {
      const list = byMajor[m.id] || [];
      const subBtns = list.map((s, si) => `
        <button class="rp-sub-btn"
                data-lat="${s.lat}"
                data-lng="${s.lng}"
                data-preset="${s.preset}"
                data-zoom="${s.zoom ?? 5}"
                style="--si:${si}">
          <span class="rp-sub-name">${s.name}</span>
          ${s.cn       ? `<span class="rp-sub-cn">${s.cn}</span>` : ''}
          ${s.mapLabel ? `<span class="rp-sub-hint">${s.mapLabel}</span>` : ''}
        </button>
      `).join('');

      return `
        <div class="rp-major" data-major="${m.id}" style="--mi:${mi}">
          <button class="rp-major-btn">
            <span class="rp-major-label">
              ${m.name}
              ${m.cn ? `<span class="rp-major-cn">${m.cn}</span>` : ''}
            </span>
            <span class="rp-major-count">${list.length} regions</span>
            <span class="rp-arrow">
              <svg viewBox="0 0 10 10" fill="none">
                <polyline points="3,2 7,5 3,8" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round"
                          stroke="currentColor"/>
              </svg>
            </span>
          </button>
          <div class="rp-sub-grid">${subBtns}</div>
        </div>
      `;
    }).join('');

    return sections + '<div class="rp-end"></div>';
  }

  // ─────────────────────────────────────────
  // LOADING STAGE HELPERS
  // ─────────────────────────────────────────

  function _setStage(tabId, label, sub, pct) {
    const lbl = document.getElementById(`lplabel-${tabId}`);
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

    const tab = TABS.find(t => t.id === tabId);
    const content = document.getElementById(`content-${tabId}`);
    if (!tab || !content) return;

    // Tab 3-5: langsung coming soon, tidak trigger app-ready
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

    // Group by base name
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

        // Tutup picker dulu tanpa resolve koordinat
        // supaya main.js tidak override fly dengan setView
        _closePicker();

        // Delegasikan ke MysticSkillPanel.goToLocation yang sudah terbukti bekerja.
        // Kalau panel belum siap (lazy load belum selesai), fallback manual.
        if (window.MysticSkillPanel?.goToLocation) {
          window.MysticSkillPanel.goToLocation(key);
        } else {
          // Fallback: tunggu map siap lalu fly manual
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

  // Tutup picker tanpa resolve koordinat — dipakai saat Go to Location
  // supaya initApp() tidak override fly dengan setView
  function _closePicker() {
    const page = document.getElementById('regionPickerPage');
    if (page) {
      page.classList.add('leaving');
      document.body.style.overflow = '';
      page.style.zIndex = '-1';
      setTimeout(() => page.remove(), 320);
    }
    // Resolve null supaya initApp() tetap lanjut tanpa set koordinat apapun
    if (_resolve) {
      _resolve(null);
      _resolve = null;
    }
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
  // ─────────────────────────────────────────

  function show() {
    return new Promise(resolve => {
      _resolve = resolve;

      const regionData = _getData();
      const page = _buildDOM(regionData);

      requestAnimationFrame(() => requestAnimationFrame(() => page.classList.add('active')));

      document.getElementById('rpSkip').addEventListener('click', () => _resolveWith(null));

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
          // Tab 2-5: trigger app-ready + load data
          if (id !== 'region') _loadTab(id);
        });
      });

      // Region accordion
      page.querySelectorAll('.rp-major-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const sec = btn.closest('.rp-major');
          const isOpen = sec.classList.contains('open');
          page.querySelectorAll('.rp-major').forEach(s => s.classList.remove('open'));
          if (!isOpen) sec.classList.add('open');
        });
      });

      // Sub region pick
      page.querySelectorAll('.rp-sub-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.removeEventListener('keydown', onKey);
          _resolveWith({
            lat:    parseFloat(btn.dataset.lat),
            lng:    parseFloat(btn.dataset.lng),
            preset: btn.dataset.preset || 'main',
            zoom:   parseInt(btn.dataset.zoom) || 5,
          });
        });
      });
    });
  }

  return { show };
})();

window.RegionPicker = RegionPicker;