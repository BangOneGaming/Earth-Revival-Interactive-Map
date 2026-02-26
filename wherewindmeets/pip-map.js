/**
 * PiP Map - Picture-in-Picture floating map window
 * 
 * Menggunakan Document Picture-in-Picture API (Chrome 116+ / Edge 116+)
 * Membuat instance Leaflet map baru di dalam PiP window yang independen.
 * 
 * Cara pakai:
 *   PipMap.open()   // buka PiP window
 *   PipMap.close()  // tutup PiP window
 *   PipMap.toggle() // toggle
 */

const PipMap = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  let pipWindow   = null;
  let pipMap      = null;
  let pipTileLayer = null;
  let btnToggle   = null;

  // ── Cek support ────────────────────────────────────────────
  function isSupported() {
    return 'documentPictureInPicture' in window;
  }

  // ── Buat tombol toggle di halaman utama ────────────────────
  function _createToggleBtn() {
    if (document.getElementById('pipMapBtn')) return;

    // Hanya tampil di desktop
    if (window.innerWidth <= 768) return;

    btnToggle = document.createElement('button');
    btnToggle.id        = 'pipMapBtn';
    btnToggle.className = 'pip-map-btn';
    btnToggle.title     = 'Open Map in Floating Window';
    btnToggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <rect x="12" y="10" width="9" height="7" rx="1" fill="currentColor" opacity="0.4"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span>PiP Map</span>
    `;
    btnToggle.addEventListener('click', toggle);
    document.body.appendChild(btnToggle);
  }

  // ── Inject semua CSS yang dibutuhkan ke PiP window ─────────
  function _injectStyles(doc) {
    const BASE_URL = 'https://bgonegaming.win/wherewindmeets/';

    // Semua CSS dari project (sama persis dengan loadDeferredCSS di main.js)
    const allCSS = [
      // Leaflet
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      // Base
      BASE_URL + 'styles.css',
      // Deferred CSS (dari main.js loadDeferredCSS)
      BASE_URL + 'marker-image-handler.css',
      BASE_URL + 'editing-image-upload.css',

      

      BASE_URL + 'layer.css',
      BASE_URL + 'region-management.css',

      BASE_URL + 'ui.css',

      BASE_URL + 'comment.css',



      BASE_URL + 'map-switcher.css',
      BASE_URL + 'MapTransition.css',
      BASE_URL + 'region.css',
      BASE_URL + 'pip-map.css',
    ];

    allCSS.forEach(href => {
      const link = doc.createElement('link');
      link.rel  = 'stylesheet';
      link.href = href;
      doc.head.appendChild(link);
    });

    // Style tambahan khusus PiP window
    const style = doc.createElement('style');
    style.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1008; }
      #pip-map-container { width: 100%; height: 100%; }
      .leaflet-container { background: #1a1008; }
      /* Sembunyikan UI yang tidak perlu di PiP */
      .leaflet-control-zoom { display: block; }
      /* Popup styling */
      .leaflet-popup-content-wrapper {
        background: rgba(30, 20, 8, 0.95) !important;
        color: #f3d59b !important;
        border: 1px solid rgba(243, 213, 155, 0.4) !important;
        border-radius: 8px !important;
        font-size: 12px !important;
      }
      .leaflet-popup-tip {
        background: rgba(30, 20, 8, 0.95) !important;
      }
    `;
    doc.head.appendChild(style);
  }

  // ── Inject Leaflet ke PiP window ───────────────────────────
  function _injectLeaflet(doc) {
    return new Promise((resolve) => {
      // CSS Leaflet
      const leafletCSS = doc.createElement('link');
      leafletCSS.rel  = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      doc.head.appendChild(leafletCSS);

      // JS Leaflet
      const leafletJS = doc.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJS.onload = resolve;
      doc.head.appendChild(leafletJS);
    });
  }

  // ── Buat map Leaflet di dalam PiP window ───────────────────
  function _buildMap(doc) {
    // Container
    const container = doc.createElement('div');
    container.id = 'pip-map-container';
    doc.body.appendChild(container);

    const L = pipWindow.L;

    const crsSimple = L.extend({}, L.CRS.Simple, {
      transformation: new L.Transformation(1, 0, 1, 0)
    });

    // Ambil posisi & preset dari map utama
    const mainCenter = window.map ? window.map.getCenter() : { lat: 128, lng: 180 };
    const mainZoom   = window.map ? window.map.getZoom()   : 5;
    const preset     = window.currentPreset || 'main';

    pipMap = L.map('pip-map-container', {
      crs:                crsSimple,
      minZoom:            3,
      maxZoom:            8,
      zoomControl:        true,
      attributionControl: false,
      preferCanvas:       true,
    });

    pipMap.setView([mainCenter.lat, mainCenter.lng], mainZoom);

    // Tile layer — sama dengan preset map utama
    _applyPreset(preset, L);

    // Clone filter panel dari halaman utama
    _cloneFilterPanel(doc);

    // Clone region container (toggle + label)
    _cloneRegionContainer(doc);

    // Clone underground/layer panel
    _cloneUndergroundPanel(doc);

    // Mulai virtual rendering setelah map siap
    pipMap.whenReady(() => {
      setTimeout(_initVirtualRendering, 300);
    });
  }

  // ── Clone filter panel ke PiP window ───────────────────────
  function _cloneFilterPanel(doc) {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) return;

    const clone = filterPanel.cloneNode(true);
    clone.id = 'filterPanel-pip';

    // Hanya pastikan visible — biarkan CSS asli (right:0, fixed) yang atur posisi
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.pointerEvents = 'auto';
    // Hapus class hidden jika ada
    clone.classList.remove('hidden');

    doc.body.appendChild(clone);

    // Aktifkan checkbox dan hubungkan ke pipMap
    clone.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.disabled = false;
      cb.addEventListener('change', function() {
        const categoryId = this.getAttribute('data-category');
        const isChecked = this.checked;

        // Update visual active class
        const filterItem = this.closest('.filter-item');
        if (filterItem) {
          filterItem.classList.toggle('active', isChecked);
        }

        // Sync ke MarkerManager activeFilters agar isFilterActive() benar
        if (categoryId && window.MarkerManager?.activeFilters) {
          if (isChecked) {
            window.MarkerManager.activeFilters.add(String(categoryId));
          } else {
            window.MarkerManager.activeFilters.delete(String(categoryId));
          }
        }

        // Refresh virtual rendering berdasarkan filter baru
        if (!pipMap || !pipWindow) return;
        _refreshPipMarkers();
      });
    });

    // Tombol Select All / Clear All
    const btnAll  = clone.querySelector('#btnSelectAll');
    const btnNone = clone.querySelector('#btnSelectNone');

    if (btnAll) {
      btnAll.addEventListener('click', () => {
        clone.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
          cb.closest('.filter-item')?.classList.add('active');
          // Sync ke MarkerManager activeFilters
          const cat = cb.getAttribute('data-category');
          if (cat) window.MarkerManager?.activeFilters?.add(String(cat));
        });
        _refreshPipMarkers();
      });
    }

    if (btnNone) {
      btnNone.addEventListener('click', () => {
        clone.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
          cb.closest('.filter-item')?.classList.remove('active');
          // Sync ke MarkerManager activeFilters
          const cat = cb.getAttribute('data-category');
          if (cat) window.MarkerManager?.activeFilters?.delete(String(cat));
        });
        _refreshPipMarkers();
      });
    }
  }

  // ── Apply tile preset ke PiP map ───────────────────────────
  function _applyPreset(preset, L) {
    if (!pipMap) return;
    L = L || pipWindow.L;

    const TILE_VERSION = window.TILE_VERSION || '20251121';
    const presets = {
      main:          `https://tiles.bgonegaming.win/wherewindmeet/tiles/{z}_{x}_{y}.webp?v=${TILE_VERSION}`,
      hutuo:         `https://tiles.bgonegaming.win/wherewindmeet/tiles/hutuo/{z}_{x}_{y}.webp?v=${TILE_VERSION}`,
      royal_palace:  `https://tiles.bgonegaming.win/wherewindmeet/tiles/royal_palace/{z}_{x}_{y}.webp?v=${TILE_VERSION}`
    };

    const tileUrl = presets[preset] || presets.main;

    if (pipTileLayer) {
      pipMap.removeLayer(pipTileLayer);
    }

    pipTileLayer = L.tileLayer(tileUrl, {
      minZoom:         3,
      maxZoom:         8,
      maxNativeZoom:   7,
      noWrap:          true,
      crossOrigin:     true,
      updateWhenIdle:  true,
      updateWhenZooming: false,
    });

    pipTileLayer.addTo(pipMap);
  }

  // ── Virtual rendering state ────────────────────────────────
  const pipActiveMarkers = {};  // key → L.marker
  let   pipRafId         = null;
  let   pipDebounce      = null;

  // ── Buat icon untuk marker (reuse fungsi dari halaman utama) ─
  function _getMarkerIcon(markerData) {
    try {
      if (String(markerData.category_id) === '2' && typeof getIconByCategoryWithMarkerName !== 'undefined') {
        return getIconByCategoryWithMarkerName(markerData.category_id, markerData.name);
      }
      if (markerData.special_icon && typeof getIconByCategoryWithSpecial !== 'undefined') {
        return getIconByCategoryWithSpecial(markerData.category_id, markerData.special_icon);
      }
      if (typeof getIconByCategory !== 'undefined') {
        return getIconByCategory(markerData.category_id);
      }
    } catch(e) {}

    // Fallback: ambil dari activeMarkers map utama
    const existing = window.MarkerManager?.activeMarkers?.[markerData._key];
    return existing?.options?.icon || null;
  }

  // ── Hitung buffered bounds pipMap ──────────────────────────
  function _getPipBounds() {
    const bounds = pipMap.getBounds();
    const bufLat = (bounds.getNorth() - bounds.getSouth()) * 0.2;
    const bufLng = (bounds.getEast()  - bounds.getWest())  * 0.2;
    return pipWindow.L.latLngBounds(
      [bounds.getSouth() - bufLat, bounds.getWest() - bufLng],
      [bounds.getNorth() + bufLat, bounds.getEast() + bufLng]
    );
  }

  // ── Hapus marker di luar bounds ────────────────────────────
  function _removePipOutOfBounds(bounds) {
    for (const key in pipActiveMarkers) {
      const m = pipActiveMarkers[key];
      if (!bounds.contains(m.getLatLng())) {
        pipMap.removeLayer(m);
        delete pipActiveMarkers[key];
      }
    }
  }

  // ── Load marker dalam bounds (batch) ───────────────────────
  function _addPipMarkersBatch(markers, bounds) {
    const L = pipWindow.L;
    const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
    const batchSize = 200;
    let index = 0;

    const addNext = () => {
      const end = Math.min(index + batchSize, markers.length);

      for (let i = index; i < end; i++) {
        const markerData = markers[i];
        const key = markerData._key;

        if (pipActiveMarkers[key]) continue;

        const lat = parseFloat(markerData.lat || markerData.y);
        const lng = parseFloat(markerData.lng || markerData.x);
        if (isNaN(lat) || isNaN(lng)) continue;
        if (!bounds.contains([lat, lng])) continue;

        // Cek filter category
        if (!window.MarkerManager.isFilterActive(markerData.category_id)) continue;

        const icon = _getMarkerIcon(markerData);
        if (!icon) continue;

        const m = L.marker([lat, lng], { icon });
        m.categoryId = markerData.category_id;
        m.markerKey  = key;

        // Opacity: visited = 0.5
        const isVisited = visitedMarkers[key] || false;
        if (isVisited) m.setOpacity(0.5);

        // Popup dengan konten lengkap (termasuk marker image)
        if (window.MarkerManager.createPopupContent) {
          try {
            const popupContent = window.MarkerManager.createPopupContent(markerData);
            m.bindPopup(popupContent, { maxWidth: 300, className: 'pip-popup' });

            // Load marker image setelah popup terbuka
            m.on('popupopen', () => {
              if (window.MarkerImageHandler?.loadImagesForMarker) {
                try {
                  window.MarkerImageHandler.loadImagesForMarker(markerData._key);
                } catch(e) {}
              }
            });
          } catch(e) {}
        }

        m.addTo(pipMap);
        pipActiveMarkers[key] = m;
      }

      index = end;
      if (index < markers.length) {
        pipRafId = requestAnimationFrame(addNext);
      }
    };

    addNext();
  }

  // ── Update marker di viewport PiP ─────────────────────────
  function _updatePipMarkersInView() {
    if (!pipMap || !pipWindow || !window.MarkerManager) return;

    const bounds  = _getPipBounds();
    const allData = window.MarkerManager.getAllMarkers();

    _removePipOutOfBounds(bounds);

    const filtered = allData.filter(m =>
      window.MarkerManager.isMarkerVisibleOnCurrentMap(m)
    );

    _addPipMarkersBatch(filtered, bounds);
  }

  // ── Debounced update (dipanggil saat moveend/zoomend) ──────
  function _schedulePipUpdate() {
    clearTimeout(pipDebounce);
    pipDebounce = setTimeout(_updatePipMarkersInView, 120);
  }

  // ── Inisialisasi virtual rendering setelah map siap ────────
  function _initVirtualRendering() {
    if (!pipMap) return;

    pipMap.on('moveend', _schedulePipUpdate);
    pipMap.on('zoomend', _schedulePipUpdate);

    // Load awal
    _updatePipMarkersInView();
  }

  // ── Public: refresh marker (dipanggil dari filter checkbox) ─
  function _refreshPipMarkers() {
    if (!pipMap || !pipWindow) return;

    // Hapus semua marker lama
    for (const key in pipActiveMarkers) {
      pipMap.removeLayer(pipActiveMarkers[key]);
      delete pipActiveMarkers[key];
    }

    _updatePipMarkersInView();
  }

  // ── Clone region container ke PiP ────────────────────────────
  function _cloneRegionContainer(doc) {
    const regionContainer = document.querySelector('.region-container');
    if (!regionContainer) return;

    const clone = regionContainer.cloneNode(true);
    clone.id = 'regionContainer-pip';

    // Pastikan visible dan pointer events aktif
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.pointerEvents = 'auto';

    doc.body.appendChild(clone);

    // Sync state aktif dari map utama ke PiP setiap 2 detik
    // (region label muncul/hilang mengikuti map utama)
    setInterval(() => {
      if (!pipWindow || pipWindow.closed) return;

      const mainRegion = document.querySelector('.region-container');
      const pipRegion  = doc.getElementById('regionContainer-pip');
      if (!mainRegion || !pipRegion) return;

      // Sync class active pada toggle button
      const mainBtn = mainRegion.querySelector('.region-toggle');
      const pipBtn  = pipRegion.querySelector('.region-toggle');
      if (mainBtn && pipBtn) {
        pipBtn.className = mainBtn.className;
      }

      // Sync panel visibility
      const mainPanel = mainRegion.querySelector('.region-panel');
      const pipPanel  = pipRegion.querySelector('.region-panel');
      if (mainPanel && pipPanel) {
        pipPanel.className = mainPanel.className;
      }
    }, 500);
  }

  // ── Clone underground/layer panel ke PiP ──────────────────
  function _cloneUndergroundPanel(doc) {
    const panel = document.getElementById('undergroundPanel');
    if (!panel) return;

    const clone = panel.cloneNode(true);
    clone.id = 'undergroundPanel-pip';
    clone.style.visibility = 'visible';
    clone.style.pointerEvents = 'auto';
    doc.body.appendChild(clone);

    // Clone toggle button juga
    const toggleBtn = document.getElementById('undergroundToggle');
    if (toggleBtn) {
      const btnClone = toggleBtn.cloneNode(true);
      btnClone.id = 'undergroundToggle-pip';
      doc.body.appendChild(btnClone);

      // Klik di PiP toggle → trigger toggle di map utama juga
      btnClone.addEventListener('click', (e) => {
        e.stopPropagation();
        // Toggle panel di PiP
        const pipPanel = doc.getElementById('undergroundPanel-pip');
        if (pipPanel) pipPanel.classList.toggle('open');
        // Sync ke map utama
        document.getElementById('undergroundToggle')?.click();
      });
    }

    // Sync state underground dari map utama ke PiP setiap 500ms
    setInterval(() => {
      if (!pipWindow || pipWindow.closed) return;

      const mainPanel = document.getElementById('undergroundPanel');
      const pipPanel  = doc.getElementById('undergroundPanel-pip');
      if (!mainPanel || !pipPanel) return;

      // Sync class (open/close, active floor)
      pipPanel.className = mainPanel.className;

      // Sync active floor item
      const mainItems = mainPanel.querySelectorAll('.floor-item');
      const pipItems  = pipPanel.querySelectorAll('.floor-item');
      mainItems.forEach((item, i) => {
        if (pipItems[i]) {
          pipItems[i].className = item.className;
        }
      });
    }, 500);
  }

  // ── Buka PiP window ────────────────────────────────────────
  async function open() {
    if (!isSupported()) {
      alert('Browser kamu tidak support Picture-in-Picture.\nGunakan Chrome 116+ atau Edge 116+.');
      return;
    }

    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();
      return;
    }

    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width:  480,
        height: 360,
        disallowReturnToOpener: false,
      });

      // Handle window close
      pipWindow.addEventListener('pagehide', () => {
        _cleanup();
      });

      // Inject Leaflet dulu, baru build map
      _injectStyles(pipWindow.document);
      await _injectLeaflet(pipWindow.document);
      _buildMap(pipWindow.document);

      // Update tombol
      if (btnToggle) btnToggle.classList.add('active');

      console.log('✅ PiP Map opened');

    } catch (e) {
      console.error('❌ PiP Map failed:', e);
      if (e.name === 'NotAllowedError') {
        alert('PiP harus dibuka melalui interaksi user (klik tombol).');
      }
    }
  }

  // ── Tutup PiP window ───────────────────────────────────────
  function close() {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
    _cleanup();
  }

  function _cleanup() {
    // Bersihkan virtual rendering state
    clearTimeout(pipDebounce);
    if (pipRafId) cancelAnimationFrame(pipRafId);
    for (const key in pipActiveMarkers) delete pipActiveMarkers[key];

    pipMap       = null;
    pipTileLayer = null;
    pipWindow    = null;
    if (btnToggle) btnToggle.classList.remove('active');
  }

  // ── Toggle ─────────────────────────────────────────────────
  function toggle() {
    if (pipWindow && !pipWindow.closed) {
      close();
    } else {
      open();
    }
  }

  // ── Refresh marker public (bisa dipanggil dari luar) ───────
  function refreshMarkers() {
    _refreshPipMarkers();
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    if (!isSupported()) {
      console.warn('⚠️ Document PiP API not supported in this browser');
      return;
    }

    // Hanya tampilkan tombol di desktop
    if (window.innerWidth > 768) {
      _createToggleBtn();
    }

    console.log('✅ PipMap initialized');
  }

  // ── Public API ─────────────────────────────────────────────
  return { init, open, close, toggle, refreshMarkers, isSupported };

})();

window.PipMap = PipMap;