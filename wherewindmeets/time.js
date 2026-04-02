/**
 * time-underground-marker.js
 *
 * Marker peta → gambar reverse.webp (no background, bulat)
 * Klik → overlay jam fullscreen muncul → underground diganti di balik overlay
 *
 * MARKER:
 *  - Segitiga terbalik PUTIH di ATAS gambar, bounce naik-turun
 *  - Glow putih soft berkedip (filter drop-shadow pada img, bukan div kotak)
 *  - Ukuran 2x: 104px desktop, 64px mobile
 *  - Tidak ada tooltip
 *
 * OVERLAY:
 *  - Background flicker gelap cepat (efek waktu)
 *  - Jarum digerakkan JS, berputar terus selama overlay hidup
 *  - Arc fill: JS RAF dari 0 → penuh (70% durasi), lalu TAHAN PENUH sampai fade-out
 *  - Underground diganti ~400ms setelah overlay solid (tersembunyi di balik overlay)
 */

const TimeUndergroundMarker = (() => {

  // ─── CONFIG ────────────────────────────────────────────────
  const COORD      = { lat: 58.51364747163952, lng: 49.34347993854442 };
  const FLOOR_ID   = '8';
  const FLOOR_NAME = 'Time';

  const ICON_BASE_URL = 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/';
  const ICON_IMG      = ICON_BASE_URL + 'reverse.webp';

  const SIZE_DESKTOP     = 104;
  const SIZE_MOBILE      = 64;
  const OVERLAY_DURATION = 3200; // ms total overlay tampil

  // ─── STATE ─────────────────────────────────────────────────
  let _map       = null;
  let _marker    = null;
  let _visible   = false;
  let _active    = false;
  let _animating = false;

  // ─── STYLES ────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('tum-all-styles')) return;
    const s = document.createElement('style');
    s.id = 'tum-all-styles';
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');

      /* ── MARKER ─────────────────────────────── */
      .tum-marker-icon {
        overflow: visible !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      .tum-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        position: relative;
      }

      /* Segitiga terbalik PUTIH di atas gambar — diperbesar, glow hitam */
      .tum-arrow {
        width: 0;
        height: 0;
        border-left:  13px solid transparent;
        border-right: 13px solid transparent;
        border-bottom: 0;
        border-top: 18px solid rgba(255,255,255,0.95);
        margin-bottom: 0;
        filter:
          drop-shadow(0 0 4px rgba(255,215,0,0.9))
          drop-shadow(0 0 10px rgba(255,180,0,0.7))
          drop-shadow(0 0 20px rgba(200,130,0,0.5));
        animation: tumBounce 1.5s ease-in-out infinite;
      }
      @keyframes tumBounce {
        0%,100% { transform: translateY(0);    opacity: 0.7; }
        50%      { transform: translateY(-8px); opacity: 1;   }
      }

      /* Gambar — glow hitam soft berkedip */
      .tum-img {
        display: block;
        pointer-events: none;
        position: relative;
        transition: filter .3s ease, transform .3s ease;
        animation: tumImgGlow 2.2s ease-in-out infinite;
      }
      @keyframes tumImgGlow {
        0%,100% {
          filter:
            drop-shadow(0 0  6px rgba(255,215,0,0.40))
            drop-shadow(0 0 14px rgba(255,180,0,0.20));
        }
        50% {
          filter:
            drop-shadow(0 0 12px rgba(255,215,0,0.90))
            drop-shadow(0 0 28px rgba(255,180,0,0.60))
            drop-shadow(0 0 48px rgba(200,130,0,0.35));
        }
      }

      /* ── OVERLAY ─────────────────────────────── */
      #tum-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Cinzel', serif;
        background: #060408;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
        overflow: hidden;
      }
      #tum-overlay.tum-ov-on {
        opacity: 1;
        pointer-events: all;
        animation: tumFlicker 0.2s ease-in-out infinite alternate;
      }
      @keyframes tumFlicker {
        0%   { background: #060408; }
        35%  { background: #0c0812; }
        65%  { background: #08050e; }
        100% { background: #100d18; }
      }

      #tum-ov-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }
      .tum-ov-p {
        position: absolute;
        background: #fff;
        border-radius: 50%;
        animation: tumDrift linear infinite;
        opacity: 0;
      }
      @keyframes tumDrift {
        0%   { opacity: 0;    transform: translateY(0)      scale(1);   }
        10%  { opacity: 0.55; }
        90%  { opacity: 0.25; }
        100% { opacity: 0;    transform: translateY(-120vh) scale(0.5); }
      }

      #tum-ov-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .tum-ov-top {
        color: rgba(255,255,255,0.32);
        font-size: 10px;
        letter-spacing: 6px;
        text-transform: uppercase;
      }

      #tum-ov-svg-box {
        position: relative;
      }
      #tum-ov-svg-box svg {
        width: 280px;
        height: 280px;
        overflow: visible;
        display: block;
      }

      .tum-ov-ring-p {
        animation: tumRingPulse 3s ease-in-out infinite;
      }
      @keyframes tumRingPulse {
        0%,100% { opacity: 0.13; }
        50%     { opacity: 0.42; }
      }

      .tum-ov-arc-track {
        fill: none;
        stroke: rgba(255,255,255,0.12);
        stroke-width: 7;
        stroke-linecap: round;
      }

      /*
       * Arc fill — TIDAK ada animation CSS di sini.
       * stroke-dashoffset dikendalikan penuh oleh JS RAF.
       * stroke-dasharray di-set via JS juga agar sesuai panjang path aktual.
       */
      .tum-ov-arc-fill {
        fill: none;
        stroke: #ffffff;
        stroke-width: 7;
        stroke-linecap: round;
      }

      .tum-ov-hand {
        transform-origin: 130px 150px;
      }

      .tum-ov-orn {
        transform-origin: 130px 150px;
        animation: tumOrnSpin 14s linear infinite;
      }
      @keyframes tumOrnSpin {
        to { transform: rotate(360deg); }
      }

      .tum-ov-pct {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -18%);
        color: rgba(255,255,255,0.55);
        font-size: 11px;
        letter-spacing: 2px;
        pointer-events: none;
      }

      .tum-ov-bottom {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }
      .tum-ov-title {
        color: rgba(255,255,255,0.72);
        font-size: 13px;
        letter-spacing: 8px;
        text-transform: uppercase;
      }
      .tum-ov-dots {
        color: rgba(255,255,255,0.18);
        font-size: 9px;
        letter-spacing: 4px;
      }
    `;
    document.head.appendChild(s);
  }

  // ─── OVERLAY HTML ──────────────────────────────────────────
  function _buildOverlayHTML(entering) {
    const title = entering ? 'Entering Realm' : 'Returning';
    return `
    <div id="tum-ov-bg"></div>
    <div id="tum-ov-wrap">
      <div class="tum-ov-top">Time Realm</div>
      <div id="tum-ov-svg-box">
        <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="tumNeon" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3"  result="b1"/>
              <feGaussianBlur stdDeviation="8"  result="b2"/>
              <feGaussianBlur stdDeviation="15" result="b3"/>
              <feMerge>
                <feMergeNode in="b3"/>
                <feMergeNode in="b2"/>
                <feMergeNode in="b1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="tumGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="tumHandF" x="-80%" y="-15%" width="260%" height="130%">
              <feGaussianBlur stdDeviation="2.5" result="b1"/>
              <feGaussianBlur stdDeviation="6"   result="b2"/>
              <feMerge>
                <feMergeNode in="b2"/>
                <feMergeNode in="b1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="tumBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#1a0e1a" stop-opacity="0.75"/>
              <stop offset="100%" stop-color="#060408" stop-opacity="0.25"/>
            </radialGradient>
          </defs>

          <circle cx="130" cy="150" r="79" fill="url(#tumBg)"/>

          <circle class="tum-ov-ring-p" cx="130" cy="150" r="80"
            fill="none" stroke="white" stroke-width="16"
            filter="url(#tumGlow)" opacity="0.15"/>

          <circle cx="130" cy="150" r="80"
            fill="none" stroke="white" stroke-width="1.4"
            filter="url(#tumGlow)" opacity="0.82"/>

          <g class="tum-ov-orn">
            <polygon points="130,57  132,61  130,65  128,61" fill="white" opacity="0.45"/>
            <polygon points="203,150 207,152 203,154 199,152" fill="white" opacity="0.45"/>
            <polygon points="130,243 132,247 130,251 128,247" fill="white" opacity="0.45"/>
            <polygon points="57,150  61,152  57,154  53,152"  fill="white" opacity="0.45"/>
          </g>

          <g stroke="white" stroke-width="1" stroke-linecap="round" opacity="0.38">
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(0,   130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(30,  130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(60,  130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(90,  130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(120, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(150, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(180, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(210, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(240, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(270, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(300, 130,150)"/>
            <line x1="130" y1="73" x2="130" y2="80" transform="rotate(330, 130,150)"/>
          </g>

          <circle cx="130" cy="150" r="50"
            fill="none" stroke="white" stroke-width="0.7" opacity="0.25"/>

          <g stroke="white" stroke-width="0.6" stroke-linecap="round" opacity="0.18">
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(0,   130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(30,  130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(60,  130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(90,  130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(120, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(150, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(180, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(210, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(240, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(270, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(300, 130,150)"/>
            <line x1="130" y1="103" x2="130" y2="108" transform="rotate(330, 130,150)"/>
          </g>

          <g class="tum-ov-hand" filter="url(#tumHandF)">
            <polygon points="130,24 127.5,150 132.5,150" fill="white" opacity="0.95"/>
            <polygon points="130,167 128.5,150 131.5,150" fill="white" opacity="0.38"/>
          </g>

          <circle cx="130" cy="150" r="5"   fill="white" filter="url(#tumGlow)"/>
          <circle cx="130" cy="150" r="3.5" fill="white"/>
          <circle cx="130" cy="150" r="1.8" fill="#060408"/>

          <!-- Arc track -->
          <path class="tum-ov-arc-track"
            d="M 20,150 A 110,110 0 0,1 240,150"/>

          <!-- Arc fill — stroke-dasharray & stroke-dashoffset di-set JS -->
          <path class="tum-ov-arc-fill"
            id="tum-ov-arc"
            d="M 20,150 A 110,110 0 0,1 240,150"
            filter="url(#tumNeon)"/>
        </svg>
        <div class="tum-ov-pct" id="tum-ov-pct">0%</div>
      </div>
      <div class="tum-ov-bottom">
        <div class="tum-ov-title" id="tum-ov-title">${title}</div>
        <div class="tum-ov-dots">∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙</div>
      </div>
    </div>`;
  }

  // ─── OVERLAY STATE ─────────────────────────────────────────
  let _overlayEl    = null;
  let _overlayTimer = null;
  let _overlayRaf   = null;

  function _killOverlay() {
    if (_overlayTimer) { clearTimeout(_overlayTimer); _overlayTimer = null; }
    if (_overlayRaf)   { cancelAnimationFrame(_overlayRaf); _overlayRaf = null; }
  }

  /**
   * onMidpoint → dipanggil ~420ms setelah overlay solid (underground ganti di sini)
   * onDone     → dipanggil setelah fade-out selesai (update ikon & notif)
   */
  function _showOverlay(entering, onMidpoint, onDone) {
    _injectStyles();
    _killOverlay();

    if (!_overlayEl) {
      _overlayEl = document.createElement('div');
      _overlayEl.id = 'tum-overlay';
      document.body.appendChild(_overlayEl);
    }

    _overlayEl.classList.remove('tum-ov-on');
    _overlayEl.innerHTML = _buildOverlayHTML(entering);

    // Spawn partikel
    const bgEl = _overlayEl.querySelector('#tum-ov-bg');
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'tum-ov-p';
      p.style.left   = (Math.random() * 100) + 'vw';
      p.style.top    = (Math.random() * 100) + 'vh';
      const sz = (Math.random() * 1.8 + 0.4) + 'px';
      p.style.width  = sz;
      p.style.height = sz;
      p.style.animationDuration = (Math.random() * 10 + 7) + 's';
      p.style.animationDelay    = (Math.random() * 6) + 's';
      bgEl.appendChild(p);
    }

    // Referensi elemen animasi
    const handEl  = _overlayEl.querySelector('.tum-ov-hand');
    const arcEl   = _overlayEl.querySelector('#tum-ov-arc');
    const pctEl   = _overlayEl.querySelector('#tum-ov-pct');
    const titleEl = _overlayEl.querySelector('#tum-ov-title');

    // ── Ukur panjang path arc secara aktual ──────────────────
    // Ini penting: getTotalLength() memberi panjang path yang akurat
    // sehingga dasharray/dashoffset benar di semua browser & ukuran layar.
    let ARC_LEN = 345; // fallback
    if (arcEl && arcEl.getTotalLength) {
      try { ARC_LEN = arcEl.getTotalLength(); } catch(e) {}
    }
    // Set dasharray & tentukan titik awal berdasarkan arah:
    //   entering  → kosong dulu (offset = ARC_LEN), lalu isi ke 0
    //   exiting   → penuh dulu  (offset = 0),       lalu kosongkan ke ARC_LEN
    if (arcEl) {
      arcEl.style.strokeDasharray  = ARC_LEN;
      arcEl.style.strokeDashoffset = entering ? ARC_LEN : 0;
    }

    // Fade in (double rAF agar browser sempat render sebelum transisi)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      _overlayEl.classList.add('tum-ov-on');
    }));

    // Midpoint callback — underground ganti di balik overlay
    setTimeout(() => { if (onMidpoint) onMidpoint(); }, 420);

    // ── Konfigurasi animasi ──────────────────────────────────
    const labsE = ['Reverse Time', 'Calibrating', 'Synchronizing', 'Switch Back'];
    const labsX = ['Returning',      'Resetting',   'Synchronizing', 'Switch'];
    const labels  = entering ? labsE : labsX;

    // Arc penuh di 70% dari total durasi, lalu TAHAN sampai fade-out
    const fillDur   = OVERLAY_DURATION * 0.70;
    // Jarum: 1 putaran per 1.5 detik, arah terbalik saat masuk
    const degPerMs  = (entering ? 1 : -1) * (360 / 1500);

    let startTs  = null;
    let prevTs   = null;
    let handDeg  = 0;
    let arcDone  = false;
    let lblIdx   = 0;

    function tick(ts) {
      if (!startTs) { startTs = ts; prevTs = ts; }
      const elapsed = ts - startTs;
      const delta   = ts - prevTs;
      prevTs = ts;

      // ── Jarum: berputar terus selama overlay hidup ─────────
      handDeg += degPerMs * delta;
      if (handEl) handEl.style.transform = `rotate(${handDeg}deg)`;

      // ── Arc fill: isi/kosongkan sekali, lalu tahan ────────
      if (!arcDone) {
        const t    = Math.min(elapsed / fillDur, 1);
        // Easing quad in-out untuk gerakan natural
        const ease = t < 0.5
          ? 2 * t * t
          : -1 + (4 - 2 * t) * t;
        // entering → offset turun dari ARC_LEN ke 0 (makin penuh)
        // exiting  → offset naik dari 0 ke ARC_LEN (makin kosong)
        const offset = entering
          ? ARC_LEN * (1 - ease)   // turun → makin penuh
          : ARC_LEN * ease;        // naik → makin kosong
        if (arcEl) arcEl.style.strokeDashoffset = offset.toFixed(2);
        if (t >= 1) {
          if (arcEl) arcEl.style.strokeDashoffset = entering ? '0' : String(ARC_LEN);
          arcDone = true;
        }
      }

      // ── Counter persen (ikut progres arc, bukan waktu total) ─
      const pctRaw = Math.min(elapsed / fillDur, 1);
      if (pctEl) pctEl.textContent = Math.round(pctRaw * 100) + '%';

      // ── Label bergilir sesuai kuartal progres ─────────────
      const newIdx = Math.min(Math.floor(pctRaw * labels.length), labels.length - 1);
      if (newIdx !== lblIdx) {
        lblIdx = newIdx;
        if (titleEl) titleEl.textContent = labels[lblIdx];
      }

      _overlayRaf = requestAnimationFrame(tick);
    }

    _overlayRaf = requestAnimationFrame(tick);

    // ── Fade out → stop RAF → onDone ──────────────────────
    _overlayTimer = setTimeout(() => {
      _overlayEl.classList.remove('tum-ov-on');
      setTimeout(() => {
        _killOverlay();
        if (onDone) onDone();
      }, 240); // tunggu transisi opacity selesai
    }, OVERLAY_DURATION);
  }

  // ─── ICON BUILDER ──────────────────────────────────────────
  function _buildIcon() {
    const isMob = window.matchMedia('(max-width:768px)').matches;
    const size  = isMob ? SIZE_MOBILE : SIZE_DESKTOP;
    const half  = size / 2;
    const totalH = size + 28; // segitiga(18) + gap(4) + margin(6) + gambar(size)

    return L.divIcon({
      html: `
        <div class="tum-wrap" style="width:${size}px;">
          <div class="tum-arrow"></div>
          <img class="tum-img"
               src="${ICON_IMG}"
               width="${size}" height="${size}"
               draggable="false" alt=""/>
        </div>`,
      iconSize:   [size, totalH],
      iconAnchor: [half, 20 + half],
      className:  'no-default-icon-bg tum-marker-icon'
    });
  }

  function _refreshIcon() {
    if (!_marker) return;
    _marker.setIcon(_buildIcon());
    requestAnimationFrame(() => {
      const el = _marker.getElement();
      if (el) _attachHover(el);
    });
  }

  // ─── HOVER ─────────────────────────────────────────────────
  function _attachHover(markerEl) {
    const img = markerEl.querySelector('.tum-img');
    if (!img) return;
    markerEl.addEventListener('mouseenter', () => {
      img.style.filter    = 'drop-shadow(0 0 16px rgba(255,215,0,0.9)) drop-shadow(0 0 32px rgba(255,180,0,0.6)) brightness(1.1)';
      img.style.transform = 'scale(1.08)';
    });
    markerEl.addEventListener('mouseleave', () => {
      img.style.filter    = '';
      img.style.transform = '';
    });
  }

  // ─── TOGGLE ────────────────────────────────────────────────
  function _toggleTimeUnderground() {
    if (_animating) return;
    if (typeof UndergroundManager === 'undefined') {
      console.warn('[TUM] UndergroundManager not found');
      return;
    }
    _animating = true;

    if (_active) {
      _showOverlay(
        false,
        () => {
          _active = false;
          UndergroundManager.setActiveFloor('surface', true);
        },
        () => {
          _animating = false;
          _refreshIcon();
          _pulseMarker(false);
          _showNotif(false);
        }
      );
    } else {
      _showOverlay(
        true,
        () => {
          _active = true;
          _ensureTimeFloor();
          UndergroundManager.setActiveFloor(FLOOR_ID, true);
        },
        () => {
          _animating = false;
          _refreshIcon();
          _pulseMarker(true);
          _showNotif(true);
        }
      );
    }
  }

  function _ensureTimeFloor() {
    if (!UndergroundManager.floors.find(f => f.id === FLOOR_ID)) {
      UndergroundManager.floors.push({
        id:          FLOOR_ID,
        name:        FLOOR_NAME,
        icon:        ICON_BASE_URL + 'layericon.png',
        description: 'Time Power',
        filterValue: FLOOR_ID,
        brightness:  0.5,
        blur:        1
      });
    }
  }

  // ─── PULSE ─────────────────────────────────────────────────
  function _pulseMarker(entering) {
    if (!_marker) return;
    const el = _marker.getElement();
    if (!el) return;
    const img = el.querySelector('.tum-img');
    if (!img) return;
    img.style.transition = 'transform .15s ease';
    img.style.transform  = 'scale(1.2)';
    img.style.filter     = entering
      ? 'drop-shadow(0 0 24px rgba(255,215,0,0.95)) drop-shadow(0 0 48px rgba(255,180,0,0.6))'
      : 'drop-shadow(0 0 10px rgba(255,215,0,0.5))';
    setTimeout(() => {
      img.style.transform = '';
      img.style.filter    = '';
    }, 380);
  }

  // ─── NOTIF ─────────────────────────────────────────────────
  function _showNotif(entering) {
    const old = document.querySelector('.tum-notif');
    if (old) old.remove();
    const n = document.createElement('div');
    n.className = 'tum-notif';
    n.innerHTML = entering
      ? `<img src="${ICON_IMG}" style="width:20px;height:20px;object-fit:contain;margin-right:7px;"><span>Switching to <strong>Future Time</strong>…</span>`
      : `<img src="${ICON_IMG}" style="width:20px;height:20px;object-fit:contain;margin-right:7px;"><span>Back to <strong>Previous Time</strong></span>`;
    Object.assign(n.style, {
      position:     'fixed',
      bottom:       '90px',
      left:         '50%',
      transform:    'translateX(-50%) translateY(18px)',
      background:   'linear-gradient(135deg,#0e0e14,#1c1a28)',
      border:       '1px solid rgba(255,255,255,0.25)',
      color:        '#ffffffcc',
      padding:      '10px 20px',
      borderRadius: '12px',
      fontSize:     '13px',
      fontWeight:   '600',
      letterSpacing:'0.5px',
      boxShadow:    '0 0 18px rgba(255,255,255,0.1)',
      zIndex:       '99998',
      display:      'flex',
      alignItems:   'center',
      opacity:      '0',
      transition:   'opacity .28s ease, transform .28s ease',
      pointerEvents:'none',
      fontFamily:   'Cinzel,serif',
    });
    document.body.appendChild(n);
    requestAnimationFrame(() => {
      n.style.opacity   = '1';
      n.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      n.style.opacity   = '0';
      n.style.transform = 'translateX(-50%) translateY(18px)';
      setTimeout(() => n.remove(), 300);
    }, 2500);
  }

  // ─── SHOW / HIDE ───────────────────────────────────────────
  function _show() {
    if (_visible || !_map) return;
    _injectStyles();
    _marker = L.marker([COORD.lat, COORD.lng], {
      icon:         _buildIcon(),
      interactive:  true,
      zIndexOffset: 9000,
      pane:         'markerPane'
    });
    _marker.on('click', _toggleTimeUnderground);
    _marker.addTo(_map);
    requestAnimationFrame(() => {
      const el = _marker.getElement();
      if (el) _attachHover(el);
    });
    _visible = true;
  }

  function _hide() {
    if (!_visible || !_marker) return;
    _killOverlay();
    if (_map && _map.hasLayer(_marker)) _map.removeLayer(_marker);
    _marker    = null;
    _visible   = false;
    _animating = false;
    if (_active) {
      _active = false;
      if (typeof UndergroundManager !== 'undefined')
        UndergroundManager.setActiveFloor('surface', false);
    }
  }

  // ─── PUBLIC API ────────────────────────────────────────────
  return {
    init(mapInstance) {
      _map = mapInstance;
      const preset = typeof getCurrentMapPreset === 'function'
        ? getCurrentMapPreset() : 'main';
      if (preset === 'main') _show();
    },
    onMapPresetChange(preset) {
      preset === 'main' ? _show() : _hide();
    },
    show: _show,
    hide: _hide,
    get isVisible()   { return _visible;   },
    get isActive()    { return _active;    },
    get isAnimating() { return _animating; },
    FLOOR_ID,
    FLOOR_NAME,
  };

})();

window.TimeUndergroundMarker = TimeUndergroundMarker;