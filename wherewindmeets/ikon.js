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
    "28": "jutsu.webp",
    "29": "fishing.webp",
    "30": "pot.webp",
    "31": "miaodao.webp",
    "32": "archer.webp",
    "33": "melody.webp",
    "34": "riddle.webp",
    "35": "summo.webp",
    "36": "tehnik.webp",
    "37": "innerway.webp",
    "38": "NPC.webp",
    "39": "camp.webp",
    "40": "dogplay.webp",
    "41": "board.webp",
    "42": "rideandarcher.webp",
    "43": "chasingmoon.webp"
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
    "17": "Miniature Treasure",
    "18": "Gourmet Food",
    "19": "Special Oddities",
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
    "37": "Inner Ways",
    "38": "Old Friend",
    "39": "Camp",
    "40": "Dog Play",
    "41": "Board",
    "42": "Ride And Archer Challenge",
    "43": "Chasing The Moon"
  },
  specialSizes: {
    "1": {
      size: isMobile ? [44, 44] : [64, 64],
      anchor: isMobile ? [22, 44] : [32, 64],
      popupAnchor: isMobile ? [0, -44] : [0, -64]
    }
  },
  defaultSize: DEFAULT_SIZE,
  defaultAnchor: DEFAULT_ANCHOR,
  defaultPopupAnchor: DEFAULT_POPUP_ANCHOR
};

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
function isCommonChest(markerName) {
  if (!markerName) return false;
  const name = markerName.trim();
  const commonChests = [
    "Chest Collection - Rocket (Burn Vines, Explosive Barrel, Sunrise-Sunset Flowers)",
    "Chest Collection - Star-Grabbing Moon (Snakes Gathered, Guarded by Humans)",
    "Treasure Collection","Treasure Chest Gathering","Treasure Chest Collection",
    "Treasure Chest collection","Treasure Chest"
  ];
  if (commonChests.includes(name)) return true;
  return name.toLowerCase().includes("common chest");
}
function getChestOverlayByName(markerName) {
  if (isCommonChest(markerName)) return `${ICON_BASE_URL}petiharta.webp`;
  return `${ICON_BASE_URL}puzzle_chest.png`;
}

// ============================================================
// ★ MODIFIKASI: helper untuk resolve overlay URL category 2
// Prioritas: special_icon → fallback nama marker → fallback default
// ============================================================
function getChestOverlayResolved(specialIcon, markerName) {
  // Prioritas 1: special_icon dari data JSON
  if (specialIcon && specialIcon.trim() !== '') {
    // Kalau sudah ada ekstensi (misal "creature.webp") pakai langsung
    // Kalau tidak ada ekstensi, tambah .webp
    const filename = specialIcon.trim().includes('.')
      ? specialIcon.trim()
      : specialIcon.trim() + '.webp';
    return `${ICON_BASE_URL}${filename}`;
  }
  // Prioritas 2: fallback ke logika nama marker (perilaku lama)
  return getChestOverlayByName(markerName);
}

function getAllCategories() {
  return Object.keys(ICON_CONFIG.overlays).map(id => ({
    id, name: getCategoryName(id), iconUrl: getIconUrl(id), overlayUrl: getOverlayUrl(id)
  }));
}
function testIconUrl(url, categoryId) {
  const img = new Image();
  img.onerror = () => FAILED_ICONS.add(categoryId);
  img.src = url;
}

// ============================================================
// createCompositeLeafletIconWithMarkerName
// ★ MODIFIKASI: tambah parameter specialIcon (opsional)
// ============================================================
function createCompositeLeafletIconWithMarkerName(categoryId, markerName, specialIcon) {
  const baseUrl = ICON_CONFIG.baseIcon;
  const special = ICON_CONFIG.specialSizes[categoryId];
  const size = special?.size || ICON_CONFIG.defaultSize;
  const anchor = special?.anchor || ICON_CONFIG.defaultAnchor;
  const popupAnchor = special?.popupAnchor || ICON_CONFIG.defaultPopupAnchor;

  if (String(categoryId) === "2") {
    // ★ Gunakan helper baru yang prioritaskan special_icon
    const overlayUrl = getChestOverlayResolved(specialIcon, markerName);
    return L.divIcon({
      html: `<div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
        <img src="${baseUrl}" style="position:absolute;top:-10%;left:-10%;width:120%;height:120%;z-index:1;">
        <img src="${overlayUrl}" style="position:absolute;top:10%;left:20%;width:60%;height:60%;z-index:2;">
      </div>`,
      iconSize: size, iconAnchor: anchor, popupAnchor, className: "no-default-icon-bg"
    });
  }
  return getIconByCategory(categoryId);
}

