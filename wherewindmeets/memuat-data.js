/**
 * Data loader module (clean version - no debug)
 * FIX: Cache menyimpan data RAW, filterMarkers hanya dipanggil saat applyToGlobal
 * Sehingga ubah DEV_SHOW_HIDDEN tidak perlu ganti DATA_VERSION atau fetch ulang
 */
window.DEV_SHOW_HIDDEN = true; // ubah ke true kalau mau lihat marker lama
const API_BASE_URL = 'https://autumn-dream-8c07.square-spon.workers.dev';
const DATA_VERSION = '1.1.38';

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
  endpointFingerprint: {},
  isLoading: false,
  isBackgroundRefresh: false,
  useBatchLoading: true,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000,
  feedbackExpiry: 60 * 60 * 1000,

  generateFingerprint(data) {
    if (!data || typeof data !== 'object') return 'empty';
    const keys = Object.keys(data);
    return `${keys.length}`;
  },

  async init() {
    this.showLoadingSpinner(true);
    this.isLoading = true;

    try {
      const cached = this.getCachedData();

      if (cached) {
        this.loadedData = cached;
        this.applyToGlobal(cached); // ← filterMarkers dipanggil di sini dengan DEV_SHOW_HIDDEN saat itu
        this.isLoading = false;
        this.showLoadingSpinner(false);
        await this.loadFeedback(false);
        return true;
      }

      const stale = this.getStaleCache();

      if (stale) {
        this.loadedData = stale;
        this.applyToGlobal(stale); // ← filterMarkers dipanggil di sini
        this.isLoading = false;
        this.showLoadingSpinner(false);

        this.loadAllEndpoints().then(async () => {
          await this.loadFeedback(true);
          this.setCachedData(this.loadedData);
          MarkerManager?.forceRefreshMarkers?.();
        });

        return true;
      }

      await this.loadAllEndpoints();
      await this.loadFeedback(true);
      this.setCachedData(this.loadedData);

      this.isLoading = false;
      this.showLoadingSpinner(false);
      return true;

    } catch (err) {
      this.isLoading = false;
      this.showLoadingSpinner(false);
      throw err;
    }
  },

  async loadFeedback(force = false) {
    try {
      if (!force) {
        const cached = this.getCachedFeedback();
        if (cached) {
          this.applyFeedback(cached);
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/userfeedback`);
      const data = await res.json();

      this.setCachedFeedback(data);
      this.applyFeedback(data);

    } catch {}
  },

  applyFeedback(data) {
    if (typeof syncFeedbackToMarkers !== 'function') return;
    Object.values(this.loadedData).forEach(markers => {
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
      if (Date.now() - timestamp > this.feedbackExpiry) return null;
      return data;
    } catch {
      return null;
    }
  },

  setCachedFeedback(data) {
    try {
      localStorage.setItem('feedbackData', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {}
  },

  getCachedData() {
    try {
      const raw = localStorage.getItem('markerData');
      if (!raw) return null;

      const { data, timestamp, version } = JSON.parse(raw);

      if (version !== DATA_VERSION) return null;
      if (Date.now() - timestamp > this.cacheExpiry) return null;

      return data;
    } catch {
      return null;
    }
  },

  getStaleCache() {
    try {
      const raw = localStorage.getItem('markerData');
      if (!raw) return null;
      return JSON.parse(raw).data;
    } catch {
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
    } catch {}
  },

  clearCache() {
    localStorage.removeItem('markerData');
    localStorage.removeItem('feedbackData');
  },

  async loadAllEndpoints() {
    if (this.useBatchLoading) {
      await this.loadBatch();
    } else {
      await Promise.all(
        Object.entries(DATA_ENDPOINTS).map(([k, url]) =>
          this.loadEndpoint(k, url)
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

      const res = await fetch(`${API_BASE_URL}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: endpoints.map(e => e.path) })
      });

      if (!res.ok) throw new Error();

      const batchData = await res.json();

      endpoints.forEach(({ key, path }) => {
        // ✅ FIX: Simpan data RAW tanpa filter ke loadedData & cache
        const data = batchData[path] || {};
        this.loadedData[key] = data;

        if (!this.isBackgroundRefresh) {
          this.endpointFingerprint[key] = this.generateFingerprint(data);
        }
      });

      // ✅ Apply ke global dengan filter (cek DEV_SHOW_HIDDEN saat ini)
      this.applyToGlobal(this.loadedData);

    } catch {
      this.useBatchLoading = false;
      await Promise.all(
        Object.entries(DATA_ENDPOINTS).map(([k, url]) =>
          this.loadEndpoint(k, url)
        )
      );
    }
  },

  async loadEndpoint(key, url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();

      // ✅ FIX: Simpan data RAW tanpa filter
      const data = await res.json();
      this.loadedData[key] = data;

      if (!this.isBackgroundRefresh) {
        this.endpointFingerprint[key] = this.generateFingerprint(data);
      }

      // ✅ Apply ke global dengan filter
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) {
        window[globalVar] = this.filterMarkers(data, key === 'terbaru');
      }

    } catch {
      this.loadedData[key] = {};
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) window[globalVar] = {};
    }
  },

  filterMarkers(data, isTerbaru = false) {
    if (!data || typeof data !== 'object') return {};

    // 🚀 DEV MODE → tampilkan semua tanpa filter
    if (window.DEV_SHOW_HIDDEN === true) {
      return data;
    }

    return Object.fromEntries(
      Object.entries(data).filter(([_, m]) => {
        if (!m || typeof m !== 'object') return false;

        const hasShow = 'show' in m;
        const hasApproved = 'approved' in m;

        if (isTerbaru) {
          if (!hasShow && !hasApproved) return false;
          if ((hasShow && m.show === false) || (hasApproved && m.approved === false)) return false;
          return true;
        }

        if ((hasShow && m.show === false) || (hasApproved && m.approved === false)) {
          return false;
        }

        return true;
      })
    );
  },

  // ✅ FIX: filterMarkers dipanggil di sini, bukan saat simpan ke cache
  applyToGlobal(data) {
    Object.keys(data).forEach(key => {
      const globalVar = ENDPOINT_TO_GLOBAL[key];
      if (globalVar) {
        window[globalVar] = this.filterMarkers(data[key], key === 'terbaru');
      }
    });
  },

  showLoadingSpinner(show) {
    const el = document.getElementById('loadingSpinner');
    if (el) el.style.display = show ? 'block' : 'none';
  }
};

window.DataLoader = DataLoader;
// 🛠️ DEV TOOLS HELPER
window.toggleDevMode = function() {
  window.DEV_SHOW_HIDDEN = !window.DEV_SHOW_HIDDEN;
  console.log(`%c DEV_SHOW_HIDDEN → ${window.DEV_SHOW_HIDDEN} `, 
    `background: ${window.DEV_SHOW_HIDDEN ? '#22c55e' : '#ef4444'}; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px`
  );
  DataLoader.applyToGlobal(DataLoader.loadedData);
  MarkerManager?.forceRefreshMarkers?.();
  console.log(`%c Marker ${window.DEV_SHOW_HIDDEN ? 'SEMUA tampil (termasuk hidden)' : 'filter normal aktif'} `, 
    `color: ${window.DEV_SHOW_HIDDEN ? '#22c55e' : '#ef4444'}; font-style: italic`
  );
};

console.log('%c [DEV] Ketik toggleDevMode() untuk toggle marker hidden ', 
  'background: #1e293b; color: #94a3b8; padding: 4px 8px; border-radius: 4px'
);
