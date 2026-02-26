/**
 * PiP Map - Picture-in-Picture floating map window
 * Menggunakan Document Picture-in-Picture API (Chrome 116+ / Edge 116+)
 */

const PipMap = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────
  let pipWindow    = null;
  let pipMap       = null;
  let pipTileLayer = null;
  let btnToggle    = null;

  // Virtual rendering state
  const pipActiveMarkers = {};
  let pipDebounce = null;
  let pipRafId    = null;

  // ── Support check ──────────────────────────────────────────────
  function isSupported() {
    return 'documentPictureInPicture' in window;
  }

  // ══════════════════════════════════════════════════════════════
  // TOMBOL TOGGLE
  // ══════════════════════════════════════════════════════════════
  function _createToggleBtn() {
    if (document.getElementById('pipMapBtn')) return;
    if (window.innerWidth <= 768) return;

    btnToggle = document.createElement('button');
    btnToggle.id        = 'pipMapBtn';
    btnToggle.className = 'pip-map-btn';
    btnToggle.title     = 'Floating Window';
    btnToggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <rect x="12" y="10" width="9" height="7" rx="1" fill="currentColor" opacity="0.4"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span>Floating Window</span>
    `;
    btnToggle.addEventListener('click', toggle);
    document.body.appendChild(btnToggle);
  }

  // ══════════════════════════════════════════════════════════════
  // INJECT CSS
  // ══════════════════════════════════════════════════════════════
  function _injectStyles(doc) {
    const BASE = 'https://bgonegaming.win/wherewindmeets/';
    const cssFiles = [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      BASE + 'styles.css',
      BASE + 'marker-image-handler.css',
      BASE + 'editing-image-upload.css',
      BASE + 'knowladgelist.css',
      BASE + 'mystic-skill-panel.css',
      BASE + 'innerway.css',
      BASE + 'patchnote.css',
      BASE + 'form.css',
      BASE + 'layer.css',
      BASE + 'region-management.css',
      BASE + 'booklist.css',
      BASE + 'ui.css',
      BASE + 'login.css',
      BASE + 'comment.css',
      BASE + 'profile-container.css',
      BASE + 'setting.css',
      BASE + 'donate.css',
      BASE + 'tip-guide.css',
      BASE + 'map-switcher.css',
      BASE + 'MapTransition.css',
      BASE + 'region.css',
      BASE + 'pip-map.css',
    ];

    cssFiles.forEach(href => {
      const link = doc.createElement('link');
      link.rel  = 'stylesheet';
      link.href = href;
      doc.head.appendChild(link);
    });

    const style = doc.createElement('style');
    style.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1008; }
      #pip-map-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 0; }
      .leaflet-container { background: #1a1008; }
      .leaflet-popup-content-wrapper {
        background: rgba(30,20,8,0.95) !important;
        color: #f3d59b !important;
        border: 1px solid rgba(243,213,155,0.4) !important;
        border-radius: 8px !important;
        font-size: 12px !important;
      }
      .leaflet-popup-tip { background: rgba(30,20,8,0.95) !important; }
    `;
    doc.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════
  // INJECT LEAFLET JS
  // ══════════════════════════════════════════════════════════════
  function _injectLeaflet(doc) {
    return new Promise((resolve) => {
      const script = doc.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      doc.head.appendChild(script);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // APPLY TILE PRESET
  // ══════════════════════════════════════════════════════════════
  function _applyPreset(preset, L) {
    if (!pipMap) return;
    L = L || pipWindow.L;

    const V = window.TILE_VERSION || '20251121';
    const urls = {
      main:         `https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp?v=${V}`,
      hutuo:        `https://tiles.bgonegaming.win/wherewindmeet/tiles/hutuo/{z}_{x}_{y}.webp?v=${V}`,
      royal_palace: `https://tiles.bgonegaming.win/wherewindmeet/tiles/royal_palace/{z}_{x}_{y}.webp?v=${V}`,
    };

    if (pipTileLayer) pipMap.removeLayer(pipTileLayer);

    pipTileLayer = L.tileLayer(urls[preset] || urls.main, {
      minZoom: 3, maxZoom: 8, maxNativeZoom: 7,
      noWrap: true, crossOrigin: true,
      updateWhenIdle: true, updateWhenZooming: false,
    });
    pipTileLayer.addTo(pipMap);
  }

  // ══════════════════════════════════════════════════════════════
  // BUILD MAP
  // ══════════════════════════════════════════════════════════════
  function _buildMap(doc) {
    const L = pipWindow.L;

    // Map container
    const container = doc.createElement('div');
    container.id = 'pip-map-container';
    doc.body.appendChild(container);

    const crsSimple = L.extend({}, L.CRS.Simple, {
      transformation: new L.Transformation(1, 0, 1, 0)
    });

    const mainCenter = window.map ? window.map.getCenter() : { lat: 128, lng: 180 };
    const mainZoom   = window.map ? window.map.getZoom()   : 5;
    const preset     = window.currentPreset || 'main';

    pipMap = L.map('pip-map-container', {
      crs: crsSimple,
      minZoom: 3, maxZoom: 8,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    pipMap.setView([mainCenter.lat, mainCenter.lng], mainZoom);
    _applyPreset(preset, L);

    // Clone semua UI dari map utama
    _cloneAllUI(doc);

    // Start virtual rendering
    pipMap.whenReady(() => {
      setTimeout(_initVirtualRendering, 300);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // CLONE SEMUA UI
  // ══════════════════════════════════════════════════════════════
  function _cloneAllUI(doc) {
    const skipIds = [
      'map', 'pip-map-container', 'pipMapBtn',
      'preloadOverlay', 'patchOverlay', 'loadingSpinner',
      'sticky-ad-container', 'cookieConsentBanner',
    ];
    const skipClasses = ['pip-map-btn', 'mapsw-overlay'];

    Array.from(document.body.children).forEach(el => {
      if (el.id && skipIds.includes(el.id)) return;
      if (skipClasses.some(cls => el.classList.contains(cls))) return;
      if (['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)) return;

      const clone = el.cloneNode(true);
      clone.style.opacity    = '1';
      clone.style.visibility = 'visible';
      doc.body.appendChild(clone);
    });

    // Aktifkan filter panel
    const filterPanel = doc.getElementById('filterPanel');
    if (filterPanel) {
      filterPanel.classList.remove('hidden');
      filterPanel.style.pointerEvents = 'auto';

      filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.disabled = false;
        cb.addEventListener('change', function () {
          const cat       = this.getAttribute('data-category');
          const isChecked = this.checked;
          this.closest('.filter-item')?.classList.toggle('active', isChecked);
          if (cat && window.MarkerManager?.activeFilters) {
            isChecked
              ? window.MarkerManager.activeFilters.add(String(cat))
              : window.MarkerManager.activeFilters.delete(String(cat));
          }
          _refreshPipMarkers();
        });
      });

      doc.getElementById('btnSelectAll')?.addEventListener('click', () => {
        filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
          cb.closest('.filter-item')?.classList.add('active');
          const cat = cb.getAttribute('data-category');
          if (cat) window.MarkerManager?.activeFilters?.add(String(cat));
        });
        _refreshPipMarkers();
      });

      doc.getElementById('btnSelectNone')?.addEventListener('click', () => {
        filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
          cb.closest('.filter-item')?.classList.remove('active');
          const cat = cb.getAttribute('data-category');
          if (cat) window.MarkerManager?.activeFilters?.delete(String(cat));
        });
        _refreshPipMarkers();
      });
    }

    // Sync UI state dari map utama setiap 500ms
    const syncInterval = setInterval(() => {
      if (!pipWindow || pipWindow.closed) {
        clearInterval(syncInterval);
        return;
      }
      _syncUIState(doc);
    }, 500);
  }

  function _syncUIState(doc) {
    const pairs = [
      ['#regionToggle',      '#regionToggle'],
      ['.region-panel',      '.region-panel'],
      ['#undergroundPanel',  '#undergroundPanel'],
      ['#undergroundToggle', '#undergroundToggle'],
      ['.filter-toggle',     '.filter-toggle'],
      ['.filter-panel',      '.filter-panel'],
    ];
    pairs.forEach(([ms, ps]) => {
      const m = document.querySelector(ms);
      const p = doc.querySelector(ps);
      if (m && p) p.className = m.className;
    });
    document.querySelectorAll('.floor-item').forEach((item, i) => {
      const p = doc.querySelectorAll('.floor-item')[i];
      if (p) p.className = item.className;
    });
  }

  // ══════════════════════════════════════════════════════════════
  // VIRTUAL RENDERING
  // ══════════════════════════════════════════════════════════════
  function _getMarkerIcon(md) {
    try {
      if (String(md.category_id) === '2' && typeof getIconByCategoryWithMarkerName !== 'undefined')
        return getIconByCategoryWithMarkerName(md.category_id, md.name);
      if (md.special_icon && typeof getIconByCategoryWithSpecial !== 'undefined')
        return getIconByCategoryWithSpecial(md.category_id, md.special_icon);
      if (typeof getIconByCategory !== 'undefined')
        return getIconByCategory(md.category_id);
    } catch (e) {}
    return window.MarkerManager?.activeMarkers?.[md._key]?.options?.icon || null;
  }

  function _getPipBounds() {
    const b    = pipMap.getBounds();
    const bLat = (b.getNorth() - b.getSouth()) * 0.2;
    const bLng = (b.getEast()  - b.getWest())  * 0.2;
    return pipWindow.L.latLngBounds(
      [b.getSouth() - bLat, b.getWest() - bLng],
      [b.getNorth() + bLat, b.getEast() + bLng]
    );
  }

  function _removePipOutOfBounds(bounds) {
    for (const key in pipActiveMarkers) {
      if (!bounds.contains(pipActiveMarkers[key].getLatLng())) {
        pipMap.removeLayer(pipActiveMarkers[key]);
        delete pipActiveMarkers[key];
      }
    }
  }

  function _addPipMarkersBatch(markers, bounds) {
    const L       = pipWindow.L;
    const visited = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
    let index = 0;

    const addNext = () => {
      const end = Math.min(index + 200, markers.length);
      for (let i = index; i < end; i++) {
        const md  = markers[i];
        const key = md._key;
        if (pipActiveMarkers[key]) continue;

        const lat = parseFloat(md.lat || md.y);
        const lng = parseFloat(md.lng || md.x);
        if (isNaN(lat) || isNaN(lng)) continue;
        if (!bounds.contains([lat, lng])) continue;
        if (!window.MarkerManager.isFilterActive(md.category_id)) continue;

        const icon = _getMarkerIcon(md);
        if (!icon) continue;

        const m = L.marker([lat, lng], { icon });
        m.categoryId = md.category_id;
        m.markerKey  = key;

        if (visited[key]) m.setOpacity(0.5);

        if (window.MarkerManager.createPopupContent) {
          try {
            m.bindPopup(window.MarkerManager.createPopupContent(md), { maxWidth: 300 });
            m.on('popupopen', () => {
              window.MarkerImageHandler?.loadImagesForMarker?.(key);
            });
          } catch (e) {}
        }

        m.addTo(pipMap);
        pipActiveMarkers[key] = m;
      }
      index = end;
      if (index < markers.length) pipRafId = requestAnimationFrame(addNext);
    };

    addNext();
  }

  function _updatePipMarkersInView() {
    if (!pipMap || !pipWindow || !window.MarkerManager) return;
    const bounds  = _getPipBounds();
    const allData = window.MarkerManager.getAllMarkers();
    _removePipOutOfBounds(bounds);
    const filtered = allData.filter(m => window.MarkerManager.isMarkerVisibleOnCurrentMap(m));
    _addPipMarkersBatch(filtered, bounds);
  }

  function _schedulePipUpdate() {
    clearTimeout(pipDebounce);
    pipDebounce = setTimeout(_updatePipMarkersInView, 120);
  }

  function _initVirtualRendering() {
    if (!pipMap) return;
    pipMap.on('moveend', _schedulePipUpdate);
    pipMap.on('zoomend', _schedulePipUpdate);
    _updatePipMarkersInView();
  }

  function _refreshPipMarkers() {
    if (!pipMap || !pipWindow) return;
    for (const key in pipActiveMarkers) {
      pipMap.removeLayer(pipActiveMarkers[key]);
      delete pipActiveMarkers[key];
    }
    _updatePipMarkersInView();
  }

  // ══════════════════════════════════════════════════════════════
  // OPEN / CLOSE / TOGGLE
  // ══════════════════════════════════════════════════════════════
  async function open() {
    if (!isSupported()) {
      alert('Browser kamu tidak support Picture-in-Picture.\nGunakan Chrome 116+ atau Edge 116+.');
      return;
    }
    if (pipWindow && !pipWindow.closed) { pipWindow.focus(); return; }

    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 480, height: 360,
        disallowReturnToOpener: false,
      });

      pipWindow.addEventListener('pagehide', _cleanup);

      _injectStyles(pipWindow.document);
      await _injectLeaflet(pipWindow.document);
      _buildMap(pipWindow.document);

      if (btnToggle) btnToggle.classList.add('active');
      console.log('✅ PiP Map opened');

    } catch (e) {
      console.error('❌ PiP Map failed:', e);
    }
  }

  function close() {
    if (pipWindow && !pipWindow.closed) pipWindow.close();
    _cleanup();
  }

  function _cleanup() {
    clearTimeout(pipDebounce);
    if (pipRafId) cancelAnimationFrame(pipRafId);
    for (const key in pipActiveMarkers) delete pipActiveMarkers[key];
    pipMap = null; pipTileLayer = null; pipWindow = null;
    if (btnToggle) btnToggle.classList.remove('active');
  }

  function toggle() {
    pipWindow && !pipWindow.closed ? close() : open();
  }

  function refreshMarkers() { _refreshPipMarkers(); }

  // ══════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════
  function init() {
    if (!isSupported()) {
      console.warn('⚠️ PiP API not supported');
      return;
    }
    if (window.innerWidth > 768) _createToggleBtn();
    console.log('✅ PipMap initialized');
  }

  return { init, open, close, toggle, refreshMarkers, isSupported };

})();

window.PipMap = PipMap;