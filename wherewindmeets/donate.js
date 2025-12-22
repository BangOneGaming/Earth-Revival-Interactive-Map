/**
 * Donation System Module
 * Shows donation popup after specified time
 * Supports multiple payment gateways
 * 
 * @author Where Wind Meet Map
 * @version 1.1.0
 */

const DonationManager = (function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
  const CONFIG = {
    showDelay: 60000, // 15 seconds for testing (300000ms = 5min for production)
    storageKey: 'wwm_donation_shown',
    modalId: 'donationModal'
  };

  // ==========================================
  // DONATION LINKS
  // ==========================================
  
  const DONATION_LINKS = {
    paypal: {
      name: 'PayPal',
      url: 'https://paypal.me/IrvanNazmudin',
      icon: '💳',
      color: '#0070ba',
      description: 'International - Credit/Debit Card'
    },
    kofi: {
      name: 'Ko-fi',
      url: 'https://ko-fi.com/bangonegaming',
      icon: '☕',
      color: '#ff5e5b',
      description: 'International - Coffee Donation'
    },
    trakteer: {
      name: 'Trakteer',
      url: 'https://trakteer.id/BangOneGaming',
      icon: '🎁',
      color: '#e74c3c',
      description: 'Indonesia - All Payment Methods'
    }
  };

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let hasShown = false;
  let timer = null;
  let donationData = {
    shown: false,
    timestamp: null
  };

  // ==========================================
  // STORAGE MANAGEMENT (In-Memory)
  // ==========================================

  function loadData() {
    try {
      const stored = sessionStorage.getItem(CONFIG.storageKey);
      if (stored) {
        donationData = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load donation data:', e);
    }
  }

  function saveData() {
    try {
      sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(donationData));
    } catch (e) {
      console.warn('Failed to save donation data:', e);
    }
  }

  function wasShownThisSession() {
    return donationData.shown === true;
  }

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
      <div class="donation-modal">
        <!-- Close Button -->
        <button class="donation-close-btn" id="donationCloseBtn">×</button>
        
        <!-- Header -->
        <div class="donation-header">
          <div class="donation-icon">❤️</div>
          <h2 class="donation-title">Support Our Project</h2>
          <p class="donation-subtitle">
            Help us keep this map free and updated for everyone!
          </p>
        </div>

        <!-- Message -->
        <div class="donation-message">
          <p>
            We truly appreciate your donations in helping us maintain this website and cover monthly hosting costs. 
            Your support ensures we can continue providing this free service to the community! 🙏
          </p>
          <p class="donation-impact">
            Your contribution directly supports:
          </p>
          <ul class="donation-impact-list">
            <li>💰 Monthly server & hosting expenses</li>
            <li>🗺️ Regular marker updates & new content</li>
            <li>🔧 Bug fixes & performance improvements</li>
            <li>✨ New features development</li>
            <li>🌐 Keeping the website free for everyone</li>
          </ul>
          <p class="donation-extra">
            Even a small contribution makes a huge difference in keeping this project alive. Thank you! ❤️
          </p>
        </div>

        <!-- Donation Options -->
        <div class="donation-options">
          <h3 class="donation-options-title">Choose Your Preferred Method:</h3>
          <div class="donation-buttons">
            ${createDonationButtons()}
          </div>
        </div>

        <!-- Footer -->
        <div class="donation-footer">
          <p class="donation-footer-text">
            Every contribution, no matter how small, makes a difference! 🙏
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
    return Object.entries(DONATION_LINKS).map(([key, data]) => `
      <a href="${data.url}" 
         target="_blank" 
         rel="noopener noreferrer"
         class="donation-btn"
         data-platform="${key}"
         style="--btn-color: ${data.color}">
        <span class="donation-btn-icon">${data.icon}</span>
        <div class="donation-btn-content">
          <span class="donation-btn-name">${data.name}</span>
          <span class="donation-btn-desc">${data.description}</span>
        </div>
      </a>
    `).join('');
  }

  // ==========================================
  // MODAL CONTROL
  // ==========================================

  function showModal() {
    if (hasShown || wasShownThisSession()) {
      console.log('💰 Donation popup already shown this session');
      return;
    }

    const existingModal = document.getElementById(CONFIG.modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = createModal();
    document.body.appendChild(modal);

    // Force reflow and add show class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    });

    setupEventListeners(modal);
    hasShown = true;
    markAsShown();

    console.log('💰 Donation popup shown');
    trackDonationClicks(modal);
  }

  function closeModal() {
    const modal = document.getElementById(CONFIG.modalId);
    if (!modal) return;

    modal.classList.remove('show');
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 300);

    console.log('💰 Donation popup closed');
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  function setupEventListeners(modal) {
    const closeBtn = modal.querySelector('#donationCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    const remindBtn = modal.querySelector('#donationRemindBtn');
    if (remindBtn) {
      remindBtn.addEventListener('click', function() {
        closeModal();
        console.log('💰 User chose to be reminded later');
      });
    }

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    const escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function trackDonationClicks(modal) {
    const donationBtns = modal.querySelectorAll('.donation-btn');
    
    donationBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const platform = this.dataset.platform;
        console.log(`💰 User clicked donation: ${platform}`);
        
        setTimeout(() => {
          showThankYouMessage();
        }, 500);
      });
    });
  }

  function showThankYouMessage() {
    const notification = document.createElement('div');
    notification.className = 'donation-thank-you';
    notification.innerHTML = `
      <div class="donation-thank-you-content">
        <span class="donation-thank-you-icon">💝</span>
        <p class="donation-thank-you-text">Thank you for your support!</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.classList.add('show');
      });
    });
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  function init() {
    loadData();
    console.log('💰 Donation system initialized');
    console.log(`💰 Will show donation popup after ${CONFIG.showDelay / 1000} seconds`);

    if (wasShownThisSession()) {
      console.log('💰 Donation already shown this session, skipping');
      return;
    }

    timer = setTimeout(() => {
      showModal();
    }, CONFIG.showDelay);
  }

  function show() {
    showModal();
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      console.log('💰 Donation timer cancelled');
    }
  }

  function reset() {
    sessionStorage.removeItem(CONFIG.storageKey);
    donationData = { shown: false, timestamp: null };
    hasShown = false;
    console.log('💰 Donation state reset');
  }

  // ==========================================
  // AUTO-INIT ON LOAD
  // ==========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==========================================
  // RETURN PUBLIC API
  // ==========================================

  return {
    init,
    show,
    cancel,
    reset
  };

})();

window.DonationManager = DonationManager;
console.log('✅ DonationManager module loaded');