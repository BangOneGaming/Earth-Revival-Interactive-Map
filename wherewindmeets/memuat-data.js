/**
 * Data loader module for fetching marker data from API endpoints
 * Now optimized with batch loading + stale-while-revalidate cache strategy
 */

const API_BASE_URL = 'https://autumn-dream-8c07.square-spon.workers.dev';

// 🔐 DATA VERSION (ubah ini kalau ada update data marker)
const DATA_VERSION = '1.1.33';

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
  anjing: `${API_BASE_URL}/dog`,
  papan: `${API_BASE_URL}/board`,
  kudadanpanah: `${API_BASE_URL}/rideandarcher`,
  terbaru: `${API_BASE_URL}/terbaru`
};

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
  anjing: 'anjing',
  papan: 'papan',
  kudadanpanah: 'kudadanpanah',
  terbaru: 'terbaru'
};

const DataLoader = {
  loadedData: {},
  loadingProgress: {},
  isLoading: false,
  isBackgroundRefresh: false,
  endpointFingerprint: {},
  dataSource: 'unknown',
  useBatchLoading: true,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 hari

  // ✅ Feedback cache — 1 jam (feedback lebih sering berubah dari marker)
  feedbackExpiry: 60 * 60 * 1000, // 1 jam

  generateFingerprint(data) {
    if (!data || typeof data !== 'object') return 'empty';
    const keys = Object.keys(data);
    let sum = keys.length;
    for (let i = 0; i < Math.min(5, keys.length); i++) {
      sum += keys[i].length;
    }
    return `${keys.length}-${sum}`;
  },

  /* =====================================================
   * INIT — cache-first, server hanya saat perlu
   * Fetch server terjadi HANYA jika:
   * 1. Tidak ada cache sama sekali (kunjungan pertama)
   * 2. Cache expired > 7 hari
   * 3. DATA_VERSION berubah
   * ===================================================== */
  async init() {
    this.showLoadingSpinner(true);
    this.isLoading = true;

    try {
      const cached = this.getCachedData();

      /* ===== CACHE HIT → pakai cache, tidak fetch server ===== */
      if (cached) {
        this.dataSource = 'cache';

        console.log(
          '%c📦 DATA SOURCE: LOCAL CACHE (no server fetch)',
          'color:#00c853;font-weight:bold'
        );

        this.loadedData = cached;

        Object.keys(cached).forEach(key => {
          const globalVar = ENDPOINT_TO_GLOBAL[key];
          if (globalVar) window[globalVar] = cached[key];
        });

        this.isLoading = false;
        this.showLoadingSpinner(false);

        // ✅ Feedback juga pakai cache — fetch hanya kalau expired
        await this.loadFeedback(false);

        return true;
      }

      /* ===== CACHE MISS → cek stale cache dulu ===== */
      this.dataSource = 'server';

      console.log(
        '%c🌐 DATA SOURCE: SERVER',
        'color:#ff9100;font-weight:bold'
      );

      const staleCache = this.getStaleCache();

      if (staleCache) {
        // ⚡ Pakai data lama dulu — user tidak nunggu
        console.log(
          '%c⚡ Stale cache → render dulu, fetch server di background',
          'color:#ff9100;font-weight:bold'
        );

        this.loadedData = staleCache;
        Object.keys(staleCache).forEach(key => {
          const globalVar = ENDPOINT_TO_GLOBAL[key];
          if (globalVar) window[globalVar] = staleCache[key];
        });

        this.isLoading = false;
        this.showLoadingSpinner(false);

        // Fetch server di background lalu replace
        this.loadAllEndpoints().then(async () => {
          await this.loadFeedback(true); // force fetch feedback juga
          this.setCachedData(this.loadedData);
          if (typeof MarkerManager !== 'undefined') {
            MarkerManager.forceRefreshMarkers?.();
          }
          console.log('✅ Fresh data from server, cache updated');
        }).catch(err => {
          console.warn('⚠️ Background server fetch failed:', err);
        });

        return true;
      }

      // 🆕 Benar-benar tidak ada cache → tunggu server
      // Hanya terjadi di kunjungan pertama
      console.log('%c🆕 First visit → fetch server', 'color:#ff9100');
      await this.loadAllEndpoints();
      await this.loadFeedback(true);

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
   * FEEDBACK — cache 1 jam
   * forceFetch = true → selalu fetch (saat data marker baru dari server)
   * forceFetch = false → pakai cache feedback kalau masih < 1 jam
   * ===================================================== */
  async loadFeedback(forceFetch = false) {
    try {
      // Cek cache feedback
      if (!forceFetch) {
        const cachedFeedback = this.getCachedFeedback();
        if (cachedFeedback) {
          console.log('%c💬 Feedback from cache', 'color:#00c853');
          this.applyFeedback(cachedFeedback);
          return;
        }
      }

      // Fetch dari server
      const res = await fetch(`${API_BASE_URL}/userfeedback`);
      const data = await res.json();

      // Simpan ke cache
      this.setCachedFeedback(data);

      this.applyFeedback(data);
      console.log('%c💬 Feedback fetched from server', 'color:#2196f3');

    } catch (err) {
      console.warn('⚠️ Feedback load failed:', err);
    }
  },

  applyFeedback(data) {
    if (typeof syncFeedbackToMarkers !== 'function') return;
    Object.keys(this.loadedData).forEach(key => {
      const markers = this.loadedData[key];
      if (markers && typeof markers === 'object') {
        syncFeedbackToMarkers(markers, data);
      }
    });
  },

  getCachedFeedback() {
    try {
      const raw = localStorage.getItem('feedbackData');
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      const age = Date.now() - timestamp;
      if (age > this.feedbackExpiry) {
        console.log('⏰ Feedback cache expired (1 jam)');
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  },

  setCachedFeedback(data) {
    try {
      localStorage.setItem('feedbackData', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('⚠️ Feedback cache write failed:', err);
    }
  },

  /* =====================================================
   * CACHE MARKER
   * ===================================================== */
  getCachedData() {
    try {
      const raw = localStorage.getItem('markerData');
      if (!raw) return null;

      const { data, timestamp, version } = JSON.parse(raw);

      if (version !== DATA_VERSION) {
        console.log(
          `%c🔁 Version changed (${version} → ${DATA_VERSION}) → fetch server`,
          'color:#ff5252;font-weight:bold'
        );
        return null;
      }

      const age = Date.now() - timestamp;
      if (age > this.cacheExpiry) {
        console.log('⏰ Cache expired (7 hari) → fetch server');
        return null;
      }

      console.log(
        '%c✅ Cache valid — no server fetch needed',
        'color:#4caf50;font-weight:bold'
      );
      return data;

    } catch (err) {
      console.warn('⚠️ Cache read error:', err);
      return null;
    }
  },

  getStaleCache() {
    try {
      const raw = localStorage.getItem('markerData');
      if (!raw) return null;
      const { data } = JSON.parse(raw);
      return data || null;
    } catch (err) {
      return null;
    }
  },

  setCachedData(data) {
    try {
      localStorage.setItem('markerData', JSON.stringify({
        data,
        timestamp: Date.now(),
        version: DATA_VERSION
      }));
      console.log('💾 Marker cache saved (7 hari)');
    } catch (err) {
      console.warn('⚠️ Cache write failed:', err);
    }
  },

  clearCache() {
    localStorage.removeItem('markerData');
    localStorage.removeItem('feedbackData');
    console.log('🗑️ All cache cleared');
  },

  /* =====================================================
   * BACKGROUND REFRESH — hanya dipanggil saat stale cache
   * ===================================================== */
  async backgroundRefresh() {
    console.log('%c🔄 Background refresh', 'color:#03a9f4');
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
        console.log(`🔄 Updated: ${updatedEndpoints.join(', ')}`);
      } else {
        console.log('%c✅ No changes detected', 'color:#4caf50');
      }

    } catch (err) {
      console.warn('⚠️ Background refresh failed:', err);
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

      console.log('%c📦 BATCH RESPONSE', 'color:#673ab7', {
        status: res.status,
        cfCache: res.headers.get('cf-cache-status') || 'N/A'
      });

      if (!res.ok) throw new Error(`Batch HTTP ${res.status}`);

      const batchData = await res.json();

      endpoints.forEach(({ key, path }) => {
        let data = batchData[path] || {};

        data = this.filterMarkers(data, key === 'terbaru');

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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let data = await res.json();

      data = this.filterMarkers(data, key === 'terbaru');

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

  filterMarkers(data, isTerbaru = false) {
  if (!data || typeof data !== 'object') return {};

  return Object.fromEntries(
    Object.entries(data).filter(([_, m]) => {
      if (!m || typeof m !== 'object') return false;

      const hasShow = Object.prototype.hasOwnProperty.call(m, 'show');
      const hasApproved = Object.prototype.hasOwnProperty.call(m, 'approved');

      // 🆕 DATA TERBARU (WAJIB TRUE)
      if (isTerbaru) {
        return m.show === true && m.approved === true;
      }

      // 📦 DATA LAMA
      if ((hasShow && m.show === false) || (hasApproved && m.approved === false)) {
        return false;
      }

      return true;
    })
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
      markerCacheStatus: this.getCachedData() ? 'HIT' : 'MISS',
      feedbackCacheStatus: this.getCachedFeedback() ? 'HIT' : 'MISS'
    };
  }
};

window.DataLoader = DataLoader;