function createCompositeLeafletIcon(categoryId) {
  const overlayUrl = getIconUrl(categoryId);
  const baseUrl = ICON_CONFIG.baseIcon;
  const special = ICON_CONFIG.specialSizes[categoryId];
  const size = special?.size || ICON_CONFIG.defaultSize;
  const anchor = special?.anchor || ICON_CONFIG.defaultAnchor;
  const popupAnchor = special?.popupAnchor || ICON_CONFIG.defaultPopupAnchor;
  if (String(categoryId) === "1") {
    return L.divIcon({
      html: `<div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
        <img src="${overlayUrl}" style="width:100%;height:100%;z-index:2;">
      </div>`,
      iconSize: size, iconAnchor: anchor, popupAnchor, className: "no-default-icon-bg"
    });
  }
  return L.divIcon({
    html: `<div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
      <img src="${baseUrl}" style="position:absolute;top:-10%;left:-10%;width:120%;height:120%;z-index:1;">
      <img src="${overlayUrl}" style="position:absolute;top:10%;left:20%;width:60%;height:60%;z-index:2;">
    </div>`,
    iconSize: size, iconAnchor: anchor, popupAnchor, className: "no-default-icon-bg"
  });
}
function initializeIcons() {
  if (typeof L === 'undefined') throw new Error("Leaflet (L) is not loaded yet!");
  ICONS.default = L.icon({
    iconUrl: ICON_CONFIG.baseIcon,
    iconSize: ICON_CONFIG.defaultSize,
    iconAnchor: ICON_CONFIG.defaultAnchor,
    popupAnchor: ICON_CONFIG.defaultPopupAnchor
  });
  Object.keys(ICON_CONFIG.overlays).forEach(categoryId => {
    ICONS[categoryId] = createCompositeLeafletIcon(categoryId);
    testIconUrl(getIconUrl(categoryId), categoryId);
  });
}
function getIconByCategory(categoryId) {
  const id = String(categoryId);
  if (ICONS[id]) return ICONS[id];
  return ICONS.default || new L.Icon.Default();
}

// ============================================================
// getIconByCategoryWithMarkerName
// ★ MODIFIKASI: tambah parameter specialIcon (opsional)
// Cara pakai di map.js:
//   getIconByCategoryWithMarkerName(marker.category_id, marker.name, marker.special_icon)
// ============================================================
function getIconByCategoryWithMarkerName(categoryId, markerName, specialIcon) {
  if (String(categoryId) === "2") {
    return createCompositeLeafletIconWithMarkerName(categoryId, markerName, specialIcon);
  }
  return getIconByCategory(categoryId);
}

