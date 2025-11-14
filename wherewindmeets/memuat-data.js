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
  story: 'https://autumn-dream-8c07.square-spon.workers.dev/story'
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
  story: 'cerita'
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
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.loadedData[key] = data;

      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) window[globalVar] = data;

      return data;

    } catch (error) {
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
      endpoints: Object.keys(DATA_ENDPOINTS)
    };
  }
};

window.DataLoader = DataLoader;