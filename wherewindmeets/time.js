/**
 * time-underground-marker.js
 * 
 * Jam dinding neon sebagai marker di peta.
 * Klik → masuk ke underground "8" (Time Underground).
 * 
 * Hanya muncul saat map preset = "main".
 * Tidak terpengaruh filter kategori / floor filter biasa.
 * Jarum bergerak real-time mengikuti waktu lokal.
 * 
 * CARA PAKAI:
 *   Panggil TimeUndergroundMarker.init(map) setelah map siap.
 *   Panggil TimeUndergroundMarker.onMapPresetChange(preset) setiap kali preset berubah.
 */

const TimeUndergroundMarker = (() => {

  // ─── CONFIG ────────────────────────────────────────────────
  const COORD      = { lat: 48.00084002013003, lng: 51.84608468841675 };
  const FLOOR_ID   = '8';
  const FLOOR_NAME = 'Time';

  // Ukuran icon: desktop / mobile lebih kecil
  const SIZE_DESKTOP = 52;
  const SIZE_MOBILE  = 32;   // ← lebih kecil untuk mobile

  // ─── STATE ─────────────────────────────────────────────────
  let _map       = null;
  let _marker    = null;
  let _animFrame = null;
  let _visible   = false;
  let _active    = false;   // toggle state: true = floor 8 aktif

  // ─── SVG BUILDER ───────────────────────────────────────────
  /**
   * Buat raw SVG jam dinding neon.
   * Putih neon + glow emas kuning. viewBox 100×100.
   * Jarum pakai class wc-hour / wc-min / wc-sec / wc-sec-tail
   * supaya bisa dirotate via JS.
   */
  function _buildSVG(size, active = false) {
    const uid = `tum${size}`;
    const ringColor   = active ? '#ffe600' : '#ffffff';  // kuning kalau aktif
    const ringOpacity = active ? '0.85'    : '0.55';
    const strokeW     = active ? '3'       : '2';
    return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100"
     xmlns="http://www.w3.org/2000/svg"
     style="overflow:visible;display:block;">
  <defs>
    <filter id="nO_${uid}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4"  result="b1"/>
      <feGaussianBlur stdDeviation="9"  result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="nI_${uid}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="nT_${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- BG hitam -->
  <circle cx="50" cy="50" r="43" fill="#050505"/>

  <!-- Glow emas luar -->
  <circle cx="50" cy="50" r="44"
    fill="none" stroke="#d4a800" stroke-width="5"
    filter="url(#nO_${uid})" opacity="${ringOpacity}"/>

  <!-- Ring utama — putih/kuning tergantung state -->
  <circle cx="50" cy="50" r="44"
    fill="none" stroke="${ringColor}" stroke-width="${strokeW}"
    filter="url(#nI_${uid})"/>

  <!-- Ring dalam tipis accent -->
  <circle cx="50" cy="50" r="37"
    fill="none" stroke="#fff8cc" stroke-width="0.6" opacity="0.25"/>

  <!-- Tick cardinal — putih -->
  <line x1="50" y1="9"  x2="50" y2="17" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>
  <line x1="91" y1="50" x2="83" y2="50" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>
  <line x1="50" y1="91" x2="50" y2="83" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>
  <line x1="9"  y1="50" x2="17" y2="50" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>

  <!-- Tick minor — emas -->
  <g stroke="#d4a800" stroke-width="1.2" stroke-linecap="round" opacity="0.55">
    <line x1="72.5" y1="12.3" x2="69.3" y2="17.8"/>
    <line x1="87.7" y1="27.5" x2="82.2" y2="30.7"/>
    <line x1="87.7" y1="72.5" x2="82.2" y2="69.3"/>
    <line x1="72.5" y1="87.7" x2="69.3" y2="82.2"/>
    <line x1="27.5" y1="87.7" x2="30.7" y2="82.2"/>
    <line x1="12.3" y1="72.5" x2="17.8" y2="69.3"/>
    <line x1="12.3" y1="27.5" x2="17.8" y2="30.7"/>
    <line x1="27.5" y1="12.3" x2="30.7" y2="17.8"/>
  </g>

  <!-- Jarum JAM -->
  <line class="wc-hour"
    x1="50" y1="50" x2="50" y2="29"
    stroke="#ffffff" stroke-width="4" stroke-linecap="round"
    filter="url(#nI_${uid})"/>

  <!-- Jarum MENIT -->
  <line class="wc-min"
    x1="50" y1="50" x2="50" y2="14"
    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"
    filter="url(#nT_${uid})"/>

  <!-- Jarum DETIK — emas -->
  <line class="wc-sec"
    x1="50" y1="50" x2="50" y2="11"
    stroke="#d4a800" stroke-width="1.3" stroke-linecap="round"/>
  <line class="wc-sec-tail"
    x1="50" y1="50" x2="50" y2="61"
    stroke="#d4a800" stroke-width="1.3" stroke-linecap="round"/>

  <!-- Center cap -->
  <circle cx="50" cy="50" r="4"   fill="#ffffff" filter="url(#nI_${uid})"/>
  <circle cx="50" cy="50" r="1.8" fill="#050505"/>
</svg>`;
  }

  // ─── ICON BUILDER ──────────────────────────────────────────
  function _buildIcon(active = false) {
    const isMob = window.matchMedia('(max-width:768px)').matches;
    const size  = isMob ? SIZE_MOBILE : SIZE_DESKTOP;
    const half  = size / 2;

    // Active state: glow lebih terang + ring emas solid
    const glowStyle = active
      ? 'drop-shadow(0 0 14px #d4a800ee) drop-shadow(0 0 6px #ffffffaa)'
      : 'drop-shadow(0 0 8px #d4a80077)';

    return L.divIcon({
      html: `<div class="tum-clock-wrap ${active ? 'tum-active' : ''}" style="
                position:relative;
                width:${size}px;
                height:${size}px;
                cursor:pointer;
                filter:${glowStyle};
                transition:filter .25s ease, transform .25s ease;
              ">${_buildSVG(size, active)}</div>`,
      iconSize:    [size, size],
      iconAnchor:  [half, half],
      popupAnchor: [0, -(half + 8)],
      className:   'no-default-icon-bg tum-marker-icon'
    });
  }

  // Refresh icon visual saja tanpa rebuild marker
  function _refreshIcon() {
    if (!_marker) return;
    _marker.setIcon(_buildIcon(_active));
    requestAnimationFrame(() => {
      const el = _marker.getElement();
      if (el) _attachHover(el);
    });
  }

  // ─── HAND ANIMATION ────────────────────────────────────────
  function _rotateLine(el, deg) {
    el.setAttribute('transform', `rotate(${deg}, 50, 50)`);
  }

  function _startAnimation() {
    if (_animFrame) return; // sudah jalan

    function tick() {
      const now = new Date();
      const h   = now.getHours() % 12;
      const m   = now.getMinutes();
      const s   = now.getSeconds();
      const ms  = now.getMilliseconds();

      const secDeg  = (s + ms / 1000) * 6;
      const minDeg  = (m + s  / 60)   * 6;
      const hourDeg = (h + m  / 60)   * 30;

      document.querySelectorAll('.tum-clock-wrap').forEach(wrap => {
        const hEl = wrap.querySelector('.wc-hour');
        const mEl = wrap.querySelector('.wc-min');
        const sEl = wrap.querySelector('.wc-sec');
        const tEl = wrap.querySelector('.wc-sec-tail');
        if (hEl) _rotateLine(hEl, hourDeg);
        if (mEl) _rotateLine(mEl, minDeg);
        if (sEl) _rotateLine(sEl, secDeg);
        if (tEl) _rotateLine(tEl, secDeg);
      });

      _animFrame = requestAnimationFrame(tick);
    }

    _animFrame = requestAnimationFrame(tick);
  }

  function _stopAnimation() {
    if (_animFrame) {
      cancelAnimationFrame(_animFrame);
      _animFrame = null;
    }
  }

  // ─── HOVER EFFECT ──────────────────────────────────────────
  function _attachHover(markerEl) {
    const wrap = markerEl.querySelector('.tum-clock-wrap');
    if (!wrap) return;

    markerEl.addEventListener('mouseenter', () => {
      wrap.style.filter    = 'drop-shadow(0 0 18px #d4a800cc) drop-shadow(0 0 6px #fff8)';
      wrap.style.transform = 'scale(1.18)';
    });
    markerEl.addEventListener('mouseleave', () => {
      wrap.style.filter    = 'drop-shadow(0 0 10px #d4a80099)';
      wrap.style.transform = 'scale(1)';
    });
  }

  function _buildTooltip() {
    return L.tooltip({
      permanent:  false,
      direction:  'top',
      className:  'tum-tooltip',
      offset:     [0, -8]
    }).setContent(`
      <div style="text-align:center;font-size:12px;letter-spacing:1px;color:#fff;line-height:1.6;">
        <div style="font-weight:700;color:#d4a800;font-size:13px;">⏰ Time Realm</div>
        <div style="opacity:.75;font-size:11px;">Tap to enter / exit</div>
      </div>
    `);
  }

  // ─── TOGGLE TIME UNDERGROUND ───────────────────────────────
  function _toggleTimeUnderground() {
    if (typeof UndergroundManager === 'undefined') {
      console.warn('[TUM] UndergroundManager not found');
      return;
    }

    if (_active) {
      // ── OFF: kembali ke surface ──────────────────────────
      _active = false;
      UndergroundManager.setActiveFloor('surface', true);
      _refreshIcon();
      _pulseMarker(false);
      _showNotif(false);
    } else {
      // ── ON: masuk floor 8 ────────────────────────────────
      _active = true;
      _ensureTimeFloor();
      UndergroundManager.setActiveFloor(FLOOR_ID, true);
      _refreshIcon();
      _pulseMarker(true);
      _showNotif(true);
    }
  }

  /**
   * Pastikan floor '8' terdaftar di UndergroundManager.floors.
   * Jika belum ada, inject secara runtime — aman karena tidak
   * merusak floor lain yang sudah ada.
   */
  function _ensureTimeFloor() {
    const existing = UndergroundManager.floors.find(f => f.id === FLOOR_ID);
    if (existing) return; // sudah ada

    UndergroundManager.floors.push({
      id:          FLOOR_ID,
      name:        FLOOR_NAME,
      icon:        `${ICON_BASE_URL}layericon.png`, // fallback icon
      description: 'Time Realm',
      filterValue: FLOOR_ID,
      brightness:  0.5,
      blur:        1
    });
  }

  // ─── PULSE ANIMATION ───────────────────────────────────────
  function _pulseMarker(entering = true) {
    if (!_marker) return;
    const el = _marker.getElement();
    if (!el) return;
    const wrap = el.querySelector('.tum-clock-wrap');
    if (!wrap) return;

    wrap.style.transition = 'transform .15s ease, filter .15s ease';
    wrap.style.transform  = 'scale(1.35)';
    wrap.style.filter     = entering
      ? 'drop-shadow(0 0 24px #ffe600) drop-shadow(0 0 10px #fff)'
      : 'drop-shadow(0 0 16px #888) drop-shadow(0 0 6px #444)';

    setTimeout(() => {
      wrap.style.transform = 'scale(1)';
      wrap.style.filter    = entering
        ? 'drop-shadow(0 0 14px #d4a800ee) drop-shadow(0 0 6px #ffffffaa)'
        : 'drop-shadow(0 0 8px #d4a80077)';
    }, 300);
  }

  // ─── NOTIFICATION ──────────────────────────────────────────
  function _showNotif(entering = true) {
    const old = document.querySelector('.tum-notif');
    if (old) old.remove();

    const notif = document.createElement('div');
    notif.className = 'tum-notif';
    notif.innerHTML = entering
      ? `<span style="font-size:18px;margin-right:8px;">⏰</span><span>Entering <strong>Time Realm</strong>…</span>`
      : `<span style="font-size:18px;margin-right:8px;">🌍</span><span>Back to <strong>Surface</strong></span>`;

    // Style inline supaya tidak bergantung CSS file lain
    Object.assign(notif.style, {
      position:     'fixed',
      bottom:       '90px',
      left:         '50%',
      transform:    'translateX(-50%) translateY(20px)',
      background:   'linear-gradient(135deg, #1a1200, #3a2800)',
      border:       '1px solid #d4a800',
      color:        '#fff8cc',
      padding:      '10px 20px',
      borderRadius: '12px',
      fontSize:     '14px',
      fontWeight:   '600',
      letterSpacing:'0.5px',
      boxShadow:    '0 0 20px #d4a80055',
      zIndex:       '99999',
      display:      'flex',
      alignItems:   'center',
      opacity:      '0',
      transition:   'opacity .3s ease, transform .3s ease',
      pointerEvents:'none',
    });

    document.body.appendChild(notif);

    // Trigger transition
    requestAnimationFrame(() => {
      notif.style.opacity   = '1';
      notif.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      notif.style.opacity   = '0';
      notif.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => notif.remove(), 350);
    }, 2500);
  }

  // ─── SHOW / HIDE MARKER ────────────────────────────────────
  function _show() {
    if (_visible || !_map) return;

    _marker = L.marker([COORD.lat, COORD.lng], {
      icon:         _buildIcon(_active),
      interactive:  true,
      zIndexOffset: 9000,
      pane:         'markerPane'
    });

    // Tooltip
    _marker.bindTooltip(_buildTooltip());

    // Klik → toggle Time Underground
    _marker.on('click', () => _toggleTimeUnderground());

    // Tambahkan ke map
    _marker.addTo(_map);

    // Attach hover effect setelah DOM siap
    requestAnimationFrame(() => {
      const el = _marker.getElement();
      if (el) _attachHover(el);
    });

    _visible = true;
    _startAnimation();
  }

  function _hide() {
    if (!_visible || !_marker) return;
    if (_map && _map.hasLayer(_marker)) {
      _map.removeLayer(_marker);
    }
    _marker  = null;
    _visible = false;
    // Reset active state saat marker disembunyikan (pindah preset)
    if (_active) {
      _active = false;
      if (typeof UndergroundManager !== 'undefined') {
        UndergroundManager.setActiveFloor('surface', false);
      }
    }
  }

  // ─── PUBLIC API ────────────────────────────────────────────
  return {

    /**
     * Init — panggil setelah map & IconManager siap.
     * @param {L.Map} mapInstance
     */
    init(mapInstance) {
      _map = mapInstance;

      // Tampilkan hanya jika preset = main
      const preset = (typeof getCurrentMapPreset === 'function')
        ? getCurrentMapPreset()
        : 'main';

      if (preset === 'main') _show();
    },

    /**
     * Panggil setiap kali switchMapPreset() dipanggil.
     * @param {string} preset — 'main' | 'hutuo' | 'royal_palace' | 'dreamspace'
     */
    onMapPresetChange(preset) {
      if (preset === 'main') {
        _show();
      } else {
        _hide();
      }
    },

    /** Paksa tampilkan (debug) */
    show: _show,

    /** Paksa sembunyikan (debug) */
    hide: _hide,

    /** Cek apakah marker sedang visible */
    get isVisible() { return _visible; },

    /** Cek apakah floor 8 sedang aktif */
    get isActive() { return _active; },

    /** Floor ID yang dipakai */
    FLOOR_ID,
    FLOOR_NAME,
  };

})();

// ─── GLOBAL EXPORT ─────────────────────────────────────────────
window.TimeUndergroundMarker = TimeUndergroundMarker;


// ─── CSS TOOLTIP ───────────────────────────────────────────────
// Inject style sekali saja supaya tooltip terlihat bagus
(function injectTUMStyles() {
  if (document.getElementById('tum-styles')) return;

  const style = document.createElement('style');
  style.id = 'tum-styles';
  style.textContent = `
    /* Tooltip jam */
    .tum-tooltip {
      background: linear-gradient(135deg, #1a1200ee, #2e1f00ee) !important;
      border: 1px solid #d4a800 !important;
      border-radius: 8px !important;
      box-shadow: 0 0 14px #d4a80055 !important;
      padding: 6px 12px !important;
    }
    .tum-tooltip::before {
      border-top-color: #d4a800 !important;
    }

    /* Pastikan marker jam tidak kena hide dari filter system */
    .tum-marker-icon {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);
})();