/**
 * TALES AND ECHOES PANEL
 * Hierarki: Major Region → Series ID → Marker names
 * Data: window.cerita, category_id = "14"
 * Major region dibangun dinamis dari RegionLabelManager (sama seperti region-management.js)
 */

const REGION_ORDER = ["Qinghe", "Kaifeng", "Hexi", "Bujian Mountain"];

const TalesEchoesPanel = {
  panel: null,
  toggleBtn: null,
  isOpen: false,
  _locMap: null, // cache mapping loc_type → major region

  init() {
    this.createElements();
    this.setupEventListeners();
    console.log('✅ Tales and Echoes Panel initialized');
  },

  // Build mapping loc_type → major region name
  // Mencakup zoom_5 (sub-region) dan zoom_6 (area kecil → parent zoom_5 → zoom_3_4)
  buildLocMapping() {
    if (this._locMap) return this._locMap;

    var map = {};

    if (typeof RegionLabelManager === 'undefined') {
      this._locMap = map;
      return map;
    }

    var zoom34 = RegionLabelManager._getLabelConfig('zoom_3_4');
    var zoom5  = RegionLabelManager._getLabelConfig('zoom_5');
    var zoom6  = RegionLabelManager._getLabelConfig('zoom_6');

    // zoom5: map_type = nama zoom34
    zoom5.forEach(function(z5) {
      var parent = (z5.map_type || '').trim();
      // cari nama zoom34 yang cocok (case-insensitive)
      var z34match = zoom34.find(function(z) {
        return z.name.trim().toLowerCase() === parent.toLowerCase();
      });
      if (z34match) {
        map[z5.name.trim()] = z34match.name;
      }
    });

    // zoom6: sub_regions = nama zoom5, lalu resolve ke zoom34
    zoom6.forEach(function(z6) {
      var parentZ5Name = (z6.sub_regions || '').trim();
      var z5match = zoom5.find(function(z) {
        return z.name.trim().toLowerCase() === parentZ5Name.toLowerCase();
      });
      if (z5match) {
        var z34name = map[z5match.name.trim()];
        if (z34name) {
          map[z6.name.trim()] = z34name;
        }
      }
    });

    // zoom34 itu sendiri juga valid sebagai loc_type
    zoom34.forEach(function(z) {
      map[z.name.trim()] = z.name.trim();
    });

    this._locMap = map;
    console.log('🗺️ TalesEchoes loc mapping built:', Object.keys(map).length, 'entries');
    return map;
  },

  getMajorRegion(marker) {
    var loc = (marker.loc_type || '').trim();
    if (!loc) return 'Other';
    var locMap = this.buildLocMapping();
    return locMap[loc] || 'Other';
  },

  createElements() {
    var btn = document.createElement('button');
    btn.id = 'talesToggleBtn';
    btn.title = 'Tales and Echoes';
    btn.innerHTML = '<img src="https://tiles.bgonegaming.win/wherewindmeet/Simbol/cerita.webp" class="tales-toggle-icon" onerror="this.style.display=\'none\'">';
    document.body.appendChild(btn);
    this.toggleBtn = btn;

    var panel = document.createElement('div');
    panel.id = 'talesPanel';
    panel.innerHTML = [
      '<div class="tales-header">',
        '<h2 class="tales-title">Tales &amp; Echoes</h2>',
        '<div class="tales-close-btn" id="talesCloseBtn">\u00d7</div>',
      '</div>',
      '<div class="tales-search-container">',
        '<input type="text" id="talesSearchInput" placeholder="\uD83D\uDD0D Search tales or series..." autocomplete="off"/>',
      '</div>',
      '<div class="tales-list-container" id="talesListContainer">',
        '<div class="tales-loading">',
          '<div class="tales-loading-spinner"></div>',
          '<p>Loading Tales...</p>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);
    this.panel = panel;
  },

  setupEventListeners() {
    this.toggleBtn.addEventListener('click', function() { TalesEchoesPanel.toggle(); });
    document.getElementById('talesCloseBtn').addEventListener('click', function() { TalesEchoesPanel.close(); });
    document.getElementById('talesSearchInput').addEventListener('input', function(e) {
      TalesEchoesPanel.renderList(e.target.value);
    });
    document.addEventListener('click', function(e) {
      if (TalesEchoesPanel.isOpen &&
          !TalesEchoesPanel.panel.contains(e.target) &&
          !TalesEchoesPanel.toggleBtn.contains(e.target)) {
        TalesEchoesPanel.close();
      }
    });
  },

  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    this.panel.classList.add('open');
    this.toggleBtn.classList.add('active');
    this._locMap = null; // reset cache agar mapping dibangun ulang
    this._ensureDescMerged(function() { TalesEchoesPanel.renderList(); });
  },

  _ensureDescMerged(callback) {
    if (window.DescriptionLoader && window.DescriptionLoader.isReady()) {
      if (window.cerita) window.DescriptionLoader.mergeDescriptions(window.cerita);
      callback();
    } else {
      var attempts = 0;
      var check = setInterval(function() {
        attempts++;
        if (window.DescriptionLoader && window.DescriptionLoader.isReady()) {
          clearInterval(check);
          if (window.cerita) window.DescriptionLoader.mergeDescriptions(window.cerita);
          callback();
        } else if (attempts >= 15) {
          clearInterval(check);
          callback();
        }
      }, 200);
    }
  },

  close() {
    this.isOpen = false;
    this.panel.classList.remove('open');
    this.toggleBtn.classList.remove('active');
  },

  getData() {
    var store = window.cerita;
    if (!store) return {};
    var result = {};
    Object.keys(store).forEach(function(key) {
      if (String(store[key].category_id) === '14') result[key] = store[key];
    });
    return result;
  },

  buildHierarchy(data, query) {
    var q = (query || '').toLowerCase().trim();
    var hierarchy = {};
    var self = this;

    Object.keys(data).forEach(function(key) {
      var marker = data[key];
      var region = self.getMajorRegion(marker);
      var seriesId = (marker.series_id || '').trim() || '\u2014';
      var name = (marker.name || key).toLowerCase();

      if (q && name.indexOf(q) === -1 && seriesId.toLowerCase().indexOf(q) === -1 && region.toLowerCase().indexOf(q) === -1) return;

      if (!hierarchy[region]) hierarchy[region] = {};
      if (!hierarchy[region][seriesId]) hierarchy[region][seriesId] = [];
      hierarchy[region][seriesId].push({ key: key, marker: marker });
    });

    Object.keys(hierarchy).forEach(function(region) {
      Object.keys(hierarchy[region]).forEach(function(sid) {
        hierarchy[region][sid].sort(function(a, b) {
          return (a.marker.name || '').localeCompare(b.marker.name || '');
        });
      });
    });

    return hierarchy;
  },

  renderList(filter) {
    var container = document.getElementById('talesListContainer');
    var data = this.getData();
    var self = this;

    if (Object.keys(data).length === 0) {
      container.innerHTML = '<div class="tales-empty"><p>Data belum tersedia.</p></div>';
      return;
    }

    var hierarchy = this.buildHierarchy(data, filter);

    if (Object.keys(hierarchy).length === 0) {
      container.innerHTML = '<div class="tales-empty"><p>Tidak ada hasil.</p></div>';
      return;
    }

    var regionKeys = REGION_ORDER.filter(function(r) { return hierarchy[r]; });
    Object.keys(hierarchy).forEach(function(r) {
      if (REGION_ORDER.indexOf(r) === -1) regionKeys.push(r);
    });

    var html = '';
    regionKeys.forEach(function(region) {
      var seriesObj = hierarchy[region];
      var seriesKeys = Object.keys(seriesObj).sort();

      html += '<div class="tales-region">';
      html += '<div class="tales-region-title">' + region + '</div>';

      seriesKeys.forEach(function(seriesId) {
        var items = seriesObj[seriesId];
        html += '<div class="tales-series">';
        html += '<div class="tales-series-title">' + seriesId + '</div>';

        items.forEach(function(item) {
          var key = item.key;
          var marker = item.marker;
          var desc = (marker.desc || '').trim();
          var hasDesc = desc !== '' && desc !== 'No description available';
          var safeDesc = hasDesc ? desc.replace(/\n/g, '<br>') : '';

          html += '<div class="tales-item" data-key="' + key + '">';
          html += '<span class="tales-item-name">' + (marker.name || key) + '</span>';
          if (hasDesc) {
            html += '<button class="tales-expand-btn" data-key="' + key + '" aria-label="expand">\u2303</button>';
          }
          html += '</div>';

          if (hasDesc) {
            html += '<div class="tales-desc-panel" id="tales-desc-' + key + '">';
            html += '<p class="tales-desc-text">' + safeDesc + '</p>';
            html += '<button class="tales-goto-btn" data-key="' + key + '">Go to Location</button>';
            html += '</div>';
          }
        });

        html += '</div>';
      });

      html += '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('.tales-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.closest('.tales-expand-btn')) return;
        if (!el.querySelector('.tales-expand-btn')) {
          self.navigateToMarker(el.dataset.key);
        }
      });
    });

    container.querySelectorAll('.tales-expand-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = btn.dataset.key;
        var descPanel = document.getElementById('tales-desc-' + key);
        var wasOpen = descPanel.classList.contains('open');
        container.querySelectorAll('.tales-desc-panel.open').forEach(function(p) { p.classList.remove('open'); });
        container.querySelectorAll('.tales-expand-btn.open').forEach(function(b) { b.classList.remove('open'); });
        if (!wasOpen) {
          descPanel.classList.add('open');
          btn.classList.add('open');
        }
      });
    });

    container.querySelectorAll('.tales-goto-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        self.navigateToMarker(btn.dataset.key);
      });
    });
  },

  navigateToMarker(markerKey) {
    var store = window.cerita;
    if (!store || !store[markerKey]) return;

    var data = store[markerKey];
    var lat = parseFloat(data.lat);
    var lng = parseFloat(data.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    this.close();

    if (typeof MarkerManager !== 'undefined') {
      MarkerManager.activeFilters.add('14');
      var cb = document.querySelector('[data-category-id="14"] .filter-checkbox');
      if (cb) cb.checked = true;
      var fi = document.querySelector('[data-category-id="14"]');
      if (fi) fi.classList.add('active');
      try { localStorage.setItem('activeFilters', JSON.stringify(Array.from(MarkerManager.activeFilters))); } catch(e) {}
      MarkerManager.updateMarkersInView();
    }

    if (window.map) {
      window.map.flyTo([lat, lng], 7, { animate: true, duration: 1.5 });
      window.map.once('moveend', function() { TalesEchoesPanel._waitAndOpenPopup(lat, lng, 0); });
    }
  },

  _waitAndOpenPopup(lat, lng, attempt) {
    if (attempt >= 15) return;
    var found = null;
    if (window.map) {
      window.map.eachLayer(function(layer) {
        if (found) return;
        if (layer instanceof L.Marker) {
          var ll = layer.getLatLng();
          if (Math.abs(ll.lat - lat) < 0.0001 && Math.abs(ll.lng - lng) < 0.0001) found = layer;
        }
      });
    }
    if (found) {
      found.openPopup();
    } else {
      setTimeout(function() { TalesEchoesPanel._waitAndOpenPopup(lat, lng, attempt + 1); }, 300);
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { TalesEchoesPanel.init(); });
} else {
  TalesEchoesPanel.init();
}

window.TalesEchoesPanel = TalesEchoesPanel;