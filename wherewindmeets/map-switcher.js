/**
 * MapSwitcher
 * ─────────────────────────────────────────────
 * Full-screen cinematic carousel to switch between map presets.
 * 
 * SETUP:
 *   1. Include MapSwitcher.css in your page
 *   2. Call MapSwitcher.init(map) after your map is ready
 * 
 * CONFIGURATION:
 *   Edit MAP_SWITCHER_MAPS below to match your presets.
 *   Set 'thumb' to an image URL when ready, or leave '' for text placeholder.
 *
 * DEPENDENCIES:
 *   - ICON_BASE_URL  (global, already in your project)
 *   - switchMapPreset(id)  (global, already in your project)
 *   - getCurrentMapPreset()  (global, already in your project)
 */

// ── Config: edit this to match your MAP_PRESETS ──
const MAP_SWITCHER_MAPS = [
  { id: 'main',         name: 'Jianghu',   thumb: 'https://tiles.bgonegaming.win/wherewindmeet/overlay/Jianghu.png' },
  { id: 'dreamspace',        name: 'Dreamspace',         thumb: 'https://tiles.bgonegaming.win/wherewindmeet/overlay/dreamspace.png' },
  { id: 'hutuo',        name: 'Hutuo',         thumb: 'https://tiles.bgonegaming.win/wherewindmeet/overlay/Hutuo.png' },
  { id: 'royal_palace', name: 'Royal Palace (Beta)',  thumb: 'https://tiles.bgonegaming.win/wherewindmeet/overlay/Royal_Palace.png' },
];

