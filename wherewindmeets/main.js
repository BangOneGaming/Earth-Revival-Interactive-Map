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
          // ✨ SEMBUNYIKAN ICON SEGERA SETELAH LOAD
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
    const cssVersion = typeof CSS_VERSION !== 'undefined' ? CSS_VERSION : '1.0.0';
    
    const cssFiles = [
      'marker-image-handler.css',
      'editing-image-upload.css',
      'knowladgelist.css',
      'mystic-skill-panel.css',
      'innerway.css',
      'patchnote.css',
      'form.css',
      'layer.css',
      'region-management.css',
      'booklist.css',
      'ui.css',
      'login.css',
      'comment.css',
      'profile-container.css',
      'setting.css',
      'donate.css',
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
  // PRELOAD UI
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

    await Promise.race([
      preloadImages(emotions),
      new Promise(r => setTimeout(r, 1000))
    ]);

    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';

    requestAnimationFrame(() => {
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';

      startEmotionFlip(emotions);
      startTextAnimation();
      startLoadingBar();
    });
  }

  function hidePreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (!overlay) return;

    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      overlay.remove();
      
      // ✨ TAMPILKAN ICON SETELAH PRELOAD HILANG
      if (window.IconManager?.showAllIcons) {
        setTimeout(() => {
          window.IconManager.showAllIcons();
        }, 100);
      }
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
  // ✨ SHOW ALL UI ELEMENTS
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
      
      // ✅ Only set pointer-events for non-container elements
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
    await showPreload();

    try {
      // ============================================
      // STEP 1: Icon Manager
      // ============================================
      updateLoadingText('Preparing icon system...');
      await loadIconManager();
      window.initializeIcons();

      // ============================================
      // STEP 2: Initialize Map
      // ============================================
      updateLoadingText('Initializing map...');
      
      const mapReady = await waitForFunction('initializeMap');
      if (!mapReady) {
        throw new Error('initializeMap not found');
      }
      
      window.map = initializeMap();

      // ============================================
      // STEP 3: Load Marker Data
      // ============================================
      updateLoadingText('Loading marker data...');
      if (window.DataLoader?.init) {
        await DataLoader.init();
      }

      // ============================================
      // STEP 4: Load Descriptions
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
      // STEP 5: Load CSS
      // ============================================
      updateLoadingText('Loading styles...');
      loadDeferredCSS();

      // ============================================
      // STEP 6: Initialize Core Systems
      // ============================================
      updateLoadingText('Initializing systems...');

      // MarkerManager
      if (window.MarkerManager?.init) {
        MarkerManager.init(window.map);
      } else {
        throw new Error('MarkerManager not found');
      }

      // RegionLabelManager
      if (window.RegionLabelManager?.init) {
        try {
          RegionLabelManager.init(window.map);
        } catch (error) {
          console.warn('⚠️ RegionLabelManager init failed:', error);
        }
      }

      // MarkerImageHandler
      if (window.MarkerImageHandler?.init) {
        try {
          MarkerImageHandler.init();
        } catch (error) {
          console.warn('⚠️ MarkerImageHandler init failed:', error);
        }
      }

      // ============================================
      // STEP 7: Initialize Underground System
      // ============================================
      updateLoadingText('Initializing underground system...');
      
      if (await waitForUndergroundManager()) {
        try {
          await UndergroundManager.init(window.map);
          console.log('✅ UndergroundManager initialized');
        } catch (error) {
          console.warn('⚠️ UndergroundManager init failed:', error);
        }
      }

      // ============================================
      // STEP 8: Initialize Region Manager
      // ============================================
      updateLoadingText('Initializing region system...');
      
      if (await waitForRegionManager()) {
        try {
          await RegionManager.init(window.map);
          console.log('✅ RegionManager initialized');
        } catch (error) {
          console.warn('⚠️ RegionManager init failed:', error);
        }
      }

      // ============================================
      // STEP 9: Dev Tools (Optional)
      // ============================================
      if (typeof createDevToolsPanel === 'function') {
        try {
          createDevToolsPanel(window.map);
        } catch (error) {
          console.warn('⚠️ Dev tools init failed:', error);
        }
      }

      // ============================================
      // STEP 10: Wait for loading animation
      // ============================================
      updateLoadingText('Ready to explore!');
      await simulateFinalLoading();

    } catch (err) {
      console.error(err);
      updateLoadingText('Error loading map');
      alert(`Failed to initialize map:\n${err.message}\n\nPlease refresh the page.`);
    } finally {
      // ✨ STEP 1: Add app-ready class
      document.body.classList.add('app-ready');
      
      // ✨ STEP 2: Hide preload & show icons
      setTimeout(() => {
        hidePreload();
        waitForProfileReady();

        // ✨ STEP 3: Show patch notes
        setTimeout(() => {
          if (window.showPatchPopup) {
            showPatchPopup();
          }
        }, 800);

      }, 300);

      // ✨ STEP 4: Show all UI elements
      setTimeout(() => {
        showAllUIElements();
      }, 500);

      // ✨ STEP 5: Cookie consent
      if (window.WWMCookieConsent) {
        setTimeout(() => {
          WWMCookieConsent.initAfterLoad(2000);
        }, 1000);
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