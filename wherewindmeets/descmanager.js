/**
 * Description Loader Module
 * Loads and merges description data from descknowladge.json into markers
 * ✨ WITH CACHE SUPPORT + 3 DAYS EXPIRATION
 */

const DescriptionLoader = {
  descData: null,
  isLoaded: false,
  CACHE_KEY: 'wwm_desc_data',
  CACHE_VERSION_KEY: 'wwm_desc_version',
  CACHE_TIMESTAMP_KEY: 'wwm_desc_timestamp',
  CURRENT_VERSION: '1.0.0', // ✨ Update ini saat desc berubah
  CACHE_DURATION: 3 * 24 * 60 * 60 * 1000, // ✨ 3 hari dalam milliseconds

  /**
   * Initialize and load description data
   */
  async init() {
    try {
      console.log('📖 Loading description data...');
      
      // ✨ CEK CACHE DULU
      const cached = this.loadFromCache();
      if (cached) {
        console.log('✅ Using cached description data');
        this.descData = cached;
        this.isLoaded = true;
        return this.descData;
      }

      // ✨ FETCH DARI SERVER (jika cache tidak ada/expired)
      console.log('🌐 Fetching fresh description data...');
      const response = await fetch(`${API_BASE_URL}/desckknowladge?v=${this.CURRENT_VERSION}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load descknowladge.json: ${response.status}`);
      }

      this.descData = await response.json();
      this.isLoaded = true;

      // ✨ SIMPAN KE CACHE
      this.saveToCache(this.descData);

      console.log(`✅ Description data loaded: ${Object.keys(this.descData).length} entries`);
      
      return this.descData;

    } catch (error) {
      console.error('❌ Failed to load description data:', error);
      
      // ✨ FALLBACK KE CACHE LAMA (meski expired)
      const fallbackCache = this.loadFromCache(true);
      if (fallbackCache) {
        console.warn('⚠️ Using expired cache as fallback');
        this.descData = fallbackCache;
        this.isLoaded = true;
        return this.descData;
      }
      
      this.descData = {};
      this.isLoaded = false;
      throw error;
    }
  },

  /**
   * ✨ Load from localStorage cache
   * @param {boolean} ignoreExpiry - Load even if expired (for fallback)
   * @returns {Object|null}
   */
  loadFromCache(ignoreExpiry = false) {
    try {
      const cachedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);

      if (!cachedData) {
        console.log('📦 No cache found');
        return null;
      }

      // ✨ CEK VERSI
      if (cachedVersion !== this.CURRENT_VERSION) {
        console.log(`🔄 Cache version mismatch (${cachedVersion} vs ${this.CURRENT_VERSION})`);
        if (!ignoreExpiry) {
          this.clearCache();
          return null;
        }
      }

      // ✨ CEK EXPIRED (3 hari)
      if (!ignoreExpiry && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        const age = now - timestamp;
        const ageInDays = (age / (24 * 60 * 60 * 1000)).toFixed(1);

        if (age > this.CACHE_DURATION) {
          console.log(`⏰ Cache expired (${ageInDays} days old, max 3 days)`);
          this.clearCache();
          return null;
        }

        console.log(`⏱️ Cache age: ${ageInDays} days (valid)`);
      }

      const data = JSON.parse(cachedData);
      console.log(`✅ Cache loaded: ${Object.keys(data).length} entries`);
      return data;

    } catch (error) {
      console.error('❌ Failed to load cache:', error);
      return null;
    }
  },

  /**
   * ✨ Save to localStorage cache
   * @param {Object} data
   */
  saveToCache(data) {
    try {
      const timestamp = Date.now();
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_VERSION_KEY, this.CURRENT_VERSION);
      localStorage.setItem(this.CACHE_TIMESTAMP_KEY, timestamp.toString());
      
      const date = new Date(timestamp).toLocaleString();
      console.log(`💾 Description data cached at ${date}`);
    } catch (error) {
      console.error('❌ Failed to save cache:', error);
    }
  },

  /**
   * ✨ Clear cache (untuk debugging atau force refresh)
   */
  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.CACHE_VERSION_KEY);
    localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
    console.log('🗑️ Description cache cleared');
  },

  /**
   * ✨ Force refresh (hapus cache lalu reload)
   */
  async forceRefresh() {
    this.clearCache();
    return await this.init();
  },

  /**
   * ✨ Get cache info (untuk debugging)
   * @returns {Object} Cache information
   */
  getCacheInfo() {
    const cachedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
    const cachedTimestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
    const cachedData = localStorage.getItem(this.CACHE_KEY);

    if (!cachedData) {
      return {
        exists: false,
        message: 'No cache found'
      };
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();
    const age = now - timestamp;
    const ageInDays = (age / (24 * 60 * 60 * 1000)).toFixed(2);
    const remainingTime = this.CACHE_DURATION - age;
    const remainingDays = (remainingTime / (24 * 60 * 60 * 1000)).toFixed(2);
    const isExpired = age > this.CACHE_DURATION;
    const isVersionMatch = cachedVersion === this.CURRENT_VERSION;

    return {
      exists: true,
      version: cachedVersion,
      currentVersion: this.CURRENT_VERSION,
      isVersionMatch,
      timestamp: new Date(timestamp).toLocaleString(),
      ageInDays: parseFloat(ageInDays),
      remainingDays: parseFloat(remainingDays),
      isExpired,
      isValid: !isExpired && isVersionMatch,
      entriesCount: JSON.parse(cachedData) ? Object.keys(JSON.parse(cachedData)).length : 0
    };
  },

  /**
   * Merge descriptions into marker data
   * Priority: markerData.desc > descknowladge.json > 'No description available'
   */
  mergeDescriptions(markerData) {
    if (!this.isLoaded || !this.descData) {
      console.warn('⚠️ Description data not loaded yet');
      return markerData;
    }

    let mergedDesc = 0;
    let mergedLocType = 0;

    Object.keys(markerData).forEach(markerId => {
      const marker = markerData[markerId];
      const fallback = this.descData[markerId];

      if (!fallback) return;

      // === DESC FALLBACK ===
      if (!marker.desc || marker.desc.trim() === '') {
        if (fallback.desc && fallback.desc.trim() !== '') {
          marker.desc = fallback.desc;
          mergedDesc++;
        }
      }

      // === LOC_TYPE FALLBACK ===
      if (!marker.loc_type || marker.loc_type.trim() === '') {
        if (fallback.loc_type && fallback.loc_type.trim() !== '') {
          marker.loc_type = fallback.loc_type;
          mergedLocType++;
        }
      }
    });

    console.log(
      `✅ Fallback applied → desc: ${mergedDesc}, loc_type: ${mergedLocType}`
    );

    return markerData;
  },

  /**
   * Merge descriptions into all loaded endpoints
   */
  mergeAllDescriptions() {
    if (!window.DataLoader || !window.DataLoader.loadedData) {
      console.error('❌ DataLoader not found or no data loaded');
      return;
    }

    // Iterate through all loaded endpoints
    Object.keys(window.DataLoader.loadedData).forEach(endpointKey => {
      const endpointData = window.DataLoader.loadedData[endpointKey];
      
      if (endpointData && typeof endpointData === 'object') {
        this.mergeDescriptions(endpointData);
        
        // Update global variable if exists
        const globalVar = window.DataLoader.ENDPOINT_TO_GLOBAL?.[endpointKey];
        if (globalVar && window[globalVar]) {
          window[globalVar] = endpointData;
        }
      }
    });

    console.log(`✅ Description merge complete for all endpoints`);
  },

  /**
   * Get description for a specific marker
   * @param {string} markerId - Marker ID
   * @param {boolean} convertNewlines - Convert \n to <br> for HTML display
   * @returns {string|null} - Description or null if not found
   */
  getDescription(markerId, convertNewlines = false) {
    if (!this.isLoaded || !this.descData) {
      return null;
    }

    let desc = this.descData[markerId]?.desc || null;
    
    if (desc && convertNewlines) {
      desc = this.convertNewlinesToBr(desc);
    }

    return desc;
  },

  /**
   * Convert \n to <br> tags for HTML display
   * @param {string} text - Text with \n characters
   * @returns {string} - Text with <br> tags
   */
  convertNewlinesToBr(text) {
    if (!text) return text;
    return text.replace(/\n/g, '<br>');
  },

  /**
   * Get all description data
   * @returns {Object} - All description data
   */
  getAllDescriptions() {
    return this.descData || {};
  },

  /**
   * Check if descriptions are loaded
   * @returns {boolean}
   */
  isReady() {
    return this.isLoaded;
  }
};

// Export to window for global access
window.DescriptionLoader = DescriptionLoader;