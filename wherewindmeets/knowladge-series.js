/**
 * Knowledge Part Navigation System (series_id based)
 * Clean + Stable + Forced Popup Open + Hide Other Markers
 */

const KnowledgePartNavigation = {

  hiddenMarkers: new Set(),
  isSeriesViewActive: false,
  activeSeriesId: null,
  restoreTimeout: null,

  extractPartNumber(name) {
    if (!name) return null;
    const match = name.match(/\(Part\s+(\d+)\)/i);
    return match ? parseInt(match[1]) : null;
  },

  extractBaseName(name) {
    if (!name) return '';
    return name.replace(/\s*\(Part\s+\d+\)\s*$/i, '').trim();
  },

  // Helper: ambil data marker dari semua store
  getMarkerData(markerKey) {
    return window.pengetahuan?.[markerKey] || window.cerita?.[markerKey] || null;
  },

  // Helper: cari store berdasarkan seriesId
  getStoreBySeriesId(seriesId) {
    for (const storeName of ['pengetahuan', 'cerita']) {
      const store = window[storeName];
      if (!store) continue;
      const found = Object.keys(store).find(k => store[k].series_id === seriesId);
      if (found) return store;
    }
    return window.pengetahuan;
  },

  findSeriesMarkers(markerData) {
    const partNumber = this.extractPartNumber(markerData.name);
    if (partNumber === null) return null;
    if (!window.pengetahuan) return null;

    const seriesId = markerData.series_id;
    if (!seriesId) return null;

    const seriesMarkers = {};

    Object.keys(window.pengetahuan).forEach(key => {
      const marker = window.pengetahuan[key];
      if (marker.series_id !== seriesId) return;
      const pn = this.extractPartNumber(marker.name);
      if (pn === null) return;
      if (seriesMarkers[pn]) return;
      seriesMarkers[pn] = { key, partNumber: pn, marker };
    });

    const parts = Object.values(seriesMarkers)
      .sort((a, b) => a.partNumber - b.partNumber);

    if (parts.length <= 1) return null;

    return {
      baseName: seriesId,
      currentPart: partNumber,
      parts
    };
  },

  findSeriesMarkersCategory14(markerData) {
    const seriesId = markerData.series_id;
    if (!seriesId) return null;

    const store = this.getStoreBySeriesId(seriesId);
    if (!store) return null;

    const seriesMarkers = {};
    Object.keys(store).forEach(key => {
      const marker = store[key];
      if (marker.series_id !== seriesId) return;
      if (!marker.name) return;
      if (seriesMarkers[key]) return;
      seriesMarkers[key] = { key, marker };
    });

    const parts = Object.values(seriesMarkers);
    if (parts.length <= 1) return null;

    const currentKey = Object.keys(store).find(k => {
      const m = store[k];
      return m.series_id === markerData.series_id &&
             m.name === markerData.name &&
             m.lat === markerData.lat &&
             m.lng === markerData.lng;
    });

    return { seriesId, currentKey, parts };
  },

  hideNonSeriesMarkers(seriesId) {
    if (!window.MarkerManager?.activeMarkers) return;

    if (this.restoreTimeout) {
      clearTimeout(this.restoreTimeout);
      this.restoreTimeout = null;
    }

    this.isSeriesViewActive = true;
    this.activeSeriesId = seriesId;
    this.hiddenMarkers.clear();

    Object.keys(window.MarkerManager.activeMarkers).forEach(markerKey => {
      const leafletMarker = window.MarkerManager.activeMarkers[markerKey];
      const markerData = this.getMarkerData(markerKey);

      if (markerData?.series_id === seriesId) return;

      if (leafletMarker && window.map.hasLayer(leafletMarker)) {
        window.map.removeLayer(leafletMarker);
        this.hiddenMarkers.add(markerKey);
      }
    });
  },

  showAllMarkers() {
    if (!this.isSeriesViewActive) return;
    if (!window.MarkerManager?.activeMarkers) return;

    if (this.restoreTimeout) {
      clearTimeout(this.restoreTimeout);
    }

    this.restoreTimeout = setTimeout(() => {
      this.hiddenMarkers.forEach(markerKey => {
        const leafletMarker = window.MarkerManager.activeMarkers[markerKey];
        if (leafletMarker && !window.map.hasLayer(leafletMarker)) {
          const visitedMarkers = JSON.parse(localStorage.getItem("visitedMarkers") || "{}");
          const isVisited = visitedMarkers[markerKey] || false;
          const isHiddenEnabled = window.SettingsManager?.isHiddenMarkerEnabled();

          if (isVisited && isHiddenEnabled) return;

          leafletMarker.addTo(window.map);
        }
      });

      this.hiddenMarkers.clear();
      this.isSeriesViewActive = false;
      this.activeSeriesId = null;
      this.restoreTimeout = null;
    }, 1300);
  },

  createPartNavigationHTML(markerData) {
  const categoryId = markerData.category_id;

  if (categoryId === "13") {
    return this._createCategory13HTML(markerData);
  }

  if (categoryId === "14") {
    return this._createCategory14HTML(markerData);
  }

  if (categoryId === "34") {
    return typeof RiddleSearch !== 'undefined'
      ? RiddleSearch.createSearchHTML(markerData)
      : '';
  }

  return '';
},

  _createCategory13HTML(markerData) {
    const series = this.findSeriesMarkers(markerData);
    if (!series) return '';

    const partsHTML = series.parts.map(part => {
      const isCurrent = part.partNumber === series.currentPart;
      return `
        <button
          class="part-btn ${isCurrent ? 'current' : ''}"
          ${isCurrent ? 'disabled' : ''}
          onclick="KnowledgePartNavigation.navigateToPart('${part.key}')">
          Part ${part.partNumber}
        </button>
      `;
    }).join('');

    return `
      <div class="knowledge-part-navigation">
        <div class="part-nav-header">Clues Location</div>
        <div class="part-nav-buttons">${partsHTML}</div>
      </div>
    `;
  },

  _createCategory14HTML(markerData) {
    const seriesId = markerData.series_id;
    if (!seriesId) return '';

    const series = this.findSeriesMarkersCategory14(markerData);
    if (!series) return '';

    const partsHTML = series.parts.map(({ key, marker }) => {
      const isCurrent = key === series.currentKey;
      return `
        <button
          class="part-btn part-btn-named ${isCurrent ? 'current' : ''}"
          ${isCurrent ? 'disabled' : ''}
          onclick="KnowledgePartNavigation.navigateToPart('${key}')">
          ${marker.name}
        </button>
      `;
    }).join('');

    return `
      <div class="knowledge-part-navigation">
        <div class="part-nav-header">${seriesId}</div>
        <div class="part-nav-buttons part-nav-list">${partsHTML}</div>
      </div>
    `;
  },

  navigateToPart(markerKey) {
    if (!window.map || !this.getMarkerData(markerKey)) {
      console.error('[KPN] Map or marker data missing');
      return;
    }

    const data = this.getMarkerData(markerKey);
    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);

    if (isNaN(lat) || isNaN(lng)) {
      console.error('[KPN] Invalid coordinates for marker:', markerKey);
      return;
    }

    if (window.map._popup) {
      window.map._popup.remove();
    }

    window.map.flyTo([lat, lng], 7, {
      duration: 1.5,
      easeLinearity: 0.25
    });

    window.map.once('moveend', () => {
      let attempt = 0;
      const maxAttempts = 5;

      const interval = setInterval(() => {
        attempt++;

        let targetMarker = null;

        window.map.eachLayer(layer => {
          if (
            layer instanceof L.Marker &&
            layer.getLatLng &&
            layer.getLatLng().lat === lat &&
            layer.getLatLng().lng === lng
          ) {
            targetMarker = layer;
          }
        });

        if (targetMarker) {
          targetMarker.openPopup();
          clearInterval(interval);
          return;
        }

        if (attempt >= maxAttempts) {
          console.error('[KPN] Popup not found after 5 seconds for marker:', markerKey);
          clearInterval(interval);
        }

      }, 1000);
    });

    this.highlightMarker(markerKey);
  },

  highlightMarker(markerKey) {
    if (!window.MarkerManager?.findMarkerByKey) return;
    const marker = MarkerManager.findMarkerByKey(markerKey);
    const el = marker?.getElement?.();
    if (!el) return;

    el.classList.add('marker-glow-effect');
    setTimeout(() => el.classList.remove('marker-glow-effect'), 3000);
  }
};

window.KnowledgePartNavigation = KnowledgePartNavigation;