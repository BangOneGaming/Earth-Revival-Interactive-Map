/**
 * Main application entry point
 * Clean version with integrated cookie consent + Region Manager
 */
(function () {
  'use strict';

  // ============================================
  // ICON MANAGER LOADER (FIXED)
  // ============================================
  function loadIconManager() {
    return new Promise((resolve, reject) => {
      if (window.IconManager && typeof window.initializeIcons === 'function') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'icon-manager.js?v=1.0.0';
      script.defer = true;

      script.onload = () => {
        if (typeof window.initializeIcons === 'function') {
          if (window.IconManager?.hideAllIcons) {
            window.IconManager.hideAllIcons();
          }
          resolve();
        } else {
          reject(new Error('initializeIcons not found'));
        }
      };

      script.onerror = () => reject(new Error('Failed to load icon-manager.js'));
      document.head.appendChild(script);
    });
  }

  // ============================================
  // DEFERRED CSS
  // ============================================
  function loadDeferredCSS() {
    const cssVersion = typeof CSS_VERSION !== 'undefined' ? CSS_VERSION : '1.2.1';

    const cssFiles = [
      'marker-image-handler.css',
      'editing-image-upload.css',
      'knowladgelist.css',
      'mystic-skill-panel.css',
      'innerway.css',
      'patchnote.css',
      'form.css',
      'layer.css',
      'tales-echoes.css',
      'region-management.css',
      'booklist.css',
      'ui.css',
      'login.css',
      'comment.css',
      'profile-container.css',
      'setting.css',
      'donate.css',
      'riddle-search.css',
      'tip-guide.css',
      'map-switcher.css',
      'MapTransition.css',
      'pip-map.css',
      'search-info.css',
      'region.css'
    ];

    cssFiles.forEach(file => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${file}?v=${cssVersion}`;
      document.head.appendChild(link);
    });

    console.log('🎨 Deferred CSS loaded');
  }

  // ============================================
  // PRELOAD UI (CLS SAFE)
  // ============================================
  async function showPreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (!overlay) return;

    const emotions = [
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/impressed.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/cry.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/hehe.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/well.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/thinking.webp'
    ];

    startEmotionFlip(emotions);
    startTextAnimation();
    startLoadingBar();

    await Promise.race([
      preloadImages(emotions),
      new Promise(r => setTimeout(r, 1000))
    ]);
  }

  function hidePreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (!overlay) return;

    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.opacity = '0';

    setTimeout(() => {
      overlay.style.pointerEvents = 'none';
      overlay.style.visibility = 'hidden';
      // ✅ DIHAPUS: showAllIcons() dari sini — sudah dipanggil lebih awal
    }, 300);
  }

  function updateLoadingText(message) {
    const el = document.getElementById('preloadMessage');
    if (!el) return;

    el.style.opacity = '0';

    requestAnimationFrame(() => {
      el.textContent = message;
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = '1';
    });
  }

  // ============================================
  // EMOTION / ANIMATION
  // ============================================
  function preloadImages(urls) {
    return Promise.all(urls.map(src => new Promise(res => {
      const img = new Image();
      img.onload = img.onerror = res;
      img.src = src;
    })));
  }

  function startEmotionFlip(emotions) {
    const el = document.getElementById('preloadEmotionIcon');
    if (!el) return;

    let i = 0;
    el.src = emotions[0];

    const interval = setInterval(() => {
      el.classList.add('flip-animation');
      setTimeout(() => {
        el.classList.remove('flip-animation');
        i = (i + 1) % emotions.length;
        el.src = emotions[i];
      }, 600);
    }, 800);

    setTimeout(() => clearInterval(interval), 5000);
  }

  function startTextAnimation() {
    updateLoadingText('Better Experience With Mobile Desktop mode');
    setTimeout(() => updateLoadingText('You can add new marker in this map'), 2500);
  }

  function startLoadingBar() {
    const bar = document.getElementById('preloadBarFill');
    const pct = document.getElementById('preloadBarPercent');
    if (!bar || !pct) return;

    let p = 0;
    const i = setInterval(() => {
      p += 1;
      bar.style.width = p + '%';
      pct.textContent = p + '%';
      if (p >= 100) clearInterval(i);
    }, 50);
  }

  function simulateFinalLoading() {
    return new Promise(r => setTimeout(r, 5000));
  }

  // ============================================
  // WAIT FOR FUNCTIONS
  // ============================================
  async function waitForFunction(fnName, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (typeof window[fnName] === 'function') return true;
      await new Promise(r => setTimeout(r, 50));
    }
    return false;
  }

  async function waitForUndergroundManager() {
    for (let i = 0; i < 50; i++) {
      if (window.UndergroundManager) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  async function waitForRegionManager() {
    for (let i = 0; i < 50; i++) {
      if (window.RegionManager) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  function waitForProfileReady(retry = 0) {
    if (
      window.ProfileContainer &&
      typeof isLoggedIn === 'function' &&
      isLoggedIn() &&
      typeof getUserProfile === 'function' &&
      getUserProfile()
    ) {
      ProfileContainer.create();
      console.log('✅ ProfileContainer auto-created after reload');
      return;
    }

    if (retry < 20) {
      setTimeout(() => waitForProfileReady(retry + 1), 200);
    }
  }

  // ============================================
  // SHOW ALL UI ELEMENTS
  // ============================================
  function showAllUIElements() {
    console.log('🎨 Showing all UI elements...');

    const styleControl = document.getElementById('ui-visibility-control');
    if (styleControl) {
      styleControl.remove();
    }

    const elements = [
      'leaderboardPanel',
      'leaderboardToggle',
      'filterPanel',
      'filterToggle',
      'notificationIcon',
      'topLoginBtn',
      'undergroundContainer'
    ];

    elements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = '1';
        el.style.visibility = 'visible';

        if (id !== 'undergroundContainer') {
          el.style.pointerEvents = 'auto';
        }
      }
    });

    console.log('✅ All UI elements visible');
  }

  // ============================================
  // MAIN INIT
  // ============================================
  async function initApp() {

    const isPip = new URLSearchParams(window.location.search).get('pip') === '1';
    if (isPip) document.body.classList.add('pip-mode');

    try {
      // ============================================
      // STEP 0: INIT MAP (LCP PRIORITY)
      // ============================================
      const mapReady = await waitForFunction('initializeMap');
      if (!mapReady) throw new Error('initializeMap not found');

      window.map = initializeMap();

      if (!isPip) await showPreload();

      // ============================================
      // STEP 1: Icon Manager
      // ============================================
      updateLoadingText('Preparing icon system...');
      await loadIconManager();
      window.initializeIcons();

      // ============================================
      // STEP 2: Load Marker Data
      // ============================================
      updateLoadingText('Loading marker data...');
      if (window.DataLoader?.init) {
        await DataLoader.init();
      }

      // ============================================
      // STEP 3: Load Descriptions
      // ============================================
      if (window.DescriptionLoader) {
        updateLoadingText('Loading descriptions...');
        try {
          await DescriptionLoader.init();
          DescriptionLoader.mergeAllDescriptions();
        } catch (error) {
          console.warn('⚠️ Description loading failed:', error);
        }
      }

      // ============================================
      // STEP 4: Load CSS (deferred)
      // ============================================
      updateLoadingText('Loading styles...');
      loadDeferredCSS();

      // ============================================
      // STEP 5: Initialize Core Systems
      // ============================================
      updateLoadingText('Initializing systems...');

      if (window.MarkerManager?.init) {
        MarkerManager.init(window.map);
      } else {
        throw new Error('MarkerManager not found');
      }

      if (window.RegionLabelManager?.init) {
        try {
          RegionLabelManager.init(window.map);
        } catch (error) {
          console.warn('⚠️ RegionLabelManager init failed:', error);
        }
      }

      if (window.MarkerImageHandler?.init) {
        try {
          MarkerImageHandler.init();
        } catch (error) {
          console.warn('⚠️ MarkerImageHandler init failed:', error);
        }
      }

// ============================================
// STEP 6: Underground System
// ============================================
updateLoadingText('Initializing underground system...');

// ✅ Guard: tunggu UndergroundManager tersedia
if (await waitForUndergroundManager()) {
  try {
    const UG = window.UndergroundManager;

    if (UG && typeof UG.init === 'function') {
      await UG.init(window.map);
      console.log('✅ UndergroundManager initialized');

      if (window.TimeUndergroundMarker?.init) {
        window.TimeUndergroundMarker.init(window.map);
        console.log('✅ TimeUndergroundMarker initialized');
      }

    } else {
      console.warn('⚠️ UndergroundManager found but invalid');
    }

  } catch (error) {
    console.warn('⚠️ UndergroundManager init failed:', error);
  }
} else {
  // ✅ Tidak throw error, cukup warn
  console.warn('⚠️ UndergroundManager not loaded, skipping underground system');
}

      // ============================================
      // STEP 7: Region System
      // ============================================
      updateLoadingText('Initializing region system...');

      if (await waitForRegionManager()) {
        try {
          await RegionManager.init(window.map);
          console.log('✅ RegionManager initialized');

          if (window.MapSwitcher) {
            MapSwitcher.init(window.map);
            console.log('✅ MapSwitcher initialized');
          }

        } catch (error) {
          console.warn('⚠️ RegionManager init failed:', error);
        }
      }

      // ============================================
      // STEP 8: Dev Tools (Optional)
      // ============================================
      if (typeof createDevToolsPanel === 'function') {
        try {
          createDevToolsPanel(window.map);
        } catch (error) {
          console.warn('⚠️ Dev tools init failed:', error);
        }
      }

      // ============================================
      // STEP 9: Tampilkan marker SEBELUM simulateFinalLoading
      // ✅ FIX UTAMA: showAllIcons dipanggil di sini, bukan di finally
      // sehingga marker sudah muncul di balik preload overlay
      // ============================================
      document.body.classList.add('app-ready');

      if (window.IconManager?.showAllIcons) {
        window.IconManager.showAllIcons();
        console.log('✅ Icons visible (before final loading wait)');
      }

      // Preload overlay masih tampil selama simulasi ini
      updateLoadingText('Ready to explore!');
      await simulateFinalLoading();

    } catch (err) {
      console.error(err);
      updateLoadingText('Error loading map');
      alert(`Failed to initialize map:\n${err.message}\n\nPlease refresh the page.`);

    } finally {

      // ============================================
      // UI FINALIZATION
      // ============================================

      // Pastikan app-ready ter-set meski error
      document.body.classList.add('app-ready');

      // ✅ Pastikan icons visible meski terjadi error sebelum STEP 9
      if (window.IconManager?.showAllIcons) {
        window.IconManager.showAllIcons();
      }

      // Hide preload overlay
      setTimeout(() => {
        hidePreload();
        waitForProfileReady();

        setTimeout(() => {
          const patchShown = window.showPatchPopup ? showPatchPopup() : false;

          if (!patchShown && window.TipGuide) {
            TipGuide.start();
          }
        }, 800);

      }, 300);

      // Show UI elements
      setTimeout(() => {
        showAllUIElements();
      }, 500);

      // Cookie Consent
      if (window.WWMCookieConsent) {
        setTimeout(() => {
          WWMCookieConsent.initAfterLoad(2000);
        }, 1000);
      }

      // PiP Map
      if (window.PipMap) {
        PipMap.init();
      }
    }
  }

  // ============================================
  // BOOT
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    setTimeout(initApp, 100);
  }

})();