/**
 * Icon definitions for different marker types
 * Centralized icon management system for all categories
 */

// Base URL for icons
const ICON_BASE_URL = "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/";

/**
 * Icon Configuration
 * Maps category IDs to their icon overlay images
 */
const ICON_CONFIG = {
  baseIcon: `${ICON_BASE_URL}default.webp`,

  overlays: {
    "1": "batuteleport.webp",
    "2": "petiharta.webp",
    "3": "strange.webp",
    "4": "soundofheaven.webp",
    "5": "gua.webp",
    "6": "windingpathinsearchoftranquility.webp",
    "7": "windsacrifaceandfiretour.webp",
    "8": "relic.webp",
    "9": "catplay.webp",
    "10": "injustic.webp",
    "11": "adventure.webp",
    "12": "meow.webp",
    "13": "knoweverything.webp",
    "14": "lightanddarkstory.webp",
    "15": "moonshadowoverlap.webp",
    "16": "scarecrow.webp",
    "17": "treasureinpalmofyourhand.webp",
    "18": "gourmetfood.webp",
    "19": "specialmuscles.webp",
    "20": "toilet.webp",
    "21": "healing.webp",
    "22": "makefriend.webp",
    "23": "argument.webp",
    "24": "book.webp",
    "25": "guard.webp",
    "26": "strongehold.webp",
    "27": "boss.webp",
    "28": "jutsu.webp"
  },

  names: {
    "1": "Teleport Landmark",
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
    "13": "Wander Tales",
    "14": "Tales and Echoes",
    "15": "Overlapping Moon Shadows",
    "16": "Scarecrow",
    "17": "Precious",
    "18": "Gourmet Food",
    "19": "Special Strange",
    "20": "Toilet",
    "21": "Healing",
    "22": "Make a Friend",
    "23": "Argument",
    "24": "Book",
    "25": "Guard",
    "26": "Stronghold",
    "27": "Boss",
    "28": "Material Art"

},
  defaultSize: [32, 32],
  defaultAnchor: [16, 32],
  defaultPopupAnchor: [0, -32]
};

// Storage for initialized Leaflet icons
const ICONS = {};
const FAILED_ICONS = new Set();

function getIconUrl(categoryId) {
  const overlay = ICON_CONFIG.overlays[String(categoryId)];
  return overlay ? ICON_BASE_URL + overlay : ICON_CONFIG.baseIcon;
}

function getCategoryName(categoryId) {
  return ICON_CONFIG.names[String(categoryId)] || `Category ${categoryId}`;
}

function getOverlayUrl(categoryId) {
  const overlay = ICON_CONFIG.overlays[String(categoryId)];
  return overlay ? ICON_BASE_URL + overlay : ICON_CONFIG.baseIcon;
}

function getAllCategories() {
  return Object.keys(ICON_CONFIG.overlays).map(id => ({
    id: id,
    name: getCategoryName(id),
    iconUrl: getIconUrl(id),
    overlayUrl: getOverlayUrl(id)
  }));
}

function testIconUrl(url, categoryId) {
  const img = new Image();
  img.onload = function() {};
  img.onerror = function() {
    FAILED_ICONS.add(categoryId);
  };
  img.src = url;
}

function initializeIcons() {
  try {
    if (typeof L === 'undefined') {
      throw new Error("Leaflet (L) is not loaded yet!");
    }

    ICONS.default = L.icon({
      iconUrl: ICON_CONFIG.baseIcon,
      iconSize: ICON_CONFIG.defaultSize,
      iconAnchor: ICON_CONFIG.defaultAnchor,
      popupAnchor: ICON_CONFIG.defaultPopupAnchor
    });

    Object.keys(ICON_CONFIG.overlays).forEach(categoryId => {
      const iconUrl = getIconUrl(categoryId);

      ICONS[categoryId] = L.icon({
        iconUrl: iconUrl,
        iconSize: ICON_CONFIG.defaultSize,
        iconAnchor: ICON_CONFIG.defaultAnchor,
        popupAnchor: ICON_CONFIG.defaultPopupAnchor
      });

      testIconUrl(iconUrl, categoryId);
    });

  } catch (error) {
    throw error;
  }
}

function getIconByCategory(categoryId) {
  const id = String(categoryId);
  if (ICONS[id]) return ICONS[id];
  return ICONS.default || new L.Icon.Default();
}

function createIconHTML(categoryId, options = {}) {
  const width = options.width || 32;
  const height = options.height || 32;
  const className = options.className || 'icon-image';
  const iconUrl = getIconUrl(categoryId);
  const categoryName = getCategoryName(categoryId);
  return `<img src="${iconUrl}" alt="${categoryName}" class="${className}" width="${width}" height="${height}">`;
}

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