/**
 * Donation System Module
 * Shows donation popup after 5 minutes of usage
 * Supports multiple payment gateways
 * 
 * @author Where Wind Meet Map
 * @version 1.0.0
 */

const DonationManager = (function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  
  const CONFIG = {
    showDelay: 300000, // 5 minutes in milliseconds (300000ms = 5min)
    storageKey: 'wwm_donation_shown_session', // sessionStorage key
    modalId: 'donationModal'
  };

  // ==========================================
  // DONATION LINKS
  // ==========================================
  
  const DONATION_LINKS = {
    paypal: {
      name: 'PayPal',
      url: 'https://paypal.me/IrvanNazmudin', // ⚠️ GANTI DENGAN URL PAYPAL ANDA
      icon: '💳',
      color: '#0070ba',
      description: 'International - Credit/Debit Card'
    },
    kofi: {
      name: 'Ko-fi',
      url: 'https://ko-fi.com/bangonegaming', // ⚠️ GANTI DENGAN URL KO-FI ANDA
      icon: '☕',
      color: '#ff5e5b',
      description: 'International - Coffee Donation'
    },
    trakteer: {
      name: 'Trakteer',
      url: 'https://trakteer.id/BangOneGaming', // ⚠️ GANTI DENGAN URL TRAKTEER ANDA
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

  // ==========================================
  // SESSION STORAGE MANAGEMENT
  // ==========================================

  /**
   * Check if donation was shown in this session
   * @returns {boolean}
   */
  function wasShownThisSession() {
    return sessionStorage.getItem(CONFIG.storageKey) === 'true';
  }

  /**
   * Mark donation as shown in this session
   */
  function markAsShown() {
    sessionStorage.setItem(CONFIG.storageKey, 'true');
  }

  // ==========================================
  // SESSION STORAGE MANAGEMENT
  // ==========================================

  /**
   * Check if donation was shown in this session
   * @returns {boolean}
   */
  function wasShownThisSession() {
    return sessionStorage.getItem(CONFIG.storageKey) === 'true';
  }

  /**
   * Mark donation as shown in this session
   */
  function markAsShown() {
    sessionStorage.setItem(CONFIG.storageKey, 'true');
  }

  // ==========================================
  // MODAL CREATION
  // ==========================================

  /**
   * Create donation modal
   * @returns {HTMLElement}
   */
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

  /**
   * Create donation buttons HTML
   * @returns {string}
   */
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

  /**
   * Show donation modal
   */
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

    // Trigger animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    // Setup event listeners
    setupEventListeners(modal);

    // Mark as shown in this session
    hasShown = true;
    markAsShown();

    console.log('💰 Donation popup shown');

    // Track donation button clicks
    trackDonationClicks(modal);
  }

  /**
   * Close donation modal
   */
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

  /**
   * Setup event listeners
   * @param {HTMLElement} modal - Modal element
   */
  function setupEventListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('#donationCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Remind later button
    const remindBtn = modal.querySelector('#donationRemindBtn');
    if (remindBtn) {
      remindBtn.addEventListener('click', function() {
        closeModal();
        console.log('💰 User chose to be reminded later');
      });
    }

    // Close on overlay click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  /**
   * Track donation button clicks
   * @param {HTMLElement} modal - Modal element
   */
  function trackDonationClicks(modal) {
    const donationBtns = modal.querySelectorAll('.donation-btn');
    
    donationBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const platform = this.dataset.platform;
        console.log(`💰 User clicked donation: ${platform}`);
        
        // Optional: Send analytics event here
        // if (typeof gtag !== 'undefined') {
        //   gtag('event', 'donation_click', {
        //     'platform': platform
        //   });
        // }
        
        // Show thank you message
        setTimeout(() => {
          showThankYouMessage();
        }, 500);
      });
    });
  }

  /**
   * Show thank you message after clicking donation
   */
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
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  /**
   * Initialize donation system
   */
  function init() {
    console.log('💰 Donation system initialized');
    console.log(`💰 Will show donation popup after ${CONFIG.showDelay / 1000 / 60} minutes`);

    // Check if already shown in this session
    if (wasShownThisSession()) {
      console.log('💰 Donation already shown this session, skipping');
      return;
    }

    // Set timer to show modal after delay
    timer = setTimeout(() => {
      showModal();
    }, CONFIG.showDelay);
  }

  /**
   * Manually show donation modal (for testing or manual trigger)
   */
  function show() {
    showModal();
  }

  /**
   * Cancel scheduled donation popup
   */
  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      console.log('💰 Donation timer cancelled');
    }
  }

  /**
   * Reset donation state (for testing)
   */
  function reset() {
    sessionStorage.removeItem(CONFIG.storageKey);
    hasShown = false;
    console.log('💰 Donation state reset');
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

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.DonationManager = DonationManager;

console.log('✅ DonationManager module loaded');