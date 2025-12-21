/**
 * Book Panel Manager
 * Menampilkan daftar book markers dengan panel slide dari kiri
 */

const BookPanel = {
  panel: null,
  toggleBtn: null,
  searchInput: null,
  listContainer: null,
  bookData: {},
  isOpen: false,
  dataLoaded: false,

  init() {
    this.createElements();
    this.setupEventListeners();
  },

createElements() {
  const iconUrl = "https://tiles.bgonegaming.win/wherewindmeet/Simbol/book.webp";

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'bookToggleBtn';
  toggleBtn.innerHTML = `
    <img src="${iconUrl}" class="book-toggle-icon">
  `;
  toggleBtn.title = 'Book Collection';
  document.body.appendChild(toggleBtn);

  const panel = document.createElement('div');
  panel.id = 'bookPanel';
  panel.innerHTML = `
    <div class="book-panel-header">
      <h2 class="book-panel-title">
        <img src="${iconUrl}" class="book-title-icon">
        Book Collection
        <span class="book-count-badge" id="bookCountBadge">0</span>
      </h2>
      <p class="book-panel-subtitle">Click on any book to view location</p>
      <div class="book-close-btn" id="bookCloseBtn">×</div>
    </div>
    
    <div class="book-search-container">
      <input 
        type="text" 
        id="bookSearchInput" 
        placeholder="Search books..."
        autocomplete="off"
      />
    </div>
    
    <div class="book-list-container" id="bookListContainer">
      <div class="book-loading">
        <div class="book-loading-spinner"></div>
        <p>Loading books...</p>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  this.panel = panel;
  this.toggleBtn = toggleBtn;
  this.searchInput = document.getElementById('bookSearchInput');
  this.listContainer = document.getElementById('bookListContainer');
},

setupEventListeners() {
  this.toggleBtn.addEventListener('click', () => this.toggle());

  document.getElementById('bookCloseBtn').addEventListener('click', () => this.close());

  this.searchInput.addEventListener('input', (e) => this.filterBooks(e.target.value));

  document.addEventListener('click', (e) => {
    if (this.isOpen && !this.panel.contains(e.target) && !this.toggleBtn.contains(e.target)) {
      this.close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && this.isOpen) this.close();
  });
},

  loadBookData() {
    // Cek langsung window.buku
    if (window.buku && typeof window.buku === 'object' && Object.keys(window.buku).length > 0) {
      this.bookData = window.buku;
      this.dataLoaded = true;
      this.renderBookList();
      return;
    }

    // Tunggu DataLoader selesai
    let attempts = 0;
    const maxAttempts = 100;
    
    const checkDataLoader = setInterval(() => {
      attempts++;

      const dataLoaderDone = window.DataLoader && !window.DataLoader.isLoading;
      const bukuHasData = window.buku && typeof window.buku === 'object' && Object.keys(window.buku).length > 0;

      if (bukuHasData) {
        clearInterval(checkDataLoader);
        this.bookData = window.buku;
        this.dataLoaded = true;
        this.renderBookList();
        return;
      }

      if (dataLoaderDone && !bukuHasData) {
        if (window.DataLoader.loadedData?.book && Object.keys(window.DataLoader.loadedData.book).length > 0) {
          clearInterval(checkDataLoader);
          this.bookData = window.DataLoader.loadedData.book;
          window.buku = this.bookData;
          this.dataLoaded = true;
          this.renderBookList();
          return;
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkDataLoader);
        this.showEmptyState();
      }
    }, 100);
  },

  renderBookList(filteredData = null) {
    const data = filteredData || this.bookData;
    const booksArray = Object.entries(data).map(([key, book]) => ({ key, ...book }));

    if (booksArray.length === 0) {
      this.showEmptyState();
      return;
    }

    booksArray.sort((a, b) => {
      const nameA = (a.name || a.title || a.desc || '').toLowerCase();
      const nameB = (b.name || b.title || b.desc || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    document.getElementById('bookCountBadge').textContent = booksArray.length;

    const bookIconUrl = 'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/book.webp';

    this.listContainer.innerHTML = booksArray.map(book => {
      const name = book.name || book.title || book.desc || 'Unnamed Book';
      return `
        <div class="book-item" data-key="${book.key}">
          <div class="book-item-name">
            <img src="${bookIconUrl}" class="book-item-icon-img" alt="Book">
            ${this.escapeHtml(name)}
          </div>
          <div class="book-item-icon">→</div>
        </div>
      `;
    }).join('');

    this.listContainer.querySelectorAll('.book-item').forEach(item => {
      item.addEventListener('click', () => this.onBookClick(item.dataset.key));
    });
  },

onBookClick(key) {
  const book = this.bookData[key];
  if (!book) return;

  /* =====================================
     0. Tutup popup aktif
     ===================================== */
  if (window.map) {
    window.map.closePopup();
  }

  /* =====================================
     1. Aktifkan kategori Book (24)
     ===================================== */
  if (typeof MarkerManager !== 'undefined') {
    MarkerManager.activeFilters.add('24');

    const checkbox = document.querySelector('[data-category-id="24"] .filter-checkbox');
    if (checkbox) checkbox.checked = true;

    const filterItem = document.querySelector('[data-category-id="24"]');
    if (filterItem) filterItem.classList.add('active');

    localStorage.setItem(
      "activeFilters",
      JSON.stringify([...MarkerManager.activeFilters])
    );

    MarkerManager.updateMarkersInView();
  }

  /* =====================================
     2. Stop jika tidak ada koordinat
     ===================================== */
  if (!window.map || !book.lat || !book.lng) return;

  const coords = [book.lat, book.lng];

  /* =====================================
     3. Zoom ke lokasi
     ===================================== */
  window.map.flyTo(coords, 6, {
    animate: true,
    duration: 2
  });

  /* =====================================
     4. Setelah zoom → klik marker
        (Pakai polling agar menunggu marker
        benar-benar selesai render)
     ===================================== */
  window.map.once("moveend", () => {
    let attempts = 0;
    const maxAttempts = 10;

    const tryClick = () => {
      const marker = MarkerManager.activeMarkers?.[key];

      // Jika sudah muncul → klik marker
      if (marker && marker._icon) {
        marker._icon.dispatchEvent(new MouseEvent("click", {
          bubbles: true,
          cancelable: true
        }));
        return;
      }

      // Jika belum muncul → coba lagi
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryClick, 120);
      }
    };

    // mulai polling setelah zoom selesai
    setTimeout(tryClick, 150);
  });

  /* =====================================
     5. Tutup panel Book
     ===================================== */
  setTimeout(() => this.close(), 200);
},

  // Tambah efek glow pada marker
  addGlowEffect(marker) {
    if (!marker._icon) return;

    const icon = marker._icon;
    
    // Tambah class glow
    icon.classList.add('marker-glow-effect');

    // Hapus efek setelah 8 detik
    setTimeout(() => {
      icon.classList.remove('marker-glow-effect');
    }, 8000);
  },

  filterBooks(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.renderBookList();
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = {};

    Object.entries(this.bookData).forEach(([key, book]) => {
      const name = (book.name || book.title || book.desc || '').toLowerCase();
      if (name.includes(term) || key.toLowerCase().includes(term)) {
        filtered[key] = book;
      }
    });

    this.renderBookList(filtered);
  },

  showEmptyState() {
    this.listContainer.innerHTML = `
      <div class="book-empty-state">
        <div class="book-empty-state-icon">📚</div>
        <div class="book-empty-state-text">
          ${this.searchInput.value ? 'No books found' : 'No books available'}
        </div>
        <button class="book-retry-btn" onclick="BookPanel.reload()">🔄 Retry</button>
      </div>
    `;
    document.getElementById('bookCountBadge').textContent = '0';
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
    this.searchInput.value = '';
    
    if (!this.dataLoaded || Object.keys(this.bookData).length === 0) {
      this.loadBookData();
    } else {
      this.renderBookList();
    }
  },

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  reload() {
    this.dataLoaded = false;
    this.bookData = {};
    
    this.listContainer.innerHTML = `
      <div class="book-loading">
        <div class="book-loading-spinner"></div>
        <p>Loading books...</p>
      </div>
    `;
    
    this.loadBookData();
  }
};

// Initialize saat DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BookPanel.init());
} else {
  BookPanel.init();
}

window.BookPanel = BookPanel;