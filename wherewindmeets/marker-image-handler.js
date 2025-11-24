/**
 * Marker Image Handler Module v5.0
 * 
 * STRATEGY:
 * 1. Saat halaman load → GET /WWMupload/all → Simpan di localStorage
 * 2. Saat buka marker → Ambil dari localStorage → TIDAK ADA GET
 * 3. localStorage bertahan sampai user clear browser
 * 
 * @version 5.0.0
 */

const MarkerImageHandler = (function() {
  'use strict';

  const CONFIG = {
    apiEndpoint: 'https://autumn-dream-8c07.square-spon.workers.dev/WWMupload',
    allEndpoint: 'https://autumn-dream-8c07.square-spon.workers.dev/WWMupload/all',
    authEndpoint: 'https://autumn-dream-8c07.square-spon.workers.dev/WWMupload/auth',
    imageKit: {
      publicKey: 'public_/+d/IF8uczhkpQ33gZPfcCg7eKQ=',
      uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload',
      folder: '/wherewindmeet/info/'
    },
    fallbackImage: 'https://cdn1.epicgames.com/spt-assets/a55e4c8b015d445195aab2f028deace6/where-winds-meet-1n85i.jpg',
    allowedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024,
    cacheKey: 'wwm_marker_images',
    cacheVersionKey: 'wwm_marker_images_version'
  };

  // In-memory cache (loaded from localStorage)
  let imageCache = {};
  let isLoaded = false;

  // ==========================================
  // LOCALSTORAGE FUNCTIONS
  // ==========================================

  function saveToLocalStorage() {
    try {
      localStorage.setItem(CONFIG.cacheKey, JSON.stringify(imageCache));
      console.log('💾 Saved to localStorage');
    } catch (e) {
      console.warn('⚠️ Failed to save to localStorage:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(CONFIG.cacheKey);
      if (data) {
        imageCache = JSON.parse(data);
        console.log(`📦 Loaded ${Object.keys(imageCache).length} markers from localStorage`);
        return true;
      }
    } catch (e) {
      console.warn('⚠️ Failed to load from localStorage:', e);
    }
    return false;
  }

  function getLastUpdated() {
    try {
      return parseInt(localStorage.getItem(CONFIG.cacheVersionKey)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function setLastUpdated(timestamp) {
    try {
      localStorage.setItem(CONFIG.cacheVersionKey, String(timestamp));
    } catch (e) {}
  }

  // ==========================================
  // PRELOAD ALL IMAGES
  // ==========================================

  async function preloadAllImages() {
    if (isLoaded) return;

    // Load from localStorage first
    const hasLocalData = loadFromLocalStorage();
    const localLastUpdated = getLastUpdated();

    try {
      console.log('🌐 Fetching all marker images...');
      const response = await fetch(CONFIG.allEndpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.markers) {
        // Check if server has newer data
        if (data.lastUpdated > localLastUpdated || !hasLocalData) {
          imageCache = data.markers;
          saveToLocalStorage();
          setLastUpdated(data.lastUpdated);
          
        } else {

        }
      }

    } catch (e) {
      console.error('❌ Preload failed:', e);
      if (!hasLocalData) {
        console.log('⚠️ No local cache, will fetch on demand');
      }
    }

    isLoaded = true;
  }

  // ==========================================
  // GET IMAGES (from cache only)
  // ==========================================

  function getImages(markerKey) {
    return imageCache[markerKey] || [];
  }

  function hasImages(markerKey) {
    return imageCache[markerKey] && imageCache[markerKey].length > 0;
  }

  // ==========================================
  // AUTH & UPLOAD
  // ==========================================

  async function getImageKitAuth() {
    const token = typeof getUserToken === 'function' ? getUserToken() : null;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(CONFIG.authEndpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Auth failed');
    }

    return await response.json();
  }

  async function uploadToImageKit(file, markerKey) {
    const filename = generateFilename(markerKey, file.type);
    const auth = await getImageKitAuth();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', filename);
    formData.append('folder', CONFIG.imageKit.folder);
    formData.append('publicKey', auth.publicKey);
    formData.append('signature', auth.signature);
    formData.append('expire', String(auth.expire));
    formData.append('token', auth.token);

    const response = await fetch(CONFIG.imageKit.uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return result.url;
  }

  async function saveImageUrlToServer(markerKey, imageUrl, format) {
    const token = typeof getUserToken === 'function' ? getUserToken() : null;
    if (!token) throw new Error('Not authenticated');

    const profile = typeof getUserProfile === 'function' ? getUserProfile() : null;
    const uploaderName = profile?.inGameName || 'Unknown';

    const response = await fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ markerKey, imageUrl, format })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save');
    }

    // Update local cache
    if (!imageCache[markerKey]) {
      imageCache[markerKey] = [];
    }
    imageCache[markerKey].push({ url: imageUrl, uploadedBy: uploaderName });
    
    // Save to localStorage
    saveToLocalStorage();
    setLastUpdated(Date.now());

    return await response.json();
  }

  // ==========================================
  // UTILITY
  // ==========================================

  function generateFilename(markerKey, mimeType) {
    const timestamp = Date.now();
    const profile = typeof getUserProfile === 'function' ? getUserProfile() : null;
    const username = profile?.inGameName || 'anonymous';
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedKey = markerKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = mimeType.replace('image/', '');
    return `${sanitizedKey}_${timestamp}_${sanitizedUsername}.${ext}`;
  }

  function validateFile(file) {
    if (!CONFIG.allowedFormats.includes(file.type)) {
      return { valid: false, error: 'Format tidak valid. Gunakan PNG, JPG, atau WebP' };
    }
    if (file.size > CONFIG.maxFileSize) {
      return { valid: false, error: 'File terlalu besar. Maksimal 5MB' };
    }
    return { valid: true };
  }

  // ==========================================
  // UI COMPONENTS
  // ==========================================

  function createImageContainerHTML(markerData) {
    const markerKey = markerData._key;
    
    return `
      <div class="marker-image-container" 
           data-marker-key="${markerKey}" 
           data-current-index="0"
           data-ui-loaded="false">
        
        <div class="marker-image-wrapper">
          <img 
            class="marker-popup-img" 
            src="${CONFIG.fallbackImage}"
            alt="${markerData.name || 'Location'}"
            data-marker-key="${markerKey}">
          
          <div class="marker-image-loading" style="display: none;">
            <div class="spinner"></div>
          </div>
          
          <div class="marker-image-overlay">
            <button class="marker-image-btn upload-btn" onclick="MarkerImageHandler.triggerUpload('${markerKey}')">
              📤 Upload Image
            </button>
          </div>
          
          <div class="marker-image-nav-container"></div>
          
          <div class="marker-image-uploader"></div>
        </div>
        
        <input type="file" 
               class="marker-image-input" 
               id="imageInput_${markerKey}"
               accept="image/png,image/jpeg,image/webp"
               style="display:none"
               onchange="MarkerImageHandler.handleFileSelect(event, '${markerKey}')">
      </div>
    `;
  }

  /**
   * Load and display images for popup (NO FETCH - from cache only)
   */
  function loadImages(markerKey) {
    const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);
    if (!container) return;

    // UI already loaded? Skip
    if (container.dataset.uiLoaded === 'true') {

      return;
    }

    const img = container.querySelector('.marker-popup-img');
    const overlay = container.querySelector('.marker-image-overlay');
    const navContainer = container.querySelector('.marker-image-nav-container');
    const uploaderEl = container.querySelector('.marker-image-uploader');

    // Get from cache (NO FETCH)
    const images = getImages(markerKey);
    
    // Mark UI as loaded
    container.dataset.uiLoaded = 'true';
    container.dataset.images = JSON.stringify(images);

    if (images.length > 0) {
      img.onerror = () => {
        img.src = CONFIG.fallbackImage;
        container.dataset.isFallback = 'true';
      };
      img.src = images[0].url;

      // Show uploader name
      if (uploaderEl) {
        uploaderEl.textContent = `📷 ${images[0].uploadedBy}`;
        uploaderEl.style.display = 'block';
      }

      // Update overlay buttons
      overlay.innerHTML = `
        <button class="marker-image-btn upload-btn" onclick="MarkerImageHandler.triggerUpload('${markerKey}')">
          📤 Upload Image
        </button>
        <button class="marker-image-btn fullview-btn" onclick="MarkerImageHandler.openFullView('${markerKey}')">
          🔍 Full View
        </button>
      `;

      // Add navigation if multiple images
      if (images.length > 1) {
        navContainer.innerHTML = `
          <button class="marker-image-nav prev" onclick="MarkerImageHandler.prevImage('${markerKey}')">‹</button>
          <button class="marker-image-nav next" onclick="MarkerImageHandler.nextImage('${markerKey}')">›</button>
          <div class="marker-image-indicators">
            ${images.map((_, i) => `<span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
          </div>
        `;
      }

      container.dataset.isFallback = 'false';
    } else {
      container.dataset.isFallback = 'true';
      if (uploaderEl) uploaderEl.style.display = 'none';
      overlay.innerHTML = `
        <button class="marker-image-btn upload-btn" onclick="MarkerImageHandler.triggerUpload('${markerKey}')">
          📤 Upload Image
        </button>
      `;
    }
  }

  // ==========================================
  // CAROUSEL NAVIGATION
  // ==========================================

  function nextImage(markerKey) { navigateImage(markerKey, 1); }
  function prevImage(markerKey) { navigateImage(markerKey, -1); }

  function navigateImage(markerKey, direction) {
    const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);
    if (!container) return;

    let images = [];
    try { images = JSON.parse(container.dataset.images || '[]'); } catch (e) { return; }
    if (images.length <= 1) return;

    let currentIndex = parseInt(container.dataset.currentIndex) || 0;
    currentIndex = (currentIndex + direction + images.length) % images.length;
    container.dataset.currentIndex = currentIndex;

    const img = container.querySelector('.marker-popup-img');
    const loadingEl = container.querySelector('.marker-image-loading');
    const uploaderEl = container.querySelector('.marker-image-uploader');

    if (img) {
      if (loadingEl) loadingEl.style.display = 'flex';
      img.onload = () => { if (loadingEl) loadingEl.style.display = 'none'; };
      img.onerror = () => { if (loadingEl) loadingEl.style.display = 'none'; };
      img.src = images[currentIndex].url;
    }

    if (uploaderEl) {
      uploaderEl.textContent = `📷 ${images[currentIndex].uploadedBy}`;
    }

    container.querySelectorAll('.indicator').forEach((ind, i) => {
      ind.classList.toggle('active', i === currentIndex);
    });
  }

  // ==========================================
  // FILE UPLOAD
  // ==========================================

  function triggerUpload(markerKey) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
      if (typeof showLoginPopup === 'function') showLoginPopup();
      else showNotification('❌ Please login to upload', 'error');
      return;
    }
    const input = document.getElementById(`imageInput_${markerKey}`);
    if (input) input.click();
  }

async function checkServerQuota() {
  try {
    const res = await fetch(CONFIG.authEndpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getUserToken()}` }
    });

    // Jika server blokir karena limit
    if (res.status === 429 || res.status === 503) {
      throw new Error("quota");
    }

    // Jika server kirim pesan error khusus
    const data = await res.json();
    if (data.error && (
      data.error.includes("limit") ||
      data.error.includes("quota") ||
      data.error.includes("exceed")
    )) {
      throw new Error("quota");
    }

    return data; // aman
  } catch (e) {
    throw new Error("quota");
  }
}


async function handleFileSelect(event, markerKey) {
  const file = event.target.files[0];
  if (!file) return;

  const validation = validateFile(file);
  if (!validation.valid) {
    showNotification(`❌ ${validation.error}`, 'error');
    event.target.value = '';
    return;
  }

  const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);

  try {
    if (container) container.classList.add('uploading');

    // ======================================================
    // 🔥 CEK QUOTA DULU — kalau limit, langsung batal!
    // ======================================================
    try {
      await checkServerQuota();
    } catch (err) {
      if (err.message === "quota") {
        showNotification(
          "❌ Sorry! Our server is out of daily quota. Please come back tomorrow.",
          "error"
        );
        event.target.value = ""; // Reset input
        return; // Stop — jangan upload ke ImageKit!
      }
    }

    showNotification('⏳ Uploading...', 'info');

    // Jika lolos quota → lanjut upload
    const imageUrl = await uploadToImageKit(file, markerKey);
    const format = file.type.replace('image/', '');
    await saveImageUrlToServer(markerKey, imageUrl, format);

    if (container) {
      container.dataset.uiLoaded = 'false';
    }
    loadImages(markerKey);
    showNotification('✅ Upload success!', 'success');
  } catch (error) {
    console.error('Upload failed:', error);
    showNotification(`❌ ${error.message}`, 'error');
  } finally {
    if (container) container.classList.remove('uploading');
    event.target.value = '';
  }
}
  // ==========================================
  // FULL VIEW MODAL
  // ==========================================

  function openFullView(markerKey) {
    const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);
    if (!container) return;

    let images = [];
    try { images = JSON.parse(container.dataset.images || '[]'); } catch (e) { return; }

    const currentIndex = parseInt(container.dataset.currentIndex) || 0;
    const imageData = images[currentIndex];
    if (!imageData) return;

    const modal = document.createElement('div');
    modal.className = 'marker-fullview-modal';
    modal.innerHTML = `
      <div class="marker-fullview-backdrop" onclick="MarkerImageHandler.closeFullView()"></div>
      <div class="marker-fullview-content">
        <img src="${imageData.url}" alt="Full view">
        <button class="marker-fullview-close" onclick="MarkerImageHandler.closeFullView()">✕</button>
        <div class="fullview-uploader">📷 ${imageData.uploadedBy}</div>
        ${images.length > 1 ? `
          <button class="fullview-nav prev" onclick="MarkerImageHandler.fullViewNav(-1, '${markerKey}')">‹</button>
          <button class="fullview-nav next" onclick="MarkerImageHandler.fullViewNav(1, '${markerKey}')">›</button>
          <div class="fullview-counter">${currentIndex + 1} / ${images.length}</div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modal);
    modal.dataset.currentIndex = currentIndex;
    modal.dataset.markerKey = markerKey;
    setTimeout(() => modal.classList.add('active'), 10);
  }

  function fullViewNav(direction, markerKey) {
    const modal = document.querySelector('.marker-fullview-modal');
    const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);
    if (!modal || !container) return;

    let images = [];
    try { images = JSON.parse(container.dataset.images || '[]'); } catch (e) { return; }

    let currentIndex = parseInt(modal.dataset.currentIndex) || 0;
    currentIndex = (currentIndex + direction + images.length) % images.length;
    modal.dataset.currentIndex = currentIndex;

    const img = modal.querySelector('.marker-fullview-content img');
    const counter = modal.querySelector('.fullview-counter');
    const uploaderEl = modal.querySelector('.fullview-uploader');

    if (img) img.src = images[currentIndex].url;
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
    if (uploaderEl) uploaderEl.textContent = `📷 ${images[currentIndex].uploadedBy}`;
  }

  function closeFullView() {
    const modal = document.querySelector('.marker-fullview-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  // ==========================================
  // NOTIFICATION
  // ==========================================

  function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = message;
    
    const colors = {
      error: 'linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.95))',
      info: 'linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(25, 118, 210, 0.95))',
      success: 'linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(56, 142, 60, 0.95))'
    };
    
    notification.style.background = colors[type] || colors.info;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // DEBUG & CACHE MANAGEMENT
  // ==========================================
  
  function debugCache() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 IMAGE CACHE DEBUG');
    console.log('isLoaded:', isLoaded);
    console.log('Total markers:', Object.keys(imageCache).length);
    console.log('Last updated:', new Date(getLastUpdated()).toLocaleString());
    Object.entries(imageCache).forEach(([key, images]) => {
      console.log(`  ${key}: ${images.length} images`);
      images.forEach((img, i) => {
        console.log(`    [${i}] ${img.uploadedBy}`);
      });
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  function clearCache() {
    imageCache = {};
    localStorage.removeItem(CONFIG.cacheKey);
    localStorage.removeItem(CONFIG.cacheVersionKey);
    isLoaded = false;
    console.log('🗑️ Cache cleared');
  }

  async function refreshCache() {
    clearCache();
    await preloadAllImages();
  }

  // ==========================================
  // INIT
  // ==========================================

async function init() {
  console.log('🚀 MarkerImageHandler v5.0 initializing...');

  // Preload langsung (tidak menunggu map)
  await preloadAllImages();

  console.log('✨ Preload complete:', Object.keys(imageCache).length, 'markers');

  // Pasang listener popup (kalau map belum ada, error dicegah)
  try {
    MarkerManager.map.on('popupopen', function (e) {
      const content = e.popup.getElement();
      if (!content) return;

      const container = content.querySelector('.marker-image-container');
      if (container) {
        const markerKey = container.dataset.markerKey;
        loadImages(markerKey);
      }
    });

    console.log('📌 Popup listener attached');
  } catch (err) {
    console.warn('⚠️ Map not ready yet, but preload is done. Listener skipped.');
  }

  console.log('✅ MarkerImageHandler v5.0 ready');
}
  return {
    init,
    createImageContainerHTML,
    loadImages,
    getImages,
    hasImages,
    triggerUpload,
    handleFileSelect,
    nextImage,
    prevImage,
    openFullView,
    closeFullView,
    fullViewNav,
    debugCache,
    clearCache,
    refreshCache,
    preloadAllImages,
    get imageCache() { return imageCache; },
    CONFIG
  };

})();

window.MarkerImageHandler = MarkerImageHandler;
console.log('✅ MarkerImageHandler module loaded v5.0.0');