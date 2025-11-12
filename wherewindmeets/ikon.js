/**
 * Icon definitions for different marker types
 * Centralized icon management system for all categories
 */

console.log("📦 Loading icons.js...");

// Base URL for icons
const ICON_BASE_URL = "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/";

/**
 * Icon Configuration
 * Maps category IDs to their icon overlay images
 */
const ICON_CONFIG = {
  // Base marker icon (background)
  baseIcon: `${ICON_BASE_URL}default.webp`,
  
  // Icon overlays for each category
  overlays: {
    "1": "batuteleport.webp",           // Batu Teleport
    "2": "petiharta.webp",              // Treasure Chest
    "3": "strange.webp",                // Aneh/Strange
    "4": "soundofheaven.webp",          // Sound of Heaven
    "5": "gua.webp",                    // Cave
    "6": "windingpathinsearchoftranquility.webp",  // Wind Of Path
    "7": "windsacrifaceandfiretour.webp",          // Wind of Sacrifice
    "8": "relic.webp",                  // Relic of Past
    "9": "catplay.webp",                // Cat
    "10": "injustic.webp",            // Injustice
    "11": "adventure.webp",
    "12": "meow.webp",
    "13": "knoweverything.webp",
    "14": "lightanddarkstory.webp",
    "15": "moonshadowoverlap.webp",
    "16": "scarecrow.webp",
    "17": "treasureinpalmofyourhand.webp",
    "18": "gourmetfood.webp",
    "19": "specialmuscles.webp",
    "20": "toilet.webp"
  },

  // Category names (for display in UI)
  names: {
    "1": "Stone",
    "2": "Treasure Chest",
    "3": "Strange",
    "5": "Cave",
    "4": "Sound of Heaven",
    "6": "Wind Of Path In Search Of Tranquility",
    "7": "Wind of Sacrifice and Fire Tour",
    "8": "Relic of Past",
    "9": "Cat",
    "10": "Injustice",
    "11": "Adventure",
    "12": "Meow",
    "13": "Knowledge",
    "14": "Category 14",
    "15": "Category 15",
    "16": "Category 16",
    "17": "Category 17",
    "18": "Category 18",
    "19": "Category 19",
    "20": "Category 20"
  },

  // Default icon settings
  defaultSize: [32, 32],
  defaultAnchor: [16, 32],
  defaultPopupAnchor: [0, -32]
};

// Storage for initialized Leaflet icons
const ICONS = {};

// Track failed icon loads
const FAILED_ICONS = new Set();

/**
 * Get full icon URL for a category
 * @param {string} categoryId - Category ID
 * @returns {string} Full URL to icon image
 */
function getIconUrl(categoryId) {
  const overlay = ICON_CONFIG.overlays[String(categoryId)];
  if (overlay) {
    return ICON_BASE_URL + overlay;
  }
  return ICON_CONFIG.baseIcon;
}

/**
 * Get category name
 * @param {string} categoryId - Category ID
 * @returns {string} Category name
 */
function getCategoryName(categoryId) {
  return ICON_CONFIG.names[String(categoryId)] || `Category ${categoryId}`;
}

/**
 * Get icon overlay image URL (for HTML/CSS use)
 * @param {string} categoryId - Category ID
 * @returns {string} URL to overlay image
 */
function getOverlayUrl(categoryId) {
  const overlay = ICON_CONFIG.overlays[String(categoryId)];
  return overlay ? ICON_BASE_URL + overlay : ICON_CONFIG.baseIcon;
}

/**
 * Get all available categories
 * @returns {Array} Array of category objects {id, name, iconUrl}
 */
function getAllCategories() {
  return Object.keys(ICON_CONFIG.overlays).map(id => ({
    id: id,
    name: getCategoryName(id),
    iconUrl: getIconUrl(id),
    overlayUrl: getOverlayUrl(id)
  }));
}

/**
 * Test if icon URL is accessible (for debugging)
 * @param {string} url - Icon URL to test
 * @param {string} categoryId - Category ID
 */
