/**
 * Knowledge Part Navigation System (series_id based)
 * Clean + Stable + Forced Popup Open + Hide Other Markers
 */

const KnowledgePartNavigation = {

  // Store hidden markers state
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

      if (seriesMarkers[pn]) {
        return;
      }

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
      const markerData = window.pengetahuan?.[markerKey];

      if (markerData?.series_id === seriesId) {
        return;
      }

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

          if (isVisited && isHiddenEnabled) {
            return;
          }

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
    if (markerData.category_id !== "13") return '';

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

  navigateToPart(markerKey) {
    if (!window.map || !window.pengetahuan?.[markerKey]) {
      console.error('[KPN] Map or marker data missing');
      return;
    }

    const data = window.pengetahuan[markerKey];
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