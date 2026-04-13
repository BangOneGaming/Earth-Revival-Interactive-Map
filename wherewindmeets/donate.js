/**
 * Donation System Module
 * Wuxia / Ancient Scroll Aesthetic — matching patch notes theme
 *
 * @author Where Wind Meet Map
 * @version 3.0.0
 */

const DonationManager = (function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================

  const CONFIG = {
    showDelay: 300000, // 300000ms = 5 min | 15000 = 15s for testing
    storageKey: 'wwm_donation_shown',
    modalId: 'donationModal'
  };

  // ==========================================
  // SVG ICONS
  // ==========================================

  const SVG = {

    // Header heart icon
    heart: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5
               c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"/>
    </svg>`,

    // Close X
    close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,

    // Thank you checkmark
    check: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
               10-10-4.48-10-10-10zm-2 15l-5-5
               1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            fill="currentColor"/>
    </svg>`,

    // Discord logo
    discord: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515
               a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25
               a18.27 18.27 0 0 0-5.487 0
               a12.64 12.64 0 0 0-.617-1.25
               a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37
               a.07.07 0 0 0-.032.027
               C.533 9.046-.32 13.58.099 18.057
               a.082.082 0 0 0 .031.057
               a19.9 19.9 0 0 0 5.993 3.03
               a.078.078 0 0 0 .084-.028
               a14.09 14.09 0 0 0 1.226-1.994
               a.076.076 0 0 0-.041-.106
               a13.107 13.107 0 0 1-1.872-.892
               a.077.077 0 0 1-.008-.128
               a10.2 10.2 0 0 0 .372-.292
               a.074.074 0 0 1 .077-.01
               c3.928 1.793 8.18 1.793 12.062 0
               a.074.074 0 0 1 .078.01c.12.098.246.198.373.292
               a.077.077 0 0 1-.006.127
               a12.299 12.299 0 0 1-1.873.892
               a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993
               a.076.076 0 0 0 .084.028
               a19.839 19.839 0 0 0 6.002-3.03
               a.077.077 0 0 0 .032-.054
               c.5-5.177-.838-9.674-3.549-13.66
               a.061.061 0 0 0-.031-.03z
               M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419
               c0-1.333.956-2.419 2.157-2.419
               c1.21 0 2.176 1.096 2.157 2.42
               c0 1.333-.956 2.418-2.157 2.418z
               m7.975 0c-1.183 0-2.157-1.085-2.157-2.419
               c0-1.333.955-2.419 2.157-2.419
               c1.21 0 2.176 1.096 2.157 2.42
               c0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>`,

    // TikTok logo
    tiktok: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67
               a2.89 2.89 0 0 1-2.88 2.5a2.89 2.89 0 0 1-2.89-2.89
               a2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01
               a6.33 6.33 0 0 0-.79-.05a6.34 6.34 0 0 0-6.34 6.34
               a6.34 6.34 0 0 0 6.34 6.34a6.34 6.34 0 0 0 6.33-6.34
               l-.03-8.41a8.16 8.16 0 0 0 4.77 1.52V5.02
               a4.85 4.85 0 0 1-1.97-.33z"/>
    </svg>`,

    // PayPal logo
    paypal: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81
               1.01 1.152 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19
               c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541
               c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825
               c-.524 0-.968.382-1.05.9L7.538 21.337h3.817l.967-6.136.033-.198a1.07 1.07 0 0 1 1.057-.9h.667
               c4.301 0 7.664-1.747 8.647-6.797.41-2.099.009-3.834-.503-4.389z"/>
    </svg>`,

    // Ko-fi cup
    kofi: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822
               c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049
               c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916z
               m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023
               c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954
               c-.709-.965-1.041-2.7-.091-3.71c.982-1.058 2.7-.968 3.456.contract
               l.774.793l.774-.793c.756-.76 2.596-.838 3.526.035
               c.698.654.98 1.963.024 3.72z
               M22.201 9.421c-.499 2.203-2.379 3.443-4.858 3.304l-.037-4.604
               c0-.001 3.823.745 4.895 1.3z"/>
    </svg>`,

    // Trakteer gift box
    trakteer: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12v10H4V12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 7H2v5h20V7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    // List item icons
    server: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
    map:    `<svg viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    tool:   `<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    star:   `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    globe:  `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  };

  // ==========================================
  // DONATION LINKS
  // ==========================================

  const DONATION_LINKS = {
    paypal: {
      name: 'PayPal',
      url: 'https://paypal.me/IrvanNazmudin',
      svgKey: 'paypal',
      color: '#0070ba',
      description: 'Credit / Debit Card · International',
      badge: 'Global'
    },
    kofi: {
      name: 'Ko-fi',
      url: 'https://ko-fi.com/bangonegaming',
      svgKey: 'kofi',
      color: '#ff5e5b',
      description: 'Coffee Donation · International',
      badge: 'Global'
    },
    trakteer: {
      name: 'Trakteer',
      url: 'https://trakteer.id/BangOneGaming',
      svgKey: 'trakteer',
      color: '#c8962a',
      description: 'Semua Metode Pembayaran · Indonesia',
      badge: 'ID'
    }
  };

  // ==========================================
  // CONTACT LINKS
  // ==========================================

  const CONTACT_LINKS = [
    {
      name: 'Discord',
      url: 'https://discord.gg/zEhTW8GuGV',
      svgKey: 'discord'
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@bangonegaming97',
      svgKey: 'tiktok'
    }
  ];

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================

  let hasShown = false;
  let timer = null;
  let donationData = { shown: false, timestamp: null };

  // ==========================================
  // STORAGE
  // ==========================================

  function loadData() {
    try {
      const stored = sessionStorage.getItem(CONFIG.storageKey);
      if (stored) donationData = JSON.parse(stored);
    } catch (e) { console.warn('Donation: load error', e); }
  }

  function saveData() {
    try {
      sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(donationData));
    } catch (e) { console.warn('Donation: save error', e); }
  }

  function wasShownThisSession() { return donationData.shown === true; }

  function markAsShown() {
    donationData.shown = true;
    donationData.timestamp = Date.now();
    saveData();
  }

  // ==========================================
  // MODAL CREATION
  // ==========================================

  function createModal() {
    const modal = document.createElement('div');
    modal.id = CONFIG.modalId;
    modal.className = 'donation-modal-overlay';

    modal.innerHTML = `
      <div class="donation-modal" role="dialog" aria-modal="true" aria-labelledby="donationTitle">

        <!-- Close -->
        <button class="donation-close-btn" id="donationCloseBtn" aria-label="Close">
          ${SVG.close}
        </button>

        <div class="donation-modal-scroll">

          <!-- Header -->
          <div class="donation-header">
            <div class="donation-icon" style="color: var(--gold-bright);">
              ${SVG.heart}
            </div>
            <h2 class="donation-title" id="donationTitle">Support Our Project</h2>
            <p class="donation-subtitle">Help us keep this map free and updated for everyone</p>
          </div>

          <!-- Contact Links -->
          <div class="donation-contact">
            ${CONTACT_LINKS.map(c => `
              <a href="${c.url}" target="_blank" rel="noopener noreferrer"
                 class="donation-contact-link" title="${c.name}">
                ${SVG[c.svgKey]}
                <span class="contact-label">${c.name}</span>
              </a>
            `).join('')}
          </div>

          <!-- Message -->
          <div class="donation-message">
            <p>
              We truly appreciate your support in helping us maintain this website and cover
              monthly hosting costs. Your generosity ensures we can continue providing this
              free service to the community.
            </p>

            <p class="donation-impact">Your contribution supports</p>

            <ul class="donation-impact-list">
              <li>${SVG.server} Monthly server &amp; hosting expenses</li>
              <li>${SVG.map} Regular marker updates &amp; new content</li>
              <li>${SVG.tool} Bug fixes &amp; performance improvements</li>
              <li>${SVG.star} New features &amp; development</li>
              <li>${SVG.globe} Keeping the website free for everyone</li>
            </ul>

            <p class="donation-extra">
              Even a small contribution makes a huge difference in keeping this project alive.
              Thank you for being part of this journey.
            </p>
          </div>

          <!-- Donation Options -->
          <div class="donation-options">
            <h3 class="donation-options-title">Choose Your Method</h3>
            <div class="donation-buttons">
              ${createDonationButtons()}
            </div>
          </div>

        </div><!-- /.donation-modal-scroll -->

        <!-- Footer -->
        <div class="donation-footer">
          <p class="donation-footer-text">
            Every contribution, no matter how small, makes a difference.
          </p>
          <button class="donation-remind-btn" id="donationRemindBtn">
            Remind me later
          </button>
        </div>

      </div>
    `;

    return modal;
  }

  function createDonationButtons() {
    return Object.entries(DONATION_LINKS).map(([key, data]) => {
      // Trakteer uses stroke-based SVG (gift box), needs special treatment
      const iconStyle = key === 'trakteer'
        ? `style="fill:none; stroke:${data.color}; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round;"`
        : '';

      return `
        <a href="${data.url}"
           target="_blank"
           rel="noopener noreferrer"
           class="donation-btn"
           data-platform="${key}"
           style="--btn-color: ${data.color}">
          <span class="donation-btn-icon">
            <svg viewBox="${getSvgViewBox(key)}" xmlns="http://www.w3.org/2000/svg"
                 style="width:26px;height:26px;fill:${key !== 'trakteer' ? data.color : 'none'};${key === 'trakteer' ? `stroke:${data.color};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;` : ''}
                        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
              ${getSvgPath(key)}
            </svg>
          </span>
          <div class="donation-btn-content">
            <span class="donation-btn-name">${data.name}</span>
            <span class="donation-btn-desc">${data.description}</span>
          </div>
          <span class="donation-btn-badge">${data.badge}</span>
        </a>
      `;
    }).join('');
  }

  function getSvgViewBox(key) {
    return '0 0 24 24';
  }

  function getSvgPath(key) {
    const paths = {
      paypal: `<path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.152 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825c-.524 0-.968.382-1.05.9L7.538 21.337h3.817l.967-6.136.033-.198a1.07 1.07 0 0 1 1.057-.9h.667c4.301 0 7.664-1.747 8.647-6.797.41-2.099.009-3.834-.503-4.389z"/>`,

      kofi: `<path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.982-1.058 2.7-.968 3.456.748l.774.793.774-.793c.756-.76 2.596-.838 3.526.035.698.654.98 1.963.024 3.972zM22.201 9.421c-.499 2.203-2.379 3.443-4.858 3.304l-.037-4.604c0-.001 3.823.745 4.895 1.3z"/>`,

      trakteer: `<path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`
    };
    return paths[key] || '';
  }

  // ==========================================
  // MODAL CONTROL
  // ==========================================

  function showModal() {
    if (hasShown || wasShownThisSession()) {
      console.log('💰 Donation popup already shown this session');
      return;
    }

    const existing = document.getElementById(CONFIG.modalId);
    if (existing) existing.remove();

    const modal = createModal();
    document.body.appendChild(modal);

    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('show')));

    setupEventListeners(modal);
    trackDonationClicks(modal);
    hasShown = true;
    markAsShown();

    console.log('💰 Donation popup shown');
  }

  function closeModal() {
    const modal = document.getElementById(CONFIG.modalId);
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { if (modal.parentNode) modal.remove(); }, 350);
    console.log('💰 Donation popup closed');
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  function setupEventListeners(modal) {
    modal.querySelector('#donationCloseBtn')?.addEventListener('click', closeModal);

    modal.querySelector('#donationRemindBtn')?.addEventListener('click', () => {
      closeModal();
      console.log('💰 Remind later');
    });

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const escHandler = (e) => {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }

  function trackDonationClicks(modal) {
    modal.querySelectorAll('.donation-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        console.log(`💰 Clicked: ${this.dataset.platform}`);
        setTimeout(showThankYouMessage, 500);
      });
    });
  }

  function showThankYouMessage() {
    document.querySelector('.donation-thank-you')?.remove();

    const n = document.createElement('div');
    n.className = 'donation-thank-you';
    n.innerHTML = `
      <div class="donation-thank-you-content">
        <span class="donation-thank-you-icon">${SVG.check}</span>
        <p class="donation-thank-you-text">Thank you for your support!</p>
      </div>
    `;
    document.body.appendChild(n);
    requestAnimationFrame(() => requestAnimationFrame(() => n.classList.add('show')));

    setTimeout(() => {
      n.classList.remove('show');
      setTimeout(() => { if (n.parentNode) n.remove(); }, 350);
    }, 3000);
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  function init() {
    loadData();
    console.log(`💰 Donation system ready — shows after ${CONFIG.showDelay / 1000}s`);
    if (wasShownThisSession()) { console.log('💰 Already shown, skipping'); return; }
    timer = setTimeout(showModal, CONFIG.showDelay);
  }

  function show()   { showModal(); }
  function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
  function reset()  {
    sessionStorage.removeItem(CONFIG.storageKey);
    donationData = { shown: false, timestamp: null };
    hasShown = false;
    console.log('💰 State reset');
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, show, cancel, reset };

})();

window.DonationManager = DonationManager;
console.log('✅ DonationManager v3.0 loaded');