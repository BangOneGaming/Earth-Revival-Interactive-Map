/**
 * Data loader module for fetching marker data from API endpoints
 * Now optimized with batch loading + support for /terbaru endpoint
 */

// Base URL for API
const API_BASE_URL = 'https://autumn-dream-8c07.square-spon.workers.dev';

// API endpoints configuration
const DATA_ENDPOINTS = {
  list: `${API_BASE_URL}/list`,
  batu: `${API_BASE_URL}/batu`,
  aneh: `${API_BASE_URL}/aneh`,
  cave: `${API_BASE_URL}/cave`,
  soundofheaven: `${API_BASE_URL}/soundofheaven`,
  windofpath: `${API_BASE_URL}/windofpath`,
  windofsacriface: `${API_BASE_URL}/windofsacriface`,
  relic: `${API_BASE_URL}/relic`,
  cat: `${API_BASE_URL}/cat`,
  injustice: `${API_BASE_URL}/injustice`,
  adventure: `${API_BASE_URL}/adventure`,
  meow: `${API_BASE_URL}/meow`,
  knowladge: `${API_BASE_URL}/knowladge`,
  story: `${API_BASE_URL}/story`,
  moon: `${API_BASE_URL}/moon`,
  uncounted: `${API_BASE_URL}/uncounted`,
  precious: `${API_BASE_URL}/precious`,
  gourmet: `${API_BASE_URL}/gourmet`,
  special: `${API_BASE_URL}/specialstrange`,
  toilet: `${API_BASE_URL}/toilet`,
  healing: `${API_BASE_URL}/healingpot`,
  makeafriend: `${API_BASE_URL}/makeafriend`,
  argument: `${API_BASE_URL}/arrgument`,
  book: `${API_BASE_URL}/book`,
  guard: `${API_BASE_URL}/guard`,
  stronghold: `${API_BASE_URL}/strongehold`,
  boss: `${API_BASE_URL}/boss`,
  materialart: `${API_BASE_URL}/jutsu`,
  pemancing: `${API_BASE_URL}/catchfish`,
  mabuk: `${API_BASE_URL}/pot`,
  kartu: `${API_BASE_URL}/card`,
  panah: `${API_BASE_URL}/shootingarcher`,
  melodi: `${API_BASE_URL}/melody`,
  tebakan: `${API_BASE_URL}/riddle`,
  gulat: `${API_BASE_URL}/summo`,
  mysticlist: `${API_BASE_URL}/mysticlist`,
  innerwayslist: `${API_BASE_URL}/innerwayslist`,
  npc: `${API_BASE_URL}/npclist`,
  terbaru: `${API_BASE_URL}/terbaru` // ✅ Tambah endpoint baru
};

// Mapping endpoint keys to window global variables
const ENDPOINT_TO_GLOBAL = {
  list: 'chest',
  batu: 'batutele',
  aneh: 'strangecollection',
  cave: 'gua',
  soundofheaven: 'yellow',
  windofpath: 'blue',
  windofsacriface: 'red',
  relic: 'peninggalan',
  cat: 'kucing',
  injustice: 'ketidakadilan',
  adventure: 'petualangan',
  meow: 'meong',
  knowladge: 'pengetahuan',
  story: 'cerita',
  moon: 'bulan',
  uncounted: 'tidakterhitung',
  precious: 'berharga',
  gourmet: 'kulinari',
  special: 'spesial',
  toilet: 'wc',
  healing: 'penyembuhan',
  makeafriend: 'buatteman',
  argument: 'perdebatan',
  book: 'buku',
  guard: 'penjaga',
  stronghold: 'benteng',
  boss: 'bos',
  materialart: 'jurus',
  pemancing: 'pemancing', 
  mabuk: 'mabuk',  
  kartu: 'kartu', 
  panah: 'panah', 
  melodi: 'melodi',
  tebakan: 'tebakan',
  gulat: 'gulat',
  mysticlist: 'tehnik',
  innerwayslist: 'innerwaylist',
  npc: 'npc',
  terbaru: 'terbaru' // ✅ Tambah mapping global
};