function createIconHTML(categoryId, options = {}) {
  const width = options.width || 32, height = options.height || 32;
  const className = options.className || 'icon-image';
  return `<img src="${getIconUrl(categoryId)}" alt="${getCategoryName(categoryId)}" class="${className}" width="${width}" height="${height}">`;
}
function createCompositeIconHTML(categoryId) {
  return `<div class="composite-icon" style="position:relative;width:32px;height:32px;">
    <img src="${ICON_CONFIG.baseIcon}" style="position:absolute;top:0;left:0;width:100%;height:100%;" alt="base">
    <img src="${getOverlayUrl(categoryId)}" style="position:absolute;top:0;left:0;width:100%;height:100%;" alt="${getCategoryName(categoryId)}">
  </div>`;
}
function getIconUrlWithSpecial(categoryId, specialIcon) {
  if (specialIcon && specialIcon.trim() !== '') {
    if (String(categoryId) === "37") return `${ICON_BASE_URL}innerway/${specialIcon}.webp`;
    return `${ICON_BASE_URL}${specialIcon}.webp`;
  }
  const overlay = ICON_CONFIG.overlays[String(categoryId)];
  return overlay ? ICON_BASE_URL + overlay : ICON_CONFIG.baseIcon;
}
function createCompositeLeafletIconWithSpecial(categoryId, specialIcon) {
  const overlayUrl = getIconUrlWithSpecial(categoryId, specialIcon);
  const baseUrl = ICON_CONFIG.baseIcon;
  const special = ICON_CONFIG.specialSizes[categoryId];
  const size = special?.size || ICON_CONFIG.defaultSize;
  const anchor = special?.anchor || ICON_CONFIG.defaultAnchor;
  const popupAnchor = special?.popupAnchor || ICON_CONFIG.defaultPopupAnchor;
  if (specialIcon && specialIcon.trim() !== '') {
    return L.divIcon({
      html: `<div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
        <img src="${overlayUrl}" style="width:100%;height:100%;object-fit:contain;z-index:2;">
      </div>`,
      iconSize: size, iconAnchor: anchor, popupAnchor, className: "no-default-icon-bg"
    });
  }
  if (String(categoryId) === "1") {
    return L.divIcon({
      html: `<div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
        <img src="${overlayUrl}" style="width:100%;height:100%;object-fit:contain;z-index:2;">
      </div>`,
      iconSize: size, iconAnchor: anchor, popupAnchor, className: "no-default-icon-bg"
    });
  }
  return L.divIcon({
    html: `<div style="position:relative;width:${size[0]}px;height:${size[1]}px;">
      <img src="${baseUrl}" style="position:absolute;top:-10%;left:-10%;width:120%;height:120%;z-index:1;">
      <img src="${overlayUrl}" style="position:absolute;top:10%;left:20%;width:60%;height:60%;z-index:2;">
    </div>`,
    iconSize: size, iconAnchor: anchor, popupAnchor, className: "no-default-icon-bg"
  });
}
function getIconByCategoryWithSpecial(categoryId, specialIcon) {
  if (specialIcon && specialIcon.trim() !== '') return createCompositeLeafletIconWithSpecial(categoryId, specialIcon);
  const id = String(categoryId);
  if (ICONS[id]) return ICONS[id];
  return ICONS.default || new L.Icon.Default();
}

// ============================================================
// VISIBILITY CONTROL
// ============================================================
let iconsVisible = false;
function hideAllIcons() {
  const style = document.createElement('style');
  style.id = 'icon-visibility-control';
  style.textContent = `.leaflet-marker-icon { opacity:0 !important; visibility:hidden !important; transition:none !important; }`;
  document.head.appendChild(style);
  iconsVisible = false;
}
function showAllIcons() {
  const style = document.getElementById('icon-visibility-control');
  if (style) style.remove();
  iconsVisible = true;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hideAllIcons);
} else {
  hideAllIcons();
}

// ============================================================
// ★ NEON WALL CLOCK — SVG Icon
// ============================================================

/**
 * Build raw SVG string untuk jam dinding neon.
 * Putih neon + glow emas kuning. Jarum bisa dirotate via JS.
 * @param {number} size — ukuran render px (viewBox tetap 100×100)
 */
