/**
 * Data loader module for fetching marker data from API endpoints
 */

// API endpoints configuration
const DATA_ENDPOINTS = {
  list: 'https://autumn-dream-8c07.square-spon.workers.dev/list',
  batu: 'https://autumn-dream-8c07.square-spon.workers.dev/batu',
  aneh: 'https://autumn-dream-8c07.square-spon.workers.dev/aneh',
  cave: 'https://autumn-dream-8c07.square-spon.workers.dev/cave',
  soundofheaven: 'https://autumn-dream-8c07.square-spon.workers.dev/soundofheaven',
  windofpath: 'https://autumn-dream-8c07.square-spon.workers.dev/windofpath',
  windofsacriface: 'https://autumn-dream-8c07.square-spon.workers.dev/windofsacriface',
  relic: 'https://autumn-dream-8c07.square-spon.workers.dev/relic',
  cat: 'https://autumn-dream-8c07.square-spon.workers.dev/cat',
  injustice: 'https://autumn-dream-8c07.square-spon.workers.dev/injustice',
  adventure: 'https://autumn-dream-8c07.square-spon.workers.dev/adventure',
  meow: 'https://autumn-dream-8c07.square-spon.workers.dev/meow',
  knowladge: 'https://autumn-dream-8c07.square-spon.workers.dev/knowladge',
  story: 'https://autumn-dream-8c07.square-spon.workers.dev/story',
  moon: 'https://autumn-dream-8c07.square-spon.workers.dev/moon',
  uncounted: 'https://autumn-dream-8c07.square-spon.workers.dev/uncounted',
  precious: 'https://autumn-dream-8c07.square-spon.workers.dev/precious',
  gourmet: 'https://autumn-dream-8c07.square-spon.workers.dev/gourmet',
  special: 'https://autumn-dream-8c07.square-spon.workers.dev/specialstrange',
  toilet: 'https://autumn-dream-8c07.square-spon.workers.dev/toilet',
  healing: 'https://autumn-dream-8c07.square-spon.workers.dev/healingpot',
  makeafriend: 'https://autumn-dream-8c07.square-spon.workers.dev/makeafriend',
  argument: 'https://autumn-dream-8c07.square-spon.workers.dev/arrgument',
  book: 'https://autumn-dream-8c07.square-spon.workers.dev/book',
  guard: 'https://autumn-dream-8c07.square-spon.workers.dev/guard',
  stronghold: 'https://autumn-dream-8c07.square-spon.workers.dev/strongehold',
  boss: 'https://autumn-dream-8c07.square-spon.workers.dev/boss',
  materialart: 'https://autumn-dream-8c07.square-spon.workers.dev/jutsu'
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
  materialart: 'jurus'
};

const DataLoader = {
  loadedData: {},
  loadingProgress: {},
  isLoading: false,

  async init() {
    this.showLoadingSpinner(true);
    this.isLoading = true;

    try {
      await this.loadAllEndpoints();

      const feedbackRes = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/userfeedback");
      const feedbackData = await feedbackRes.json();

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
      return true;

    } catch (error) {
      this.isLoading = false;
      this.showLoadingSpinner(false);
      throw error;
    }
  },

  async loadAllEndpoints() {
    const promises = Object.keys(DATA_ENDPOINTS).map(key =>
      this.loadEndpoint(key, DATA_ENDPOINTS[key])
    );
    await Promise.all(promises);
  },

async loadEndpoint(key, url) {
  console.group(`🔎 Checking endpoint: %c${key}`, "color: orange; font-weight: bold");
  console.log("🌐 URL:", url);

  try {
    const response = await fetch(url);

    // HTTP error seperti 404, 403, 500
    if (!response.ok) {
      console.error(`❌ HTTP ERROR for "${key}" →`, response.status, response.statusText);
      console.groupEnd();
      return this.loadedData[key] = {};
    }

    let data;

    // JSON parse error (contoh: koma hilang, bracket salah)
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error(`❌ JSON SYNTAX ERROR in "${key}"`);
      console.error(jsonErr);
      console.groupEnd();
      return this.loadedData[key] = {};
    }

    // Deteksi JSON kosong atau tidak valid
    if (!data || typeof data !== 'object') {
      console.warn(`⚠️ INVALID JSON for "${key}" → not an object`, data);
    } else if (Object.keys(data).length === 0) {
      console.warn(`⚠️ EMPTY JSON for "${key}"`);
    } else {
      console.log(`✅ OK: "${key}" loaded successfully`);
    }

    this.loadedData[key] = data;
    console.groupEnd();
    return data;

  } catch (err) {
    console.error(`❌ UNKNOWN ERROR on "${key}"`);
    console.error(err);
    console.groupEnd();
    return this.loadedData[key] = {};
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
      endpoints: Object.keys(DATA_ENDPOINTS)
    };
  }
};

window.DataLoader = DataLoader;