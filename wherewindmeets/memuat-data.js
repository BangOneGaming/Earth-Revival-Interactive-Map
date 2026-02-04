/**
 * Data loader module for fetching marker data from API endpoints
 * Now optimized with batch loading + support for /terbaru endpoint
 */

// Base URL for API
const API_BASE_URL = 'https://autumn-dream-8c07.square-spon.workers.dev';

// 🔐 DATA VERSION (ubah ini kalau ada update data)
const DATA_VERSION = '1.0.0';

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
  kemah: `${API_BASE_URL}/camp`,
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
  kemah: 'kemah',
  terbaru: 'terbaru' // ✅ Tambah mapping global
};

const DataLoader = {
  loadedData: {},
  loadingProgress: {},
  isLoading: false,
  isBackgroundRefresh: false,
  endpointFingerprint: {},
  dataSource: 'unknown', // cache | server
  useBatchLoading: true,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days

generateFingerprint(data) {
  if (!data || typeof data !== 'object') return 'empty';

  const keys = Object.keys(data);
  let sum = keys.length;

  // ambil 5 key pertama aja (hemat)
  for (let i = 0; i < Math.min(5, keys.length); i++) {
    sum += keys[i].length;
  }

  return `${keys.length}-${sum}`;
},


  /* =====================================================
   * INIT
   * ===================================================== */
  async init() {
    this.showLoadingSpinner(true);
    this.isLoading = true;

    try {
      const cached = this.getCachedData();

      /* ===== CACHE HIT ===== */
      if (cached) {
        this.dataSource = 'cache';

        console.log(
          '%c📦 DATA SOURCE: LOCAL CACHE',
          'color:#00c853;font-weight:bold'
        );

        this.loadedData = cached;

        Object.keys(cached).forEach(key => {
          const globalVar = ENDPOINT_TO_GLOBAL[key];
          if (globalVar) window[globalVar] = cached[key];
        });

        this.isLoading = false;
        this.showLoadingSpinner(false);

        await this.loadFeedback();
        

        return true;
      }

      /* ===== CACHE MISS → SERVER ===== */
      this.dataSource = 'server';

      console.log(
        '%c🌐 DATA SOURCE: SERVER (NO LOCAL CACHE)',
        'color:#ff9100;font-weight:bold'
      );

      await this.loadAllEndpoints();
      await this.loadFeedback();

      this.setCachedData(this.loadedData);

      this.isLoading = false;
      this.showLoadingSpinner(false);

      console.log('✅ Initial load complete (server)');
      return true;

    } catch (error) {
      console.error('❌ Data loading failed:', error);
      this.isLoading = false;
      this.showLoadingSpinner(false);
      throw error;
    }
  },

  /* =====================================================
   * FEEDBACK
   * ===================================================== */
  async loadFeedback() {
    try {
      const res = await fetch(`${API_BASE_URL}/userfeedback`);
      const data = await res.json();

      if (typeof syncFeedbackToMarkers === "function") {
        Object.keys(this.loadedData).forEach(key => {
          const markers = this.loadedData[key];
          if (markers && typeof markers === 'object') {
            syncFeedbackToMarkers(markers, data);
          }
        });
      }
    } catch (err) {
      console.warn('⚠️ Feedback load failed:', err);
    }
  },

  /* =====================================================
   * CACHE
   * ===================================================== */
  getCachedData() {
  try {
    const raw = localStorage.getItem('markerData');
    if (!raw) return null;

    const { data, timestamp, version } = JSON.parse(raw);

    // 🔥 VERSION BERUBAH → FORCE SERVER
    if (version !== DATA_VERSION) {
      console.log(
        `%c🔁 Data version changed (${version} → ${DATA_VERSION})`,
        'color:#ff5252;font-weight:bold'
      );
      localStorage.removeItem('markerData');
      return null;
    }

    const age = Date.now() - timestamp;

    // ⏰ EXPIRED (1 MINGGU)
    if (age > this.cacheExpiry) {
      console.log('⏰ Cache expired (weekly)');
      localStorage.removeItem('markerData');
      return null;
    }

    console.log(
      `%c✅ Cache valid (weekly + version)`,
      'color:#4caf50;font-weight:bold'
    );

    return data;

  } catch (err) {
    console.warn('⚠️ Cache read error:', err);
    return null;
  }
},

  setCachedData(data) {
  try {
    localStorage.setItem(
      'markerData',
      JSON.stringify({
        data,
        timestamp: Date.now(),
        version: DATA_VERSION // 🔐 SIMPAN VERSI
      })
    );
    console.log('💾 Cached to localStorage (weekly + version)');
  } catch (err) {
    console.warn('⚠️ Cache write failed:', err);
  }
},

  clearCache() {
    localStorage.removeItem('markerData');
    console.log('🗑️ Cache cleared');
  },

  /* =====================================================
   * BACKGROUND REFRESH
   * ===================================================== */
  async backgroundRefresh() {
  console.log('%c🔄 Background refresh (diff mode)', 'color:#03a9f4');

  this.isBackgroundRefresh = true;

  const updatedEndpoints = [];
  const oldFingerprints = { ...this.endpointFingerprint };
  const oldData = { ...this.loadedData };

  try {
    await this.loadAllEndpoints();

    Object.keys(this.loadedData).forEach(key => {
      const oldFP = oldFingerprints[key];
      const newFP = this.generateFingerprint(this.loadedData[key]);

      if (oldFP !== newFP) {
        updatedEndpoints.push(key);
        this.endpointFingerprint[key] = newFP;
      } else {
        this.loadedData[key] = oldData[key];
        this.endpointFingerprint[key] = oldFP;
      }
    });

    if (updatedEndpoints.length > 0) {
      this.setCachedData(this.loadedData);
      MarkerManager?.updateMarkersInView?.(updatedEndpoints);
    }

  } catch (err) {
    console.warn('⚠️ Background refresh diff failed:', err);
  } finally {
    this.isBackgroundRefresh = false;
  }
},

  /* =====================================================
   * LOADERS
   * ===================================================== */
  async loadAllEndpoints() {
    if (this.useBatchLoading) {
      await this.loadBatch();
    } else {
      await Promise.all(
        Object.keys(DATA_ENDPOINTS).map(key =>
          this.loadEndpoint(key, DATA_ENDPOINTS[key])
        )
      );
    }
  },

  async loadBatch() {
    try {
      const endpoints = Object.entries(DATA_ENDPOINTS).map(([key, url]) => ({
        key,
        path: new URL(url).pathname.slice(1)
      }));

      console.log(
        `%c📦 BATCH LOAD (${endpoints.length} endpoints)`,
        'color:#673ab7;font-weight:bold'
      );

      const res = await fetch(`${API_BASE_URL}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: endpoints.map(e => e.path)
        })
      });

      console.log(
        '%c📦 BATCH RESPONSE',
        'color:#673ab7',
        {
          status: res.status,
          cfCache: res.headers.get('cf-cache-status') || 'N/A'
        }
      );

      if (!res.ok) throw new Error(`Batch HTTP ${res.status}`);

      const batchData = await res.json();

      endpoints.forEach(({ key, path }) => {
        let data = batchData[path] || {};

        if (key === 'terbaru') {
          data = this.filterApprovedMarkers(data);
          console.log(`🆕 terbaru approved: ${Object.keys(data).length}`);
        }

this.loadedData[key] = data;

if (!this.isBackgroundRefresh) {
  this.endpointFingerprint[key] = this.generateFingerprint(data);
}

const globalVar = ENDPOINT_TO_GLOBAL[key];
if (globalVar) window[globalVar] = data;
      });

    } catch (err) {
      console.error('❌ Batch failed → fallback individual', err);
      this.useBatchLoading = false;

      await Promise.all(
        Object.keys(DATA_ENDPOINTS).map(key =>
          this.loadEndpoint(key, DATA_ENDPOINTS[key])
        )
      );
    }
  },

  async loadEndpoint(key, url) {
    try {
      const res = await fetch(url);

      console.log(
        `%c🌐 [${key}] FETCH`,
        'color:#2196f3',
        {
          status: res.status,
          cfCache: res.headers.get('cf-cache-status') || 'N/A'
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let data = await res.json();

      if (key === 'terbaru') {
        data = this.filterApprovedMarkers(data);
      }

      this.loadedData[key] = data;

if (!this.isBackgroundRefresh) {
  this.endpointFingerprint[key] = this.generateFingerprint(data);
}

const globalVar = ENDPOINT_TO_GLOBAL[key];
if (globalVar) window[globalVar] = data;

      return data;

    } catch (err) {
      console.error(`❌ ${key} load failed`, err);
      this.loadedData[key] = {};
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) window[globalVar] = {};
    }
  },

  filterApprovedMarkers(data) {
    if (!data || typeof data !== 'object') return {};
    return Object.fromEntries(
      Object.entries(data).filter(([_, m]) => m?.approved === true)
    );
  },

  /* =====================================================
   * UTILS
   * ===================================================== */
  showLoadingSpinner(show) {
    const el = document.getElementById('loadingSpinner');
    if (el) el.style.display = show ? 'block' : 'none';
  },

  getStatus() {
    return {
      dataSource: this.dataSource,
      isLoading: this.isLoading,
      loadedEndpoints: Object.keys(this.loadedData).length,
      totalEndpoints: Object.keys(DATA_ENDPOINTS).length,
      batchMode: this.useBatchLoading,
      cacheStatus: this.getCachedData() ? 'HIT' : 'MISS'
    };
  }
};

window.DataLoader = DataLoader;