function buildWallClockSVG(size = 64) {
  const uid = `wc${size}`;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100"
     xmlns="http://www.w3.org/2000/svg"
     style="overflow:visible;display:block;">
  <defs>
    <filter id="nO_${uid}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4"  result="b1"/>
      <feGaussianBlur stdDeviation="9"  result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="nI_${uid}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="nT_${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- BG hitam -->
  <circle cx="50" cy="50" r="43" fill="#050505"/>

  <!-- Glow emas luar -->
  <circle cx="50" cy="50" r="44"
    fill="none" stroke="#d4a800" stroke-width="5"
    filter="url(#nO_${uid})" opacity="0.55"/>

  <!-- Ring putih utama -->
  <circle cx="50" cy="50" r="44"
    fill="none" stroke="#ffffff" stroke-width="2"
    filter="url(#nI_${uid})"/>

  <!-- Ring dalam accent tipis -->
  <circle cx="50" cy="50" r="37"
    fill="none" stroke="#fff8cc" stroke-width="0.6" opacity="0.25"/>

  <!-- Tick cardinal — putih -->
  <line x1="50" y1="9"  x2="50" y2="17" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>
  <line x1="91" y1="50" x2="83" y2="50" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>
  <line x1="50" y1="91" x2="50" y2="83" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>
  <line x1="9"  y1="50" x2="17" y2="50" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" filter="url(#nT_${uid})"/>

  <!-- Tick minor — emas -->
  <g stroke="#d4a800" stroke-width="1.2" stroke-linecap="round" opacity="0.55">
    <line x1="72.5" y1="12.3" x2="69.3" y2="17.8"/>
    <line x1="87.7" y1="27.5" x2="82.2" y2="30.7"/>
    <line x1="87.7" y1="72.5" x2="82.2" y2="69.3"/>
    <line x1="72.5" y1="87.7" x2="69.3" y2="82.2"/>
    <line x1="27.5" y1="87.7" x2="30.7" y2="82.2"/>
    <line x1="12.3" y1="72.5" x2="17.8" y2="69.3"/>
    <line x1="12.3" y1="27.5" x2="17.8" y2="30.7"/>
    <line x1="27.5" y1="12.3" x2="30.7" y2="17.8"/>
  </g>

  <!-- Jarum JAM — class wc-hour, pivot (50,50) -->
  <line class="wc-hour"
    x1="50" y1="50" x2="50" y2="29"
    stroke="#ffffff" stroke-width="4" stroke-linecap="round"
    filter="url(#nI_${uid})"/>

  <!-- Jarum MENIT — class wc-min -->
  <line class="wc-min"
    x1="50" y1="50" x2="50" y2="14"
    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"
    filter="url(#nT_${uid})"/>

  <!-- Jarum DETIK — class wc-sec, emas -->
  <line class="wc-sec"
    x1="50" y1="50" x2="50" y2="11"
    stroke="#d4a800" stroke-width="1.3" stroke-linecap="round"/>
  <line class="wc-sec-tail"
    x1="50" y1="50" x2="50" y2="61"
    stroke="#d4a800" stroke-width="1.3" stroke-linecap="round"/>

  <!-- Center cap -->
  <circle cx="50" cy="50" r="4"   fill="#ffffff" filter="url(#nI_${uid})"/>
  <circle cx="50" cy="50" r="1.8" fill="#050505"/>
</svg>`;
}

/**
 * Buat Leaflet divIcon jam dinding neon.
 * Gunakan sebagai icon marker biasa.
 */
function createWallClockIcon() {
  const size = isMobile ? 48 : 64;
  const half = size / 2;
  return L.divIcon({
    html: `<div class="wc-icon" style="
              position:relative;
              width:${size}px;
              height:${size}px;
              filter:drop-shadow(0 0 8px #d4a80088);
            ">${buildWallClockSVG(size)}</div>`,
    iconSize:    [size, size],
    iconAnchor:  [half, half],
    popupAnchor: [0, -half],
    className:   "no-default-icon-bg"
  });
}

/**
 * Mulai animasi jarum semua jam dinding yang ada di DOM.
 * Panggil SETELAH marker ditambahkan ke peta.
 * Aman dipanggil berkali-kali — animasi hanya berjalan satu instance.
 */
let _wcAnimRunning = false;
function startWallClockAnimation() {
  if (_wcAnimRunning) return;
  _wcAnimRunning = true;

  function rotateLine(el, deg) {
    el.setAttribute('transform', `rotate(${deg}, 50, 50)`);
  }

  function tick() {
    const now = new Date();
    const h  = now.getHours() % 12;
    const m  = now.getMinutes();
    const s  = now.getSeconds();
    const ms = now.getMilliseconds();

    const secDeg  = (s + ms / 1000) * 6;
    const minDeg  = (m + s  / 60)   * 6;
    const hourDeg = (h + m  / 60)   * 30;

    document.querySelectorAll('.wc-icon').forEach(wrapper => {
      const h = wrapper.querySelector('.wc-hour');
      const m = wrapper.querySelector('.wc-min');
      const s = wrapper.querySelector('.wc-sec');
      const t = wrapper.querySelector('.wc-sec-tail');
      if (h) rotateLine(h, hourDeg);
      if (m) rotateLine(m, minDeg);
      if (s) rotateLine(s, secDeg);
      if (t) rotateLine(t, secDeg);
    });

    requestAnimationFrame(tick);
  }

  tick();
}

// ============================================================
// EXPORTS
// ============================================================
window.IconManager = {
  // — existing —
  getIconUrl,
  getCategoryName,
  getOverlayUrl,
  getAllCategories,
  getIconByCategory,
  getIconByCategoryWithMarkerName,   // ★ signature berubah: (categoryId, markerName, specialIcon)
  createIconHTML,
  createCompositeIconHTML,
  getIconUrlWithSpecial,
  getIconByCategoryWithSpecial,
  createCompositeLeafletIconWithSpecial,
  hideAllIcons,
  showAllIcons,
  ICON_CONFIG,
  ICONS,
  FAILED_ICONS,
  // — helpers baru category 2 —
  getChestOverlayResolved,
  // — ★ wall clock —
  buildWallClockSVG,
  createWallClockIcon,
  startWallClockAnimation,
};

window.initializeIcons = initializeIcons;