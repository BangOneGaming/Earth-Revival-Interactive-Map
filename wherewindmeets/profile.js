/**
 * Profile Container Module
 * Modular system for displaying player profile with visited markers stats
 * NOW WITH SETTINGS INTEGRATION
 * 
 * Dependencies:
 * - login.js (for currentUser, isLoggedIn, getUserProfile)
 * - ikon.js (for ICON_CONFIG)
 * - penanda.js (for MarkerManager)
 * - setting.js (for SettingsManager) - OPTIONAL
 * 
 * @author Your Name
 * @version 1.3.0 - Added Logout button
 */

const ProfileContainer = (function() {
  'use strict';

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let container = null;
  let isCollapsed = false;
  let showAllCategories = false;
  const MAX_VISIBLE_CATEGORIES = 0;
  
  const CONFIG = {
    containerId: 'profileContainer',
    position: { top: '70px', right: '20px' },
    updateDelay: 300,
    animationClass: 'animate-in'
  };

  // ==========================================
  // CATEGORY TO SOURCE MAPPING (sama seperti MarkerManager)
  // ==========================================
const CATEGORY_SOURCES = {
  1: 'batutele',
  2: 'chest',
  3: 'strangecollection',
  4: 'yellow',
  5: 'gua',
  6: 'blue',
  7: 'red',
  8: 'peninggalan',
  9: 'kucing',
  10: 'ketidakadilan',
  11: 'petualangan',
  12: 'meong',
  13: 'pengetahuan',
  14: 'cerita',
  15: 'bulan',
  16: 'tidakterhitung',
  17: 'berharga',
  18: 'kulinari',
  19: 'spesial',
  20: 'wc',
  21: 'penyembuhan',
  22: 'buatteman',
  23: 'perdebatan',
  24: 'buku',
  25: 'penjaga',
  26: 'benteng',
  27: 'bos',
  28: 'jurus',
  // Tambahan baru
  29: 'pemancing',
  30: 'mabuk',
  31: 'kartu',
  32: 'panah',
  33: 'melodi',
  34: 'tebakan',
  35: 'gulat',
  36: 'tehnik'
};

// ==========================================
// FIXED CATEGORY NAMES (Hardcoded)
// ==========================================
const CATEGORY_NAMES = {
  "1": "Teleport Landmark",
  "2": "Treasure Chest",
  "3": "Catch Bug",
  "4": "Sound of Heaven",
  "5": "Cave",
  "6": "Wind Of Path In Search Of Tranquility",
  "7": "Wind of Sacrifice and Fire Tour",
  "8": "Relic of Past",
  "9": "Cat Play",
  "10": "Injustice",
  "11": "Adventure",
  "12": "Meow Meow",
  "13": "Wander Tales",
  "14": "Tales and Echoes",
  "15": "Overlapping Moon Shadows",
  "16": "Scarecrow",
  "17": "Precious",
  "18": "Gourmet Food",
  "19": "Special Strange",
  "20": "Toilet",
  "21": "Doctor Treatment",
  "22": "Make a Friend",
  "23": "Argument",
  "24": "Book",
  "25": "Guard",
  "26": "Stronghold",
  "27": "Boss",
  "28": "Material Art",
  // Tambahan baru
  "29": "Fishing Spot",
  "30": "Pitch Pot",
  "31": "Miaodao",
  "32": "Archer Contest",
  "33": "Graceful Melody",
  "34": "Riddle",
  "35": "Sumo",
  "36": "Mystic Skill"
};

// ==========================================
// FIXED CATEGORY ICON FILENAMES (Hardcoded)
// ==========================================
const CATEGORY_ICONS = {
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
  // Tambahan baru
  "29": "fishing.webp",
  "30": "pot.webp",
  "31": "miaodao.webp",
  "32": "archer.webp",
  "33": "melody.webp",
  "34": "riddle.webp",
  "35": "summo.webp",
  "36": "mystic.webp"
};
  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Get all markers from sources (sama seperti MarkerManager.getAllMarkers)
   * @returns {Array} All markers with category info
   */
  function getAllMarkersWithCategories() {
    const allMarkers = [];
    const markerEdits = JSON.parse(localStorage.getItem('markerEdits') || '{}');
    
    // Loop through each category and its source
    Object.entries(CATEGORY_SOURCES).forEach(([categoryId, sourceName]) => {
      const source = window[sourceName];
      
      if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
          const marker = { 
            ...source[key], 
            _key: key,
            categoryId: categoryId, // Assign category ID
            sourceName: sourceName
          };
          
          // Apply any edits from localStorage
          if (markerEdits[key]) {
            if (markerEdits[key].x) marker.x = markerEdits[key].x;
            if (markerEdits[key].y) marker.y = markerEdits[key].y;
            if (markerEdits[key].desc !== undefined) marker.desc = markerEdits[key].desc;
          }
          
          allMarkers.push(marker);
        });
      }
    });

    console.log(`📊 getAllMarkersWithCategories: Found ${allMarkers.length} total markers`);
    return allMarkers;
  }

  /**
   * Get visited markers count grouped by category
   * Now uses proper category detection from sources
   * @returns {Object} Category counts
   */
  function getVisitedCountsByCategory() {
    // CRITICAL: Get from localStorage first, fallback to empty
    let visitedMarkers = {};
    
    try {
      const stored = localStorage.getItem('visitedMarkers');
      if (stored) {
        visitedMarkers = JSON.parse(stored);
        console.log(`💾 Loaded ${Object.keys(visitedMarkers).length} visited markers from localStorage`);
      } else {
        console.warn('⚠️ No visitedMarkers in localStorage yet');
      }
    } catch (e) {
      console.error('❌ Failed to parse visitedMarkers:', e);
      visitedMarkers = {};
    }

    const counts = {};

    // Initialize ALL categories from ICON_CONFIG with 0
    // FALLBACK: If ICON_CONFIG not loaded, create minimal structure
    if (window.ICON_CONFIG && window.ICON_CONFIG.names) {
      Object.keys(window.ICON_CONFIG.names).forEach(categoryId => {
        counts[categoryId] = 0;
      });
      console.log(`📋 Initialized ${Object.keys(counts).length} categories from ICON_CONFIG`);
    } else {
      console.warn('⚠️ ICON_CONFIG.names not found! Using fallback categories...');
      // Fallback: Initialize all 36 categories
      for (let i = 1; i <= 36; i++) {
        counts[String(i)] = 0;
      }
    }

    // Get all markers with proper category assignment
    const allMarkers = getAllMarkersWithCategories();

    console.log(`🔍 Checking visited markers...`);
    console.log(`📍 Total markers in system: ${allMarkers.length}`);
    console.log(`✅ Visited markers to process:`, Object.keys(visitedMarkers).length);

    // Count visited markers per category
    let visitedCount = 0;
    let skippedCount = 0;
    
    Object.keys(visitedMarkers).forEach(markerKey => {
      if (!visitedMarkers[markerKey]) {
        skippedCount++;
        return; // Skip non-visited (false values)
      }

      // Find marker data using _key
      const markerData = allMarkers.find(m => m._key === markerKey);
      
      if (!markerData) {
        console.warn(`⚠️ Marker key "${markerKey}" not found in sources`);
        return;
      }

      if (!markerData.categoryId) {
        console.warn(`⚠️ Marker "${markerKey}" has no categoryId`);
        return;
      }

      const categoryId = String(markerData.categoryId);
      counts[categoryId] = (counts[categoryId] || 0) + 1;
      visitedCount++;

      // Debug log untuk beberapa marker pertama
      if (visitedCount <= 5) {
        const catName = window.ICON_CONFIG?.names?.[categoryId] || `Category ${categoryId}`;
        console.log(`✅ Visited: ${markerKey} → Category ${categoryId} (${catName})`);
      }
    });

    console.log(`✅ Total visited markers counted: ${visitedCount}`);
    console.log(`⏭️ Skipped false markers: ${skippedCount}`);
    console.log(`📊 Counts per category:`, counts);
    
    // Debug: Show sample category data
    const nonZeroCats = Object.entries(counts).filter(([_, count]) => count > 0);
    if (nonZeroCats.length > 0) {
      const [sampleCat, sampleCount] = nonZeroCats[0];
      console.log(`🔍 Sample visited category:`, {
        id: sampleCat,
        name: window.ICON_CONFIG?.names?.[sampleCat] || `Category ${sampleCat}`,
        icon: window.ICON_CONFIG?.overlays?.[sampleCat] || 'default.png',
        count: sampleCount
      });
    }

    return counts;
  }

  /**
   * Get total visited count
   * @returns {number} Total count
   */
  function getTotalVisitedCount() {
    const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
    return Object.values(visitedMarkers).filter(v => v === true).length;
  }

  /**
   * Create background title element
   * @param {string} titleUrl - URL of title image
   * @returns {HTMLElement}
   */
  function createTitleBackground(titleUrl) {
    const titleBg = document.createElement('div');
    titleBg.className = 'profile-title-bg';
    titleBg.style.backgroundImage = `url('${titleUrl}')`;
    return titleBg;
  }

  /**
   * Create logout button with SVG icon
   * @returns {HTMLElement}
   */
  function createLogoutButton() {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'profile-logout-btn';
    logoutBtn.title = 'Logout';
    
    // Styling tombol logout
    logoutBtn.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      border-radius: 4px;
    `;
    
    // SVG logout icon dengan warna kuning kecoklatan
    logoutBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A574" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: all 0.3s ease;">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    `;
    
    // Hover effects
    logoutBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.15)';
      const svg = this.querySelector('svg');
      if (svg) {
        svg.setAttribute('stroke', '#F3E5AB'); // Warna lebih terang saat hover
      }
    });
    
    logoutBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      const svg = this.querySelector('svg');
      if (svg) {
        svg.setAttribute('stroke', '#D4A574'); // Kembali ke warna normal
      }
    });
    
    logoutBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Try to call logout function from login.js
      if (typeof window.handleLogout === 'function') {
        window.handleLogout();
      } else {
        // Fallback: implement logout directly
        console.warn('⚠️ handleLogout not found, using fallback');
        
        const confirmed = confirm("Are you sure you want to logout?");
        if (!confirmed) return;
        
        // Clear data
        localStorage.removeItem("userToken");
        localStorage.removeItem("visitedMarkers");
        
        // Reset all marker opacity to 1.0
        if (typeof MarkerManager !== 'undefined' && MarkerManager.activeMarkers) {
          Object.entries(MarkerManager.activeMarkers).forEach(([key, marker]) => {
            if (marker) {
              // Restore to map if hidden
              if (!marker._map && MarkerManager.map) {
                marker.addTo(MarkerManager.map);
              }
              // Reset opacity to full
              marker.setOpacity(1.0);
            }
          });
          console.log("✅ All marker opacity reset to 1.0");
        }
        
        // Remove profile container
        if (ProfileContainer && ProfileContainer.exists()) {
          ProfileContainer.remove();
        }
        
        // Show notification (if available)
        if (typeof showNotification === 'function') {
          showNotification("You have been logged out successfully", "info");
        }
        
        // Reload page
        setTimeout(() => {
          location.reload();
        }, 500);
      }
    });
    
    return logoutBtn;
  }

  /**
   * Create header section
   * @param {Object} profile - User profile data
   * @param {Object} weaponData - Weapon data
   * @returns {HTMLElement}
   */
  function createHeader(profile, weaponData) {
    const header = document.createElement('div');
    header.className = 'profile-header';

    const weaponImg = document.createElement('img');
    weaponImg.className = 'profile-weapon-img';
    weaponImg.src = weaponData.image;
    weaponImg.alt = profile.weaponType;
    weaponImg.onerror = function() {
      this.style.display = 'none';
    };

    const infoDiv = document.createElement('div');
    infoDiv.className = 'profile-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'profile-name';
    nameDiv.textContent = profile.inGameName;
    nameDiv.title = profile.inGameName;

    const roleDiv = document.createElement('div');
    roleDiv.className = 'profile-role';
    roleDiv.textContent = profile.role;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(roleDiv);
    
    // Add logout button
    const logoutBtn = createLogoutButton();
    
    header.appendChild(weaponImg);
    header.appendChild(infoDiv);
    header.appendChild(logoutBtn);

    return header;
  }

  /**
   * Create stat item element
   * @param {string} categoryId - Category ID
   * @param {number} count - Visited count
   * @returns {HTMLElement}
   */
  function createStatItem(categoryId, count) {
    const categoryName = CATEGORY_NAMES[categoryId] || `Category ${categoryId}`;
    const iconFile = CATEGORY_ICONS[categoryId] || "default.png";

    const ICON_BASE = "https://tiles.bgonegaming.win/wherewindmeet/Simbol/";
    const iconUrl = ICON_BASE + iconFile;

    const statItem = document.createElement('div');
    statItem.className = 'profile-stat-item';
    if (count === 0) {
      statItem.classList.add('zero-count');
    }
    statItem.dataset.categoryId = categoryId;

    const icon = document.createElement('img');
    icon.className = 'profile-stat-icon';
    icon.src = iconUrl;
    icon.alt = categoryName;
    icon.onerror = function() {
      this.src = `${ICON_BASE}default.png`;
    };

    const nameSpan = document.createElement('div');
    nameSpan.className = 'profile-stat-name';
    nameSpan.textContent = categoryName;
    nameSpan.title = categoryName;

    const countSpan = document.createElement('div');
    countSpan.className = 'profile-stat-count';
    countSpan.textContent = count;

    statItem.appendChild(icon);
    statItem.appendChild(nameSpan);
    statItem.appendChild(countSpan);

    // Click to filter by category (optional)
    statItem.addEventListener('click', function() {
      if (window.MarkerManager?.filterByCategory) {
        window.MarkerManager.filterByCategory(categoryId);
      }
    });

    return statItem;
  }

  /**
   * Create stats section with Show More button
   * @param {Object} visitedCounts - Category counts
   * @returns {HTMLElement}
   */
  function createStatsSection(visitedCounts) {
    const wrapper = document.createElement('div');

    const statsSection = document.createElement('div');
    statsSection.className = 'profile-stats-section';
    
    if (!showAllCategories) {
      statsSection.classList.add('collapsed');
    }

    if (Object.keys(visitedCounts).length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'profile-empty-state';
      emptyState.textContent = 'No categories available';
      statsSection.appendChild(emptyState);
      wrapper.appendChild(statsSection);
      return wrapper;
    }

    // Sort: visited (descending) first, then unvisited alphabetically
    const sortedCategories = Object.entries(visitedCounts).sort((a, b) => {
      const countA = a[1];
      const countB = b[1];
      
      if (countA > 0 && countB > 0) {
        return countB - countA;
      }
      
      if (countA > 0 && countB === 0) return -1;
      if (countA === 0 && countB > 0) return 1;
      
      const nameA = window.ICON_CONFIG?.names?.[a[0]] || '';
      const nameB = window.ICON_CONFIG?.names?.[b[0]] || '';
      return nameA.localeCompare(nameB);
    });

    const totalCategories = sortedCategories.length;
    const categoriesToShow = showAllCategories ? sortedCategories : sortedCategories.slice(0, MAX_VISIBLE_CATEGORIES);

    categoriesToShow.forEach(([categoryId, count]) => {
      const statItem = createStatItem(categoryId, count);
      statsSection.appendChild(statItem);
    });

    wrapper.appendChild(statsSection);

    if (totalCategories > MAX_VISIBLE_CATEGORIES) {
      const showMoreBtn = document.createElement('button');
      showMoreBtn.className = 'profile-show-more-btn';
      if (showAllCategories) {
        showMoreBtn.classList.add('expanded');
      }
      
      const icon = document.createElement('span');
      icon.className = 'profile-show-more-icon';
      icon.textContent = '▼';
      
      const text = document.createElement('span');
      text.textContent = showAllCategories 
        ? 'Show Less' 
        : `Show(${totalCategories - MAX_VISIBLE_CATEGORIES} Available)`;
      
      showMoreBtn.appendChild(text);
      showMoreBtn.appendChild(icon);
      
      showMoreBtn.addEventListener('click', function() {
        showAllCategories = !showAllCategories;
        update(false);
      });
      
      wrapper.appendChild(showMoreBtn);
    }

    return wrapper;
  }

  /**
   * Create total counter
   * @param {number} total - Total visited count
   * @returns {HTMLElement}
   */
  function createTotalCounter(total) {
    const counter = document.createElement('div');
    counter.className = 'profile-total-counter';

    const label = document.createElement('div');
    label.className = 'profile-total-label';
    label.textContent = 'Total Marker Visited';

    const value = document.createElement('div');
    value.className = 'profile-total-value';
    value.textContent = total;

    counter.appendChild(label);
    counter.appendChild(value);

    return counter;
  }

  /**
   * Create toggle button
   * @returns {HTMLElement}
   */
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.className = 'profile-toggle-btn';
    btn.innerHTML = '−';
    btn.title = 'Toggle Profile';
    btn.onclick = function() {
      ProfileContainer.toggle();
    };
    return btn;
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Initialize and create profile container
   * @param {Object} options - Configuration options
   */
  function create(options = {}) {
    remove();

    if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
      return;
    }

    const profile = typeof getUserProfile === 'function' ? getUserProfile() : window.currentUser?.gameProfile;

    if (!profile || !profile.weaponType) {
      return;
    }

    const weaponData = window.WWM_WEAPONS?.[profile.weaponType];
    if (!weaponData) {
      return;
    }

    const visitedCounts = getVisitedCountsByCategory();
    const totalVisited = getTotalVisitedCount();

    container = document.createElement('div');
    container.id = CONFIG.containerId;
    container.className = CONFIG.animationClass;

    if (options.position) {
      Object.assign(CONFIG.position, options.position);
    }

    const titleBg = createTitleBackground(weaponData.title);
    const content = document.createElement('div');
    content.className = 'profile-content';

    const header = createHeader(profile, weaponData);
    const statsWrapper = createStatsSection(visitedCounts);

    if (options.showTotal !== false) {
      const totalCounter = createTotalCounter(totalVisited);
      content.appendChild(header);
      content.appendChild(totalCounter);
      content.appendChild(statsWrapper);
    } else {
      content.appendChild(header);
      content.appendChild(statsWrapper);
    }

    if (options.toggleButton) {
      const toggleBtn = createToggleButton();
      container.appendChild(toggleBtn);
    }

    container.appendChild(titleBg);
    container.appendChild(content);
    document.body.appendChild(container);

    // ✅ INITIALIZE SETTINGS BUTTON (for logged-in users)
    if (window.SettingsManager) {
      setTimeout(() => {
        window.SettingsManager.init();
        console.log('⚙️ Settings initialized for profile');
      }, 100);
    }
  }

  /**
   * Update profile container
   * @param {boolean} animate - Whether to animate update
   */
  function update(animate = true) {
    if (!container) {
      create();
      return;
    }

    const visitedCounts = getVisitedCountsByCategory();
    const totalVisited = getTotalVisitedCount();

    const statsWrapper = container.querySelector('.profile-stats-section')?.parentElement;
    if (statsWrapper) {
      const newStatsWrapper = createStatsSection(visitedCounts);
      statsWrapper.replaceWith(newStatsWrapper);

      if (animate) {
        setTimeout(() => {
          newStatsWrapper.querySelectorAll('.profile-stat-item').forEach((item, idx) => {
            setTimeout(() => {
              item.classList.add('highlight');
              setTimeout(() => item.classList.remove('highlight'), 500);
            }, idx * 50);
          });
        }, 100);
      }
    }

    const totalCounter = container.querySelector('.profile-total-counter .profile-total-value');
    if (totalCounter) {
      totalCounter.textContent = totalVisited;
    }

    console.log('🔄 Profile container updated');
    
    // ✅ Always re-initialize settings after update (to fix button disappearing)
    if (window.SettingsManager && typeof isLoggedIn === 'function' && isLoggedIn()) {
      setTimeout(() => {
        window.SettingsManager.init();
        console.log('🔄 Settings button re-initialized after update');
      }, 100);
    }
  }

  /**
   * Remove profile container
   */
  function remove() {
    if (container && container.parentNode) {
      // ✅ Destroy settings first if exists
      if (window.SettingsManager) {
        window.SettingsManager.destroy();
      }
      
      container.remove();
      container = null;
      console.log('❌ Profile container removed');
    }
  }

  /**
   * Toggle collapse state
   */
  function toggle() {
    if (!container) return;

    isCollapsed = !isCollapsed;
    container.classList.toggle('collapsed', isCollapsed);

    const toggleBtn = container.querySelector('.profile-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = isCollapsed ? '+' : '−';
    }
  }

  /**
   * Show profile container
   */
  function show() {
    if (container) {
      container.style.display = 'block';
      if (isCollapsed) {
        container.classList.remove('collapsed');
        isCollapsed = false;
      }
    } else {
      create();
    }
  }

  /**
   * Hide profile container
   */
  function hide() {
    if (container) {
      container.style.display = 'none';
    }
  }

  /**
   * Check if container exists
   * @returns {boolean}
   */
  function exists() {
    return container !== null && document.body.contains(container);
  }

  /**
   * Get container element
   * @returns {HTMLElement|null}
   */
  function getElement() {
    return container;
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  return {
    create,
    update,
    remove,
    toggle,
    show,
    hide,
    exists,
    getElement
  };

})();

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.ProfileContainer = ProfileContainer;

// Backward compatibility
window.createProfileContainer = ProfileContainer.create;
window.updateProfileContainer = ProfileContainer.update;
window.removeProfileContainer = ProfileContainer.remove;

console.log('✅ ProfileContainer module loaded (with Settings support and Logout button)');