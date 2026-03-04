/**
 * RIDDLE CLUE SEARCH (Category 34)
 * Struktur HTML sama dengan knowledge-part-navigation (cat 13 & 14)
 * Search clue → suggestion → klik → answer muncul di bawah + copy
 */

const RiddleSearch = {
  data: null,
  isLoading: false,
  isFailed: false,

  async loadData() {
    if (this.data || this.isLoading) return;
    this.isLoading = true;
    try {
      const res = await fetch('riddle-data.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      this.data = await res.json();
      console.log('✅ RiddleSearch loaded', this.data.length, 'entries');
    } catch(e) {
      console.error('❌ RiddleSearch:', e);
      this.isFailed = true;
    }
    this.isLoading = false;
  },

  // Pakai .knowledge-part-navigation + .part-nav-header agar style sama dengan cat 13/14
  createSearchHTML(markerData) {
    if (String(markerData.category_id) !== '34') return '';
    const key = (markerData._key || '').replace(/[^a-zA-Z0-9_]/g, '_');
    this.loadData();

    return '<div class="knowledge-part-navigation">' +
             '<div class="part-nav-header">' +
               '<svg class="rs-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                 '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>' +
               '</svg>' +
               'Search Clue' +
             '</div>' +
             '<div class="rs-input-wrap">' +
               '<svg class="rs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                 '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>' +
               '</svg>' +
               '<input type="text" id="rsInput_' + key + '" class="rs-input"' +
                 ' placeholder="Type a clue..."' +
                 ' autocomplete="off"' +
                 ' oninput="RiddleSearch.onInput(this)"' +
                 ' onclick="event.stopPropagation()"' +
                 ' onkeydown="event.stopPropagation()"/>' +
               '<ul class="rs-suggestions" id="rsSug_' + key + '"></ul>' +
             '</div>' +
             '<div class="rs-answer-box" id="rsAnswer_' + key + '">' +
               '<span class="rs-answer-label">Answer</span>' +
               '<span class="rs-answer-text" id="rsAnswerText_' + key + '"></span>' +
               '<button class="rs-copy-btn" id="rsCopyBtn_' + key + '"' +
                 ' onclick="RiddleSearch.copyAnswer(this)" style="display:none">' +
                 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                   '<rect x="9" y="9" width="13" height="13" rx="2"/>' +
                   '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
                 '</svg>' +
               '</button>' +
             '</div>' +
           '</div>';
  },

  onInput(inputEl) {
    const query = (inputEl.value || '').trim().toLowerCase();
    const key   = inputEl.id.replace('rsInput_', '');
    const sugEl = document.getElementById('rsSug_' + key);
    const ansEl = document.getElementById('rsAnswer_' + key);

    if (!sugEl) return;

    // Reset answer saat mengetik ulang
    if (ansEl) ansEl.classList.remove('visible');

    if (query.length < 1) {
      sugEl.innerHTML = '';
      sugEl.classList.remove('open');
      return;
    }

    if (!this.data) {
      sugEl.innerHTML = '<li class="rs-sug-empty">Loading...</li>';
      sugEl.classList.add('open');
      this.loadData().then(() => this.onInput(inputEl));
      return;
    }

    if (this.isFailed) {
      sugEl.innerHTML = '<li class="rs-sug-empty">Failed to load riddle data.</li>';
      sugEl.classList.add('open');
      return;
    }

    const matches = this.data
      .filter(d => d.clue.toLowerCase().includes(query))
      .slice(0, 8);

    if (matches.length === 0) {
      sugEl.innerHTML = '<li class="rs-sug-empty">No clue found</li>';
      sugEl.classList.add('open');
      return;
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sugEl.innerHTML = matches.map(function(d) {
      const highlighted = d.clue.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
      return '<li class="rs-sug-item"' +
        ' data-clue="' + d.clue.replace(/"/g, '&quot;') + '"' +
        ' data-answer="' + d.answer.replace(/"/g, '&quot;') + '"' +
        ' data-key="' + key + '"' +
        ' onclick="RiddleSearch.selectClue(this)">' +
        highlighted + '</li>';
    }).join('');

    sugEl.classList.add('open');
  },

  selectClue(liEl) {
    const clue   = liEl.dataset.clue;
    const answer = liEl.dataset.answer;
    const key    = liEl.dataset.key;

    const inputEl = document.getElementById('rsInput_' + key);
    if (inputEl) inputEl.value = clue;

    const sugEl = document.getElementById('rsSug_' + key);
    if (sugEl) { sugEl.innerHTML = ''; sugEl.classList.remove('open'); }

    const ansEl   = document.getElementById('rsAnswer_' + key);
    const textEl  = document.getElementById('rsAnswerText_' + key);
    const copyBtn = document.getElementById('rsCopyBtn_' + key);

    if (textEl)  textEl.textContent = answer;
    if (copyBtn) { copyBtn.style.display = ''; copyBtn.dataset.answer = answer; }
    if (ansEl)   ansEl.classList.add('visible');
  },

  copyAnswer(btn) {
    const answer = btn.dataset.answer || '';
    navigator.clipboard.writeText(answer).then(function() {
      btn.classList.add('copied');
      setTimeout(function() { btn.classList.remove('copied'); }, 1500);
    }).catch(function() {
      const el = document.createElement('textarea');
      el.value = answer;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      btn.classList.add('copied');
      setTimeout(function() { btn.classList.remove('copied'); }, 1500);
    });
  }
};

// Auto-hide desc section pada popup category 34
// Observe popup open via MutationObserver
(function() {
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (!node.querySelectorAll) return;
        // Cari popup yang mengandung rs-input-wrap (= category 34)
        node.querySelectorAll('.knowledge-part-navigation').forEach(function(nav) {
          if (!nav.querySelector('.rs-input-wrap')) return;
          // Cari .marker-popup-desc di popup yang sama
          var popup = nav.closest('.marker-popup') || nav.closest('.leaflet-popup-content');
          if (!popup) return;
          var desc = popup.querySelector('.marker-popup-desc');
          if (desc) desc.style.display = 'none';
        });
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

window.RiddleSearch = RiddleSearch;