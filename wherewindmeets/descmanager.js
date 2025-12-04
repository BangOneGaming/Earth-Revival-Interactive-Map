/**
 * Description Loader Module
 * Loads and merges description data from descknowladge.json into markers
 */

const DescriptionLoader = {
  descData: null,
  isLoaded: false,

  /**
   * Initialize and load description data
   */
  async init() {
    try {
      console.log('📖 Loading description data...');
      
      // Load descknowladge.json from local file
      const response = await fetch('./descknowladge.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load descknowladge.json: ${response.status}`);
      }

      this.descData = await response.json();
      this.isLoaded = true;

      console.log(`✅ Description data loaded: ${Object.keys(this.descData).length} entries`);
      
      return this.descData;

    } catch (error) {
      console.error('❌ Failed to load description data:', error);
      this.descData = {};
      this.isLoaded = false;
      throw error;
    }
  },

  /**
   * Merge descriptions into marker data
   * Priority: markerData.desc > descknowladge.json > 'No description available'
   * descknowladge.json hanya digunakan jika marker.desc kosong/tidak ada
   * @param {Object} markerData - Marker data object from DataLoader
   * @returns {Object} - Marker data with merged descriptions
   */
  mergeDescriptions(markerData) {
    if (!this.isLoaded || !this.descData) {
      console.warn('⚠️ Description data not loaded yet');
      return markerData;
    }

    let mergedCount = 0;

    // Iterate through all markers
    Object.keys(markerData).forEach(markerId => {
      const marker = markerData[markerId];
      
      // HANYA isi dari descknowladge.json jika marker.desc KOSONG
      if (!marker.desc || marker.desc.trim() === '') {
        if (this.descData[markerId] && this.descData[markerId].desc) {
          marker.desc = this.descData[markerId].desc;
          mergedCount++;
        }
      }
      // Jika marker.desc sudah ada, BIARKAN (prioritas lebih tinggi)
    });

    console.log(`✅ Filled ${mergedCount} empty descriptions from descknowladge.json`);
    
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

    let totalMerged = 0;

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

// ❌ HAPUS AUTO-INITIALIZE - Biar gak loading sendiri duluan
// Loading akan diatur dari main.js dengan urutan yang benar