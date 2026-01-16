/**
 * Main application entry point
 * Clean version with integrated cookie consent + Region Manager
 */
(function() {
  'use strict';

  // ============================================
  // PRELOAD UI FUNCTIONS
  // ============================================
  
async function showPreload() {
  const overlay = document.getElementById('preloadOverlay');
  if (overlay) overlay.style.display = 'block';

  const emotions = [
    'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/impressed.webp',
    'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/cry.webp',
    'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/hehe.webp',
    'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/well.webp',
    'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/thinking.webp'
  ];

  // 🔥 PENTING
  await preloadImages(emotions);

  startEmotionFlip(emotions);
  startTextAnimation();
  startLoadingBar();
}

function hidePreload() {
  const overlay = document.getElementById('preloadOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }
}

  function updateLoadingText(message) {
    const textElement = document.getElementById('preloadMessage');
    if (textElement) {
      textElement.style.animation = 'preloadFadeOut 0.3s ease-out';
      setTimeout(() => {
        textElement.textContent = message;
        textElement.style.animation = 'preloadFadeIn 0.3s ease-in';
      }, 300);
    }
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
  // EMOTION FLIP ANIMATION
  // ============================================
function preloadImages(urls) {
  return Promise.all(
    urls.map(src => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });
    })
  );
}
function startEmotionFlip(emotions) {
  const emotionImg = document.getElementById('preloadEmotionIcon');
  if (!emotionImg) return;

  let currentIndex = 0;
  emotionImg.src = emotions[0];

  const flipInterval = setInterval(() => {
    emotionImg.classList.add('flip-animation');

    setTimeout(() => {
      emotionImg.classList.remove('flip-animation');
      currentIndex = (currentIndex + 1) % emotions.length;
      emotionImg.src = emotions[currentIndex];
    }, 600);
  }, 800);

  setTimeout(() => clearInterval(flipInterval), 5000);
}

  // ============================================
  // TEXT ANIMATION
  // ============================================
  
  function startTextAnimation() {
    updateLoadingText('Better Experience With Mobile Desktop mode');

    setTimeout(() => {
      updateLoadingText('You can add new marker in this map');
    }, 2500);
  }

  // ============================================
  // LOADING BAR ANIMATION
  // ============================================
  
  function startLoadingBar() {
    const barFill = document.getElementById('preloadBarFill');
    const barPercent = document.getElementById('preloadBarPercent');
    
    if (!barFill || !barPercent) return;

    let progress = 0;
    const totalDuration = 5000;
    const intervalTime = 50;
    const increment = (100 / totalDuration) * intervalTime;

    const loadingInterval = setInterval(() => {
      progress += increment;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
      }

      barFill.style.width = progress + '%';
      barPercent.textContent = Math.floor(progress) + '%';
    }, intervalTime);
  }

  // ============================================
  // SIMULATE LOADING DELAY
  // ============================================
  
  function simulateFinalLoading() {
    return new Promise(resolve => {
      setTimeout(resolve, 5000);
    });
  }

  // ============================================
  // VALIDATE MARKER DATA
  // ============================================
  
  function validateMarkerData() {
    const sources = [
      'chest', 'batutele', 'strangecollection', 'yellow', 'gua', 
      'blue', 'red', 'peninggalan', 'kucing', 'ketidakadilan', 
      'petualangan', 'meong', 'pengetahuan', 'cerita', 'bulan', 
      'tidakterhitung', 'berharga', 'kulinari', 'spesial', 'wc', 
      'penyembuhan', 'buatteman', 'perdebatan', 'buku', 'penjaga', 
      'benteng', 'bos', 'jurus', 'pemancing', 'mabuk', 'kartu', 
      'panah', 'melodi', 'tebakan', 'gulat', 'tehnik', 'innerwaylist',
      'npc', 'terbaru'
    ];

    let totalMarkers = 0;

    sources.forEach(source => {
      if (window[source]) {
        totalMarkers += Object.keys(window[source]).length;
      }
    });

    return totalMarkers > 0;
  }
  
