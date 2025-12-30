/**
 * NO ICON RESIZE
 * Icon tetap ukuran default, tidak berubah saat zoom
 * File ini bisa dihapus atau di-disable jika tidak digunakan
 */

const InstantIconResizer = {
  /**
   * Initialize - dummy function untuk compatibility
   */
  init(map) {
    console.log('✅ Icon Resizer: Disabled (icons use default size)');
  }
};

// ========================================
// INTEGRATION WITH MARKER MANAGER
// ========================================

// Override MarkerManager.init - tapi tidak melakukan apa-apa
const originalMarkerManagerInit = MarkerManager.init;
MarkerManager.init = function(map) {
  originalMarkerManagerInit.call(this, map);
  InstantIconResizer.init(map);
};

// ========================================
// EXPORT
// ========================================
window.InstantIconResizer = InstantIconResizer;

console.log('✅ Icon Resizer loaded (disabled - default size only)');