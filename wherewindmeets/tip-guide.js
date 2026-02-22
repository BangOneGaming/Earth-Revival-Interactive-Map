/**
 * Tip Guide System
 * Onboarding tooltips for first-time users
 * 
 * @author Where Wind Meet Map
 * @version 1.0.0
 */

const TipGuide = (function () {
  'use strict';

  // ==========================================
  // STATE
  // ==========================================

  const STORAGE_KEY = 'wwm_tip_guide_v1.0.1';
  let currentTip = null;
  let backdrop = null;
  let tipEl = null;
  let isActive = false;

  // ==========================================
  // TIPS DEFINITION
  // ==========================================

  /**
   * Each tip:
   *  - id         : unique string
   *  - targetId   : element ID to highlight
   *  - title      : tip heading
   *  - body       : tip description
   *  - position   : 'right' | 'left' | 'top' | 'bottom'
   *  - onShow     : optional fn called when tip is shown
   *  - dismissOn  : 'click-target' | 'click-tip' | 'manual'
   *                 'click-target' → dismiss when user clicks the highlighted element
   */
  const TIPS = [
    {
      id: 'region_toggle',
      targetId: 'regionToggle',
      title: 'Switch Region',
      body: 'Tap here to open the region list and navigate between areas of the map.',
      position: 'right',
      dismissOn: 'click-target'
    }
    // Future tips go here:
    // { id: 'filter_toggle', ... }
  ];

  // ==========================================
  // HELPERS
  // ==========================================

  function getSeenTips() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function markSeen(id) {
    try {
      const seen = getSeenTips();
      if (!seen.includes(id)) {
        seen.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
      }
    } catch {}
  }

  function hasSeenTip(id) {
    return getSeenTips().includes(id);
  }

  // ==========================================
  // POSITION CALCULATION
  // ==========================================

  function calcPosition(targetRect, tipRect, position) {
    const GAP = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top, left;

    switch (position) {
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tipRect.height / 2;
        left = targetRect.right + GAP;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tipRect.height / 2;
        left = targetRect.left - tipRect.width - GAP;
        break;
      case 'bottom':
        top = targetRect.bottom + GAP;
        left = targetRect.left + targetRect.width / 2 - tipRect.width / 2;
        break;
      case 'top':
      default:
        top = targetRect.top - tipRect.height - GAP;
        left = targetRect.left + targetRect.width / 2 - tipRect.width / 2;
        break;
    }

    // Clamp to viewport
    top  = Math.max(8, Math.min(top,  vh - tipRect.height - 8));
    left = Math.max(8, Math.min(left, vw - tipRect.width  - 8));

    return { top, left };
  }

  // ==========================================
  // RENDER
  // ==========================================

  function createBackdrop() {
    backdrop = document.createElement('div');
    backdrop.className = 'tg-backdrop';
    document.body.appendChild(backdrop);
  }

  function removeBackdrop() {
    if (backdrop) {
      backdrop.remove();
      backdrop = null;
    }
  }

  /**
   * Highlight the target element by cutting a "hole" via clip-path
   * using a CSS custom property on the backdrop
   */
  function highlightTarget(rect) {
    if (!backdrop) return;
    const PAD = 8;
    const r = {
      top:    rect.top    - PAD,
      left:   rect.left   - PAD,
      right:  rect.right  + PAD,
      bottom: rect.bottom + PAD
    };

    // Polygon hole: outer rect → inset hole
    const poly = `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%,
      0% ${r.top}px,
      ${r.left}px ${r.top}px,
      ${r.left}px ${r.bottom}px,
      ${r.right}px ${r.bottom}px,
      ${r.right}px ${r.top}px,
      0% ${r.top}px,
      0% 100%
    )`;

    backdrop.style.clipPath = poly;
    backdrop.style.webkitClipPath = poly;
  }

  function createTipElement(tip) {
    tipEl = document.createElement('div');
    tipEl.className = `tg-tip tg-tip--${tip.position}`;
    tipEl.innerHTML = `
      <div class="tg-tip__inner">
        <div class="tg-tip__header">
          <span class="tg-tip__icon">💡</span>
          <span class="tg-tip__title">${tip.title}</span>
          <button class="tg-tip__close" aria-label="Close tip">✕</button>
        </div>
        <p class="tg-tip__body">${tip.body}</p>
        <div class="tg-tip__arrow"></div>
      </div>
    `;
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function positionTip(tip, targetEl) {
    const targetRect = targetEl.getBoundingClientRect();
    const tipRect    = tipEl.getBoundingClientRect();
    const { top, left } = calcPosition(targetRect, tipRect, tip.position);

    tipEl.style.top  = top  + 'px';
    tipEl.style.left = left + 'px';
  }

  // ==========================================
  // SHOW / DISMISS
  // ==========================================

  function showTip(tip) {
    if (isActive) return;

    const targetEl = document.getElementById(tip.targetId);
    if (!targetEl) {
      console.warn(`[TipGuide] Target #${tip.targetId} not found`);
      return;
    }

    isActive = true;
    currentTip = tip;

    // Backdrop
    createBackdrop();
    const rect = targetEl.getBoundingClientRect();
    highlightTarget(rect);

    // Tip bubble
    createTipElement(tip);

    // Position after paint
    requestAnimationFrame(() => {
      positionTip(tip, targetEl);
      tipEl.classList.add('tg-tip--visible');
      backdrop.classList.add('tg-backdrop--visible');
    });

    // ── Close button
    tipEl.querySelector('.tg-tip__close').addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss(tip.id);
    });

    // ── Dismiss on target click
    if (tip.dismissOn === 'click-target') {
      const onTargetClick = () => {
        targetEl.removeEventListener('click', onTargetClick);
        dismiss(tip.id);
      };
      targetEl.addEventListener('click', onTargetClick);
    }

    // ── Reposition on resize / scroll
    const reposition = () => {
      if (!tipEl || !isActive) return;
      const r = targetEl.getBoundingClientRect();
      highlightTarget(r);
      positionTip(tip, targetEl);
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    // Store cleanup refs
    tipEl._cleanup = () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };

    console.log(`[TipGuide] Showing tip: ${tip.id}`);
  }

  function dismiss(id) {
    if (!isActive) return;

    markSeen(id);
    isActive = false;
    currentTip = null;

    // Animate out
    if (tipEl) {
      tipEl.classList.remove('tg-tip--visible');
      tipEl.classList.add('tg-tip--hiding');
      if (tipEl._cleanup) tipEl._cleanup();
      setTimeout(() => {
        if (tipEl) { tipEl.remove(); tipEl = null; }
      }, 300);
    }

    if (backdrop) {
      backdrop.classList.remove('tg-backdrop--visible');
      setTimeout(() => removeBackdrop(), 300);
    }

    console.log(`[TipGuide] Dismissed tip: ${id}`);

    // Show next tip in sequence (if any)
    showNextUnseen();
  }

  function showNextUnseen() {
    const next = TIPS.find(t => !hasSeenTip(t.id));
    if (next) {
      setTimeout(() => showTip(next), 400);
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  /**
   * Start the tip guide from the first unseen tip
   * Call this after patch note closes OR after preload ends
   */
  function start() {
    // Small delay so UI settles
    setTimeout(() => {
      showNextUnseen();
    }, 600);
  }

  /**
   * Reset all seen tips (for testing / dev)
   */
  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    console.log('[TipGuide] All tips reset');
  }

  /**
   * Force show a specific tip by ID (for testing)
   */
  function show(id) {
    const tip = TIPS.find(t => t.id === id);
    if (tip) showTip(tip);
  }

  return { start, reset, show };

})();

window.TipGuide = TipGuide;
console.log('✅ TipGuide loaded');