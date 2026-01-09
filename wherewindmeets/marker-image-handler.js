/**
 * Marker Image Handler Module v5.5
 * 
 * NEW FEATURES v5.5:
 * - Integrated Image Editor before upload
 * - Drawing tools (brush, text, circle markers)
 * - Edit and annotate images before uploading
 * - Preview and confirm before final upload
 * 
 * FEATURES v5.4:
 * - Touch protection: prevents accidental upload clicks on touch devices
 * - Pointer type detection: distinguishes between touch and mouse events
 * - 300ms touch cooldown to allow hover gestures
 * - Desktop mode on mobile: paste zone hidden for touch devices
 * 
 * @version 5.5.0
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
    maxFileSize: 15 * 1024 * 1024, // 15MB
    webpQuality: 0.85,
    maxDimension: 1920,
    cacheKey: 'wwm_marker_images',
    cacheVersionKey: 'wwm_marker_images_version',
    uploadEnabled: true,
    uploadResumeDate: 'January 14',
    enableImageEditor: false, // Toggle editor on/off
    enableTouchProtection: false // Toggle touch protection (set false jika bermasalah)
  };

  let imageCache = {};
  let isLoaded = false;
  let pasteListeners = new Map();

  // Touch protection state
  let lastTouchTime = 0;
  let isPointerMode = false;

  // ==========================================
  // DEVICE DETECTION
  // ==========================================

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
  }

  function handlePointerStart(e) {
    if (e.pointerType === 'touch') {
      lastTouchTime = Date.now();
      isPointerMode = false;
    } else {
      isPointerMode = true;
    }
  }

  function shouldAllowClick() {
    const timeSinceTouch = Date.now() - lastTouchTime;
    if (timeSinceTouch < 300) {
      return false;
    }
    return true;
  }

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
  // IMAGE COMPRESSION TO WEBP
  // ==========================================

  async function compressToWebP(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onerror = () => reject(new Error('Failed to load image'));
        
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;
            
            if (width > CONFIG.maxDimension || height > CONFIG.maxDimension) {
              if (width > height) {
                height = Math.round((height * CONFIG.maxDimension) / width);
                width = CONFIG.maxDimension;
              } else {
                width = Math.round((width * CONFIG.maxDimension) / height);
                height = CONFIG.maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// 🔥 FIX ANDROID SCREENSHOT BLANK
ctx.save();
ctx.globalCompositeOperation = 'source-over';
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, width, height);
ctx.drawImage(img, 0, 0, width, height);
ctx.restore();

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to create WebP blob'));
                  return;
                }
                
                const originalSize = file.size;
                const compressedSize = blob.size;
                const savingsPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                
                console.log(`📊 Compression: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${savingsPercent}% saved)`);
                
                resolve({
                  blob,
                  originalSize,
                  compressedSize,
                  savings: savingsPercent
                });
              },
              'image/webp',
              CONFIG.webpQuality
            );
          } catch (error) {
            reject(error);
          }
        };
        
        img.src = e.target.result;
      };
      
      reader.readAsDataURL(file);
    });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ==========================================
  // CLIPBOARD PASTE HANDLER
  // ==========================================

  async function handlePaste(event, markerKey) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        console.log('📋 Pasted image:', file.type, formatBytes(file.size));
        
        await processImageUpload(file, markerKey, true);
        return;
      }
    }
  }

  function attachPasteListener(markerKey) {
    if (pasteListeners.has(markerKey)) {
      document.removeEventListener('paste', pasteListeners.get(markerKey));
    }

    const listener = (e) => handlePaste(e, markerKey);
    document.addEventListener('paste', listener);
    pasteListeners.set(markerKey, listener);

    console.log(`📋 Paste listener attached for ${markerKey}`);
  }

  function removePasteListener(markerKey) {
    if (pasteListeners.has(markerKey)) {
      document.removeEventListener('paste', pasteListeners.get(markerKey));
      pasteListeners.delete(markerKey);
    }
  }

  // ==========================================
  // PRELOAD ALL IMAGES
  // ==========================================

  async function preloadAllImages() {
    if (isLoaded) return;

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
        if (data.lastUpdated > localLastUpdated || !hasLocalData) {
          imageCache = data.markers;
          saveToLocalStorage();
          setLastUpdated(data.lastUpdated);
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
  // GET IMAGES
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

  async function uploadToImageKit(blob, markerKey) {
    const filename = generateFilename(markerKey, 'webp');
    const auth = await getImageKitAuth();
    
    const formData = new FormData();
    formData.append('file', blob, filename);
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

  async function saveImageUrlToServer(markerKey, imageUrl) {
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
      body: JSON.stringify({ markerKey, imageUrl, format: 'webp' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save');
    }

    if (!imageCache[markerKey]) {
      imageCache[markerKey] = [];
    }
    imageCache[markerKey].push({ url: imageUrl, uploadedBy: uploaderName });
    
    saveToLocalStorage();
    setLastUpdated(Date.now());

    return await response.json();
  }

  // ==========================================
  // PROCESS IMAGE UPLOAD (with Editor Integration)
  // ==========================================
async function sanitizeBeforeEditor(file) {
  const isScreenshot =
    file.type === 'image/png' &&
    /screenshot|screen/i.test(file.name);

  if (!isScreenshot) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Sanitize failed'));
            return;
          }

          resolve(new File(
            [blob],
            file.name.replace(/\.\w+$/, '.jpg'),
            {
              type: 'image/jpeg',
              lastModified: Date.now()
            }
          ));
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = e => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };

    img.src = objectUrl;
  });
}
async function processImageUpload(file, markerKey, fromPaste = false) {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      showNotification(`❌ ${validation.error}`, 'error');
      return;
    }

    // If Image Editor is enabled and available, open it
    if (CONFIG.enableImageEditor && typeof ImageEditor !== 'undefined') {
console.log('✏️ Opening Image Editor...');
showNotification('🧼 Preparing image...', 'info');

let safeFile = file;

try {
  safeFile = await sanitizeBeforeEditor(file);
} catch (e) {
  console.warn('⚠️ Sanitize failed, fallback to original file', e);
}

showNotification('✏️ Opening editor...', 'info');

return new Promise((resolve) => {
  ImageEditor.open(safeFile, markerKey, async (result) => {
          // Check if user cancelled
          if (result.status === 'cancel') {
            console.log('❌ Upload cancelled by user');
            showNotification('Upload cancelled', 'info');
            resolve(); // Resolve tanpa upload
            return;
          }
          
          // Only proceed if confirmed
          if (result.status === 'confirm' && result.blob) {
            console.log('📝 Image edited, proceeding with upload...');
            
            // Convert blob to file
const editedFile = new File(
  [result.blob],
  file.name.replace(/\.\w+$/, '.webp'),
  {
    type: 'image/webp',
    lastModified: Date.now()
  }
);

            // Continue with upload
            await continueUpload(editedFile, markerKey, fromPaste);
            resolve();
          } else {
            // Jika status tidak dikenali
            console.log('⚠️ Unknown editor status:', result.status);
            resolve();
          }
        });
      });
    } else {
      // Direct upload without editor
      await continueUpload(file, markerKey, fromPaste);
    }
  }
  async function continueUpload(file, markerKey, fromPaste) {
    const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);

    try {
      if (container) container.classList.add('uploading');

      try {
        await checkServerQuota();
      } catch (err) {
        if (err.message === "quota") {
          showNotification("⚠️ Server quota exceeded. Try again later.", "error");
          return;
        }

        if (err.message === "auth") {
          showNotification("❌ Session expired. Please login again.", "error");
          return;
        }
      }

      const source = fromPaste ? 'clipboard' : 'file';
      showNotification(`⏳ Compressing ${source} image...`, 'info');

      const compressed = await compressToWebP(file);
      
      showNotification(
        `✨ Compressed ${compressed.savings}% • Uploading...`,
        'info'
      );

      const imageUrl = await uploadToImageKit(compressed.blob, markerKey);
      await saveImageUrlToServer(markerKey, imageUrl);

      if (container) {
        container.dataset.uiLoaded = 'false';
      }
      loadImages(markerKey);
      
      showNotification(
        `✅ Upload success! (${formatBytes(compressed.compressedSize)})`,
        'success'
      );
    } catch (error) {
      console.error('Upload failed:', error);
      showNotification(`❌ ${error.message}`, 'error');
    } finally {
      if (container) container.classList.remove('uploading');
    }
  }

  // ==========================================
  // UTILITY
  // ==========================================

  function generateFilename(markerKey, ext = 'webp') {
    const timestamp = Date.now();
    const profile = typeof getUserProfile === 'function' ? getUserProfile() : null;
    const username = profile?.inGameName || 'anonymous';
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedKey = markerKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${sanitizedKey}_${timestamp}_${sanitizedUsername}.${ext}`;
  }

  function validateFile(file) {
    if (!CONFIG.allowedFormats.includes(file.type) && file.type !== 'image/png') {
      return { valid: false, error: 'Format tidak valid. Gunakan PNG, JPG, atau WebP' };
    }
    if (file.size > CONFIG.maxFileSize) {
      return { valid: false, error: `File terlalu besar. Maksimal ${formatBytes(CONFIG.maxFileSize)}` };
    }
    return { valid: true };
  }

  async function checkServerQuota() {
    const token = typeof getUserToken === 'function' ? getUserToken() : null;
    if (!token) throw new Error('auth');

    const res = await fetch(CONFIG.authEndpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 429 || res.status === 503) {
      throw new Error("quota");
    }

    if (!res.ok) {
      throw new Error("auth");
    }

    const data = await res.json();
    return data;
  }

  // ==========================================
  // UI COMPONENTS (with touch protection)
  // ==========================================

  function createImageContainerHTML(markerData) {
    const markerKey = markerData._key;
    const mobile = isMobile();
    const touch = isTouchDevice();
    
    // Paste zone hanya untuk desktop non-touch
    const pasteZoneHTML = !mobile && !touch ? `
      <div class="marker-paste-zone" 
           onclick="MarkerImageHandler.triggerUpload('${markerKey}')"
           title="Click to browse files or press Ctrl+V to paste">
        <div class="paste-zone-icon">📋</div>
        <div class="paste-zone-text">
          <div class="paste-zone-title">Drop or Paste Image</div>
          <div class="paste-zone-subtitle">Click to browse • Ctrl+V to paste</div>
        </div>
      </div>
    ` : '';
    
    return `
      <div class="marker-image-container" 
           data-marker-key="${markerKey}" 
           data-current-index="0"
           data-ui-loaded="false">
        
        <div class="marker-image-wrapper" 
             onpointerdown="MarkerImageHandler.handlePointerStart(event)">
          <img 
            class="marker-popup-img" 
            src="${CONFIG.fallbackImage}"
            alt="${markerData.name || 'Location'}"
            data-marker-key="${markerKey}">
          
          <div class="marker-image-loading" style="display: none;">
            <div class="spinner"></div>
          </div>
          
          <div class="marker-image-overlay">
            <button class="marker-image-btn upload-btn" 
                    onclick="return MarkerImageHandler.safeUploadClick('${markerKey}', event)">
              📤 Upload
            </button>
            ${pasteZoneHTML}
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

  function loadImages(markerKey) {
    const container = document.querySelector(`.marker-image-container[data-marker-key="${markerKey}"]`);
    if (!container) return;

    if (container.dataset.uiLoaded === 'true') return;

    const img = container.querySelector('.marker-popup-img');
    const overlay = container.querySelector('.marker-image-overlay');
    const navContainer = container.querySelector('.marker-image-nav-container');
    const uploaderEl = container.querySelector('.marker-image-uploader');

    const images = getImages(markerKey);
    const mobile = isMobile();
    const touch = isTouchDevice();
    
    container.dataset.uiLoaded = 'true';
    container.dataset.images = JSON.stringify(images);

    // Attach paste listener (desktop non-touch only)
    if (!mobile && !touch) {
      attachPasteListener(markerKey);
    }

    if (images.length > 0) {
      img.onerror = () => {
        img.src = CONFIG.fallbackImage;
        container.dataset.isFallback = 'true';
      };
      img.src = images[0].url;

      if (uploaderEl) {
        uploaderEl.textContent = `📷 ${images[0].uploadedBy}`;
        uploaderEl.style.display = 'block';
      }

      // Paste zone hanya desktop non-touch
      const pasteZoneHTML = !mobile && !touch ? `
        <div class="marker-paste-zone compact" 
             onclick="MarkerImageHandler.triggerUpload('${markerKey}')"
             title="Click to browse or Ctrl+V to paste">
          <div class="paste-zone-icon">📋</div>
          <div class="paste-zone-text">
            <div class="paste-zone-subtitle">Click or Ctrl+V</div>
          </div>
        </div>
      ` : '';

      overlay.innerHTML = `
        <button class="marker-image-btn upload-btn" 
                onclick="return MarkerImageHandler.safeUploadClick('${markerKey}', event)">
          📤 Upload
        </button>
        ${pasteZoneHTML}
        <button class="marker-image-btn fullview-btn" onclick="MarkerImageHandler.openFullView('${markerKey}')">
          🔍 Full View
        </button>
      `;

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
      
      const pasteZoneHTML = !mobile && !touch ? `
        <div class="marker-paste-zone" 
             onclick="MarkerImageHandler.triggerUpload('${markerKey}')"
             title="Click to browse files or press Ctrl+V to paste">
          <div class="paste-zone-icon">📋</div>
          <div class="paste-zone-text">
            <div class="paste-zone-title">Drop or Paste Image</div>
            <div class="paste-zone-subtitle">Click to browse • Ctrl+V to paste</div>
          </div>
        </div>
      ` : '';
      
      overlay.innerHTML = `
        <button class="marker-image-btn upload-btn" 
                onclick="return MarkerImageHandler.safeUploadClick('${markerKey}', event)">
          📤 Upload
        </button>
        ${pasteZoneHTML}
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
  // FILE UPLOAD (with touch protection)
  // ==========================================

  function safeUploadClick(markerKey, event) {
    // Jika touch protection disabled, langsung izinkan
    if (!CONFIG.enableTouchProtection) {
      triggerUpload(markerKey);
      return true;
    }
    
    // Touch protection logic
    const timeSinceTouch = Date.now() - lastTouchTime;
    const isTouchEvent = event.pointerType === 'touch' || 
                         (event.type && event.type.indexOf('touch') !== -1);
    
    // Hanya blokir jika:
    // 1. Touch event yang baru saja terjadi (< 300ms)
    // 2. DAN bukan klik mouse biasa
    if (isTouchEvent && timeSinceTouch < 300) {
      event.preventDefault();
      event.stopPropagation();
      console.log('🚫 Upload click prevented (touch hover detected)');
      return false;
    }
    
    triggerUpload(markerKey);
    return true;
  }

  function triggerUpload(markerKey) {
    if (!CONFIG.uploadEnabled) {
      showNotification(
        `⚠️ Upload temporarily unavailable until ${CONFIG.uploadResumeDate}.`,
        'error'
      );
      return;
    }

    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
      if (typeof showLoginPopup === 'function') showLoginPopup();
      else showNotification('❌ Please login to upload', 'error');
      return;
    }
    
    const input = document.getElementById(`imageInput_${markerKey}`);
    if (input) input.click();
  }

  async function handleFileSelect(event, markerKey) {
    const file = event.target.files[0];
    if (!file) return;

    await processImageUpload(file, markerKey, false);
    event.target.value = '';
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
    console.log('📦 IMAGE CACHE DEBUG v5.5');
    console.log('isLoaded:', isLoaded);
    console.log('Upload enabled:', CONFIG.uploadEnabled);
    console.log('Editor enabled:', CONFIG.enableImageEditor);
    console.log('ImageEditor available:', typeof ImageEditor !== 'undefined');
    console.log('Device:', isMobile() ? 'Mobile' : 'Desktop');
    console.log('Input:', isTouchDevice() ? 'Touch' : 'Mouse');
    console.log('Total markers:', Object.keys(imageCache).length);
    console.log('Last updated:', new Date(getLastUpdated()).toLocaleString());
    console.log('Active paste listeners:', pasteListeners.size);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  function clearCache() {
    imageCache = {};
    localStorage.removeItem(CONFIG.cacheKey);
    localStorage.removeItem(CONFIG.cacheVersionKey);
    isLoaded = false;
    
    pasteListeners.forEach((listener, key) => {
      document.removeEventListener('paste', listener);
    });
    pasteListeners.clear();
    
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
    console.log('🚀 MarkerImageHandler v5.5 initializing...');
    
    if (!CONFIG.uploadEnabled) {
      console.warn(`⚠️ Upload temporarily disabled until ${CONFIG.uploadResumeDate}`);
    }

    if (CONFIG.enableImageEditor) {
      if (typeof ImageEditor !== 'undefined') {
        console.log('✏️ Image Editor integration enabled');
      } else {
        console.warn('⚠️ Image Editor not found. Load editing-image-upload.js first.');
      }
    }

    const deviceType = isMobile() ? 'Mobile' : 'Desktop';
    const inputType = isTouchDevice() ? 'Touch' : 'Mouse';
    console.log(`📱 Device: ${deviceType} / Input: ${inputType}`);

    await preloadAllImages();

    console.log('✨ Preload complete:', Object.keys(imageCache).length, 'markers');

    // Pasang listener popup (kalau map belum ada, error dicegah)
    try {
      // Popup open
      MarkerManager.map.on('popupopen', function (e) {
        const content = e.popup.getElement();
        if (!content) return;

        const container = content.querySelector('.marker-image-container');
        if (container) {
          const markerKey = container.dataset.markerKey;
          loadImages(markerKey);
        }
      });

      // Popup close - cleanup paste listener
      MarkerManager.map.on('popupclose', function (e) {
        const content = e.popup.getElement();
        if (!content) return;

        const container = content.querySelector('.marker-image-container');
        if (container) {
          const markerKey = container.dataset.markerKey;
          removePasteListener(markerKey);
        }
      });

      console.log('📌 Popup listeners attached');
    } catch (err) {
      console.warn('⚠️ Map not ready yet, popup listener skipped.');
    }

    console.log('✅ MarkerImageHandler v5.5 ready');
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  return {
    init,
    createImageContainerHTML,
    loadImages,
    getImages,
    hasImages,
    triggerUpload,
    safeUploadClick,
    handleFileSelect,
    handlePointerStart,
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

// Global expose
window.MarkerImageHandler = MarkerImageHandler;
console.log('✅ MarkerImageHandler module loaded v5.5.0');