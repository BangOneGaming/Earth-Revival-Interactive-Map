/**
 * Marker Add Module
 * System untuk menambahkan marker baru ke peta
 * 
 * Dependencies:
 * - peta.js (map object)
 * - profile.js (ProfileContainer untuk data user)
 * - login.js (currentUser)
 * 
 * @author Your Name
 * @version 2.0.0 - Refined UX with popup controls
 */

const MarkerAddSystem = (function() {
  'use strict';

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let isAddMode = false;
  let tempMarker = null;
  let addMarkerBtn = null;
  let formOverlay = null;
  let currentPosition = null;
  
  const API_URL = 'https://autumn-dream-8c07.square-spon.workers.dev/terbaru';
  const ICON_BASE_URL = 'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/';
  const DEFAULT_ICON_URL = ICON_BASE_URL + 'default.png';
  
  // Icon Config (from ikon.js)
  const ICON_CONFIG = {
    overlays: {
      "1": "batuteleport.webp?updatedAt=1762879575407",
      "2": "petiharta.webp?updatedAt=1762879575344",
      "3": "strange.webp?updatedAt=1762879614618",
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
    }
  };
  
  // Category Names (sama dengan profile.js)
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
    "28": "Material Art"
  };

  /**
   * Create custom category select with icons
   * @returns {string} HTML string for custom select
   */
  function createCategorySelect() {
    return `
      <div class="category-select-wrapper">
        <input type="hidden" name="category_id" id="categoryIdInput" required>
        
        <div class="category-select-display" id="categorySelectDisplay">
          <img class="icon" src="${DEFAULT_ICON_URL}" alt="Icon" style="display: none;">
          <span class="text">-- Select Category --</span>
          <span class="arrow"></span>
        </div>
        
        <div class="category-dropdown" id="categoryDropdown">
          ${Object.entries(CATEGORY_NAMES).map(([id, name]) => {
            const iconFile = ICON_CONFIG.overlays[id] || 'default.png';
            const iconUrl = ICON_BASE_URL + iconFile;
            
            return `
              <div class="category-option" data-id="${id}">
                <img class="icon" src="${iconUrl}" alt="${name}">
                <span class="name">${name}</span>
                <span class="id">#${id}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
function showAddButtonHint() {
  if (!addMarkerBtn) return;

  // Hapus hint lama jika ada
  const old = document.querySelector('.addmarker-hint');
  if (old) old.remove();

  const hint = document.createElement('div');
  hint.className = 'addmarker-hint';
  hint.textContent = 'Tap to if you found lost marker!';
  document.body.appendChild(hint);

  // Posisi tombol
  const rect = addMarkerBtn.getBoundingClientRect();

  // === Versi DESKTOP (bawaan) ===
  hint.style.position = "fixed";
  hint.style.left = (rect.left + rect.width / 2) + "px";
  hint.style.top = (rect.top + 5) + "px";
  hint.style.transform = "translateX(-120%)";

  hint.classList.add("hint-desktop");   // ← tambahkan class desktop

  // === Versi MOBILE (<600px) → tooltip di kanan tombol ===
  if (window.innerWidth <= 600) {
    hint.style.left = rect.right + 12 + "px";     // kanan tombol
    hint.style.top = (rect.top + rect.height / 2) + "px";
    hint.style.transform = "translateY(-50%)";    // center

    hint.classList.remove("hint-desktop");
    hint.classList.add("hint-mobile");            // ← tambahkan class mobile
  }

  // Animasi muncul
  setTimeout(() => hint.classList.add('show'), 50);

  // Hilang sendiri
  setTimeout(() => {
    hint.classList.remove('show');
    setTimeout(() => hint.remove(), 300);
  }, 19000);
}
  /**
   * Initialize category select events
   */
  function initCategorySelect() {
    const display = document.getElementById('categorySelectDisplay');
    const dropdown = document.getElementById('categoryDropdown');
    const hiddenInput = document.getElementById('categoryIdInput');
    const nameInput = document.querySelector('input[name="name"]');
    const descTextarea = document.querySelector('textarea[name="desc"]');
    
    if (!display || !dropdown || !hiddenInput) return;
    
    // Toggle dropdown
    display.addEventListener('click', (e) => {
      e.stopPropagation();
      display.classList.toggle('active');
      dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.category-select-wrapper')) {
        display.classList.remove('active');
        dropdown.classList.remove('active');
      }
    });
    
    // Select category option
    const options = dropdown.querySelectorAll('.category-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const selectedId = option.dataset.id;
        const selectedName = CATEGORY_NAMES[selectedId];
        const iconFile = ICON_CONFIG.overlays[selectedId] || 'default.png';
        const iconUrl = ICON_BASE_URL + iconFile;
        
        // Update hidden input
        hiddenInput.value = selectedId;
        
        // Update display
        const displayIcon = display.querySelector('.icon');
        const displayText = display.querySelector('.text');
        
        displayIcon.src = iconUrl;
        displayIcon.style.display = 'block';
        displayText.textContent = selectedName;
        display.classList.add('has-value');
        
        // Remove all selected states
        options.forEach(opt => opt.classList.remove('selected'));
        // Add selected state to current
        option.classList.add('selected');
        
        // Auto-fill name and description
        if (nameInput) {
          nameInput.value = selectedName;
        }
        
        if (descTextarea) {
          descTextarea.value = `${selectedName} marker at this location. `;
        }
        
        // Close dropdown
        display.classList.remove('active');
        dropdown.classList.remove('active');
        
        console.log('✅ Category selected:', selectedId, selectedName);
      });
    });
  }

  /**
   * Generate unique marker ID
   * @param {Array} existingMarkers - Array of existing markers
   * @returns {Object} { key, id, point }
   */
  function generateUniqueId(existingMarkers) {
    const existingIds = new Set();
    
    // Collect all existing IDs
    existingMarkers.forEach(marker => {
      if (marker.id) {
        existingIds.add(marker.id);
      }
    });

    // Generate new unique ID
    let newId = 1;
    while (existingIds.has(String(newId).padStart(4, '0'))) {
      newId++;
    }

    const idStr = String(newId).padStart(4, '0');
    const pointStr = String(newId).padStart(3, '0');
    const key = `NEW_${idStr}_${pointStr}_`;

    return {
      key: key,
      id: idStr,
      point: pointStr
    };
  }

  /**
   * Fetch existing markers from API
   * @returns {Promise<Array>}
   */
  async function fetchExistingMarkers() {
    try {
      console.log('🔄 Fetching existing markers from API...');
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${Object.keys(data).length} existing markers`);
      
      // Convert to array format
      return Object.entries(data).map(([key, value]) => ({
        key,
        ...value
      }));
    } catch (error) {
      console.error('❌ Failed to fetch markers:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   * @returns {Object|null}
   */
  function getCurrentUser() {
    if (typeof getUserProfile === 'function') {
      return getUserProfile();
    }
    if (window.currentUser?.gameProfile) {
      return window.currentUser.gameProfile;
    }
    return null;
  }

  // ==========================================
  // UI CREATION FUNCTIONS
  // ==========================================

  /**
   * Create add marker button (default icon style)
   */
  function createAddMarkerButton() {
    if (addMarkerBtn) return;

    addMarkerBtn = document.createElement('button');
    addMarkerBtn.id = 'addMarkerBtn';
    addMarkerBtn.title = 'Add new marker to map';
    
    const icon = document.createElement('img');
    icon.src = DEFAULT_ICON_URL;
    icon.alt = 'Add Marker';
    
    addMarkerBtn.appendChild(icon);
    addMarkerBtn.addEventListener('click', toggleAddMode);
    
    document.body.appendChild(addMarkerBtn);
    console.log('✅ Add marker button created');
  }

  /**
   * Create popup controls for temp marker
   * @returns {string} HTML string for popup
   */
  function createPopupControls() {
    return `
      <div class="marker-popup-controls">
        <div class="marker-popup-info">Drag to adjust position</div>
        <div class="marker-popup-buttons">
          <button class="marker-popup-confirm" onclick="MarkerAddSystem.confirmPosition()">
            ✓ Confirm
          </button>
          <button class="marker-popup-cancel" onclick="MarkerAddSystem.cancelAddMode()">
            ✕ Cancel
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create marker form overlay
   * @param {Object} position - { lat, lng }
   * @param {Object} uniqueIds - { key, id, point }
   */
  function createMarkerForm(position, uniqueIds) {
    if (formOverlay) {
      formOverlay.remove();
    }

    const userProfile = getCurrentUser();
    const ysId = userProfile?.inGameName || 'Unknown';

    formOverlay = document.createElement('div');
    formOverlay.className = 'marker-form-overlay';
    
    formOverlay.innerHTML = `
      <div class="marker-form-container">
        <div class="marker-form-header">
          <h2>⭐ Add New Marker</h2>
          <button class="marker-form-close" type="button">&times;</button>
        </div>
        
        <div class="marker-form-body">
          <form id="markerAddForm">
            <input type="hidden" name="key" value="${uniqueIds.key}">
            <input type="hidden" name="id" value="${uniqueIds.id}">
            <input type="hidden" name="point" value="${uniqueIds.point}">
            <input type="hidden" name="lat" value="${position.lat}">
            <input type="hidden" name="lng" value="${position.lng}">

            <div class="form-group">
              <label>
                Creator <span class="optional">(auto-filled)</span>
              </label>
              <input 
                type="text" 
                name="ys_id" 
                value="${ysId}"
                readonly
                placeholder="Your in-game name"
              >
            </div>

            <div class="form-group">
              <label>
                Category <span class="required">*</span>
              </label>
              ${createCategorySelect()}
            </div>

            <div class="form-group">
              <label>
                Marker Name <span class="optional">(auto-filled, editable)</span>
              </label>
              <input 
                type="text" 
                name="name" 
                placeholder="Will be set based on category"
              >
            </div>

            <div class="form-group">
              <label>
                Description <span class="optional">(auto-filled, editable)</span>
              </label>
              <textarea 
                name="desc" 
                placeholder="Description will be auto-filled based on category..."
              ></textarea>
            </div>
          </form>
        </div>

        <div class="marker-form-footer">
          <button type="button" class="btn-cancel">Cancel</button>
          <button type="submit" form="markerAddForm" class="btn-submit">
            💾 Save Marker
          </button>
        </div>
      </div>
    `;

    // Event listeners
    const closeBtn = formOverlay.querySelector('.marker-form-close');
    const cancelBtn = formOverlay.querySelector('.btn-cancel');
    const form = formOverlay.querySelector('#markerAddForm');
    const nameInput = formOverlay.querySelector('input[name="name"]');
    const descTextarea = formOverlay.querySelector('textarea[name="desc"]');

    closeBtn.addEventListener('click', closeForm);
    cancelBtn.addEventListener('click', closeForm);
    
    // Click outside to close
    formOverlay.addEventListener('click', (e) => {
      if (e.target === formOverlay) {
        closeForm();
      }
    });

    // Initialize custom category select
    initCategorySelect();

    // Form submit
    form.addEventListener('submit', handleFormSubmit);

    document.body.appendChild(formOverlay);
    console.log('✅ Marker form created');
    
    // Initialize custom category select dengan delay
    setTimeout(() => {
      initCategorySelect();
    }, 100);
  }

  // ==========================================
  // MARKER MANAGEMENT
  // ==========================================

  /**
   * Create temporary draggable marker
   */
  function createTempMarker() {
    if (!window.map) {
      console.error('❌ Map not initialized');
      return;
    }

    removeTempMarker();

    const center = window.map.getCenter();
    
    // Create custom icon
const icon = L.icon({
  iconUrl: DEFAULT_ICON_URL,
  iconSize: [64, 64],       // ukuran icon
  iconAnchor: [32, 64],     // titik bawah tengah
  popupAnchor: [0, -64]     // posisi popup
});

    tempMarker = L.marker(center, {
      icon: icon,
      draggable: true,
      zIndexOffset: 1000
    }).addTo(window.map);

    // Bind popup with controls
    tempMarker.bindPopup(createPopupControls(), {
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      className: 'marker-add-popup'
    }).openPopup();

    // Event handlers
    tempMarker.on('dragstart', function() {
      // Hide popup during drag
      tempMarker.closePopup();
    });

    tempMarker.on('dragend', function() {
      // Show popup after drag stops
      tempMarker.openPopup();
    });

    console.log('✅ Temporary marker created with popup controls');
  }

  /**
   * Remove temporary marker
   */
  function removeTempMarker() {
    if (tempMarker) {
      window.map.removeLayer(tempMarker);
      tempMarker = null;
      console.log('🗑️ Temporary marker removed');
    }
  }

  // ==========================================
  // MODE MANAGEMENT
  // ==========================================

  /**
   * Toggle add marker mode
   */
  function toggleAddMode() {
    if (isAddMode) {
      exitAddMode();
    } else {
      enterAddMode();
    }
  }

  /**
   * Enter add marker mode
   */
  function enterAddMode() {
    if (!window.map) {
      alert('Map is not initialized!');
      return;
    }

    // Check login
    const user = getCurrentUser();
    if (!user) {
      alert('Please login first to add markers!');
      return;
    }

    isAddMode = true;
    
    // Update button
    addMarkerBtn.classList.add('active');
    addMarkerBtn.title = 'Cancel adding marker';
    
    // Zoom to level 6
    window.map.setZoom(6);
    
    // Create temp marker
    createTempMarker();

    console.log('🎯 Entered add marker mode');
  }

  /**
   * Exit add marker mode
   */
  function exitAddMode() {
    isAddMode = false;
    
    // Update button
    addMarkerBtn.classList.remove('active');
    addMarkerBtn.title = 'Add new marker to map';
    
    // Remove temp marker
    removeTempMarker();

    console.log('🚪 Exited add marker mode');
  }

  /**
   * Cancel add mode (same as exit)
   */
  function cancelAddMode() {
    exitAddMode();
  }

  /**
   * Confirm marker position
   */
  async function confirmPosition() {
    if (!tempMarker) {
      alert('No marker to confirm!');
      return;
    }

    const position = tempMarker.getLatLng();
    currentPosition = position;

    console.log('📍 Position confirmed:', position);

    // Update popup to show loading
    tempMarker.setPopupContent(`
      <div class="marker-popup-controls">
        <div class="marker-popup-info">⏳ Loading...</div>
      </div>
    `);

    try {
      // Fetch existing markers
      const existingMarkers = await fetchExistingMarkers();
      
      // Generate unique ID
      const uniqueIds = generateUniqueId(existingMarkers);
      
      console.log('🆔 Generated unique ID:', uniqueIds);

      // Show form
      createMarkerForm(position, uniqueIds);

    } catch (error) {
      alert('Failed to load marker data. Please try again.');
      console.error('❌ Error:', error);
      
      // Reset popup
      tempMarker.setPopupContent(createPopupControls());
    }
  }

  // ==========================================
  // FORM HANDLING
  // ==========================================

  /**
   * Close marker form
   */
  function closeForm() {
    if (formOverlay) {
      formOverlay.remove();
      formOverlay = null;
    }
    exitAddMode();
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    
    // Get submit button from the modal (not form)
    const submitBtn = document.querySelector('.marker-form-footer .btn-submit');
    
    if (!submitBtn) {
      console.error('❌ Submit button not found');
      return;
    }

    // Validate
    const categoryId = formData.get('category_id');
    if (!categoryId) {
      alert('Please select a category!');
      return;
    }

    const name = formData.get('name').trim();
    if (!name) {
      alert('Please enter a marker name!');
      return;
    }

    // Build marker object
    const markerData = {
      id: formData.get('id'),
      ys_id: formData.get('ys_id'),
      name: name,
      category_id: categoryId,
      loc_type: "",
      lat: formData.get('lat'),
      lng: formData.get('lng'),
      desc: formData.get('desc').trim() || "",
      point: formData.get('point'),
      number: "",
      links_info: "[]",
      images_info: "[]"
    };

    const markerKey = formData.get('key');

    console.log('💾 Submitting marker:', { key: markerKey, data: markerData });

    // Show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="form-loading">Saving...</span>';

    try {
      // Submit to API/localStorage
      await submitMarkerToAPI(markerKey, markerData);

      console.log('✅ Marker saved successfully');
      alert('✅ Marker added successfully!');

      // Close form and exit mode
      closeForm();

      // Refresh markers if MarkerManager exists
      if (window.MarkerManager?.refresh) {
        window.MarkerManager.refresh();
      }

    } catch (error) {
      console.error('❌ Failed to save marker:', error);
      alert('❌ Failed to save marker. Please try again.');
      
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = '💾 Save Marker';
    }
  }

  /**
   * Submit marker to API
   * @param {string} key - Marker key
   * @param {Object} data - Marker data
   * @returns {Promise}
   */
  async function submitMarkerToAPI(key, data) {
    console.log('📤 Sending to API:', API_URL);
    console.log('📦 Payload:', { [key]: data });
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: data })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Try to parse as JSON, fallback to text
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('✅ API Success Response (JSON):', result);
      } else {
        result = await response.text();
        console.log('✅ API Success Response (Text):', result);
        
        // If it's a success message, convert to object
        if (result.toLowerCase().includes('success') || result.toLowerCase().includes('merged')) {
          result = { success: true, message: result };
        }
      }
      
      // Also save to localStorage as backup
      try {
        const localMarkers = JSON.parse(localStorage.getItem('newMarkers') || '{}');
        localMarkers[key] = data;
        localStorage.setItem('newMarkers', JSON.stringify(localMarkers));
        console.log('💾 Also saved to localStorage as backup');
      } catch (e) {
        console.warn('⚠️ Failed to save to localStorage:', e);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ API Submission Error:', error);
      
      // Fallback: save to localStorage if API fails
      try {
        const localMarkers = JSON.parse(localStorage.getItem('newMarkers') || '{}');
        localMarkers[key] = data;
        localStorage.setItem('newMarkers', JSON.stringify(localMarkers));
        console.log('💾 Saved to localStorage as fallback');
      } catch (e) {
        console.error('❌ Even localStorage failed:', e);
      }
      
      throw error;
    }
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Initialize the add marker system
   */
  function init() {
    console.log('🚀 Initializing MarkerAddSystem...');
    
    createAddMarkerButton();
showAddButtonHint();
    console.log('✅ MarkerAddSystem initialized');
  }

  /**
   * Destroy the add marker system
   */
  function destroy() {
    exitAddMode();
    
    if (addMarkerBtn) {
      addMarkerBtn.remove();
      addMarkerBtn = null;
    }
    
    if (formOverlay) {
      formOverlay.remove();
      formOverlay = null;
    }
    
    console.log('🗑️ MarkerAddSystem destroyed');
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  return {
    init,
    destroy,
    enterAddMode,
    exitAddMode,
    cancelAddMode,
    confirmPosition,
    isActive: () => isAddMode
  };

})();

// ==========================================
// AUTO-INITIALIZE
// ==========================================

// Wait for DOM and map to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.map) {
      MarkerAddSystem.init();
    } else {
      console.warn('⚠️ Map not found, MarkerAddSystem not initialized');
    }
  });
} else {
  if (window.map) {
    MarkerAddSystem.init();
  } else {
    console.warn('⚠️ Map not found, MarkerAddSystem not initialized');
  }
}

// Global export
window.MarkerAddSystem = MarkerAddSystem;

console.log('✅ marker-add.js loaded');