// ============================================
// WAIT FOR REQUIRED GLOBAL FUNCTION
// ============================================
async function waitForFunction(fnName, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (typeof window[fnName] === "function") return true;
    await new Promise(r => setTimeout(r, 50));
  }
  return false;
}

  // ============================================
  // MAIN INITIALIZATION
  // ============================================
  
  async function initApp() {
    await showPreload();

    try {
// ============================================
// WAIT FOR CORE DEPENDENCIES
// ============================================
updateLoadingText('Preparing core systems...');

const iconReady = await waitForFunction("initializeIcons");
const mapReady  = await waitForFunction("initializeMap");

if (!iconReady || !mapReady) {
  throw new Error("Core system not ready (icons or map)");
}

      // ============================================
      // STEP 1: Load Marker Data
      // ============================================
      let dataLoadSuccess = false;
      
      if (typeof DataLoader !== "undefined" && DataLoader.init) {
        updateLoadingText('Loading marker data...');
        
        try {
          await DataLoader.init();
          dataLoadSuccess = validateMarkerData();
          
          if (!dataLoadSuccess) {
            throw new Error("No marker data found after loading");
          }
        } catch (error) {
          throw new Error(`DataLoader failed: ${error.message}`);
        }
      } else {
        dataLoadSuccess = validateMarkerData();
        
        if (!dataLoadSuccess) {
          throw new Error("No marker data available");
        }
      }

      // ============================================
      // STEP 2: Load Descriptions
      // ============================================
      if (typeof DescriptionLoader !== "undefined") {
        updateLoadingText('Loading descriptions...');
        
        try {
          await DescriptionLoader.init();
          
          if (dataLoadSuccess) {
            DescriptionLoader.mergeAllDescriptions();
          }
        } catch (error) {
          // Non-critical, continue without descriptions
        }
      }

      // ============================================
      // STEP 3: Initialize Map & Core Systems
      // ============================================
      updateLoadingText('Initializing map interface...');

      // Initialize icons
      initializeIcons();

      // Initialize map
      window.map = initializeMap();

      // Initialize MarkerManager
      if (typeof MarkerManager !== "undefined" && MarkerManager.init) {
        MarkerManager.init(window.map);
      } else {
        throw new Error("MarkerManager not found");
      }

      // Initialize RegionLabelManager
      if (typeof RegionLabelManager !== "undefined" && RegionLabelManager.init) {
        try {
          RegionLabelManager.init(window.map);
        } catch (error) {
          // Optional feature
        }
      }

      // Initialize MarkerImageHandler
      if (typeof MarkerImageHandler !== "undefined" && MarkerImageHandler.init) {
        try {
          MarkerImageHandler.init();
        } catch (error) {
          // Optional feature
        }
      }

      // ============================================
      // STEP 4: Initialize Underground System
      // ============================================
      updateLoadingText('Initializing underground system...');
      
async function waitForUndergroundManager() {
  for (let i = 0; i < 50; i++) {
    if (window.UndergroundManager) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

if (await waitForUndergroundManager()) {
  await UndergroundManager.init(window.map);
}

      // ============================================
      // STEP 5: Initialize Region Manager (NEW!)
      // ============================================
      updateLoadingText('Initializing region system...');
      
async function waitForRegionManager() {
  for (let i = 0; i < 50; i++) {
    if (window.RegionManager) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

if (await waitForRegionManager()) {
  try {
    await RegionManager.init(window.map);
    console.log('✅ RegionManager initialized');
  } catch (error) {
    console.warn('⚠️ RegionManager init failed:', error);
    // Non-critical, continue without region filtering
  }
}

      // ============================================
      // OPTIONAL: Dev Tools
      // ============================================
      if (typeof createDevToolsPanel === "function") {
        try {
          createDevToolsPanel(window.map);
        } catch (error) {
          // Dev tools are optional
        }
      }

      // Wait for loading animation to complete
      await simulateFinalLoading();

      updateLoadingText('Ready to explore!');
      
    } catch (error) {
      updateLoadingText('Error loading map');
      alert(`Failed to initialize map:\n${error.message}\n\nPlease refresh the page.`);
      
    } finally {
  document.body.classList.add('app-ready');

  setTimeout(() => {
    hidePreload();

    // ✅ SAFE INIT PROFILE (retry-based)
    waitForProfileReady();

  }, 300);

  if (typeof window.WWMCookieConsent !== "undefined") {
    window.WWMCookieConsent.initAfterLoad(2000);
  }
}
}
  // ============================================
  // AUTO-START
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    setTimeout(initApp, 100);
  }
})();