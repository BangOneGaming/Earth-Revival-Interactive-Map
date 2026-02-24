/**
 * MapTransition.js
 * Cinematic smoke transition for map switching.
 *
 * USAGE:
 *   MapTransition.play(mapId, callback)
 *   - mapId    : key from MAP_SWITCHER_MAPS / MAP_PRESETS
 *   - callback : fires at peak coverage (~600ms) — do tile switch here
 *
 * INTEGRATION (map-init.js):
 *   Wrap switchMapPreset body in MapTransition.play(type, () => { ...switch... })
 *
 * Add display name for each map in NAMES below.
 */

const MapTransition = {
  _playing: false,
  _smoke:   null,

  NAMES: {
    main:         'Jianghua',
    hutuo:        'Hutuo',
    royal_palace: 'Royal Palace (Beta)',
  },

  // ── Init smoke system (lazy, once) ──
  _initSmoke() {
    if (this._smoke) return;
    const canvas = document.getElementById('mtrCanvas');
    if (!canvas) return;
    this._smoke = new SmokeSystem(canvas);
    window.addEventListener('resize', () => this._smoke?.resize());
  },

// ── Main play ──
play(mapId, callback) {
  if (this._playing) { callback?.(); return; }
  this._playing = true;

  this._ensureDOM();
  this._initSmoke();

  const overlay = document.getElementById('mtrOverlay');
  const content = document.getElementById('mtrContent');
  const nameEl  = document.getElementById('mtrName');

  nameEl.textContent = this.NAMES[mapId] || mapId;

  // Reset
  overlay.classList.remove('mtr-fadeout');
  overlay.style.opacity = '';
  content.classList.remove('mtr-show', 'mtr-hide');

  overlay.classList.add('mtr-active');
  this._smoke.start();

// Switch tiles
setTimeout(() => callback?.(), 700);

// Reveal text + smoke mulai hilang
setTimeout(() => {
  content.classList.add('mtr-show');
  this._smoke.beginFadeOut();
}, 900);

// 🔥 Text hold sedikit lebih singkat
setTimeout(() => {
  content.classList.add('mtr-hide');
  overlay.classList.add('mtr-fadeout');
}, 2800);

// Cleanup
setTimeout(() => {
  overlay.classList.remove('mtr-active', 'mtr-fadeout');
  content.classList.remove('mtr-show', 'mtr-hide');
  this._smoke.stop();
  this._playing = false;
}, 5000);
},

  // ── Build overlay DOM (once) ──
  _ensureDOM() {
    if (document.getElementById('mtrOverlay')) return;

    const el = document.createElement('div');
    el.id        = 'mtrOverlay';
    el.className = 'mtr-overlay';
    el.innerHTML = `
      <canvas id="mtrCanvas"></canvas>
      <div id="mtrContent" class="mtr-content">
        <div class="mtr-orn mtr-orn-top">
          <span class="mtr-line"></span>
          <span class="mtr-diamond">◆</span>
          <span class="mtr-line"></span>
        </div>
        <div id="mtrName" class="mtr-name"></div>
        <div class="mtr-orn mtr-orn-bot">
          <span class="mtr-line"></span>
          <span class="mtr-diamond">◆</span>
          <span class="mtr-line"></span>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  },
};

window.MapTransition = MapTransition;

// ═══════════════════════════════════════════════════════
// SmokeSystem — Canvas particle engine
// ═══════════════════════════════════════════════════════

class SmokeSystem {
  constructor(canvas) {
    this.canvas    = canvas;
    this.ctx       = canvas.getContext('2d');
    this.particles = [];
    this.running   = false;
    this.fadeOut   = false;
    this.globalAlpha = 0;
    this._raf      = null;
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // zone: 'bottom' | 'full' | 'top'
  _spawn(zone = 'bottom') {
    const W = this.canvas.width;
    const H = this.canvas.height;

    let startY;
    if (zone === 'top')      startY = H * (Math.random() * 0.45);
    else if (zone === 'full')startY = H * (0.1 + Math.random() * 0.85);
    else                     startY = H * (0.55 + Math.random() * 0.55);

    return {
      x:    W * (Math.random() * 1.1 - 0.05),
      y:    startY,
      r:    30  + Math.random() * 50,
      maxR: 150 + Math.random() * 220,
      vx:   (Math.random() - 0.5) * 0.5,
      vy:   -(0.3 + Math.random() * 0.7),
      opacity: 0,
      maxOp: 0.12 + Math.random() * 0.15,
      life:    0,
      maxLife: 200 + Math.random() * 140,
      wobble:      Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.014,
      zone,
    };
  }

  start() {
    this.running     = true;
    this.fadeOut     = false;
    this.globalAlpha = 0;
    this.particles   = [];
    this.resize();

    // Seed: bottom risers
    for (let i = 0; i < 35; i++) {
      const p = this._spawn('bottom');
      p.life = Math.random() * p.maxLife * 0.65;
      p.r    = p.r + (p.maxR - p.r) * (p.life / p.maxLife);
      this.particles.push(p);
    }
    // Seed: full spread (mid coverage)
    for (let i = 0; i < 25; i++) {
      const p = this._spawn('full');
      p.life = Math.random() * p.maxLife * 0.5;
      p.r    = p.r + (p.maxR - p.r) * (p.life / p.maxLife);
      this.particles.push(p);
    }
    // Seed: top zone
    for (let i = 0; i < 15; i++) {
      const p = this._spawn('top');
      p.life = Math.random() * p.maxLife * 0.5;
      p.r    = p.r + (p.maxR - p.r) * (p.life / p.maxLife);
      this.particles.push(p);
    }

    this._loop();
  }

  beginFadeOut() { this.fadeOut = true; }

  stop() {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _loop() {
    if (!this.running) return;
    this._raf = requestAnimationFrame(() => this._loop());
    this._update();
    this._draw();
  }

  _update() {
    // Master alpha
    if (!this.fadeOut) {
      this.globalAlpha = Math.min(0.75, this.globalAlpha + 0.04);
    } else {
      this.globalAlpha = Math.max(0, this.globalAlpha - 0.022);
    }

    // Spawn new
    if (!this.fadeOut && this.particles.length < 160) {
      if (Math.random() < 0.7) {
        const roll = Math.random();
        const zone = roll < 0.45 ? 'bottom' : roll < 0.75 ? 'full' : 'top';
        this.particles.push(this._spawn(zone));
      }
    }

    this.particles = this.particles.filter(p => {
      p.life++;
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.3;
      p.y += p.vy;
      p.r  = Math.min(p.maxR, p.r + 0.6 + Math.random() * 0.4);

      const progress = p.life / p.maxLife;
      if      (progress < 0.20) p.opacity = (progress / 0.20) * p.maxOp;
      else if (progress < 0.65) p.opacity = p.maxOp;
      else                      p.opacity = p.maxOp * (1 - (progress - 0.65) / 0.35);

      return p.life < p.maxLife && p.y + p.r > -50;
    });
  }

  _draw() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = this.globalAlpha;

    this.particles.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0,    `rgba(225,217,205, ${p.opacity})`);
      g.addColorStop(0.4,  `rgba(205,197,185, ${p.opacity * 0.7})`);
      g.addColorStop(0.75, `rgba(185,177,165, ${p.opacity * 0.3})`);
      g.addColorStop(1,    `rgba(165,157,145, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    ctx.restore();
  }
}