function testIconUrl(url, categoryId) {
  const img = new Image();
  img.onload = function() {
    console.log(`✅ Icon loaded: Category ${categoryId} (${getCategoryName(categoryId)})`);
  };
  img.onerror = function() {
    console.error(`❌ Failed to load icon: Category ${categoryId} - ${url}`);
    FAILED_ICONS.add(categoryId);
  };
  img.src = url;
}

/**
 * Initialize all icons for Leaflet
 */
function initializeIcons() {
  console.log("🎨 Initializing icons...");
  
  try {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      throw new Error("Leaflet (L) is not loaded yet!");
    }

    // Create default icon
    ICONS.default = L.icon({
      iconUrl: ICON_CONFIG.baseIcon,
      iconSize: ICON_CONFIG.defaultSize,
      iconAnchor: ICON_CONFIG.defaultAnchor,
      popupAnchor: ICON_CONFIG.defaultPopupAnchor
    });

    console.log("🔍 Testing icon URLs...");

    // Create icons for all categories
    Object.keys(ICON_CONFIG.overlays).forEach(categoryId => {
      const iconUrl = getIconUrl(categoryId);
      
      ICONS[categoryId] = L.icon({
        iconUrl: iconUrl,
        iconSize: ICON_CONFIG.defaultSize,
        iconAnchor: ICON_CONFIG.defaultAnchor,
        popupAnchor: ICON_CONFIG.defaultPopupAnchor
      });
      
      // Test if icon image exists
      testIconUrl(iconUrl, categoryId);
    });

    console.log(`✅ ${Object.keys(ICONS).length} icons initialized`);
    
    // Show summary after a delay to allow image tests to complete
    setTimeout(() => {
      if (FAILED_ICONS.size > 0) {
        console.warn(`⚠️ ${FAILED_ICONS.size} icons failed to load:`, Array.from(FAILED_ICONS));
      } else {
        console.log("✅ All icon images loaded successfully!");
      }
    }, 2000);
    
  } catch (error) {
    console.error("❌ Error initializing icons:", error);
    throw error;
  }
}

/**
 * Get Leaflet icon object by category ID
 * @param {string} categoryId - The category ID
 * @returns {L.Icon} Leaflet icon object
 */
function getIconByCategory(categoryId) {
  const id = String(categoryId);
  
  // Return specific icon if exists
  if (ICONS[id]) {
    return ICONS[id];
  }
  
  // Return default icon as fallback
  console.warn(`⚠️ Icon for category ${id} not configured, using default`);
  return ICONS.default || new L.Icon.Default();
}

/**
 * Create HTML icon element (for use in filter panel or other UI)
 * @param {string} categoryId - Category ID
 * @param {object} options - Options {width, height, className}
 * @returns {string} HTML string
 */
function createIconHTML(categoryId, options = {}) {
  const width = options.width || 32;
  const height = options.height || 32;
  const className = options.className || 'icon-image';
  const iconUrl = getIconUrl(categoryId);
  const categoryName = getCategoryName(categoryId);
  
  return `<img src="${iconUrl}" alt="${categoryName}" class="${className}" width="${width}" height="${height}">`;
}

/**
 * Create icon with overlay (composite icon for advanced UI)
 * @param {string} categoryId - Category ID
 * @returns {string} HTML string with base + overlay
 */
function createCompositeIconHTML(categoryId) {
  const overlayUrl = getOverlayUrl(categoryId);
  const categoryName = getCategoryName(categoryId);
  
  return `
    <div class="composite-icon" style="position:relative;width:32px;height:32px;">
      <img src="${ICON_CONFIG.baseIcon}" style="position:absolute;top:0;left:0;width:100%;height:100%;" alt="base">
      <img src="${overlayUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" alt="${categoryName}">
    </div>
  `;
}

// Export for global access
window.IconManager = {
  getIconUrl,
  getCategoryName,
  getOverlayUrl,
  getAllCategories,
  getIconByCategory,
  createIconHTML,
  createCompositeIconHTML,
  ICON_CONFIG,
  ICONS,
  FAILED_ICONS
};

console.log("✅ icons.js loaded successfully");
console.log(`📊 Total categories configured: ${Object.keys(ICON_CONFIG.overlays).length}`);