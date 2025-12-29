/**
 * INSTANT ICON RESIZE AFTER ZOOM
 * Freeze icon size during zoom, update instantly after zoom ends
 * Add to marker-manager.js or create new file
 */

const InstantIconResizer = {
  currentZoom: 0,
  isZooming: false,
  zoomEndTimeout: null,
  ZOOM_END_DELAY: 200, // Delay setelah zoom stop (ms)
  
  /**
   * Initialize resizer
   */
  init(map) {
    this.currentZoom = map.getZoom();
    this.setupZoomHandlers(map);
    this.injectStyles();
    
    console.log('✅ InstantIconResizer initialized');
  },
  
  /**
   * Inject CSS to freeze transitions during zoom
   */
  injectStyles() {
    if (document.getElementById('instant-resize-style')) return;
    
    const style = document.createElement('style');
    style.id = 'instant-resize-style';
    style.textContent = `
      /* ❌ DISABLE semua animasi/transition saat zoom */
      body.is-zooming .leaflet-marker-icon,
      body.is-zooming .leaflet-marker-icon * {
        transition: none !important;
        animation: none !important;
      }
      
      /* ✅ ENABLE instant update setelah zoom (no transition) */
      body.zoom-just-ended .leaflet-marker-icon,
      body.zoom-just-ended .leaflet-marker-icon * {
        transition: none !important;
      }
      
      /* Normal state - bisa ada transition ringan untuk hover, dll */
      body:not(.is-zooming):not(.zoom-just-ended) .leaflet-marker-icon {
        transition: opacity 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  },
  
  /**
   * Setup zoom event handlers
   */
  setupZoomHandlers(map) {
    // ========================================
    // ZOOM START - Freeze everything
    // ========================================
    map.on('zoomstart', () => {
      this.isZooming = true;
      document.body.classList.add('is-zooming');
      document.body.classList.remove('zoom-just-ended');
      
      // Clear any pending update
      if (this.zoomEndTimeout) {
        clearTimeout(this.zoomEndTimeout);
      }
      
      console.log('🔒 Zoom started - icons frozen');
    });
    
    // ========================================
    // ZOOM END - Update instantly after delay
    // ========================================
    map.on('zoomend', () => {
      const newZoom = map.getZoom();
      
      // Clear existing timeout
      if (this.zoomEndTimeout) {
        clearTimeout(this.zoomEndTimeout);
      }
      
      // Tunggu user selesai zoom (debounce)
      this.zoomEndTimeout = setTimeout(() => {
        this.isZooming = false;
        
        // Remove zooming class
        document.body.classList.remove('is-zooming');
        
        // Add instant-update class
        document.body.classList.add('zoom-just-ended');
        
        // Update icon sizes INSTANTLY
        this.updateIconSizesInstant(newZoom);
        
        console.log(`🔄 Zoom ended at level ${newZoom} - icons updated instantly`);
        
        // Remove instant-update class after update complete
        setTimeout(() => {
          document.body.classList.remove('zoom-just-ended');
        }, 100);
        
        this.currentZoom = newZoom;
        
      }, this.ZOOM_END_DELAY);
    });
  },
  
  /**
   * Update icon sizes instantly (no animation)
   * Determines size based on zoom level
   */
  updateIconSizesInstant(zoom) {
    if (!MarkerManager || !MarkerManager.activeMarkers) return;
    
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    // Determine icon size based on zoom level
    let baseSize;
    if (isMobile) {
      // Mobile sizes
      if (zoom < 4) {
        baseSize = [24, 24];
      } else if (zoom < 5) {
        baseSize = [28, 28];
      } else if (zoom < 6) {
        baseSize = [32, 32];
      } else {
        baseSize = [38, 38];
      }
    } else {
      // Desktop sizes
      if (zoom < 4) {
        baseSize = [32, 32];
      } else if (zoom < 5) {
        baseSize = [40, 40];
      } else if (zoom < 6) {
        baseSize = [48, 48];
      } else {
        baseSize = [56, 56];
      }
    }
    
    console.log(`📏 Updating to size: ${baseSize[0]}x${baseSize[1]}`);
    
    // Update all markers in one go
    this.batchUpdateIconSize(baseSize);
  },
  
  /**
   * Batch update icon sizes
   * Process in chunks to avoid UI freeze
   */
  batchUpdateIconSize(newSize) {
    const markers = Object.values(MarkerManager.activeMarkers);
    const CHUNK_SIZE = 100; // Process 100 markers per frame
    let index = 0;
    
    const processChunk = () => {
      const end = Math.min(index + CHUNK_SIZE, markers.length);
      
      for (let i = index; i < end; i++) {
        const marker = markers[i];
        const markerKey = marker.markerKey;
        const categoryId = marker.categoryId;
        const specialIcon = marker.specialIcon;
        const floor = marker.floor;
        const hasBadge = marker.hasBadge;
        
        // Get marker data
        const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
        if (!markerData) continue;
        
        // Create new icon with correct size
        let newIcon;
        if (typeof getIconByCategoryWithSpecial !== 'undefined') {
          newIcon = getIconByCategoryWithSpecial(categoryId, specialIcon, newSize);
        } else if (typeof getIconByCategory !== 'undefined') {
          newIcon = getIconByCategory(categoryId, newSize);
        }
        
        if (!newIcon) continue;
        
        // Add badge if needed
        if (hasBadge && floor) {
          newIcon = this.createIconWithBadge(newIcon, floor, newSize);
        }
        
        // Update marker icon instantly
        marker.setIcon(newIcon);
      }
      
      index = end;
      
      // Continue with next chunk
      if (index < markers.length) {
        requestAnimationFrame(processChunk);
      } else {
        console.log(`✅ Updated ${markers.length} marker icons`);
      }
    };
    
    processChunk();
  },
  
  /**
   * Create icon with floor badge
   */
  createIconWithBadge(baseIcon, markerFloor, iconSize) {
    const baseHtml = baseIcon.options.html || "";
    const badgeSize = Math.floor(iconSize[0] * 0.3);

    return L.divIcon({
      html: `
        <div style="position:relative;width:${iconSize[0]}px;height:${iconSize[1]}px;">
          ${baseHtml}
          <img src="${ICON_BASE_URL}layericon.png"
            style="
              position:absolute;
              bottom:0;
              right:0;
              width:${badgeSize}px;
              height:${badgeSize}px;
              border:2px solid rgba(0,0,0,0.5);
              border-radius:50%;
              background:rgba(0,0,0,0.7);
              box-shadow:0 2px 4px rgba(0,0,0,0.5);
              z-index:10;
            ">
        </div>
      `,
      iconSize: iconSize,
      iconAnchor: [iconSize[0] / 2, iconSize[1]],
      popupAnchor: [0, -iconSize[1]],
      className: "no-default-icon-bg marker-with-badge"
    });
  }
};

// ========================================
// INTEGRATION WITH MARKER MANAGER
// ========================================

// Override MarkerManager.init untuk include resizer
const originalMarkerManagerInit = MarkerManager.init;
MarkerManager.init = function(map) {
  // Call original init
  originalMarkerManagerInit.call(this, map);
  
  // Initialize instant resizer
  InstantIconResizer.init(map);
};

// ========================================
// EXPORT
// ========================================
window.InstantIconResizer = InstantIconResizer;

console.log('✅ InstantIconResizer loaded');