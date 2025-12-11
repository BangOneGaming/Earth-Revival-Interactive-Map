/**
 * Marker Add Module - WITH FLOOR SELECTION
 * System untuk menambahkan marker baru ke peta dengan pilihan floor
 * 
 * Dependencies:
 * - peta.js (map object)
 * - profile.js (ProfileContainer untuk data user)
 * - login.js (currentUser)
 * - underground-manager.js (UndergroundManager)
 * 
 * @author Your Name
 * @version 3.0.0 - Added Floor Selection with repositioning
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
  let selectedFloor = null; // Track selected floor
  let isRepositioning = false; // Flag untuk reposition mode
  let savedFormData = null; // Simpan data form saat reposition
  
  const API_URL = 'https://autumn-dream-8c07.square-spon.workers.dev/terbaru';
  const ICON_BASE_URL = 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/';
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
  
  // Category Names
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

  // Floor Options (from UndergroundManager)
  const FLOOR_OPTIONS = [
    { id: 'surface', name: 'Surface (Jianghua)', value: '' },
    { id: '1', name: 'Cave Level 1', value: '1' },
    { id: '2', name: 'Cave Level 2', value: '2' },
    { id: '3', name: 'Cave Level 3', value: '3' },
    { id: '4', name: 'Deepest Cave', value: '4' }
  ];

  /**
   * Create custom category select with icons
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

  /**
   * Create Floor Dropdown
   */
  function createFloorSelect(defaultValue = '') {
    return `
      <div class="floor-select-wrapper">
        <select name="floor" id="floorSelect" class="floor-select">
          ${FLOOR_OPTIONS.map(floor => {
            const selected = floor.value === defaultValue ? 'selected' : '';
            return `<option value="${floor.value}" ${selected}>${floor.name}</option>`;
          }).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Show Add Marker Button Hint
   */
  function showAddButtonHint() {
    if (!addMarkerBtn) return;

    const old = document.querySelector('.addmarker-hint');
    if (old) old.remove();

    const hint = document.createElement('div');
    hint.className = 'addmarker-hint';
    hint.textContent = 'Tap if you found lost marker!';
    document.body.appendChild(hint);

    const rect = addMarkerBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 600;

    if (isMobile) {
      hint.style.position = "fixed";
      hint.style.left = (rect.right + 15) + "px";
      hint.style.top = (rect.top + rect.height / 2) + "px";
      hint.style.transform = "translateY(-50%)";
    } else {
      hint.style.position = "fixed";
      hint.style.left = (rect.left + rect.width / 2) + "px";
      hint.style.top = (rect.bottom + 15) + "px";
      hint.style.transform = "translateX(-50%)";
    }

    setTimeout(() => hint.classList.add('show'), 50);
    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 300);
    }, 19000);
  }

  // Update hint position on window resize
  let hintResizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(hintResizeTimeout);
    hintResizeTimeout = setTimeout(() => {
      const hint = document.querySelector('.addmarker-hint');
      if (hint && hint.classList.contains('show')) {
        hint.remove();
        showAddButtonHint();
      }
    }, 250);
  });

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
    
    display.addEventListener('click', (e) => {
      e.stopPropagation();
      display.classList.toggle('active');
      dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.category-select-wrapper')) {
        display.classList.remove('active');
        dropdown.classList.remove('active');
      }
    });
    
    const options = dropdown.querySelectorAll('.category-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const selectedId = option.dataset.id;
        const selectedName = CATEGORY_NAMES[selectedId];
        const iconFile = ICON_CONFIG.overlays[selectedId] || 'default.png';
        const iconUrl = ICON_BASE_URL + iconFile;
        
        hiddenInput.value = selectedId;
        
        const displayIcon = display.querySelector('.icon');
        const displayText = display.querySelector('.text');
        
        displayIcon.src = iconUrl;
        displayIcon.style.display = 'block';
        displayText.textContent = selectedName;
        display.classList.add('has-value');
        
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        if (nameInput) {
          nameInput.value = selectedName;
        }
        
        if (descTextarea) {
          descTextarea.value = `${selectedName} marker at this location. `;
        }
        
        display.classList.remove('active');
        dropdown.classList.remove('active');
        
        console.log('✅ Category selected:', selectedId, selectedName);
      });
    });
  }

  /**
   * Initialize floor select events
   */
  function initFloorSelect() {
    const floorSelect = document.getElementById('floorSelect');
    if (!floorSelect) return;

    floorSelect.addEventListener('change', (e) => {
      const newFloorValue = e.target.value;
      const currentActiveFloor = window.UndergroundManager?.activeFloor || 'surface';
      
      console.log('🎯 Floor changed to:', newFloorValue);
      
      // Jika pilih surface, tidak perlu reposition
      if (newFloorValue === '') {
        selectedFloor = '';
        
        // Switch ke surface jika belum
        if (currentActiveFloor !== 'surface') {
          window.UndergroundManager?.setActiveFloor('surface', false);
        }
        return;
      }
      
      // Jika pilih underground floor
      const floorId = FLOOR_OPTIONS.find(f => f.value === newFloorValue)?.id;
      
      // Check apakah sudah di floor yang tepat
      if (currentActiveFloor === floorId) {
        console.log('✅ Already on correct floor, no repositioning needed');
        selectedFloor = newFloorValue;
        return;
      }
      
      // Perlu reposition!
      console.log('🔄 Need to reposition marker on floor:', floorId);
      startRepositioning(newFloorValue, floorId);
    });
  }

  /**
   * Start repositioning flow
   */
  function startRepositioning(floorValue, floorId) {
    // Save form data
    savedFormData = {
      category_id: document.getElementById('categoryIdInput')?.value || '',
      name: document.querySelector('input[name="name"]')?.value || '',
      desc: document.querySelector('textarea[name="desc"]')?.value || '',
      floor: floorValue
    };
    
    // Set flag
    isRepositioning = true;
    selectedFloor = floorValue;
    
    // Close form
    if (formOverlay) {
      formOverlay.remove();
      formOverlay = null;
    }
    
    // Switch floor
    if (window.UndergroundManager) {
      window.UndergroundManager.setActiveFloor(floorId, false);
    }
    
    // Update popup message
    if (tempMarker) {
      const floorName = FLOOR_OPTIONS.find(f => f.value === floorValue)?.name || 'Floor';
      tempMarker.setPopupContent(`
        <div class="marker-popup-controls">
          <div class="marker-popup-info">
            📍 Repositioning on <strong>${floorName}</strong><br>
            Drag marker to new position
          </div>
          <div class="marker-popup-buttons">
            <button class="marker-popup-confirm" onclick="MarkerAddSystem.confirmPosition()">
              ✓ Confirm Position
            </button>
            <button class="marker-popup-cancel" onclick="MarkerAddSystem.cancelAddMode()">
              ✕ Cancel
            </button>
          </div>
        </div>
      `);
      tempMarker.openPopup();
    }
    
    console.log('🎯 Repositioning mode active. Saved form data:', savedFormData);
  }

  /**
   * Generate unique marker ID
   */
  function generateUniqueId(existingMarkers) {
    const existingIds = new Set();
    
    existingMarkers.forEach(marker => {
      if (marker.id) {
        existingIds.add(marker.id);
      }
    });

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
   * Create add marker button
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
   */
  function createMarkerForm(position, uniqueIds) {
    if (formOverlay) {
      formOverlay.remove();
    }

    const userProfile = getCurrentUser();
    const ysId = userProfile?.inGameName || 'Unknown';
    
    // Get current floor
    const currentFloor = selectedFloor || '';

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
                Floor / Layer <span class="required">*</span>
              </label>
              ${createFloorSelect(currentFloor)}
              <small class="form-hint">⚠️ Selecting underground floor will require repositioning</small>
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
                value="${savedFormData?.name || ''}"
              >
            </div>

            <div class="form-group">
              <label>
                Description <span class="optional">(auto-filled, editable)</span>
              </label>
              <textarea 
                name="desc" 
                placeholder="Description will be auto-filled based on category..."
              >${savedFormData?.desc || ''}</textarea>
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

    const closeBtn = formOverlay.querySelector('.marker-form-close');
    const cancelBtn = formOverlay.querySelector('.btn-cancel');
    const form = formOverlay.querySelector('#markerAddForm');

    closeBtn.addEventListener('click', closeForm);
    cancelBtn.addEventListener('click', closeForm);
    
    formOverlay.addEventListener('click', (e) => {
      if (e.target === formOverlay) {
        closeForm();
      }
    });

    form.addEventListener('submit', handleFormSubmit);

    document.body.appendChild(formOverlay);
    console.log('✅ Marker form created');
    
    setTimeout(() => {
      initCategorySelect();
      initFloorSelect();
      
      // Restore category if repositioning
      if (isRepositioning && savedFormData?.category_id) {
        const hiddenInput = document.getElementById('categoryIdInput');
        if (hiddenInput) {
          hiddenInput.value = savedFormData.category_id;
          
          // Update display
          const display = document.getElementById('categorySelectDisplay');
          const selectedName = CATEGORY_NAMES[savedFormData.category_id];
          const iconFile = ICON_CONFIG.overlays[savedFormData.category_id] || 'default.png';
          const iconUrl = ICON_BASE_URL + iconFile;
          
          if (display) {
            const displayIcon = display.querySelector('.icon');
            const displayText = display.querySelector('.text');
            
            displayIcon.src = iconUrl;
            displayIcon.style.display = 'block';
            displayText.textContent = selectedName;
            display.classList.add('has-value');
          }
        }
      }
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
    
    const icon = L.icon({
      iconUrl: DEFAULT_ICON_URL,
      iconSize: [64, 64],
      iconAnchor: [32, 64],
      popupAnchor: [0, -64]
    });

    tempMarker = L.marker(center, {
      icon: icon,
      draggable: true,
      zIndexOffset: 1000
    }).addTo(window.map);

    tempMarker.bindPopup(createPopupControls(), {
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      className: 'marker-add-popup'
    }).openPopup();

    tempMarker.on('dragstart', function() {
      tempMarker.closePopup();
    });

    tempMarker.on('dragend', function() {
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

    const user = getCurrentUser();
    if (!user) {
      alert('Please login first to add markers!');
      return;
    }

    isAddMode = true;
    
    addMarkerBtn.classList.add('active');
    addMarkerBtn.title = 'Cancel adding marker';
    
    window.map.setZoom(6);
    
    createTempMarker();

    console.log('🎯 Entered add marker mode');
  }

  /**
   * Exit add marker mode
   */
  function exitAddMode() {
    isAddMode = false;
    isRepositioning = false;
    savedFormData = null;
    selectedFloor = null;
    
    addMarkerBtn.classList.remove('active');
    addMarkerBtn.title = 'Add new marker to map';
    
    removeTempMarker();

    console.log('🚪 Exited add marker mode');
  }

  /**
   * Cancel add mode
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

    tempMarker.setPopupContent(`
      <div class="marker-popup-controls">
        <div class="marker-popup-info">⏳ Loading...</div>
      </div>
    `);

    try {
      const existingMarkers = await fetchExistingMarkers();
      const uniqueIds = generateUniqueId(existingMarkers);
      
      console.log('🆔 Generated unique ID:', uniqueIds);

      // Reset repositioning flag
      if (isRepositioning) {
        console.log('✅ Repositioning complete');
        isRepositioning = false;
      }

      createMarkerForm(position, uniqueIds);

    } catch (error) {
      alert('Failed to load marker data. Please try again.');
      console.error('❌ Error:', error);
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
   * Show custom success popup with image
   * @param {string} imageUrl - URL gambar success
   * @param {string} message - Pesan success
   */
  function showSuccessPopup(imageUrl, message) {
    // Remove old popup if exists
    const oldPopup = document.querySelector('.marker-success-popup');
    if (oldPopup) oldPopup.remove();

    // Create popup overlay
    const popup = document.createElement('div');
    popup.className = 'marker-success-popup';
    
    popup.innerHTML = `
      <div class="success-popup-overlay"></div>
      <div class="success-popup-container">
        <div class="success-popup-content">
          <img src="${imageUrl}" alt="Success" class="success-image">
          <p class="success-message">${message}</p>
          <button class="success-close-btn" onclick="this.closest('.marker-success-popup').remove()">
            OK
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    // Show with animation
    setTimeout(() => {
      popup.classList.add('show');
    }, 50);

    // Auto close after 5 seconds
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }, 5000);
  }


