/**
 * Main application entry point - WITH INSTANT ICON RESIZER
 */
(function() {
  'use strict';

  /**
   * Show / Hide preload overlay
   */
  function showPreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (overlay) overlay.style.display = 'block';
    
    startEmotionFlip();
    startTextAnimation();
    startLoadingBar();
  }

  function hidePreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  /**
   * Emotion FLIP 3D
   */
  function startEmotionFlip() {
    const emotions = [
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/impressed.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/cry.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/hehe.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/well.webp',
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/thinking.webp'
    ];

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

    setTimeout(() => {
      clearInterval(flipInterval);
    }, 5000);
  }

  /**
   * Text animation
   */
  function startTextAnimation() {
    const textElement = document.getElementById('preloadMessage');
    if (!textElement) return;

    textElement.textContent = 'Better Experience With Mobile Desktop mode';

    setTimeout(() => {
      textElement.style.animation = 'preloadFadeOut 0.4s ease-out';
      
      setTimeout(() => {
        textElement.textContent = 'You can add new marker in this map';
        textElement.style.animation = 'preloadFadeIn 0.4s ease-in';
      }, 400);
    }, 2500);
  }

  /**
   * Loading bar animation
   */
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

  /**
   * Simulate progress delay
   */
  function simulateFinalLoading() {
    return new Promise(resolve => {
      console.log("%c⏳ Loading experience... (0% → 100%)", "color:#02a0c5;font-weight:bold;");
      setTimeout(() => {
        console.log("%c✅ Loading complete (100%)", "color:lime;font-weight:bold;");
        resolve();
      }, 5000);
    });
  }

  /**
   * ✅ VALIDATION: Check if marker data is actually loaded
   */
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
    const missingData = [];

    sources.forEach(source => {
      if (!window[source]) {
        missingData.push(source);
      } else {
        const count = Object.keys(window[source]).length;
        totalMarkers += count;
      }
    });

    return totalMarkers > 0;
  }

/**
 * FIXED: Proper initialization order
 * UndergroundManager AFTER MarkerManager
 */

/**
 * ✅ SAFE INIT: Initialize with proper error handling and correct order
 */
