/**
 * time-underground-marker.js
 *
 * Jam dinding neon sebagai marker di peta.
 * Klik → masuk ke underground "8" (Time Underground).
 *
 * Hanya muncul saat map preset = "main".
 * Tidak terpengaruh filter kategori / floor filter biasa.
 *
 * LOGIKA ANIMASI:
 *  - Tidak aktif  → fill PENUH, jarum DIAM
 *  - Ditekan masuk → fill berkurang (penuh→kosong), jarum BERPUTAR TERBALIK
 *  - Aktif         → fill KOSONG, jarum DIAM
 *  - Ditekan keluar→ fill bertambah (kosong→penuh), jarum BERPUTAR NORMAL
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

  const SIZE_DESKTOP = 52;
  const SIZE_MOBILE  = 32;

  // Durasi animasi fill (ms)
  const ANIM_DURATION = 1800;

  // ─── STATE ─────────────────────────────────────────────────
  let _map        = null;
  let _marker     = null;
  let _animFrame  = null;
  let _visible    = false;
  let _active     = false;
  let _animating  = false;

  // Progress fill: 1.0 = penuh, 0.0 = kosong
  let _fillProgress = 1.0;

  // ─── SVG BUILDER ───────────────────────────────────────────
  /**
   * Jam neon dengan:
   *  - Lingkaran utama + glow emas
   *  - Lingkaran kecil dalam
   *  - 12 garis jam sama rata (lingkaran besar & kecil)
   *  - 4 ornamen diamond berputar pelan di luar ring
   *  - Jarum runcing (polygon) panjang sampai ke arc
   *  - Loading arc setengah atas di luar lingkaran
   *
   * viewBox 0 0 100 100, center = 50,50
   * Arc luar: r=48, panjang ≈ 151
   */
  function _buildSVG(size, active = false, fillProgress = 1.0) {
    const uid = `tum${size}${Date.now()}`;

    const ARC_LEN    = 176; // π × 56 ≈ 175.9
    const dashOffset = ARC_LEN * (1 - fillProgress);

    const ringOpacity = active ? '0.85' : '0.55';
    const strokeW     = active ? '3'    : '2';
    const ornamentDur = active ? '6s'   : '12s';

    return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100"
     xmlns="http://www.w3.org/2000/svg"
     style="overflow:visible;display:block;">
  <defs>
    <!-- Glow kuat — ring utama -->
    <filter id="nO_${uid}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3"  result="b1"/>
      <feGaussianBlur stdDeviation="7"  result="b2"/>
      <feGaussianBlur stdDeviation="13" result="b3"/>
      <feMerge>
        <feMergeNode in="b3"/>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Glow medium — center cap -->
    <filter id="nI_${uid}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2" result="b1"/>
      <feGaussianBlur stdDeviation="5" result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Glow arc fill -->
    <filter id="nArc_${uid}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.5" result="b1"/>
      <feGaussianBlur stdDeviation="6"   result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Glow jarum -->
    <filter id="nH_${uid}" x="-100%" y="-20%" width="300%" height="140%">
      <feGaussianBlur stdDeviation="2"  result="b1"/>
      <feGaussianBlur stdDeviation="5"  result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Ring utama — stroke tebal, opacity penuh, glow kuat -->
  <circle cx="50" cy="50" r="44"
    fill="none" stroke="#ffffff" stroke-width="${strokeW}"
    opacity="${ringOpacity}"
    filter="url(#nO_${uid})"/>

  <!-- ── 12 garis jam BESAR — lebih tebal & jelas ── -->
  <g stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85">
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(0,   50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(30,  50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(60,  50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(90,  50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(120, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(150, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(180, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(210, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(240, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(270, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(300, 50,50)"/>
    <line x1="50" y1="8"  x2="50" y2="15" transform="rotate(330, 50,50)"/>
  </g>

  <!-- Lingkaran kecil dalam (r=28) — lebih tebal -->
  <circle cx="50" cy="50" r="28"
    fill="none" stroke="#ffffff" stroke-width="1" opacity="0.55"/>

  <!-- ── 12 garis jam KECIL — lebih tebal & jelas ── -->
  <g stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.5">
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(0,   50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(30,  50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(60,  50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(90,  50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(120, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(150, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(180, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(210, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(240, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(270, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(300, 50,50)"/>
    <line x1="50" y1="24" x2="50" y2="29" transform="rotate(330, 50,50)"/>
  </g>

  <!-- ── Ornamen 4 diamond berputar — lebih besar & jelas ── -->
  <g opacity="0.85" filter="url(#nI_${uid})">
    <animateTransform
      attributeName="transform" attributeType="XML"
      type="rotate" from="0 50 50" to="360 50 50"
      dur="${ornamentDur}" repeatCount="indefinite"/>
    <polygon points="50,1   52,5.5  50,10  48,5.5"  fill="#ffffff"/>
    <polygon points="99,50  103,52  99,54  95,52"   fill="#ffffff"/>
    <polygon points="50,90  52,94.5 50,99  48,94.5" fill="#ffffff"/>
    <polygon points="1,50   5,52    1,54   -3,52"   fill="#ffffff"/>
  </g>

  <!-- ── Jarum runcing — lebih tebal, glow kuat ── -->
  <g class="wc-hour" filter="url(#nH_${uid})">
    <polygon points="50,5 48,50 52,50"  fill="#ffffff" opacity="1"/>
    <polygon points="50,63 49,50 51,50" fill="#ffffff" opacity="0.6"/>
  </g>

  <!-- Center cap — lebih besar & bercahaya -->
  <circle cx="50" cy="50" r="4.5" fill="#ffffff" filter="url(#nI_${uid})"/>
  <circle cx="50" cy="50" r="2.5" fill="#ffffff"/>

  <!-- ── LOADING ARC di LUAR (r=56) ── -->
  <!-- Track — cukup terlihat saat kosong -->
  <path d="M -6,50 A 56,56 0 0,1 106,50"
    fill="none"
    stroke="rgba(255,255,255,0.4)"
    stroke-width="3.5"
    stroke-linecap="round"/>

  <!-- Fill — neon glow -->
  <path class="wc-arc-fill"
    d="M -6,50 A 56,56 0 0,1 106,50"
    fill="none"
    stroke="#ffffff"
    stroke-width="3.5"
    stroke-linecap="round"
    stroke-dasharray="${ARC_LEN}"
    stroke-dashoffset="${dashOffset}"
    filter="url(#nArc_${uid})"/>

</svg>`;
  }

  // ─── ICON BUILDER ──────────────────────────────────────────
  function _buildIcon(active = false, fillProgress = 1.0) {
    const isMob = window.matchMedia('(max-width:768px)').matches;
    const size  = isMob ? SIZE_MOBILE : SIZE_DESKTOP;
    const half  = size / 2;

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
              ">${_buildSVG(size, active, fillProgress)}</div>`,
      iconSize:    [size, size],
      iconAnchor:  [half, half],
      popupAnchor: [0, -(half + 8)],
      className:   'no-default-icon-bg tum-marker-icon'
    });
  }

  function _refreshIcon() {
    if (!_marker) return;
    _marker.setIcon(_buildIcon(_active, _fillProgress));
    requestAnimationFrame(() => {
      const el = _marker.getElement();
      if (el) _attachHover(el);
    });
  }

  // ─── HAND ROTATION ─────────────────────────────────────────
  function _rotateLine(el, deg) {
    el.setAttribute('transform', `rotate(${deg}, 50, 50)`);
  }

  function _setHandAngle(deg) {
    document.querySelectorAll('.tum-clock-wrap').forEach(wrap => {
      const hEl = wrap.querySelector('.wc-hour');
      if (hEl) _rotateLine(hEl, deg);
    });
  }

  // ─── FILL + HAND TRANSITION ANIMATION ──────────────────────
  // Posisi jarum akumulatif — tidak reset, lanjut dari posisi terakhir
  let _currentHandDeg = 0;

  function _animateTransition(entering, onDone) {
    if (_animFrame) cancelAnimationFrame(_animFrame);

    _animating = true;

    const startProgress = _fillProgress;
    const endProgress   = entering ? 0.0 : 1.0;
    const startTime     = performance.now();

    // Arah: masuk = terbalik (CCW = negatif), keluar = normal (CW = positif)
    const direction = entering ? -1 : 1;

    // Minimum 1 putaran penuh + random 0–2 putaran extra
    const extraRounds = Math.floor(Math.random() * 3);
    const totalDeg    = direction * (360 + extraRounds * 360);
    const startDeg    = _currentHandDeg;

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function tick(now) {
      const elapsed = now - startTime;
      const rawT    = Math.min(elapsed / ANIM_DURATION, 1);
      const t       = easeInOut(rawT);

      // Update fill arc
      _fillProgress = startProgress + (endProgress - startProgress) * t;
      document.querySelectorAll('.wc-arc-fill').forEach(arc => {
        arc.setAttribute('stroke-dashoffset', 176 * (1 - _fillProgress));
      });

      // Jarum berputar terus dari posisi terakhir
      _currentHandDeg = startDeg + totalDeg * t;
      _setHandAngle(_currentHandDeg);

      if (rawT < 1) {
        _animFrame = requestAnimationFrame(tick);
      } else {
        _fillProgress   = endProgress;
        _currentHandDeg = startDeg + totalDeg;
        _animating      = false;
        _animFrame      = null;
        if (onDone) onDone();
      }
    }

    _animFrame = requestAnimationFrame(tick);
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
    if (_animating) return;

    if (typeof UndergroundManager === 'undefined') {
      console.warn('[TUM] UndergroundManager not found');
      return;
    }

    if (_active) {
      _active = false;
      _refreshIcon();

      _animateTransition(false, () => {
        UndergroundManager.setActiveFloor('surface', true);
        _pulseMarker(false);
        _showNotif(false);
      });

    } else {
      _active = true;
      _ensureTimeFloor();
      _refreshIcon();

      _animateTransition(true, () => {
        UndergroundManager.setActiveFloor(FLOOR_ID, true);
        _pulseMarker(true);
        _showNotif(true);
      });
    }
  }

  function _ensureTimeFloor() {
    const existing = UndergroundManager.floors.find(f => f.id === FLOOR_ID);
    if (existing) return;

    UndergroundManager.floors.push({
      id:          FLOOR_ID,
      name:        FLOOR_NAME,
      icon:        `${ICON_BASE_URL}layericon.png`,
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

    _fillProgress = _active ? 0.0 : 1.0;

    _marker = L.marker([COORD.lat, COORD.lng], {
      icon:         _buildIcon(_active, _fillProgress),
      interactive:  true,
      zIndexOffset: 9000,
      pane:         'markerPane'
    });

    _marker.bindTooltip(_buildTooltip());
    _marker.on('click', () => _toggleTimeUnderground());
    _marker.addTo(_map);

    requestAnimationFrame(() => {
      const el = _marker.getElement();
      if (el) _attachHover(el);
    });

    _visible = true;
  }

  function _hide() {
    if (!_visible || !_marker) return;

    if (_animFrame) {
      cancelAnimationFrame(_animFrame);
      _animFrame = null;
      _animating = false;
    }

    if (_map && _map.hasLayer(_marker)) {
      _map.removeLayer(_marker);
    }
    _marker  = null;
    _visible = false;

    if (_active) {
      _active       = false;
      _fillProgress = 1.0;
      if (typeof UndergroundManager !== 'undefined') {
        UndergroundManager.setActiveFloor('surface', false);
      }
    }
  }

  // ─── PUBLIC API ────────────────────────────────────────────
  return {

    init(mapInstance) {
      _map = mapInstance;

      const preset = (typeof getCurrentMapPreset === 'function')
        ? getCurrentMapPreset()
        : 'main';

      if (preset === 'main') _show();
    },

    onMapPresetChange(preset) {
      if (preset === 'main') {
        _show();
      } else {
        _hide();
      }
    },

    show: _show,
    hide: _hide,

    get isVisible()   { return _visible; },
    get isActive()    { return _active; },
    get isAnimating() { return _animating; },

    FLOOR_ID,
    FLOOR_NAME,
  };

})();

// ─── GLOBAL EXPORT ─────────────────────────────────────────────
window.TimeUndergroundMarker = TimeUndergroundMarker;


// ─── CSS ───────────────────────────────────────────────────────
(function injectTUMStyles() {
  if (document.getElementById('tum-styles')) return;

  const style = document.createElement('style');
  style.id = 'tum-styles';
  style.textContent = `
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
    .tum-marker-icon {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);
})();