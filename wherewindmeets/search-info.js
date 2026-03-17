/**
 * SEARCH INFO — Carousel panel
 * Menampilkan 4 panel toggle (Mystic, InnerWays, Knowledge, Book)
 * sebagai card carousel bergaya map-switcher.
 * Muncul sebagai overlay saat tombol Search Info ditekan.
 */

const SEARCH_INFO_PANELS = [
    {
    id:    'knowledge',
    name:  'Wander Tales',
    thumb: '',
    iconKey: 'knoweverything.webp',
    action: () => { if (window.KnowledgePanel) window.KnowledgePanel.toggle(); }
  },
  {
    id:    'tales',
    name:  'Tales & Echoes',
    thumb: '',
    iconKey: 'lightanddarkstory.webp',
    action: () => { if (window.TalesEchoesPanel) window.TalesEchoesPanel.toggle(); }
  },
  {
    id:    'book',
    name:  'Anecdote',
    thumb: '',
    iconKey: 'book.webp',
    action: () => { if (window.BookPanel) window.BookPanel.toggle(); }
  },
  {
    id:    'mystic',
    name:  'Mystic Skills',
    thumb: '', // akan diisi dari IconManager setelah init
    iconKey: 'tehnik.webp',
    action: () => { if (window.MysticSkillPanel) window.MysticSkillPanel.openPanel(); }
  },
  {
    id:    'innerways',
    name:  'Inner Ways',
    thumb: '',
    iconKey: 'innerway.webp',
    action: () => { if (window.InnerWaysPanel) window.InnerWaysPanel.openPanel(); }
  },
  
];