const DataLoader = {
  loadedData: {},
  loadingProgress: {},
  isLoading: false,
  useBatchLoading: true,

  async init() {
    this.showLoadingSpinner(true);
    this.isLoading = true;

    try {
      // Load all marker data
      await this.loadAllEndpoints();

      // Load feedback data separately
      const feedbackRes = await fetch(`${API_BASE_URL}/userfeedback`);
      const feedbackData = await feedbackRes.json();

      // Sync feedback to markers
      if (typeof syncFeedbackToMarkers === "function") {
        Object.keys(this.loadedData).forEach(endpointKey => {
          const endpointMarkers = this.loadedData[endpointKey];
          if (endpointMarkers && typeof endpointMarkers === "object") {
            syncFeedbackToMarkers(endpointMarkers, feedbackData);
          }
        });
      }

      this.isLoading = false;
      this.showLoadingSpinner(false);
      console.log('✅ Data loaded successfully via batch endpoint');
      return true;

    } catch (error) {
      console.error('❌ Data loading failed:', error);
      this.isLoading = false;
      this.showLoadingSpinner(false);
      throw error;
    }
  },

  async loadAllEndpoints() {
    if (this.useBatchLoading) {
      await this.loadBatch();
    } else {
      const promises = Object.keys(DATA_ENDPOINTS).map(key =>
        this.loadEndpoint(key, DATA_ENDPOINTS[key])
      );
      await Promise.all(promises);
    }
  },

  async loadBatch() {
    try {
      const endpointPaths = Object.entries(DATA_ENDPOINTS).map(([key, url]) => ({
        key: key,
        path: new URL(url).pathname.slice(1)
      }));

      console.log(`📦 Loading ${endpointPaths.length} endpoints via batch...`);

      const response = await fetch(`${API_BASE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoints: endpointPaths.map(e => e.path)
        })
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const batchData = await response.json();

      endpointPaths.forEach(({ key, path }) => {
        let data = batchData[path] || {};
        
        // ✅ FILTER khusus untuk endpoint terbaru
        if (key === 'terbaru') {
          data = this.filterApprovedMarkers(data);
          console.log(`✅ Filtered terbaru: ${Object.keys(data).length} approved markers`);
        }
        
        this.loadedData[key] = data;

        const globalVar = ENDPOINT_TO_GLOBAL[key];
        if (globalVar) {
          window[globalVar] = data;
        }
      });

      console.log(`✅ Batch loading complete: ${Object.keys(batchData).length} endpoints loaded`);

    } catch (error) {
      console.error('❌ Batch loading failed, falling back to individual requests:', error);
      
      this.useBatchLoading = false;
      const promises = Object.keys(DATA_ENDPOINTS).map(key =>
        this.loadEndpoint(key, DATA_ENDPOINTS[key])
      );
      await Promise.all(promises);
    }
  },

  /**
   * ✅ Filter marker yang approved === true
   */
  filterApprovedMarkers(data) {
    if (!data || typeof data !== 'object') return {};
    
    const filtered = {};
    Object.keys(data).forEach(key => {
      const marker = data[key];
      // Hanya ambil marker dengan approved === true (strict check)
      if (marker && marker.approved === true) {
        filtered[key] = marker;
      }
    });
    
    return filtered;
  },

  async loadEndpoint(key, url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // ✅ FILTER khusus untuk endpoint terbaru
      if (key === 'terbaru') {
        data = this.filterApprovedMarkers(data);
        console.log(`✅ Filtered terbaru: ${Object.keys(data).length} approved markers`);
      }

      this.loadedData[key] = data;

      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) window[globalVar] = data;

      return data;

    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      this.loadedData[key] = {};
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) window[globalVar] = {};
      throw error;
    }
  },

  async reloadEndpoint(key) {
    if (!DATA_ENDPOINTS[key]) return;
    await this.loadEndpoint(key, DATA_ENDPOINTS[key]);
    if (typeof MarkerManager !== 'undefined' && MarkerManager.updateMarkersInView) {
      MarkerManager.updateMarkersInView();
    }
  },

  async reloadAll() {
    this.showLoadingSpinner(true);

    try {
      await this.loadAllEndpoints();
      if (typeof MarkerManager !== 'undefined' && MarkerManager.updateMarkersInView) {
        MarkerManager.updateMarkersInView();
      }
    } finally {
      this.showLoadingSpinner(false);
    }
  },

  getAllMarkers() {
    const allMarkers = [];

    Object.keys(this.loadedData).forEach(endpointKey => {
      const data = this.loadedData[endpointKey];
      if (data && typeof data === 'object') {
        allMarkers.push(...Object.values(data));
      }
    });

    return allMarkers;
  },

  getMarkersByEndpoint(key) {
    const data = this.loadedData[key];
    return data ? Object.values(data) : [];
  },

  showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = show ? 'block' : 'none';
  },

  getStatus() {
    return {
      isLoading: this.isLoading,
      loadedEndpoints: Object.keys(this.loadedData).length,
      totalEndpoints: Object.keys(DATA_ENDPOINTS).length,
      endpoints: Object.keys(DATA_ENDPOINTS),
      batchMode: this.useBatchLoading,
      terbaruCount: this.loadedData.terbaru ? Object.keys(this.loadedData.terbaru).length : 0
    };
  }
};

window.DataLoader = DataLoader;