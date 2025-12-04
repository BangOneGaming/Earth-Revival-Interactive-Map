/**
 * Icon definitions for different marker types
 * Centralized icon management system for all categories
 */

/**
 * Icon definitions for different marker types
 * Centralized icon management system for all categories
 */

// Base URL for icons
const ICON_BASE_URL = "https://tiles.bgonegaming.win/wherewindmeet/Simbol/";

// Detect device size
const isMobile = window.matchMedia("(max-width: 768px)").matches;

// Icon sizes
const ICON_SIZE_PC = [48, 48];
const ICON_ANCHOR_PC = [24, 48];
const ICON_POPUP_ANCHOR_PC = [0, -48];

const ICON_SIZE_MOBILE = [32, 32];
const ICON_ANCHOR_MOBILE = [16, 32];
const ICON_POPUP_ANCHOR_MOBILE = [0, -32];

// Apply based on device
const DEFAULT_SIZE = isMobile ? ICON_SIZE_MOBILE : ICON_SIZE_PC;
const DEFAULT_ANCHOR = isMobile ? ICON_ANCHOR_MOBILE : ICON_ANCHOR_PC;
const DEFAULT_POPUP_ANCHOR = isMobile ? ICON_POPUP_ANCHOR_MOBILE : ICON_POPUP_ANCHOR_PC;

/**
 * Icon Configuration
 * Maps category IDs to their icon overlay images
 */
