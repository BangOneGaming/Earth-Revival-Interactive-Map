/**
 * Knowledge Panel Manager
 * Panel untuk data pengetahuan (knowladge)
 */

const KnowledgePanel = {
  panel: null,
  toggleBtn: null,
  searchInput: null,
  listContainer: null,
  knowData: {},
  isOpen: false,
  dataLoaded: false,

  init() {
    this.createElements();
    this.setupEventListeners();
  },

createElements() {
  const iconUrl = 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/knoweverything.webp';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'knowledgeToggleBtn';
  toggleBtn.innerHTML = `
    <img src="${iconUrl}" class="knowledge-toggle-icon">
  `;
  toggleBtn.title = 'Knowledge Collection';
  document.body.appendChild(toggleBtn);

  const panel = document.createElement('div');
  panel.id = 'knowledgePanel';
  panel.innerHTML = `
    <div class="knowledge-panel-header">
      <h2 class="knowledge-panel-title">
        <img src="${iconUrl}" class="knowledge-title-icon">
         Wander Tales List
        <span class="knowledge-count-badge" id="knowledgeCountBadge">0</span>
      </h2>
      <p class="knowledge-panel-subtitle">Click on any item to view location</p>
      <div class="knowledge-close-btn" id="knowledgeCloseBtn">×</div>
    </div>
    
    <div class="knowledge-search-container">
      <input 
        type="text" 
        id="knowledgeSearchInput" 
        placeholder="🔍 Search Wander Tales..."
        autocomplete="off"
      />
    </div>
    
    <div class="knowledge-list-container" id="knowledgeListContainer">
      <div class="knowledge-loading">
        <div class="knowledge-loading-spinner"></div>
        <p>Loading Wander Tales list...</p>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  this.panel = panel;
  this.toggleBtn = toggleBtn;
  this.searchInput = document.getElementById('knowledgeSearchInput');
  this.listContainer = document.getElementById('knowledgeListContainer');
},

  setupEventListeners() {
    this.toggleBtn.addEventListener('click', () => this.toggle());

    document.getElementById('knowledgeCloseBtn')
      .addEventListener('click', () => this.close());

    this.searchInput.addEventListener('input', (e) => 
      this.filterKnowledge(e.target.value)
    );

    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.panel.contains(e.target) && !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  },

  loadKnowledgeData() {
    // Langsung cek window.pengetahuan
    if (window.pengetahuan && Object.keys(window.pengetahuan).length > 0) {
      this.knowData = window.pengetahuan;
      this.dataLoaded = true;
      this.renderKnowledgeList();
      return;
    }

    // Tunggu sampai DataLoader selesai
    let attempts = 0;
    const maxAttempts = 100;

    const check = setInterval(() => {
      attempts++;

      const loaded = window.DataLoader && !window.DataLoader.isLoading;
      const hasData = window.pengetahuan && Object.keys(window.pengetahuan).length > 0;

      if (hasData) {
        clearInterval(check);
        this.knowData = window.pengetahuan;
        this.dataLoaded = true;
        this.renderKnowledgeList();
        return;
      }

      if (loaded && !hasData) {
        const data = window.DataLoader.loadedData?.knowladge || {};
        if (Object.keys(data).length > 0) {
          clearInterval(check);
          this.knowData = data;
          window.pengetahuan = data;
          this.dataLoaded = true;
          this.renderKnowledgeList();
          return;
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(check);
        this.showEmptyState();
      }
    }, 100);
  },

  renderKnowledgeList(filtered = null) {
    const data = filtered || this.knowData;
    const array = Object.entries(data).map(([key, item]) => ({ key, ...item }));

    if (array.length === 0) {
      this.showEmptyState();
      return;
    }

    array.sort((a, b) => {
      const A = (a.name || a.title || a.desc || '').toLowerCase();
      const B = (b.name || b.title || b.desc || '').toLowerCase();
      return A.localeCompare(B);
    });

    document.getElementById('knowledgeCountBadge').textContent = array.length;

    const iconUrl = 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/knoweverything.webp';

    this.listContainer.innerHTML = array
      .map(item => {
        const name = item.name || item.title || item.desc || 'Unnamed';
        return `
          <div class="knowledge-item" data-key="${item.key}">
            <div class="knowledge-item-name">
              <img src="${iconUrl}" class="knowledge-item-icon-img">
              ${this.escapeHtml(name)}
            </div>
            <div class="knowledge-item-icon">→</div>
          </div>
        `;
      })
      .join('');

    this.listContainer.querySelectorAll('.knowledge-item').forEach(el => {
      el.addEventListener('click', () => this.onKnowledgeClick(el.dataset.key));
    });
  },

onKnowledgeClick(key) {
  const item = this.knowData[key];
  if (!item) return;

  // Tutup popup aktif
  if (window.map) {
    window.map.closePopup();
  }

  // Aktifkan kategori Knowledge (ID = 13)
  if (typeof MarkerManager !== 'undefined') {
    MarkerManager.activeFilters.add('13');

    const checkbox = document.querySelector('[data-category-id="13"] .filter-checkbox');
    if (checkbox) checkbox.checked = true;

    const filterItem = document.querySelector('[data-category-id="13"]');
    if (filterItem) filterItem.classList.add('active');

    localStorage.setItem("activeFilters", JSON.stringify([...MarkerManager.activeFilters]));
    MarkerManager.updateMarkersInView();
  }

  if (!window.map || !item.lat || !item.lng) return;

  const coords = [item.lat, item.lng];

  // Zoom ke lokasi
  window.map.flyTo(coords, 6, {
    animate: true,
    duration: 2
  });

  // Setelah zoom selesai → klik marker asli
  window.map.once("moveend", () => {
    setTimeout(() => {
      const marker = MarkerManager.activeMarkers?.[key];
      if (!marker || !marker._icon) return;

      marker._icon.dispatchEvent(new MouseEvent("click", { 
        bubbles: true, 
        cancelable: true 
      }));
    }, 350);
  });

  // Tutup panel knowledge
  setTimeout(() => this.close(), 200);
},
  filterKnowledge(term) {
    if (!term.trim()) {
      this.renderKnowledgeList();
      return;
    }

    const q = term.toLowerCase();
    const filtered = {};

    Object.entries(this.knowData).forEach(([key, item]) => {
      const name = (item.name || item.title || item.desc || '').toLowerCase();
      if (name.includes(q) || key.toLowerCase().includes(q)) {
        filtered[key] = item;
      }
    });

    this.renderKnowledgeList(filtered);
  },

  showEmptyState() {
    this.listContainer.innerHTML = `
      <div class="knowledge-empty-state">
        <div class="knowledge-empty-state-icon">📘</div>
        <div class="knowledge-empty-state-text">
          ${this.searchInput.value ? 'No knowledge found' : 'No knowledge available'}
        </div>
        <button class="knowledge-retry-btn" onclick="KnowledgePanel.reload()">🔄 Retry</button>
      </div>
    `;
    document.getElementById('knowledgeCountBadge').textContent = '0';
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
    this.searchInput.value = '';

    if (!this.dataLoaded) {
      this.loadKnowledgeData();
    } else {
      this.renderKnowledgeList();
    }
  },

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
  },

  escapeHtml(t) {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  },

  reload() {
    this.dataLoaded = false;
    this.knowData = {};

    this.listContainer.innerHTML = `
      <div class="knowledge-loading">
        <div class="knowledge-loading-spinner"></div>
        <p>Loading knowledge...</p>
      </div>
    `;

    this.loadKnowledgeData();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => KnowledgePanel.init());
} else {
  KnowledgePanel.init();
}

window.KnowledgePanel = KnowledgePanel;