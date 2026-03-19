/**
 * Main application entry point
 * Clean version with integrated cookie consent + Region Manager
 */
(function () {
  'use strict';

  // ============================================
  // ICON MANAGER LOADER
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

  // ============================================
  // LOADING BAR — berbasis progress nyata
  // ============================================
  let _loadProgress = 0;

  function startLoadingBar() {
  const bar = document.getElementById('preloadBarFill');
  const pct = document.getElementById('preloadBarPercent');
  if (!bar || !pct) return;

  // ✅ Matikan animasi CSS pulse, JS ambil alih kontrol bar
  bar.classList.add('js-controlled');

  _loadProgress = 0;
  bar.style.transition = 'width 0.3s ease-out';
  bar.style.width = '0%';
  pct.textContent = '0%';
}

  function updateLoadingProgress(percent) {
    const bar = document.getElementById('preloadBarFill');
    const pct = document.getElementById('preloadBarPercent');
    if (!bar || !pct) return;

    // Tidak boleh mundur
    _loadProgress = Math.max(_loadProgress, Math.min(percent, 100));
    bar.style.width = _loadProgress + '%';
    pct.textContent = _loadProgress + '%';
  }

  function forceCompleteLoadingBar() {
    updateLoadingProgress(100);
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

  requestAnimationFrame(() => {
    const styleControl = document.getElementById('ui-visibility-control');
    if (styleControl) styleControl.remove();

    const elements = [
      'leaderboardPanel', 'leaderboardToggle',
      'filterPanel', 'filterToggle',
      'notificationIcon', 'topLoginBtn',
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
  });
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
      updateLoadingProgress(10);

      // ✅ Tampilkan preload hanya kalau USE_PRELOAD = true
      if (!isPip && window.USE_PRELOAD !== false) {
        await showPreload();
      } else {
        const overlay = document.getElementById('preloadOverlay');
        if (overlay) overlay.style.display = 'none';
      }

      // ============================================
      // STEP 1: Icon Manager
      // ============================================
      updateLoadingText('Preparing icon system...');
      await loadIconManager();
      window.initializeIcons();
      updateLoadingProgress(20);

      // ============================================
      // STEP 2: Load Marker Data
      // ============================================
      updateLoadingText('Loading marker data...');
      if (window.DataLoader?.init) {
        await DataLoader.init();
      }
      updateLoadingProgress(50);

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
      updateLoadingProgress(62);

      // ============================================
      // STEP 4: Load CSS (deferred)
      // ============================================
      updateLoadingText('Loading styles...');
      loadDeferredCSS();
      updateLoadingProgress(70);

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
        const initRegionLabel = () => {
          try {
            RegionLabelManager.init(window.map);
          } catch (error) {
            console.warn('⚠️ RegionLabelManager init failed:', error);
          }
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(initRegionLabel);
        } else {
          setTimeout(initRegionLabel, 100);
        }
      }

      if (window.MarkerImageHandler?.init) {
        try {
          MarkerImageHandler.init();
        } catch (error) {
          console.warn('⚠️ MarkerImageHandler init failed:', error);
        }
      }

      updateLoadingProgress(80);

      // ============================================
      // Terapkan pilihan RegionPicker / Go to Location / Marker Link
      // Diletakkan SETELAH MarkerManager.init agar
      // activeMarkers dan filter sudah tersedia.
      // ============================================
      
      // Check for marker link parameters first (takes priority)
      let pick = window.__markerLinkParams || window.__regionPick;
      
      if (pick) {

        // 1. Switch preset map jika perlu (misal Hutuo)
        if (pick.preset && pick.preset !== 'main') {
          if (typeof _applyMapPreset === 'function') {
            _applyMapPreset(pick.preset, false);
          }
        }

        // 2. Set posisi awal peta
        if (pick.lat != null && pick.lng != null) {
          window.map.setView([pick.lat, pick.lng], pick.zoom ?? 5, { animate: false });
          setTimeout(() => window.map.invalidateSize(true), 100);
        }

        // 3. Aktifkan filter kategori (dari Go to Location tab Mystic dll atau dari URL marker link)
        if (pick.filterCategory && window.MarkerManager) {
          const catId = String(pick.filterCategory);
          MarkerManager.activeFilters.add(catId);

          // Sinkronkan checkbox di filter panel jika sudah render
          const cb = document.querySelector(
            `[data-category-id="${catId}"] .filter-checkbox, ` +
            `[data-category-id="${catId}"] input[type="checkbox"]`
          );
          if (cb) cb.checked = true;

          // Tandai filter item aktif
          const fi = document.querySelector(`[data-category-id="${catId}"]`);
          if (fi) fi.classList.add('active');

          // Persist ke localStorage
          try {
            localStorage.setItem(
              'activeFilters',
              JSON.stringify([...MarkerManager.activeFilters])
            );
          } catch (e) {}

          MarkerManager.updateMarkersInView();
        }

        // 4. Fly + buka popup marker (khusus Go to Location dari tab konten atau marker link)
        if (pick.goToLocation && pick.markerKey && window.MarkerManager) {
          const tryClick = (attempt) => {
            if (attempt >= 25) {
              console.warn('[pick] Marker tidak ditemukan:', pick.markerKey);
              return;
            }
            const marker = MarkerManager.activeMarkers?.[pick.markerKey];
            if (marker && marker._icon) {
              // Fly smooth, buka popup setelah animasi selesai
              window.map.flyTo([pick.lat, pick.lng], 6, { animate: true, duration: 1.2 });
              window.map.once('moveend', () => {
                marker._icon.dispatchEvent(
                  new MouseEvent('click', { bubbles: true, cancelable: true })
                );
              });
            } else {
              setTimeout(() => tryClick(attempt + 1), 200);
            }
          };
          // Beri jeda 400ms agar updateMarkersInView selesai render
          setTimeout(() => tryClick(0), 400);
        }
      }

      // ============================================
      // STEP 6: Underground System
      // ============================================
      updateLoadingText('Initializing underground system...');

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
        console.warn('⚠️ UndergroundManager not loaded, skipping underground system');
      }
      updateLoadingProgress(88);

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
      updateLoadingProgress(95);

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
      updateLoadingProgress(98);

      // ============================================
      // STEP 9: Selesai — tampilkan map & tutup overlay
      // ============================================
      document.body.classList.add('app-ready');

      // FIX 1 — Hapus inline style opacity:0 visibility:hidden pada #map.
      // CSS body.app-ready #map { opacity: 1 !important } tidak cukup karena
      // inline style selalu lebih spesifik dari class selector, !important sekalipun.
      const mapEl = document.getElementById('map');
      if (mapEl) {
        mapEl.style.opacity = '';
        mapEl.style.visibility = '';
      }

      // FIX 3 — Paksa Leaflet hitung ulang ukuran container.
      // Saat initializeMap() dipanggil tadi, #map masih visibility:hidden
      // sehingga Leaflet bisa mengukur dimensi 0x0 dan tile tidak dirender.
      // invalidateSize(true) memaksanya ukur ulang sekarang div sudah visible.
      if (window.map) {
        setTimeout(() => window.map.invalidateSize(true), 50);
      }

      if (window.IconManager?.showAllIcons) {
        window.IconManager.showAllIcons();
        console.log('✅ Icons visible');
      }

      updateLoadingText('Ready to explore!');
      forceCompleteLoadingBar();

    } catch (err) {
      console.error(err);
      updateLoadingText('Error loading map');
      alert(`Failed to initialize map:\n${err.message}\n\nPlease refresh the page.`);

    } finally {

      // ============================================
      // UI FINALIZATION
      // ============================================

      
      // ✅ Pastikan icons visible meski error sebelum STEP 9
      if (window.IconManager?.showAllIcons) {
        window.IconManager.showAllIcons();
      }

      // ✅ Pastikan app-ready ter-set meski error — tapi pakai flag
      if (!document.body.classList.contains('app-ready')) {
        document.body.classList.add('app-ready');
      }

// Hide preload overlay
      setTimeout(() => {
        // ✅ Hanya hide kalau memang preload dipakai
        if (window.USE_PRELOAD !== false) {
          hidePreload();
        }
        waitForProfileReady();

        setTimeout(() => {
          const patchShown = window.showPatchPopup ? showPatchPopup() : false;
          if (!patchShown && window.TipGuide) {
            TipGuide.start();
          }

          if (!patchShown && window.WWMCookieConsent) {
            if (!WWMCookieConsent.hasConsent() && !WWMCookieConsent.hasDeclined()) {
              setTimeout(() => WWMCookieConsent.initAfterLoad(0), 1000);
            }
          }
        }, 3000);

      }, 400);

      // Show UI elements
      setTimeout(() => {
        showAllUIElements();
      }, 500);


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