const ICON_CONFIG = {
  baseIcon: `${ICON_BASE_URL}default.png`,

  overlays: {
    "1": "batuteleport.webp",
    "2": "petiharta.webp",
    "3": "aneh.webp",
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
    "28": "jutsu.webp",
    "29": "fishing.webp",
    "30": "pot.webp",
    "31": "miaodao.webp",
    "32": "archer.webp",
    "33": "melody.webp",
    "34": "riddle.webp",
    "35": "summo.webp",
    "36": "tehnik.webp",
    "37": "innerway.webp"
  },

  names: {
    "1": "Teleport Landmark",
    "2": "Treasure Chest",
    "3": "Oddities",
    "5": "Cave",
    "4": "Universal Harmony",
    "6": "Hidden Path",
    "7": "Wild Ritual Ghost Fire",
    "8": "Antique",
    "9": "Cat Play",
    "10": "Injustice",
    "11": "Encounter Quest",
    "12": "Meow Meow Treasure",
    "13": "Wander Tales",
    "14": "Tales and Echoes",
    "15": "Overlapping Moon Shadows",
    "16": "Scarecrow",
    "17": "Precious",
    "18": "Gourmet Food",
    "19": "Special Strange",
    "20": "Toilet",
    "21": "Healing Ilnies",
    "22": "Material Fellowship",
    "23": "Gift of Gab",
    "24": "Experience",
    "25": "Guard",
    "26": "Outpost",
    "27": "World Boss",
    "28": "Material Art",
    "29": "Fishing Spot",
    "30": "Pitch Pot",
    "31": "Miaodao",
    "32": "Archer Contest",
    "33": "Graceful Melody",
    "34": "Riddle",
    "35": "Sumo",
    "36": "Mystic Skill",
    "37": "Inner Ways"
  },

  // Custom sizes per category
  specialSizes: {
    "1": {
      size: isMobile ? [44, 44] : [64, 64],
      anchor: isMobile ? [22, 44] : [32, 64],
      popupAnchor: isMobile ? [0, -44] : [0, -64]
    }
  },

  // Default sizes
  defaultSize: DEFAULT_SIZE,
  defaultAnchor: DEFAULT_ANCHOR,
  defaultPopupAnchor: DEFAULT_POPUP_ANCHOR
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

function createCompositeLeafletIcon(categoryId) {
  const overlayUrl = getIconUrl(categoryId);
  const baseUrl = ICON_CONFIG.baseIcon;

  const special = ICON_CONFIG.specialSizes[categoryId];
  const size = special?.size || ICON_CONFIG.defaultSize;
  const anchor = special?.anchor || ICON_CONFIG.defaultAnchor;
  const popupAnchor = special?.popupAnchor || ICON_CONFIG.defaultPopupAnchor;

  // === KHUSUS KATEGORI 1 → TANPA BACKGROUND ===
  if (String(categoryId) === "1") {
    return L.divIcon({
      html: `
        <div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
          <img src="${overlayUrl}" style="width:100%;height:100%;z-index:2;">
        </div>
      `,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: popupAnchor,
      className: "no-default-icon-bg"
    });
  }

  // === KATEGORI LAIN → BACKGROUND + OVERLAY ===
return L.divIcon({
  html: `
    <div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
      <!-- Background lebih besar (120%) -->
      <img src="${baseUrl}" 
           style="
             position:absolute;
             top:-10%; left:-10%;
             width:120%; height:120%;
             z-index:1;
           ">

      <!-- Overlay lebih kecil (60%) -->
      <img src="${overlayUrl}" 
           style="
             position:absolute;
             top:10%; left:20%;
             width:60%; height:60%;
             z-index:2;
           ">
    </div>
  `,
  iconSize: size,
  iconAnchor: anchor,
  popupAnchor: popupAnchor,
  className: "no-default-icon-bg"
});
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
  const special = ICON_CONFIG.specialSizes[categoryId];

  ICONS[categoryId] = createCompositeLeafletIcon(categoryId);

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


/**
 * Get icon URL dengan support untuk special_icon
 */
function getIconUrlWithSpecial(categoryId, specialIcon) {
  if (specialIcon && specialIcon.trim() !== '') {

    // KHUSUS category 37 = Inner Ways
    if (String(categoryId) === "37") {
      return `${ICON_BASE_URL}innerway/${specialIcon}.webp`;
    }

    // Selain Inner Ways tetap normal
    return `${ICON_BASE_URL}${specialIcon}.webp`;
  }
  
  const overlay = ICON_CONFIG.overlays[String(categoryId)];
  return overlay ? ICON_BASE_URL + overlay : ICON_CONFIG.baseIcon;
}

/**
 * Create composite icon dengan support special_icon
 */
/**
 * Create composite icon dengan support special_icon
 * ✨ FIXED: Special icon TANPA background (langsung icon saja)
 */
/**
 * Create composite icon dengan support special_icon
 * ✨ FIXED: Special icon TANPA background (langsung icon saja)
 * ✨ FIXED: Aspect ratio dijaga dengan object-fit: contain
 */
function createCompositeLeafletIconWithSpecial(categoryId, specialIcon) {
  const overlayUrl = getIconUrlWithSpecial(categoryId, specialIcon);
  const baseUrl = ICON_CONFIG.baseIcon;

  const special = ICON_CONFIG.specialSizes[categoryId];
  const size = special?.size || ICON_CONFIG.defaultSize;
  const anchor = special?.anchor || ICON_CONFIG.defaultAnchor;
  const popupAnchor = special?.popupAnchor || ICON_CONFIG.defaultPopupAnchor;

  // ✨ JIKA ADA SPECIAL ICON → TANPA BACKGROUND (seperti category 1)
  if (specialIcon && specialIcon.trim() !== '') {
    return L.divIcon({
      html: `
        <div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
          <img src="${overlayUrl}" 
               style="width:100%;height:100%;object-fit:contain;z-index:2;">
        </div>
      `,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: popupAnchor,
      className: "no-default-icon-bg"
    });
  }

  // Category 1 (Teleport) juga tanpa background
  if (String(categoryId) === "1") {
    return L.divIcon({
      html: `
        <div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
          <img src="${overlayUrl}" 
               style="width:100%;height:100%;object-fit:contain;z-index:2;">
        </div>
      `,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: popupAnchor,
      className: "no-default-icon-bg"
    });
  }

  // Kategori biasa → Background + Overlay
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
        <img src="${baseUrl}" 
             style="position:absolute;top:-10%;left:-10%;width:120%;height:120%;z-index:1;">
        <img src="${overlayUrl}" 
             style="position:absolute;top:10%;left:20%;width:60%;height:60%;z-index:2;">
      </div>
    `,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: popupAnchor,
    className: "no-default-icon-bg"
  });
}

/**
 * Get icon by category dengan support special_icon
 */
function getIconByCategoryWithSpecial(categoryId, specialIcon) {
  if (specialIcon && specialIcon.trim() !== '') {
    return createCompositeLeafletIconWithSpecial(categoryId, specialIcon);
  }
  
  const id = String(categoryId);
  if (ICONS[id]) return ICONS[id];
  return ICONS.default || new L.Icon.Default();
}


window.IconManager = {
  getIconUrl,
  getCategoryName,
  getOverlayUrl,
  getAllCategories,
  getIconByCategory,
  createIconHTML,
  createCompositeIconHTML,
  // ✅ Tambahkan ini
  getIconUrlWithSpecial,
  getIconByCategoryWithSpecial,
  createCompositeLeafletIconWithSpecial,
  ICON_CONFIG,
  ICONS,
  FAILED_ICONS
};