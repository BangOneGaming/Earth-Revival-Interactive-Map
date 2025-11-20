/**
 * Main application entry point
 */
(function() {
  'use strict';

  /**
   * Show / Hide loading overlay
   */
  function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'block';
  }

  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  /**
   * Simulate progress delay (95% -> 100%)
   */
  function simulateFinalLoading() {
    return new Promise(resolve => {
      console.log("%c⏳ Finishing loading... (95% → 100%)", "color:#02a0c5;font-weight:bold;");
      setTimeout(() => {
        console.log("%c✅ Loading complete (100%)", "color:lime;font-weight:bold;");
        resolve();
      }, 3000); // 3 detik tambahan
    });
  }

  /**
   * Initialize the application
   */
  async function initApp() {
    console.log("%c🗺️ Initializing Map Application...", "color:#4CAF50;font-weight:bold;");
    showLoading(); // 🟢 Tampilkan loading overlay

    try {
      // Check if required functions are available
      if (typeof initializeIcons !== "function") throw new Error("initializeIcons not found");
      if (typeof initializeMap !== "function") throw new Error("initializeMap not found");

      // Load data from API first
      if (typeof DataLoader !== "undefined" && DataLoader.init) {
        console.log("%c⏳ Loading marker data from API...", "color:#FFA500;font-weight:bold;");
        await DataLoader.init();
        console.log("%c✓ Data loaded from API", "color:#4CAF50;");
      } else {
        console.warn("%c⚠️ DataLoader not found, using static data files", "color:orange;");
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

      // Initialize dev tools if available
      if (typeof createDevToolsPanel === "function") {
        createDevToolsPanel(window.map);
        console.log("%c✓ Dev tools initialized", "color:#4CAF50;");
      }

      // Tunggu delay tambahan 3 detik sebelum sembunyikan loading
      await simulateFinalLoading();

      console.log("%c✅ Application ready!", "color:lime;font-weight:bold;font-size:16px;");
    } catch (error) {
      console.error("%c❌ Initialization error:", "color:red;font-weight:bold;", error);
      console.error("Stack trace:", error.stack);
    } finally {
      // 🔵 Sembunyikan loading overlay setelah semua siap
      hideLoading();
    }
  }

  // Start application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    setTimeout(initApp, 100);
  }
})();

// Inisialisasi currentUser dari localStorage (jika ada)
const savedToken = localStorage.getItem("userToken");
if (savedToken) {
  try {
    const payload = decodeJwt(savedToken);

    currentUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      token: savedToken
    };

    checkUserProfile().then(async hasProfile => {
      if (hasProfile) {
        console.log("✅ User restored from previous session:", currentUser);

        // 🔥 HAPUS VISITED LOKAL DULU
        localStorage.removeItem("visitedMarkers");
        console.log("🧹 Cleared local visited cache");

        // 🔥 LOAD VISITED DARI SERVER
        await loadVisitedMarkersFromServer();
        console.log("📥 Visited markers loaded from server");
      } else {
        console.log("⚠️ Invalid session, clearing token");
        localStorage.removeItem("userToken");
        currentUser = null;
      }
    });

  } catch (err) {
    console.error("Error restoring session:", err);
    localStorage.removeItem("userToken");
  }
}
    // Show popup after map loads
    function showPatchPopup() {
      const overlay = document.getElementById('patchOverlay');
      const hasSeenPatch = localStorage.getItem('seenPatchV1'); // Change version number for new updates
      
      if (!hasSeenPatch) {
        overlay.classList.add('active');
      }
    }

    // Close popup
    function closePatchPopup() {
      const overlay = document.getElementById('patchOverlay');
      overlay.classList.remove('active');
      localStorage.setItem('seenPatchV1', 'true'); // Mark as seen
    }

    // Close on overlay click
    document.getElementById('patchOverlay').addEventListener('click', function(e) {
      if (e.target === this) {
        closePatchPopup();
      }
    });

    // Auto-show popup when page loads (simulate map initialization)
    // In your actual code, call showPatchPopup() after map initialization
    window.addEventListener('load', function() {
      setTimeout(showPatchPopup, 2000);
    });