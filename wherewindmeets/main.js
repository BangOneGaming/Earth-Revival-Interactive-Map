/**
 * Main application entry point
 */
(function() {
  'use strict';

  /**
   * Show / Hide preload overlay
   */
  function showPreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (overlay) overlay.style.display = 'block';
    
    // Start emotion flip animation (CEPAT!)
    startEmotionFlip();
    
    // Start text changing
    startTextAnimation();
    
    // Start loading bar animation
    startLoadingBar();
  }

  function hidePreload() {
    const overlay = document.getElementById('preloadOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  /**
   * Emotion FLIP 3D (Flip selesai DULU, baru ganti gambar)
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

    // Set gambar pertama
    emotionImg.src = emotions[0];

    // Ganti gambar setiap 800ms (flip 600ms + delay 200ms)
    const flipInterval = setInterval(() => {
      // Trigger animasi flip 3D
      emotionImg.classList.add('flip-animation');
      
      // TUNGGU flip selesai (600ms), BARU ganti gambar
      setTimeout(() => {
        emotionImg.classList.remove('flip-animation');
        currentIndex = (currentIndex + 1) % emotions.length;
        emotionImg.src = emotions[currentIndex];
      }, 600);
      
    }, 800);

    // Stop animasi saat loading selesai
    setTimeout(() => {
      clearInterval(flipInterval);
    }, 5000);
  }

  /**
   * Text animation (ganti text di tengah durasi - 2.5 detik)
   */
  function startTextAnimation() {
    const textElement = document.getElementById('preloadMessage');
    if (!textElement) return;

    // Text pertama
    textElement.textContent = 'Better Experience With Mobile Desktop mode';

    // Ganti text di tengah loading (2.5 detik)
    setTimeout(() => {
      textElement.style.animation = 'preloadFadeOut 0.4s ease-out';
      
      setTimeout(() => {
        textElement.textContent = 'You can add new marker in this map';
        textElement.style.animation = 'preloadFadeIn 0.4s ease-in';
      }, 400);
    }, 2500);
  }

  /**
   * Loading bar animation (0% -> 100% dalam 5 detik)
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
   * Simulate progress delay (total 5 detik)
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
   * Initialize the application
   */
  async function initApp() {
    console.log("%c🗺️ Initializing Map Application...", "color:#4CAF50;font-weight:bold;");
    
    showPreload();

    try {
      // Check if required functions are available
      if (typeof initializeIcons !== "function") throw new Error("initializeIcons not found");
      if (typeof initializeMap !== "function") throw new Error("initializeMap not found");

      // ✅ STEP 1: Load DATA MARKER dulu dari API
      if (typeof DataLoader !== "undefined" && DataLoader.init) {
        console.log("%c⏳ [1/2] Loading marker data from API...", "color:#FFA500;font-weight:bold;");
        await DataLoader.init();
        console.log("%c✓ [1/2] Marker data loaded successfully", "color:#4CAF50;font-weight:bold;");
      } else {
        console.warn("%c⚠️ DataLoader not found, using static data files", "color:orange;");
      }

      // ✅ STEP 2: Load DESCRIPTION data dan merge (SETELAH marker data ready)
      if (typeof DescriptionLoader !== "undefined") {
        console.log("%c⏳ [2/2] Loading descriptions...", "color:#02a0c5;font-weight:bold;");
        await DescriptionLoader.init();
        console.log("%c✓ [2/2] Descriptions loaded", "color:#4CAF50;");
        
        // Merge descriptions ke marker data
        console.log("%c⏳ Merging descriptions into markers...", "color:#02a0c5;");
        DescriptionLoader.mergeAllDescriptions();
        console.log("%c✓ Descriptions merged successfully", "color:#4CAF50;font-weight:bold;");
      }

      // Initialize icons
      initializeIcons();
      console.log("%c✓ Icons initialized", "color:#4CAF50;");

      // Initialize map
      window.map = initializeMap();
      console.log("%c✓ Map initialized", "color:#4CAF50;");

      // Initialize UndergroundManager (Popup Version)
      if (typeof UndergroundManager !== "undefined") {
        console.log("%c⏳ Initializing UndergroundManager...", "color:#02a0c5;font-weight:bold;");
        await UndergroundManager.init(window.map);
        console.log("%c✓ UndergroundManager initialized", "color:#4CAF50;");
      }

      // Initialize marker manager (includes filter)
      if (typeof MarkerManager !== "undefined" && MarkerManager.init) {
        MarkerManager.init(window.map);
        console.log("%c✓ Marker manager initialized", "color:#4CAF50;");
      }

      // ✅ Initialize MarkerImageHandler SETELAH MarkerManager
      if (typeof MarkerImageHandler !== "undefined" && MarkerImageHandler.init) {
        MarkerImageHandler.init();
        console.log("%c✓ MarkerImageHandler initialized", "color:#4CAF50;");
      }

      // Initialize dev tools if available
      if (typeof createDevToolsPanel === "function") {
        createDevToolsPanel(window.map);
        console.log("%c✓ Dev tools initialized", "color:#4CAF50;");
      }

      // Tunggu delay loading animation selesai (5 detik)
      await simulateFinalLoading();

      console.log("%c✅ Application ready!", "color:lime;font-weight:bold;font-size:16px;");
    } catch (error) {
      console.error("%c❌ Initialization error:", "color:red;font-weight:bold;", error);
      console.error("Stack trace:", error.stack);
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