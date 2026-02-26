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
      <span>Floating Window (Beta)</span>
    `;
    btnToggle.addEventListener('click', toggle);
    document.body.appendChild(btnToggle);
  }

  // ── Inject semua CSS yang dibutuhkan ke PiP window ─────────
  function _injectStyles(doc) {
  const cssVersion = window.CSS_VERSION || '1.1.5';

  const cssFiles = [
    'styles.css',
    'marker-image-handler.css',
    'editing-image-upload.css',

    'mystic-skill-panel.css',
    'innerway.css',
    'patchnote.css',
    'form.css',
    'layer.css',


    'ui.css',

    'comment.css',
    'profile-container.css',
    'setting.css',


    'map-switcher.css',
    'MapTransition.css',

    'region.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  ];

  cssFiles.forEach(file => {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = file.includes('http')
      ? file
      : `${file}?v=${cssVersion}`;
    doc.head.appendChild(link);
  });
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

    // Load markers
    _loadMarkers(L);
  }

  // ── Clone filter panel ke PiP window ───────────────────────
  function _cloneFilterPanel(doc) {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) return;

    // Clone dengan semua children
    const clone = filterPanel.cloneNode(true);
    clone.id = 'filterPanel-pip';

    // Tambah style override agar filter panel tampil di PiP
    clone.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 100%;
      z-index: 800;
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      overflow-y: auto;
    `;

    doc.body.appendChild(clone);

    // Disable checkbox interaksi (read-only di PiP)
    clone.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.disabled = true;
    });
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

  // ── Load marker dari data yang sudah ada di halaman utama ──
  function _loadMarkers(L) {
    if (!pipMap || !window.MarkerManager) return;
    L = L || pipWindow.L;

    // Ambil semua marker yang aktif di map utama
    const activeMarkers = window.MarkerManager.activeMarkers || {};

    Object.values(activeMarkers).forEach(marker => {
      if (!marker) return;

      try {
        const latlng  = marker.getLatLng();
        const options = marker.options || {};

        // Buat marker baru di PiP dengan icon yang sama
        const pipMarker = L.marker(latlng, {
          icon: options.icon,
          opacity: options.opacity || 1,
        });

        // Copy popup content jika ada
        const popup = marker.getPopup();
        if (popup) {
          pipMarker.bindPopup(popup.getContent(), {
            maxWidth: 250,
            className: 'pip-popup'
          });
        }

        pipMarker.addTo(pipMap);
      } catch (e) {}
    });

    console.log(`✅ PiP: Loaded ${Object.keys(activeMarkers).length} markers`);
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
    pipMap      = null;
    pipTileLayer = null;
    pipWindow   = null;
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

  // ── Refresh marker (bisa dipanggil saat marker update) ─────
  function refreshMarkers() {
    if (!pipMap || !pipWindow) return;
    const L = pipWindow.L;

    // Hapus semua marker lama
    pipMap.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        pipMap.removeLayer(layer);
      }
    });

    // Load ulang
    _loadMarkers(L);
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