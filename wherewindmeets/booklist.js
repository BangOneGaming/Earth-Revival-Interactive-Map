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

  init() {
    console.log("📚 Initializing Book Panel...");
    
    this.createElements();
    this.setupEventListeners();
    this.loadBookData();
    
    console.log("✅ Book Panel initialized");
  },

  createElements() {
    // Buat tombol toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'bookToggleBtn';
    toggleBtn.innerHTML = '📖';
    toggleBtn.title = 'Book Collection';
    document.body.appendChild(toggleBtn);

    // Buat panel
    const panel = document.createElement('div');
    panel.id = 'bookPanel';
    panel.innerHTML = `
      <div class="book-panel-header">
        <h2 class="book-panel-title">
          📚 Book Collection
          <span class="book-count-badge" id="bookCountBadge">0</span>
        </h2>
        <p class="book-panel-subtitle">Click on any book to view location</p>
        <div class="book-close-btn" id="bookCloseBtn">×</div>
      </div>
      
      <div class="book-search-container">
        <input 
          type="text" 
          id="bookSearchInput" 
          placeholder="🔍 Search books..."
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
    // Toggle button
    this.toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    // Close button
    const closeBtn = document.getElementById('bookCloseBtn');
    closeBtn.addEventListener('click', () => {
      this.close();
    });

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.filterBooks(e.target.value);
    });

    // Close saat klik di luar panel
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.panel.contains(e.target) && 
          !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    // ESC key untuk close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  loadBookData() {
    // Tunggu sampai DataLoader selesai load
    const checkDataLoader = setInterval(() => {
      if (window.DataLoader && !window.DataLoader.isLoading) {
        clearInterval(checkDataLoader);
        
        // Ambil data dari window.buku
        if (window.buku && typeof window.buku === 'object') {
          this.bookData = window.buku;
          this.renderBookList();
          console.log(`📚 Loaded ${Object.keys(this.bookData).length} books`);
        } else {
          this.showEmptyState();
          console.warn('⚠️ No book data found');
        }
      }
    }, 100);

    // Timeout setelah 10 detik
    setTimeout(() => {
      clearInterval(checkDataLoader);
      if (Object.keys(this.bookData).length === 0) {
        this.showEmptyState();
      }
    }, 10000);
  },

renderBookList(filteredData = null) {
    const data = filteredData || this.bookData;
    const booksArray = Object.entries(data).map(([key, book]) => ({ key, ...book }));

    if (booksArray.length === 0) {
      this.showEmptyState();
      return;
    }

    // Urutkan berdasarkan nama buku (abjad)
    booksArray.sort((a, b) => {
      const nameA = (a.name || a.title || a.desc || '').toLowerCase();
      const nameB = (b.name || b.title || b.desc || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Update count badge
    document.getElementById('bookCountBadge').textContent = booksArray.length;

    const bookIconUrl = 'https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/book.webp';

    // Render list
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

    // Add click listeners
    this.listContainer.querySelectorAll('.book-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        this.onBookClick(key);
      });
    });
  },

onBookClick(key) {
    console.log(`📖 Book clicked: ${key}`);

    const book = this.bookData[key];
    if (!book) {
        console.error(`❌ Book not found: ${key}`);
        return;
    }

    // Aktifkan category book (24)
    if (typeof MarkerManager !== 'undefined') {
        MarkerManager.activeFilters.add('24');

        const bookCheckbox = document.querySelector('[data-category-id="24"] .filter-checkbox');
        if (bookCheckbox) bookCheckbox.checked = true;

        const bookFilterItem = document.querySelector('[data-category-id="24"]');
        if (bookFilterItem) bookFilterItem.classList.add('active');

        localStorage.setItem("activeFilters", JSON.stringify([...MarkerManager.activeFilters]));
        MarkerManager.updateMarkersInView();
    }

    // Fungsi zoom pelan + buka popup marker
    const zoomAndOpenPopup = (coords, key) => {
        if (!window.map) return;

        // Zoom pelan
        window.map.flyTo(coords, 6, {
            animate: true,
            duration: 3,
            easeLinearity: 0.25
        });
        console.log(`🎯 Zooming to book at [${coords}] dengan level 6 (slow)`);

        // Polling untuk marker
        const start = Date.now();
        const interval = setInterval(() => {
            const marker = window.MarkerManager?.markers?.[key];
            if (marker) {
                if (typeof marker.openPopup === 'function') {
                    marker.openPopup();
                    console.log(`🔹 Popup marker dibuka untuk key: ${key}`);
                    clearInterval(interval);
                }
            } else if (Date.now() - start > 5000) { // timeout 5 detik
                console.warn(`⚠️ Marker ${key} belum tersedia setelah 5 detik`);
                clearInterval(interval);
            }
        }, 100);
    };

    if (book.lat !== undefined && book.lng !== undefined) {
        const coords = [book.lat, book.lng];

        if (window.map && typeof window.map.flyTo === 'function') {
            zoomAndOpenPopup(coords, key);
        } else {
            // Map belum siap → simpan untuk dijalankan saat map siap
            window.forcedBookZoom = { coords, key };
            console.log(`⚠️ Map belum siap. Zoom + popup queued untuk [${coords}]`);
        }
    } else {
        console.warn('⚠️ Book coordinates not found:', book);
    }

    // Close panel setelah klik
    setTimeout(() => this.close(), 300);
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
      const keyLower = key.toLowerCase();
      
      if (name.includes(term) || keyLower.includes(term)) {
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
      </div>
    `;
    document.getElementById('bookCountBadge').textContent = '0';
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
    this.searchInput.value = '';
    this.renderBookList();
    console.log("📖 Book panel opened");
  },

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
    console.log("📕 Book panel closed");
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Method untuk reload data book jika diperlukan
  reload() {
    console.log("🔄 Reloading book data...");
    if (window.buku && typeof window.buku === 'object') {
      this.bookData = window.buku;
      this.renderBookList();
      console.log(`📚 Reloaded ${Object.keys(this.bookData).length} books`);
    }
  }
};

// Initialize saat DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    BookPanel.init();
  });
} else {
  BookPanel.init();
}

// Export ke window untuk akses global
window.BookPanel = BookPanel;