const MapSwitcher = {

  map: null,
  isOpen: false,
  focusedIdx: 0,
  rafId: null,

  // ── Init ──────────────────────────────────────
  init(map) {
    this.map = map;
    this._buildDOM();
    this._bindEvents();
  },

  // ── Build DOM ─────────────────────────────────
  _buildDOM() {
    // ── Toggle button — independent fixed button, di kiri region toggle (desktop) ──
    if (!document.getElementById('mapSwBtn')) {
      const btn = document.createElement('button');
      btn.id        = 'mapSwBtn';
      btn.className = 'region-toggle mapsw-toggle-btn';
      btn.title     = 'Switch Map';
      btn.innerHTML = `<img src="${ICON_BASE_URL}outlander.webp" alt="Map">`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
      document.body.appendChild(btn);
    }

    // ── Overlay ──
    if (document.getElementById('mapSwOverlay')) return; // already built

    const overlay = document.createElement('div');
    overlay.id        = 'mapSwOverlay';
    overlay.className = 'mapsw-overlay';
    overlay.innerHTML = `
      <div class="mapsw-close" id="mapSwClose">✕ Close</div>
      <div class="mapsw-heading">Select Map</div>

      <div class="mapsw-carousel-outer">

        <!-- Arrow left -->
        <button class="mapsw-arrow mapsw-arrow-left" id="mapSwArrowLeft" aria-label="Previous map">
          <span>&#8249;</span>
        </button>

        <div class="mapsw-track" id="mapSwTrack">
          <div class="mapsw-spacer"></div>
          ${MAP_SWITCHER_MAPS.map((m, i) => `
            <div class="mapsw-item" data-map="${m.id}" data-idx="${i}">
              <div class="mapsw-badge">Active</div>
              <div class="mapsw-img-wrap">
                ${m.thumb
                  ? `<img data-src="${m.thumb}" class="mapsw-thumb" alt="${m.name}">`
                  : `<div class="mapsw-thumb-text">${m.name}</div>`
                }
              </div>
              <div class="mapsw-item-name">${m.name}</div>
            </div>
          `).join('')}
          <div class="mapsw-spacer"></div>
        </div>

        <!-- Arrow right -->
        <button class="mapsw-arrow mapsw-arrow-right" id="mapSwArrowRight" aria-label="Next map">
          <span>&#8250;</span>
        </button>

      </div>

      <div class="mapsw-controls">
        <div class="mapsw-label" id="mapSwLabel">—</div>
        <div class="mapsw-dots" id="mapSwDots"></div>
        <button class="mapsw-confirm" id="mapSwConfirm">Switch Map</button>
        <div class="mapsw-hint">Scroll · Arrow keys · Click to switch</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Build dots
    const dotsEl = overlay.querySelector('#mapSwDots');
    MAP_SWITCHER_MAPS.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'mapsw-dot';
      d.addEventListener('click', () => this._scrollToIdx(i));
      dotsEl.appendChild(d);
    });
  },

  // ── Bind Events ───────────────────────────────
  _bindEvents() {
    const overlay   = document.getElementById('mapSwOverlay');
    const track     = document.getElementById('mapSwTrack');
    const closeBtn  = document.getElementById('mapSwClose');
    const confirmBtn= document.getElementById('mapSwConfirm');
    const arrowL    = document.getElementById('mapSwArrowLeft');
    const arrowR    = document.getElementById('mapSwArrowRight');

    closeBtn.addEventListener('click',  () => this.close());
    confirmBtn.addEventListener('click',() => this._confirmMap());

    arrowL.addEventListener('click', () => this._scrollToIdx(Math.max(0, this.focusedIdx - 1)));
    arrowR.addEventListener('click', () => this._scrollToIdx(Math.min(MAP_SWITCHER_MAPS.length - 1, this.focusedIdx + 1)));

    // Backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape')     this.close();
      if (e.key === 'ArrowLeft')  this._scrollToIdx(Math.max(0, this.focusedIdx - 1));
      if (e.key === 'ArrowRight') this._scrollToIdx(Math.min(MAP_SWITCHER_MAPS.length - 1, this.focusedIdx + 1));
      if (e.key === 'Enter')      this._confirmMap();
    });

    // Card click — only fire if user did NOT drag
    this._cardEls().forEach((card, i) => {
      let downX = 0, downY = 0;
      card.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
      card.addEventListener('click', (e) => {
        const dx = Math.abs(e.clientX - downX);
        const dy = Math.abs(e.clientY - downY);
        if (dx > 6 || dy > 6) return; // was a drag, ignore
        if (i === this.focusedIdx) this._confirmMap();
        else this._scrollToIdx(i);
      });
    });

    // ── Mouse drag: hold & drag, snap on release ──
    let isDrag = false, dragX = 0, dragSL = 0, movedPx = 0;
    let mouseVelX = 0, mousePrevX = 0;

    track.addEventListener('mousedown', (e) => {
      isDrag     = true; movedPx = 0;
      dragX      = e.clientX; dragSL = track.scrollLeft;
      mousePrevX = e.clientX; mouseVelX = 0;
      track.style.userSelect = 'none';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDrag) return;
      mouseVelX  = e.clientX - mousePrevX;
      mousePrevX = e.clientX;
      movedPx    = Math.abs(e.clientX - dragX);
      track.scrollLeft = dragSL - (e.clientX - dragX);
    });
    window.addEventListener('mouseup', () => {
      if (!isDrag) return;
      isDrag = false;
      track.style.userSelect = '';
      if (movedPx < 6) return; // was just a click
      this._snapToNearest(mouseVelX);
    });

    // ── Touch: direction-aware, snap on release ──
    let tStartX = 0, tStartY = 0, tSL = 0, tIsHoriz = null;
    let tVelX = 0, tPrevX = 0;

    track.addEventListener('touchstart', (e) => {
      const t  = e.touches[0];
      tStartX  = t.clientX;
      tStartY  = t.clientY;
      tPrevX   = t.clientX;
      tSL      = track.scrollLeft;
      tIsHoriz = null;
      tVelX    = 0;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      const t  = e.touches[0];
      const dx = t.clientX - tStartX;
      const dy = t.clientY - tStartY;
      if (tIsHoriz === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        tIsHoriz = Math.abs(dx) > Math.abs(dy) * 1.3;
      }
      if (!tIsHoriz) return;
      e.preventDefault();
      tVelX  = t.clientX - tPrevX;
      tPrevX = t.clientX;
      track.scrollLeft = tSL - dx;
    }, { passive: false });

    track.addEventListener('touchend', () => {
      if (!tIsHoriz) return;
      tIsHoriz = null;
      this._snapToNearest(tVelX);
    }, { passive: true });
  },

  // ── Snap to nearest card with smooth scroll ──
  _snapToNearest(velocityX = 0) {
    const track = document.getElementById('mapSwTrack');
    if (!track) return;

    // Project scroll position forward using velocity (momentum feel)
    const MOMENTUM = 4; // multiplier — higher = more momentum influence
    const projected = track.scrollLeft - velocityX * MOMENTUM;
    const trackCx   = projected + track.offsetWidth / 2;

    let bestIdx = 0, bestDist = Infinity;
    this._cardEls().forEach((card, i) => {
      const cx   = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cx - trackCx);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });

    this._scrollToIdx(bestIdx); // smooth scroll via scrollTo behavior:'smooth'
  },

  // ── RAF loop: real-time scale ─────────────────
  _startLoop() {
    const loop = () => {
      this._updateScales();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  },
  _stopLoop() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  },

  _updateScales() {
    const track  = document.getElementById('mapSwTrack');
    if (!track) return;
    const trackCx = track.scrollLeft + track.offsetWidth / 2;
    const halfW   = track.offsetWidth / 2;
    let bestDist  = Infinity, bestIdx = 0;

    this._cardEls().forEach((card, i) => {
      const cx   = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cx - trackCx);
      const ratio= Math.max(0, 1 - dist / halfW);

      const s = 0.68 + ratio * 0.32;
      const o = 0.30 + ratio * 0.70;

      card.style.transform = `scale(${s.toFixed(3)}) translateZ(0)`;
      card.style.opacity   = o.toFixed(3);

      const r = Math.round(122 + ratio * (243 - 122));
      const g = Math.round( 90 + ratio * (213 -  90));
      const b = Math.round( 40 + ratio * (155 -  40));
      const nameEl = card.querySelector('.mapsw-item-name');
      if (nameEl) nameEl.style.color = `rgb(${r},${g},${b})`;

      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });

    if (bestIdx !== this.focusedIdx) {
      this.focusedIdx = bestIdx;
      this._updateFocusUI();
    }

    // Arrow visibility
    const arrowL = document.getElementById('mapSwArrowLeft');
    const arrowR = document.getElementById('mapSwArrowRight');
    if (arrowL) arrowL.classList.toggle('hidden', this.focusedIdx === 0);
    if (arrowR) arrowR.classList.toggle('hidden', this.focusedIdx === MAP_SWITCHER_MAPS.length - 1);
  },

  _updateFocusUI() {
    const map    = MAP_SWITCHER_MAPS[this.focusedIdx];
    const label  = document.getElementById('mapSwLabel');
    const confirm= document.getElementById('mapSwConfirm');
    const active = typeof getCurrentMapPreset === 'function' ? getCurrentMapPreset() : '';

    if (label)  label.textContent = map.name;
    if (confirm) {
      const isCurrent = map.id === active;
      confirm.classList.toggle('is-active-map', isCurrent);
      confirm.textContent = isCurrent ? 'Current Map' : `Switch to ${map.name}`;
    }

    document.querySelectorAll('#mapSwDots .mapsw-dot')
      .forEach((d, i) => d.classList.toggle('active', i === this.focusedIdx));
  },

  _scrollToIdx(idx, behavior = 'smooth') {
    const track = document.getElementById('mapSwTrack');
    const cards = this._cardEls();
    if (!track || !cards[idx]) return;
    const cx = cards[idx].offsetLeft + cards[idx].offsetWidth / 2;
    track.scrollTo({ left: cx - track.offsetWidth / 2, behavior });
  },

  _cardEls() {
    return [...(document.querySelectorAll('#mapSwTrack .mapsw-item') || [])];
  },

  // ── Confirm switch ────────────────────────────
  _confirmMap() {
    const map    = MAP_SWITCHER_MAPS[this.focusedIdx];
    const active = typeof getCurrentMapPreset === 'function' ? getCurrentMapPreset() : '';
    if (map.id === active) return;

    this._cardEls().forEach((c, i) => c.classList.toggle('selected', i === this.focusedIdx));
    this.close();

    if (typeof switchMapPreset === 'function') {
      switchMapPreset(map.id, true);
    }
  },

  // ── Lazy-load thumbnails saat panel dibuka pertama kali ──
  _thumbsLoaded: false,
  _loadThumbs() {
    if (this._thumbsLoaded) return;
    this._thumbsLoaded = true;
    document.querySelectorAll('#mapSwTrack .mapsw-thumb[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  },

  // ── Open / Close ──────────────────────────────
  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    const overlay = document.getElementById('mapSwOverlay');
    const btn     = document.getElementById('mapSwBtn');
    if (overlay) overlay.classList.add('visible');
    if (btn)     btn.classList.add('active');
    this._loadThumbs(); // ← load gambar hanya saat panel pertama kali dibuka
    this._startLoop();

    // scroll to current map instantly
    const activeId  = typeof getCurrentMapPreset === 'function' ? getCurrentMapPreset() : 'main';
    const activeIdx = MAP_SWITCHER_MAPS.findIndex(m => m.id === activeId);
    const idx       = activeIdx >= 0 ? activeIdx : 0;
    this.focusedIdx = idx;
    this._cardEls().forEach((c, i) => c.classList.toggle('selected', i === idx));
    setTimeout(() => {
      this._scrollToIdx(idx, 'instant');
      this._updateFocusUI();
    }, 20);
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('mapSwOverlay');
    const btn     = document.getElementById('mapSwBtn');
    if (overlay) overlay.classList.remove('visible');
    if (btn)     btn.classList.remove('active');
    this._stopLoop();
  },
};

window.MapSwitcher = MapSwitcher;