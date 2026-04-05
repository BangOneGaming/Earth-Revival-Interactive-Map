/**
 * Description Loader Module (clean - warnings only)
 */

const DescriptionLoader = {
  descData: null,
  isLoaded: false,
  CACHE_KEY: 'wwm_desc_data',
  CACHE_VERSION_KEY: 'wwm_desc_version',
  CACHE_TIMESTAMP_KEY: 'wwm_desc_timestamp',
  CURRENT_VERSION: '1.2.26',
  CACHE_DURATION: 3 * 24 * 60 * 60 * 1000,

  async init() {
    try {
      const cached = this.loadFromCache();
      if (cached) {
        this.descData = cached;
        this.isLoaded = true;
        return this.descData;
      }

      const response = await fetch(`${API_BASE_URL}/desckknowladge?v=${this.CURRENT_VERSION}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load descknowladge.json: ${response.status}`);
      }

      this.descData = await response.json();
      this.isLoaded = true;

      this.saveToCache(this.descData);
      return this.descData;

    } catch (error) {
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

  loadFromCache(ignoreExpiry = false) {
    try {
      const cachedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);

      if (!cachedData) return null;

      if (cachedVersion !== this.CURRENT_VERSION && !ignoreExpiry) {
        this.clearCache();
        return null;
      }

      if (!ignoreExpiry && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const age = Date.now() - timestamp;

        if (age > this.CACHE_DURATION) {
          this.clearCache();
          return null;
        }
      }

      return JSON.parse(cachedData);

    } catch {
      return null;
    }
  },

  saveToCache(data) {
    try {
      const timestamp = Date.now();
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_VERSION_KEY, this.CURRENT_VERSION);
      localStorage.setItem(this.CACHE_TIMESTAMP_KEY, timestamp.toString());
    } catch {}
  },

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.CACHE_VERSION_KEY);
    localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
  },

  async forceRefresh() {
    this.clearCache();
    return await this.init();
  },

  getCacheInfo() {
    const cachedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
    const cachedTimestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
    const cachedData = localStorage.getItem(this.CACHE_KEY);

    if (!cachedData) {
      return { exists: false };
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();
    const age = now - timestamp;
    const isExpired = age > this.CACHE_DURATION;
    const isVersionMatch = cachedVersion === this.CURRENT_VERSION;

    return {
      exists: true,
      version: cachedVersion,
      currentVersion: this.CURRENT_VERSION,
      isVersionMatch,
      age,
      isExpired,
      isValid: !isExpired && isVersionMatch
    };
  },

  mergeDescriptions(markerData) {
    if (!this.isLoaded || !this.descData) {
      console.warn('⚠️ Description data not loaded yet');
      return markerData;
    }

    Object.keys(markerData).forEach(markerId => {
      const marker = markerData[markerId];
      const fallback = this.descData[markerId];

      if (!fallback) return;

      if (!marker.desc || marker.desc.trim() === '') {
        if (fallback.desc && fallback.desc.trim() !== '') {
          marker.desc = fallback.desc;
        }
      }

      if (!marker.loc_type || marker.loc_type.trim() === '') {
        if (fallback.loc_type && fallback.loc_type.trim() !== '') {
          marker.loc_type = fallback.loc_type;
        }
      }
    });

    return markerData;
  },


// Di DescriptionLoader
mergeOne(markerId, markerObj) {
  if (!this.isLoaded || !this.descData) return markerObj;
  const fallback = this.descData[markerId];
  if (!fallback) return markerObj;

  if ((!markerObj.desc || markerObj.desc.trim() === '') && fallback.desc?.trim()) {
    markerObj.desc = fallback.desc;
  }
  if ((!markerObj.loc_type || markerObj.loc_type.trim() === '') && fallback.loc_type?.trim()) {
    markerObj.loc_type = fallback.loc_type;
  }
  return markerObj;
},


  async mergeAllDescriptions() {
  // ⏳ Tunggu DataLoader siap
  let retry = 0;
  while ((!window.DataLoader || !window.DataLoader.loadedData) && retry < 50) {
    await new Promise(r => setTimeout(r, 100));
    retry++;
  }

  if (!window.DataLoader || !window.DataLoader.loadedData) {
    console.warn('❌ DataLoader still not ready after wait');
    return;
  }

  Object.keys(window.DataLoader.loadedData).forEach(endpointKey => {
    const endpointData = window.DataLoader.loadedData[endpointKey];
    
    if (endpointData && typeof endpointData === 'object') {
      this.mergeDescriptions(endpointData);
      
      const globalVar = window.DataLoader.ENDPOINT_TO_GLOBAL?.[endpointKey];
      if (globalVar && window[globalVar]) {
        window[globalVar] = endpointData;
      }
    }
  });

  console.log('✅ Descriptions merged');
},

  getDescription(markerId, convertNewlines = false) {
    if (!this.isLoaded || !this.descData) return null;

    let desc = this.descData[markerId]?.desc || null;
    
    if (desc && convertNewlines) {
      desc = this.convertNewlinesToBr(desc);
    }

    return desc;
  },

  convertNewlinesToBr(text) {
    if (!text) return text;
    return text.replace(/\n/g, '<br>');
  },

  getAllDescriptions() {
    return this.descData || {};
  },

  isReady() {
    return this.isLoaded;
  }
};

window.DescriptionLoader = DescriptionLoader;