async function initApp() {
  console.log("%c🗺️ Initializing Map Application...", "color:#4CAF50;font-weight:bold;");
  
  showPreload();

  try {
    // Check required functions
    if (typeof initializeIcons !== "function") {
      throw new Error("initializeIcons not found");
    }
    if (typeof initializeMap !== "function") {
      throw new Error("initializeMap not found");
    }

    // ============================================
    // STEP 1: Load MARKER DATA (CRITICAL)
    // ============================================
    let dataLoadSuccess = false;
    
    if (typeof DataLoader !== "undefined" && DataLoader.init) {
      console.log("%c⏳ [1/4] Loading marker data from API...", "color:#FFA500;font-weight:bold;");
      
      try {
        await DataLoader.init();
        
        // ✅ VALIDATE DATA
        console.log("%c🔍 Validating loaded data...", "color:#02a0c5;");
        dataLoadSuccess = validateMarkerData();
        
        if (dataLoadSuccess) {
          console.log("%c✓ [1/4] Marker data loaded successfully", "color:#4CAF50;font-weight:bold;");
        } else {
          throw new Error("No marker data found after loading");
        }
        
      } catch (error) {
        console.error("%c❌ Failed to load marker data:", "color:red;font-weight:bold;", error);
        throw new Error(`DataLoader failed: ${error.message}`);
      }
    } else {
      console.warn("%c⚠️ DataLoader not found", "color:orange;");
      
      // Check if static data exists
      dataLoadSuccess = validateMarkerData();
      
      if (!dataLoadSuccess) {
        throw new Error("No marker data available (neither API nor static files)");
      }
    }

    // ============================================
    // STEP 2: Load DESCRIPTION DATA (OPTIONAL)
    // ============================================
    if (typeof DescriptionLoader !== "undefined") {
      console.log("%c⏳ [2/4] Loading descriptions...", "color:#02a0c5;font-weight:bold;");
      
      try {
        await DescriptionLoader.init();
        console.log("%c✓ [2/4] Descriptions loaded", "color:#4CAF50;");
        
        // ✅ ONLY MERGE IF DATA IS VALID
        if (dataLoadSuccess) {
          console.log("%c⏳ Merging descriptions into markers...", "color:#02a0c5;");
          DescriptionLoader.mergeAllDescriptions();
          console.log("%c✓ Descriptions merged successfully", "color:#4CAF50;font-weight:bold;");
        } else {
          console.warn("%c⚠️ Skipping description merge (no marker data)", "color:orange;");
        }
        
      } catch (error) {
        console.warn("%c⚠️ Description loading failed (non-critical):", "color:orange;", error);
        // Continue without descriptions
      }
    }

    // ============================================
    // STEP 3: Initialize MAP & CORE SYSTEMS
    // ============================================
    console.log("%c⏳ [3/4] Initializing map interface...", "color:#02a0c5;font-weight:bold;");

    // Initialize icons
    initializeIcons();
    console.log("%c  ✓ Icons initialized", "color:#4CAF50;");

    // Initialize map
    window.map = initializeMap();
    console.log("%c  ✓ Map initialized", "color:#4CAF50;");

    // ✅ CRITICAL: Initialize MarkerManager FIRST
    if (typeof MarkerManager !== "undefined" && MarkerManager.init) {
      try {
        // Verify data is available before initializing
        const markerCount = MarkerManager.getAllMarkers().length;
        
        if (markerCount === 0) {
          console.warn("%c  ⚠️ Warning: MarkerManager found 0 markers", "color:orange;");
        }
        
        MarkerManager.init(window.map);
        console.log("%c  ✓ Marker manager initialized (" + markerCount + " markers)", "color:#4CAF50;");
        
      } catch (error) {
        console.error("%c  ❌ MarkerManager failed:", "color:red;", error);
        throw error;
      }
    } else {
      throw new Error("MarkerManager not found or missing init method");
    }

    // Initialize RegionLabelManager
    if (typeof RegionLabelManager !== "undefined" && RegionLabelManager.init) {
      try {
        RegionLabelManager.init(window.map);
        console.log("%c  ✓ RegionLabelManager initialized", "color:#4CAF50;");
      } catch (error) {
        console.warn("%c  ⚠️ RegionLabelManager failed:", "color:orange;", error);
      }
    }

    // Initialize MarkerImageHandler
    if (typeof MarkerImageHandler !== "undefined" && MarkerImageHandler.init) {
      try {
        MarkerImageHandler.init();
        console.log("%c  ✓ MarkerImageHandler initialized", "color:#4CAF50;");
      } catch (error) {
        console.warn("%c  ⚠️ MarkerImageHandler failed:", "color:orange;", error);
      }
    }

    console.log("%c✓ [3/4] Core systems ready", "color:#4CAF50;font-weight:bold;");

    // ============================================
    // STEP 4: Initialize UNDERGROUND MANAGER (AFTER MarkerManager)
    // ============================================
    console.log("%c⏳ [4/4] Initializing underground system...", "color:#02a0c5;font-weight:bold;");

    if (typeof UndergroundManager !== "undefined") {
      try {
        // ✅ UndergroundManager.init() is async and loads overlay data
        await UndergroundManager.init(window.map);
        console.log("%c  ✓ UndergroundManager initialized", "color:#4CAF50;");
        
        // Verify overlay data loaded
        if (UndergroundManager.overlayData && UndergroundManager.overlayData.length > 0) {
          console.log(`%c  ✓ Loaded ${UndergroundManager.overlayData.length} overlay(s)`, "color:#4CAF50;");
        } else {
          console.warn("%c  ⚠️ No overlay data loaded", "color:orange;");
        }
        
      } catch (error) {
        console.error("%c  ❌ UndergroundManager failed:", "color:red;", error);
        // Don't throw - underground is optional feature
      }
    } else {
      console.warn("%c  ⚠️ UndergroundManager not found", "color:orange;");
    }

    console.log("%c✓ [4/4] Underground system ready", "color:#4CAF50;font-weight:bold;");

    // ============================================
    // OPTIONAL: Dev Tools
    // ============================================
    if (typeof createDevToolsPanel === "function") {
      try {
        createDevToolsPanel(window.map);
        console.log("%c  ✓ Dev tools initialized", "color:#4CAF50;");
      } catch (error) {
        console.warn("%c  ⚠️ Dev tools failed:", "color:orange;", error);
      }
    }

    // Wait for loading animation
    await simulateFinalLoading();

    console.log("%c✅ APPLICATION READY!", "color:lime;font-weight:bold;font-size:16px;");
    
  } catch (error) {
    console.error("%c❌ CRITICAL ERROR:", "color:red;font-weight:bold;font-size:16px;", error);
    console.error("Stack trace:", error.stack);
    
    // Show error to user
    alert(`Failed to initialize map:\n${error.message}\n\nPlease refresh the page or contact support.`);
    
  } finally {
    hidePreload();
  }
}

  // Start application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    setTimeout(initApp, 100);
  }
})();