const SearchInfoButton = {
  btn:        null,
  overlay:    null,
  isOpen:     false,
  focusedIdx: 0,
  rafId:      null,

  init() {
    // Resolve thumb dari IconManager kalau tersedia
    SEARCH_INFO_PANELS.forEach(p => {
      if (p.iconKey && window.IconManager) {
        p.thumb = window.IconManager.ICON_CONFIG.baseIcon.replace('default.png', p.iconKey);
      }
    });

    this._buildDOM();
    this._bindEvents();
    console.log('✅ Search Info initialized');
  },

  _buildDOM() {
    // ── Toggle button ──
    const btn = document.createElement('button');
    btn.id        = 'searchInfoBtn';
    btn.title     = 'Search Info';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
           stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <line x1="16.5" y1="16.5" x2="22" y2="22"/>
      </svg>`;
    document.body.appendChild(btn);
    this.btn = btn;

    // ── Overlay ──
    const overlay = document.createElement('div');
    overlay.id        = 'searchInfoOverlay';
    overlay.innerHTML = `
      <div class="si-close" id="siClose">✕ Close</div>
      <div class="si-heading">Search Info</div>

      <div class="si-carousel-outer">

        <button class="si-arrow si-arrow-left hidden" id="siArrowLeft" aria-label="Previous">
          <span>&#8249;</span>
        </button>

        <div class="si-track" id="siTrack">
          <div class="si-spacer"></div>
          ${SEARCH_INFO_PANELS.map((p, i) => `
            <div class="si-item" data-id="${p.id}" data-idx="${i}">
              <div class="si-img-wrap">
                ${p.thumb
                  ? `<img src="${p.thumb}" class="si-thumb" alt="${p.name}">`
                  : `<div class="si-thumb-text">${p.name}</div>`}
              </div>
              <div class="si-item-name">${p.name}</div>
            </div>
          `).join('')}
          <div class="si-spacer"></div>
        </div>

        <button class="si-arrow si-arrow-right hidden" id="siArrowRight" aria-label="Next">
          <span>&#8250;</span>
        </button>

      </div>

      <div class="si-hint">Scroll · Swipe · Click to open</div>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
  },

  _bindEvents() {
    const overlay  = this.overlay;
    const track    = overlay.querySelector('#siTrack');
    const closeBtn = overlay.querySelector('#siClose');
    const arrowL   = overlay.querySelector('#siArrowLeft');
    const arrowR   = overlay.querySelector('#siArrowRight');

    // Toggle btn
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Close
    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Arrows
    arrowL.addEventListener('click', () =>
      this._scrollToIdx(Math.max(0, this.focusedIdx - 1)));
    arrowR.addEventListener('click', () =>
      this._scrollToIdx(Math.min(SEARCH_INFO_PANELS.length - 1, this.focusedIdx + 1)));

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape')     this.close();
      if (e.key === 'ArrowLeft')  this._scrollToIdx(Math.max(0, this.focusedIdx - 1));
      if (e.key === 'ArrowRight') this._scrollToIdx(Math.min(SEARCH_INFO_PANELS.length - 1, this.focusedIdx + 1));
      if (e.key === 'Enter')      this._activateCard(this.focusedIdx);
    });

    // Card click — only if not a drag
    this._cardEls().forEach((card, i) => {
      let downX = 0, downY = 0;
      card.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
      card.addEventListener('click', (e) => {
        const dx = Math.abs(e.clientX - downX);
        const dy = Math.abs(e.clientY - downY);
        if (dx > 6 || dy > 6) return;
        if (i === this.focusedIdx) this._activateCard(i);
        else this._scrollToIdx(i);
      });
    });

    // Mouse drag
    let isDrag = false, dragX = 0, dragSL = 0, movedPx = 0;
    let mouseVelX = 0, mousePrevX = 0;

    track.addEventListener('mousedown', (e) => {
      isDrag = true; movedPx = 0;
      dragX = e.clientX; dragSL = track.scrollLeft;
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
      if (movedPx < 6) return;
      this._snapToNearest(mouseVelX);
    });

    // Touch
    let tStartX = 0, tStartY = 0, tSL = 0, tIsHoriz = null;
    let tVelX = 0, tPrevX = 0;

    track.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      tStartX = t.clientX; tStartY = t.clientY;
      tPrevX = t.clientX; tSL = track.scrollLeft;
      tIsHoriz = null; tVelX = 0;
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

  _snapToNearest(velocityX = 0) {
    const track     = this.overlay.querySelector('#siTrack');
    const MOMENTUM  = 4;
    const projected = track.scrollLeft - velocityX * MOMENTUM;
    const trackCx   = projected + track.offsetWidth / 2;

    let bestIdx = 0, bestDist = Infinity;
    this._cardEls().forEach((card, i) => {
      const cx   = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cx - trackCx);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    this._scrollToIdx(bestIdx);
  },

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
    const track   = this.overlay.querySelector('#siTrack');
    if (!track) return;
    const trackCx = track.scrollLeft + track.offsetWidth / 2;
    const halfW   = track.offsetWidth / 2;
    let bestDist  = Infinity, bestIdx = 0;

    this._cardEls().forEach((card, i) => {
      const cx    = card.offsetLeft + card.offsetWidth / 2;
      const dist  = Math.abs(cx - trackCx);
      const ratio = Math.max(0, 1 - dist / halfW);

      const s = 0.68 + ratio * 0.32;
      const o = 0.30 + ratio * 0.70;
      card.style.transform = `scale(${s.toFixed(3)}) translateZ(0)`;
      card.style.opacity   = o.toFixed(3);

      const r = Math.round(122 + ratio * (243 - 122));
      const g = Math.round( 90 + ratio * (213 -  90));
      const b = Math.round( 40 + ratio * (155 -  40));
      const nameEl = card.querySelector('.si-item-name');
      if (nameEl) nameEl.style.color = `rgb(${r},${g},${b})`;

      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });

    if (bestIdx !== this.focusedIdx) {
      this.focusedIdx = bestIdx;
      this._updateArrows();
    }
  },

  _updateArrows() {
    const arrowL = this.overlay.querySelector('#siArrowLeft');
    const arrowR = this.overlay.querySelector('#siArrowRight');
    if (arrowL) arrowL.classList.toggle('hidden', this.focusedIdx === 0);
    if (arrowR) arrowR.classList.toggle('hidden', this.focusedIdx === SEARCH_INFO_PANELS.length - 1);
  },

  _scrollToIdx(idx, behavior = 'smooth') {
    const track = this.overlay.querySelector('#siTrack');
    const cards = this._cardEls();
    if (!track || !cards[idx]) return;
    const cx = cards[idx].offsetLeft + cards[idx].offsetWidth / 2;
    track.scrollTo({ left: cx - track.offsetWidth / 2, behavior });
  },

  _cardEls() {
    return [...this.overlay.querySelectorAll('#siTrack .si-item')];
  },

  _activateCard(idx) {
    const panel = SEARCH_INFO_PANELS[idx];
    if (!panel) return;
    this.close();
    setTimeout(() => panel.action(), 120); // beri waktu overlay menutup
  },

  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    this.overlay.classList.add('visible');
    this.btn.classList.add('active');
    this._startLoop();
    setTimeout(() => {
      this._scrollToIdx(0, 'instant');
      this._updateArrows();
    }, 20);
  },

  close() {
    this.isOpen = false;
    this.overlay.classList.remove('visible');
    this.btn.classList.remove('active');
    this._stopLoop();
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const tryInit = () => window.IconManager
      ? SearchInfoButton.init()
      : setTimeout(tryInit, 200);
    tryInit();
  });
} else {
  const tryInit = () => window.IconManager
    ? SearchInfoButton.init()
    : setTimeout(tryInit, 200);
  tryInit();
}

window.SearchInfoButton = SearchInfoButton;