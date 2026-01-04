/**
 * Knowledge Part Navigation System (series_id based)
 * Clean + Stable + Forced Popup Open
 */

const KnowledgePartNavigation = {

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
  if (!seriesId) return null; // ⛔ wajib ada

  const seriesMarkers = {};

  Object.keys(window.pengetahuan).forEach(key => {
    const marker = window.pengetahuan[key];

    // 🔒 KUNCI UTAMA
    if (marker.series_id !== seriesId) return;

    const pn = this.extractPartNumber(marker.name);
    if (pn === null) return;

    if (seriesMarkers[pn]) {
      console.warn('[KPN] Duplicate part number:', pn, key);
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

  /**
   * 🔥 NAVIGATE + FORCE POPUP
   */
navigateToPart(markerKey) {

  console.group('[KPN]');
  console.log('Navigate to:', markerKey);

  if (!window.map || !window.pengetahuan?.[markerKey]) {
    console.warn('Map or marker data missing');
    console.groupEnd();
    return;
  }

  const data = window.pengetahuan[markerKey];
  const lat = parseFloat(data.lat);
  const lng = parseFloat(data.lng);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates');
    console.groupEnd();
    return;
  }

  // STEP 1: close popup
  if (window.map._popup) {
    window.map._popup.remove();
    console.log('Popup closed');
  }

  // STEP 2: fly
  console.log('Flying...');
  window.map.flyTo([lat, lng], 7, {
    duration: 1.5,
    easeLinearity: 0.25
  });

  // STEP 3: after move end → try open popup
  window.map.once('moveend', () => {
    console.log('Fly finished');

    let attempt = 0;
    const maxAttempts = 5;

    const interval = setInterval(() => {
      attempt++;
      console.log(`Popup attempt ${attempt}/${maxAttempts}`);

      let targetMarker = null;

      // 🔍 UNIVERSAL LEAFLET MARKER SCAN
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
        console.log('✅ Popup opened');
        clearInterval(interval);
        console.groupEnd();
        return;
      }

      if (attempt >= maxAttempts) {
        console.warn('❌ Popup not found after 5 seconds');
        clearInterval(interval);
        console.groupEnd();
      }

    }, 1000); // 1 detik
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