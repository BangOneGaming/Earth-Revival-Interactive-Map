/**
 * Marker Add Module - WITH FLOOR & REGION SELECTION
 * System untuk menambahkan marker baru ke peta dengan pilihan floor dan region
 *
 * Dependencies:
 * - peta.js (map object)
 * - profile.js (ProfileContainer untuk data user)
 * - login.js (currentUser)
 * - underground-manager.js (UndergroundManager)
 * - MarkerManager (untuk extract regions dari loc_type)
 *
 * @version 4.0.0 - Added Region Selection (loc_type)
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
  let selectedFloor = null;
  let selectedRegion = null; // ← BARU: track selected region (loc_type)
  let isRepositioning = false;
  let savedFormData = null;

  const API_URL = 'https://autumn-dream-8c07.square-spon.workers.dev/terbaru';
  const ICON_BASE_URL = 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/';
  const DEFAULT_ICON_URL = ICON_BASE_URL + 'default.png';

  // Icon Config — use shared IconManager from ikon.js (avoids duplicate image requests)
  const ICON_CONFIG = window.IconManager ? window.IconManager.ICON_CONFIG : { overlays: {} };
  const CATEGORY_NAMES = window.IconManager ? window.IconManager.ICON_CONFIG.names : {};

  // Floor Options (from UndergroundManager)
  const FLOOR_OPTIONS = [
    { id: 'surface', name: 'Surface (Jianghua)', value: '' },
    { id: '1', name: 'Cave Level 1', value: '1' },
    { id: '2', name: 'Cave Level 2', value: '2' },
    { id: '3', name: 'Cave Level 3', value: '3' },
    { id: '4', name: 'Deepest Cave', value: '4' }
  ];

  // ==========================================
  // REGION HELPERS
  // ==========================================

  /**
   * Extract unique regions dari semua marker (via MarkerManager.getAllMarkers → loc_type)
   * Sesuai pola extractRegions() di region-management.js
   */
  function extractRegions() {
    const regionsSet = new Set();
    if (typeof MarkerManager !== 'undefined' && MarkerManager.getAllMarkers) {
      const markers = MarkerManager.getAllMarkers();
      markers.forEach(marker => {
        if (marker.loc_type && marker.loc_type.trim() !== '') {
          regionsSet.add(marker.loc_type.trim());
        }
      });
    }
    const regionsList = Array.from(regionsSet).sort();
    return regionsList.map(region => ({
      id: region,
      name: region
    }));
  }

  // ==========================================
  // HTML BUILDERS
  // ==========================================

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
   * Create Region Select dengan search
   * Nilai yang dipilih masuk ke field name="loc_type"
   */
  function createRegionSelect(defaultValue = '') {
    return `
      <div class="region-select-wrapper">
        <input type="hidden" name="loc_type" id="regionIdInput" required>
        <div class="region-select-display" id="regionSelectDisplay">
          <img class="icon" src="${ICON_BASE_URL}region.webp" alt="" style="display:none;" onerror="this.style.display='none'">
          <span class="text">-- Select Region --</span>
          <span class="arrow"></span>
        </div>
        <div class="region-dropdown" id="regionDropdown">
          <div class="region-search-wrap">
            <input
              type="text"
              class="region-search-input"
              id="regionSearchInput"
              placeholder="Search region…"
              autocomplete="off"
            >
          </div>
          <div class="region-list" id="regionList"></div>
          <div class="region-empty" id="regionEmpty">No region found.</div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // INIT FUNCTIONS
  // ==========================================

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
      option.addEventListener('click', () => {
        const selectedId = option.dataset.id;
        const selectedName = CATEGORY_NAMES[selectedId];
        const iconFile = ICON_CONFIG.overlays[selectedId] || 'default.png';
        const iconUrl = ICON_BASE_URL + iconFile;

        hiddenInput.value = selectedId;
if (!savedFormData) savedFormData = {};
savedFormData.category_id = selectedId;

        const displayIcon = display.querySelector('.icon');
        const displayText = display.querySelector('.text');
        displayIcon.src = iconUrl;
        displayIcon.style.display = 'block';
        displayText.textContent = selectedName;
        display.classList.add('has-value');

        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        if (nameInput) nameInput.value = selectedName;
        if (descTextarea) descTextarea.value = `${selectedName} marker at this location. `;

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

      if (newFloorValue === '') {
        selectedFloor = '';
        if (currentActiveFloor !== 'surface') {
          window.UndergroundManager?.setActiveFloor('surface', false);
        }
        return;
      }

      const floorId = FLOOR_OPTIONS.find(f => f.value === newFloorValue)?.id;

      if (currentActiveFloor === floorId) {
        console.log('✅ Already on correct floor, no repositioning needed');
        selectedFloor = newFloorValue;
        return;
      }

      console.log('🔄 Need to reposition marker on floor:', floorId);
      startRepositioning(newFloorValue, floorId);
    });
  }

  /**
   * Initialize region select events dengan search/filter
   */
  function initRegionSelect() {
    const display  = document.getElementById('regionSelectDisplay');
    const dropdown = document.getElementById('regionDropdown');
    const input    = document.getElementById('regionIdInput');
    const list     = document.getElementById('regionList');
    const search   = document.getElementById('regionSearchInput');
    const empty    = document.getElementById('regionEmpty');

    if (!display || !dropdown || !input) return;

    // Ambil regions dari MarkerManager
    const regions = extractRegions();

    /**
     * Render daftar region, filter berdasarkan query
     * Teks yang cocok di-highlight
     */
    function renderRegionList(q = '') {
      list.innerHTML = '';
      const query = q.toLowerCase().trim();
      let count = 0;

      regions.forEach(region => {
        if (query && !region.name.toLowerCase().includes(query)) return;
        count++;

        const div = document.createElement('div');
        div.className = 'region-option';
        div.dataset.id   = region.id;
        div.dataset.name = region.name;

        // Highlight matched substring
        let displayName = region.name;
        if (query) {
          const idx = region.name.toLowerCase().indexOf(query);
          if (idx !== -1) {
            displayName =
              region.name.slice(0, idx) +
              '<mark>' + region.name.slice(idx, idx + query.length) + '</mark>' +
              region.name.slice(idx + query.length);
          }
        }

        div.innerHTML = `
          <img src="${ICON_BASE_URL}region.webp" alt="" onerror="this.style.opacity='0'">
          <span class="region-name">${displayName}</span>
        `;

        div.addEventListener('click', () => {
          // Set nilai ke hidden input (ini yang dikirim sebagai loc_type)
          input.value    = region.id;
selectedRegion = region.id;
if (!savedFormData) savedFormData = {};
savedFormData.loc_type = region.id;

          // Update tampilan display
          display.querySelector('.text').textContent = region.name;
          display.querySelector('.icon').style.display = 'block';
          display.classList.add('has-value');

          // Tandai selected
          list.querySelectorAll('.region-option').forEach(o =>
            o.classList.toggle('selected', o.dataset.id === region.id)
          );

          closeRegionDropdown();
          console.log('✅ Region selected:', region.id);
        });

        list.appendChild(div);
      });

      // Tampilkan pesan kosong jika tidak ada hasil
      empty.classList.toggle('show', count === 0);
    }

    function openRegionDropdown() {
      display.classList.add('active');
      dropdown.classList.add('active');
      renderRegionList(search.value);
      search.focus();
    }

    function closeRegionDropdown() {
      display.classList.remove('active');
      dropdown.classList.remove('active');
      search.value = '';
    }

    // Toggle dropdown saat display diklik
    display.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.contains('active')
        ? closeRegionDropdown()
        : openRegionDropdown();
    });

    // Filter saat user mengetik di search
    search.addEventListener('input', () => renderRegionList(search.value));

    // Cegah dropdown tertutup saat klik di dalamnya
    dropdown.addEventListener('click', (e) => e.stopPropagation());

    // Tutup dropdown saat klik di luar
    document.addEventListener('click', () => closeRegionDropdown());

    // Render awal
    renderRegionList();

    // ── Restore nilai jika sedang repositioning ──
    if (savedFormData?.loc_type) {
      const restoredRegion = regions.find(r => r.id === savedFormData.loc_type);
      if (restoredRegion) {
        input.value    = restoredRegion.id;
        selectedRegion = restoredRegion.id;
        display.querySelector('.text').textContent = restoredRegion.name;
        display.querySelector('.icon').style.display = 'block';
        display.classList.add('has-value');
        console.log('♻️ Restored region:', restoredRegion.name);
      }
    }
  }

  // ==========================================
  // HINT
  // ==========================================

  function showAddButtonHint() {
    if (!addMarkerBtn) return;

    const old = document.querySelector('.addmarker-hint');
    if (old) old.remove();

    // Baca geometry SEBELUM DOM diubah — cegah forced reflow
    const rect = addMarkerBtn.getBoundingClientRect();
    const isMobile = window.matchMedia('(max-width: 600px)').matches;

    const hint = document.createElement('div');
    hint.className = 'addmarker-hint';
    hint.textContent = 'Tap if you found lost marker!';

    if (isMobile) {
      hint.style.position  = 'fixed';
      hint.style.left      = (rect.right + 15) + 'px';
      hint.style.top       = (rect.top + rect.height / 2) + 'px';
      hint.style.transform = 'translateY(-50%)';
    } else {
      hint.style.position  = 'fixed';
      hint.style.left      = (rect.left + rect.width / 2) + 'px';
      hint.style.top       = (rect.bottom + 15) + 'px';
      hint.style.transform = 'translateX(-50%)';
    }

    document.body.appendChild(hint);
    setTimeout(() => hint.classList.add('show'), 50);
    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 300);
    }, 19000);
  }

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

  // ==========================================
  // REPOSITIONING
  // ==========================================

  function startRepositioning(floorValue, floorId) {
    // Simpan semua data form termasuk loc_type
    savedFormData = {
      category_id: document.getElementById('categoryIdInput')?.value || '',
      name:        document.querySelector('input[name="name"]')?.value || '',
      desc:        document.querySelector('textarea[name="desc"]')?.value || '',
      loc_type:    document.getElementById('regionIdInput')?.value || '', // ← loc_type ikut disimpan
      floor:       floorValue
    };

    isRepositioning = true;
    selectedFloor   = floorValue;

    if (formOverlay) {
      formOverlay.remove();
      formOverlay = null;
    }

    if (window.UndergroundManager) {
      window.UndergroundManager.setActiveFloor(floorId, false);
    }

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

  // ==========================================
  // ID GENERATION & API
  // ==========================================

  function generateUniqueId(existingMarkers) {
    const existingIds = new Set();
    existingMarkers.forEach(marker => {
      if (marker.id) existingIds.add(marker.id);
    });

    let newId = 1;
    while (existingIds.has(String(newId).padStart(4, '0'))) newId++;

    const idStr    = String(newId).padStart(4, '0');
    const pointStr = String(newId).padStart(3, '0');
    const key      = `NEW_${idStr}_${pointStr}_`;

    return { key, id: idStr, point: pointStr };
  }

  async function fetchExistingMarkers() {
    try {
      console.log('🔄 Fetching existing markers from API...');
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log(`✅ Fetched ${Object.keys(data).length} existing markers`);
      return Object.entries(data).map(([key, value]) => ({ key, ...value }));
    } catch (error) {
      console.error('❌ Failed to fetch markers:', error);
      throw error;
    }
  }

  function getCurrentUser() {
    if (typeof getUserProfile === 'function') return getUserProfile();
    if (window.currentUser?.gameProfile) return window.currentUser.gameProfile;
    return null;
  }

  // ==========================================
  // UI CREATION
  // ==========================================

  function createAddMarkerButton() {
    if (addMarkerBtn) return;

    addMarkerBtn = document.createElement('button');
    addMarkerBtn.id    = 'addMarkerBtn';
    addMarkerBtn.title = 'Add new marker to map';

    const icon = document.createElement('img');
    icon.src = DEFAULT_ICON_URL;
    icon.alt = 'Add Marker';

    addMarkerBtn.appendChild(icon);
    addMarkerBtn.addEventListener('click', toggleAddMode);

    document.body.appendChild(addMarkerBtn);
    console.log('✅ Add marker button created');
  }

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
    if (formOverlay) formOverlay.remove();

    const userProfile = getCurrentUser();
    const ysId        = userProfile?.inGameName || 'Unknown';
    const currentFloor = selectedFloor || '';

    formOverlay = document.createElement('div');
    formOverlay.className = 'marker-form-overlay';

    formOverlay.innerHTML = `
      <div class="marker-form-container">
        <div class="marker-form-header">
          <h2>⭐ Add New Marker</h2>
          <p class="marker-form-subtitle">Mark what you have found upon the wind's path</p>
          <button class="marker-form-close" type="button">&times;</button>
        </div>

        <div class="marker-form-body">
          <form id="markerAddForm">
            <input type="hidden" name="key"   value="${uniqueIds.key}">
            <input type="hidden" name="id"    value="${uniqueIds.id}">
            <input type="hidden" name="point" value="${uniqueIds.point}">
            <input type="hidden" name="lat"   value="${position.lat}">
            <input type="hidden" name="lng"   value="${position.lng}">

            <div class="form-section-label">Traveller</div>

            <div class="form-group">
              <label>Creator <span class="optional">(auto-filled)</span></label>
              <input type="text" name="ys_id" value="${ysId}" readonly placeholder="Your in-game name">
            </div>

            <div class="form-section-label">Location</div>

            <div class="form-group">
              <label>Floor / Layer <span class="required">*</span></label>
              ${createFloorSelect(currentFloor)}
              <small class="form-hint">⚠️ Selecting underground floor will require repositioning</small>
            </div>

            <div class="form-group">
              <label>Region <span class="required">*</span></label>
              ${createRegionSelect(savedFormData?.loc_type || '')}
              <small class="form-hint">Which Region Coming From?.</small>
            </div>

            <div class="form-section-label">Marker Details</div>

            <div class="form-group">
              <label>Category <span class="required">*</span></label>
              ${createCategorySelect()}
            </div>

            <div class="form-group">
              <label>Marker Name <span class="optional">(auto-filled, editable)</span></label>
              <input
                type="text"
                name="name"
                placeholder="Will be set based on category"
                value="${savedFormData?.name || ''}"
              >
            </div>

            <div class="form-group">
              <label>Description <span class="optional">(auto-filled, editable)</span></label>
              <textarea name="desc" placeholder="Description will be auto-filled based on category...">${savedFormData?.desc || ''}</textarea>
            </div>
          </form>
        </div>

        <div class="marker-form-footer">
          <button type="button" class="btn-cancel">Cancel</button>
          <button type="submit" form="markerAddForm" class="btn-submit">💾 Save Marker</button>
        </div>
      </div>
    `;

    const closeBtn  = formOverlay.querySelector('.marker-form-close');
    const cancelBtn = formOverlay.querySelector('.btn-cancel');
    const form      = formOverlay.querySelector('#markerAddForm');

    closeBtn.addEventListener('click', closeForm);
    cancelBtn.addEventListener('click', closeForm);
    formOverlay.addEventListener('click', (e) => {
      if (e.target === formOverlay) closeForm();
    });
    form.addEventListener('submit', handleFormSubmit);

    document.body.appendChild(formOverlay);
    console.log('✅ Marker form created');

    // Init semua custom selects setelah DOM siap
setTimeout(() => {
  initCategorySelect();
  initFloorSelect();
  initRegionSelect();

  // Restore category jika ada savedFormData
  if (savedFormData?.category_id) {
        const hiddenInput = document.getElementById('categoryIdInput');
        if (hiddenInput) {
          hiddenInput.value = savedFormData.category_id;
          const display      = document.getElementById('categorySelectDisplay');
          const selectedName = CATEGORY_NAMES[savedFormData.category_id];
          const iconFile     = ICON_CONFIG.overlays[savedFormData.category_id] || 'default.png';
          const iconUrl      = ICON_BASE_URL + iconFile;
          if (display) {
            display.querySelector('.icon').src          = iconUrl;
            display.querySelector('.icon').style.display = 'block';
            display.querySelector('.text').textContent   = selectedName;
            display.classList.add('has-value');
          }
        }
      }
    }, 100);
  }

  // ==========================================
  // MARKER MANAGEMENT
  // ==========================================

  function createTempMarker() {
    if (!window.map) {
      console.error('❌ Map not initialized');
      return;
    }

    removeTempMarker();

    const center = window.map.getCenter();
    const icon   = L.icon({
      iconUrl:     DEFAULT_ICON_URL,
      iconSize:    [64, 64],
      iconAnchor:  [32, 64],
      popupAnchor: [0, -64]
    });

    tempMarker = L.marker(center, {
      icon,
      draggable:   true,
      zIndexOffset: 1000
    }).addTo(window.map);

    tempMarker.bindPopup(createPopupControls(), {
      closeButton:  false,
      autoClose:    false,
      closeOnClick: false,
      className:    'marker-add-popup'
    }).openPopup();

    tempMarker.on('dragstart', () => tempMarker.closePopup());
    tempMarker.on('dragend',   () => tempMarker.openPopup());

    console.log('✅ Temporary marker created with popup controls');
  }

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

  function toggleAddMode() {
    isAddMode ? exitAddMode() : enterAddMode();
  }

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

  function exitAddMode() {
  isAddMode      = false;
  isRepositioning = false;
  selectedFloor  = null;
  selectedRegion = null;
  // savedFormData TIDAK di-null — biar persist ke sesi berikutnya

    addMarkerBtn.classList.remove('active');
    addMarkerBtn.title = 'Add new marker to map';
    removeTempMarker();
    console.log('🚪 Exited add marker mode');
  }

  function cancelAddMode() {
    exitAddMode();
  }

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
      const uniqueIds       = generateUniqueId(existingMarkers);
      console.log('🆔 Generated unique ID:', uniqueIds);

      createMarkerForm(position, uniqueIds);

if (isRepositioning) {
  console.log('✅ Repositioning complete');
  isRepositioning = false;
}

    } catch (error) {
      alert('Failed to load marker data. Please try again.');
      console.error('❌ Error:', error);
      tempMarker.setPopupContent(createPopupControls());
    }
  }

  // ==========================================
  // FORM HANDLING
  // ==========================================

  function closeForm() {
    if (formOverlay) {
      formOverlay.remove();
      formOverlay = null;
    }
    exitAddMode();
  }

  function showSuccessPopup(imageUrl, message) {
    const oldPopup = document.querySelector('.marker-success-popup');
    if (oldPopup) oldPopup.remove();

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
    setTimeout(() => popup.classList.add('show'), 50);
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }, 5000);
  }

  /**
   * Handle form submission
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const form      = e.target;
    const formData  = new FormData(form);
    const submitBtn = document.querySelector('.marker-form-footer .btn-submit');

    if (!submitBtn) {
      console.error('❌ Submit button not found');
      return;
    }

    // Validasi category
    const categoryId = formData.get('category_id');
    if (!categoryId) {
      alert('Please select a category!');
      return;
    }

    // Validasi name
    const name = formData.get('name').trim();
    if (!name) {
      alert('Please enter a marker name!');
      return;
    }

    // Validasi region (loc_type) — wajib diisi
    const locType = formData.get('loc_type') || '';
    if (!locType) {
      alert('Please select a region!');
      return;
    }

    const markerData = {
      id:          formData.get('id'),
      ys_id:       formData.get('ys_id'),
      name:        name,
      category_id: categoryId,
      loc_type:    locType,           // ← region yang dipilih user
      lat:         formData.get('lat'),
      lng:         formData.get('lng'),
      desc:        formData.get('desc').trim() || '',
      point:       formData.get('point'),
      number:      '',
      floor:       formData.get('floor') || '',
      links_info:  '[]',
      images_info: '[]'
    };

    const markerKey = formData.get('key');

    console.log('💾 Submitting marker:', { key: markerKey, data: markerData });

    submitBtn.disabled     = true;
    submitBtn.innerHTML    = '<span class="form-loading">Saving...</span>';

    try {
      await submitMarkerToAPI(markerKey, markerData);
      console.log('✅ Marker saved successfully');

      showSuccessPopup(
        'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/hehe.webp',
        'Thank You!<br>We will review your marker.'
      );

      savedFormData = null; // reset HANYA setelah submit sukses
      closeForm();

      if (window.MarkerManager?.refresh) {
        window.MarkerManager.refresh();
      }

    } catch (error) {
      console.error('❌ Failed to save marker:', error);
      alert('❌ Failed to save marker. Please try again.');
      submitBtn.disabled  = false;
      submitBtn.innerHTML = '💾 Save Marker';
    }
  }

  /**
   * Submit marker to API
   */
  async function submitMarkerToAPI(key, data) {
    console.log('📤 Sending to API:', API_URL);
    console.log('📦 Payload:', { [key]: data });

    try {
      const response = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [key]: data })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      let result;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('✅ API Success Response (JSON):', result);
      } else {
        result = await response.text();
        console.log('✅ API Success Response (Text):', result);
        if (result.toLowerCase().includes('success') || result.toLowerCase().includes('merged')) {
          result = { success: true, message: result };
        }
      }

      // Backup ke localStorage
      try {
        const localMarkers = JSON.parse(localStorage.getItem('newMarkers') || '{}');
        localMarkers[key]  = data;
        localStorage.setItem('newMarkers', JSON.stringify(localMarkers));
        console.log('💾 Also saved to localStorage as backup');
      } catch (e) {
        console.warn('⚠️ Failed to save to localStorage:', e);
      }

      return result;

    } catch (error) {
      console.error('❌ API Submission Error:', error);

      try {
        const localMarkers = JSON.parse(localStorage.getItem('newMarkers') || '{}');
        localMarkers[key]  = data;
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

  function init() {
    console.log('🚀 Initializing MarkerAddSystem...');
    createAddMarkerButton();
    showAddButtonHint();
    console.log('✅ MarkerAddSystem initialized');
  }

  function destroy() {
    exitAddMode();
    if (addMarkerBtn) { addMarkerBtn.remove(); addMarkerBtn = null; }
    if (formOverlay)  { formOverlay.remove();  formOverlay  = null; }
    console.log('🗑️ MarkerAddSystem destroyed');
  }

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.map) MarkerAddSystem.init();
    else console.warn('⚠️ Map not found, MarkerAddSystem not initialized');
  });
} else {
  if (window.map) MarkerAddSystem.init();
  else console.warn('⚠️ Map not found, MarkerAddSystem not initialized');
}

window.MarkerAddSystem = MarkerAddSystem;

console.log('✅ marker-add.js loaded (v4.0 - with Floor + Region Selection)');