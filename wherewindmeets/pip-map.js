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
      BASE_URL + 'knowladgelist.css',
      BASE_URL + 'mystic-skill-panel.css',
      BASE_URL + 'innerway.css',
      BASE_URL + 'patchnote.css',
      BASE_URL + 'form.css',
      BASE_URL + 'layer.css',
      BASE_URL + 'region-management.css',
      BASE_URL + 'booklist.css',
      BASE_URL + 'ui.css',
      BASE_URL + 'login.css',
      BASE_URL + 'comment.css',
      BASE_URL + 'profile-container.css',
      BASE_URL + 'setting.css',
      BASE_URL + 'donate.css',
      BASE_URL + 'tip-guide.css',
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

    // Clone semua UI dari map utama
    _cloneAllUI(doc);

    // Mulai virtual rendering setelah map siap
    pipMap.whenReady(() => {
      setTimeout(_initVirtualRendering, 300);
    });
  }

  // ── Clone semua UI dari body map utama ke PiP ────────────────
  function _cloneAllUI(doc) {
    const skipIds = [
      'map',
      'pip-map-container',
      'pipMapBtn',
      'preloadOverlay',
      'patchOverlay',
      'loadingSpinner',
      'sticky-ad-container',
      'cookieConsentBanner',
    ];
    const skipClasses = ['pip-map-btn', 'mapsw-overlay'];

    Array.from(document.body.children).forEach(el => {
      if (el.id && skipIds.includes(el.id)) return;
      if (skipClasses.some(cls => el.classList.contains(cls))) return;
      if (['SCRIPT','STYLE','LINK'].includes(el.tagName)) return;

      const clone = el.cloneNode(true);
      clone.style.opacity = '1';
      clone.style.visibility = 'visible';
      doc.body.appendChild(clone);
    });

    // ── Aktifkan filter panel ──
    const filterPanel = doc.getElementById('filterPanel');
    if (filterPanel) {
      filterPanel.classList.remove('hidden');
      filterPanel.style.pointerEvents = 'auto';

      filterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.disabled = false;
        cb.addEventListener('change', function() {
          const categoryId = this.getAttribute('data-category');
          const isChecked  = this.checked;
          this.closest('.filter-item')?.classList.toggle('active', isChecked);
          if (categoryId && window.MarkerManager?.activeFilters) {
            isChecked
              ? window.MarkerManager.activeFilters.add(String(categoryId))
              : window.MarkerManager.activeFilters.delete(String(categoryId));
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

    // ── Sync state UI setiap 500ms ──
    setInterval(() => {
      if (!pipWindow || pipWindow.closed) return;
      const syncTargets = [
        ['#regionToggle',      '#regionToggle'],
        ['.region-panel',      '.region-panel'],
        ['#undergroundPanel',  '#undergroundPanel'],
        ['#undergroundToggle', '#undergroundToggle'],
        ['.filter-toggle',     '.filter-toggle'],
        ['.filter-panel',      '.filter-panel'],
      ];
      syncTargets.forEach(([mainSel, pipSel]) => {
        const mainEl = document.querySelector(mainSel);
        const pipEl  = doc.querySelector(pipSel);
        if (mainEl && pipEl) pipEl.className = mainEl.className;
      });
      // Sync active floor items
      document.querySelectorAll('.floor-item').forEach((item, i) => {
        const pipItem = doc.querySelectorAll('.floor-item')[i];
        if (pipItem) pipItem.className = item.className;
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