/**
 * PiP Map - Picture-in-Picture floating map window
 * Menggunakan Document Picture-in-Picture API (Chrome 116+ / Edge 116+)
 * Mode: iframe — load web asli di dalam PiP window
 */

const PipMap = (function () {
  'use strict';

  let pipWindow = null;
  let btnToggle = null;

  function isSupported() {
    return 'documentPictureInPicture' in window;
  }

  // ── Tombol toggle ──────────────────────────────────────────────
  function _createToggleBtn() {
    if (document.getElementById('pipMapBtn')) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    btnToggle = document.createElement('button');
    btnToggle.id        = 'pipMapBtn';
    btnToggle.className = 'pip-map-btn';
    btnToggle.title     = 'Floating Window';
    btnToggle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <rect x="12" y="10" width="9" height="7" rx="1" fill="currentColor" opacity="0.4"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span>Floating Window</span>
    `;
    btnToggle.addEventListener('click', toggle);
    document.body.appendChild(btnToggle);
  }

  // ── Buka PiP ──────────────────────────────────────────────────
  async function open() {
    if (!isSupported()) {
      alert('Browser kamu tidak support Picture-in-Picture.\nGunakan Chrome 116+ atau Edge 116+.');
      return;
    }
    if (pipWindow && !pipWindow.closed) { pipWindow.focus(); return; }

    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 640, height: 420,
        disallowReturnToOpener: false,
      });

      pipWindow.addEventListener('pagehide', _cleanup);

      // Style minimal
      const style = pipWindow.document.createElement('style');
      style.textContent = `
        body, html { margin: 0; padding: 0; overflow: hidden; }
        iframe { border: none; width: 100svw; height: 100svh; display: block; }
      `;
      pipWindow.document.head.appendChild(style);

      // iframe ke web asli — tambah ?pip=1 untuk skip preload
      const url = new URL(window.location.href);
      url.searchParams.set('pip', '1');
      const iframe = pipWindow.document.createElement('iframe');
      iframe.src = url.toString();
      iframe.allow = 'same-origin';
      pipWindow.document.body.appendChild(iframe);

      if (btnToggle) btnToggle.classList.add('active');
      console.log('✅ PiP Map opened (iframe mode)');

    } catch (e) {
      console.error('❌ PiP Map failed:', e);
    }
  }

  function close() {
    if (pipWindow && !pipWindow.closed) pipWindow.close();
    _cleanup();
  }

  function _cleanup() {
    pipWindow = null;
    if (btnToggle) btnToggle.classList.remove('active');
  }

  function toggle() {
    pipWindow && !pipWindow.closed ? close() : open();
  }

  function init() {
    if (!isSupported()) {
      console.warn('⚠️ PiP API not supported');
      return;
    }
    if (!window.matchMedia('(max-width: 768px)').matches) _createToggleBtn();
    console.log('✅ PipMap initialized');
  }

  return { init, open, close, toggle, isSupported };

})();

window.PipMap = PipMap;