// ==========================================
// UBAH BAGIAN handleFormSubmit
// ==========================================

/**
 * Handle form submission - UPDATED VERSION
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  
  const submitBtn = document.querySelector('.marker-form-footer .btn-submit');
  
  if (!submitBtn) {
    console.error('❌ Submit button not found');
    return;
  }

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
    floor: formData.get('floor') || "",
    links_info: "[]",
    images_info: "[]"
  };

  const markerKey = formData.get('key');

  console.log('💾 Submitting marker:', { key: markerKey, data: markerData });

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="form-loading">Saving...</span>';

  try {
    await submitMarkerToAPI(markerKey, markerData);

    console.log('✅ Marker saved successfully');
    
    // ✨ GANTI alert() dengan showSuccessPopup()
    // GANTI URL_GAMBAR_ANDA dengan link gambar yang sebenarnya
    showSuccessPopup(
      'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/hehe.webp', // <-- GANTI LINK INI
      'Thank You!<br>We will review your marker.'
    );

    closeForm();

    if (window.MarkerManager?.refresh) {
      window.MarkerManager.refresh();
    }

  } catch (error) {
    console.error('❌ Failed to save marker:', error);
    alert('❌ Failed to save marker. Please try again.');
    
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

console.log('✅ marker-add.js loaded (with Floor Selection)');