/**
 * Cookie Consent Manager for Where Winds Meet Interactive Map
 * Mobile-First Optimized Version
 */

// ============================================
// CONSTANTS
// ============================================
const COOKIE_CONFIG = {
  NAMES: {
    CONSENT: 'wwm_cookie_consent',
    USER_SESSION: 'wwm_user_session',
    VISITED_MARKERS: 'wwm_visited_markers',
    MAP_SETTINGS: 'wwm_map_settings',
    NOTIFICATIONS: 'wwm_notifications',
    USER_PREFERENCES: 'wwm_user_prefs'
  },
  
  VALUES: {
    ACCEPTED: 'accepted',
    DECLINED: 'declined'
  },
  
  EXPIRY_DAYS: {
    CONSENT: 365,
    SESSION: 30,
    SETTINGS: 90,
    MARKERS: 365
  },
  
  CSS_CLASSES: {
    BANNER: 'wwm-cookie-banner',
    OVERLAY: 'wwm-cookie-overlay',
    HIDDEN: 'wwm-hidden',
    VISIBLE: 'wwm-visible'
  }
};

// ============================================
// COOKIE UTILITIES
// ============================================
const CookieUtils = {
  set(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
  },
  
  get(name) {
    const nameWithEquals = `${name}=`;
    const cookieArray = document.cookie.split(';');
    
    for (let cookie of cookieArray) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith(nameWithEquals)) {
        return trimmedCookie.substring(nameWithEquals.length);
      }
    }
    return null;
  },
  
  delete(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
  
  deleteAll() {
    Object.values(COOKIE_CONFIG.NAMES).forEach(name => {
      this.delete(name);
    });
  }
};

// ============================================
// CONSENT CHECKER
// ============================================
const ConsentChecker = {
  hasUserConsented() {
    const consentValue = CookieUtils.get(COOKIE_CONFIG.NAMES.CONSENT);
    return consentValue === COOKIE_CONFIG.VALUES.ACCEPTED;
  },
  
  hasUserDeclined() {
    const consentValue = CookieUtils.get(COOKIE_CONFIG.NAMES.CONSENT);
    return consentValue === COOKIE_CONFIG.VALUES.DECLINED;
  },
  
  shouldShowBanner() {
    return !this.hasUserConsented() && !this.hasUserDeclined();
  }
};

// ============================================
// BANNER TEMPLATE - COMPACT MOBILE VERSION
// ============================================
const BannerTemplate = {
  createHTML() {
    return `
      <div class="${COOKIE_CONFIG.CSS_CLASSES.OVERLAY}" id="wwmCookieOverlay"></div>

      <div class="${COOKIE_CONFIG.CSS_CLASSES.BANNER}" id="wwmCookieBanner">
        <div class="wwm-cookie-content">

          <!-- Compact Header -->
          <div class="wwm-cookie-header">
            <img
              src="https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/faviconV2.ico?updatedAt=1762922428848"
              alt="WWM"
              class="wwm-cookie-icon"
            >
            <h2>🍪 Cookie Settings</h2>
          </div>

          <!-- Compact Intro -->
          <div class="wwm-cookie-intro">
            <p>
              We use cookies to save your progress and enhance your map experience.
              Your data stays in your browser and is never shared.
            </p>
          </div>

          <!-- Collapsible Details -->
          <details class="wwm-cookie-details">
            <summary>📋 What we store</summary>
            <div class="wwm-cookie-details-content">
              <ul>
                <li><strong>Session</strong> – Keep you logged in</li>
                <li><strong>Progress</strong> – Track visited markers</li>
                <li><strong>Settings</strong> – Remember filters & zoom</li>
                <li><strong>Preferences</strong> – Custom options</li>
              </ul>
              
              <div class="wwm-cookie-note">
                <strong>🔒 Privacy:</strong>
                <p>
                  Data stays local. No tracking or third parties.
                  <a href="policy.html" target="_blank">Privacy Policy</a>
                </p>
              </div>
            </div>
          </details>

          <!-- Action Buttons -->
          <div class="wwm-cookie-actions">
            <button id="wwmAcceptCookies" class="wwm-btn wwm-btn-accept">
              ✅ Accept
            </button>
            <button id="wwmDeclineCookies" class="wwm-btn wwm-btn-decline">
              ❌ Decline
            </button>
          </div>

          <!-- Footer -->
          <div class="wwm-cookie-footer">
            <small>Clear cookies anytime from browser settings</small>
          </div>

        </div>
      </div>
    `;
  },
  
  createStyles() {
    return `
      <style>
        /* Overlay */
        .${COOKIE_CONFIG.CSS_CLASSES.OVERLAY} {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(31, 27, 23, 0.85);
          backdrop-filter: blur(5px);
          z-index: 99998;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        .${COOKIE_CONFIG.CSS_CLASSES.OVERLAY}.${COOKIE_CONFIG.CSS_CLASSES.VISIBLE} {
          opacity: 1;
          pointer-events: all;
        }
        
        /* Banner Container - Mobile First */
        .${COOKIE_CONFIG.CSS_CLASSES.BANNER} {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(145deg, #3e2f1c 0%, #5a4328 100%);
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
          z-index: 99999;
          max-height: 80vh;
          overflow-y: auto;
          border-top: 3px solid #d4af7f;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .${COOKIE_CONFIG.CSS_CLASSES.BANNER}.${COOKIE_CONFIG.CSS_CLASSES.VISIBLE} {
          transform: translateY(0);
        }
        
        /* Content Container */
        .wwm-cookie-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          color: #f5f0e1;
        }
        
        /* Compact Header */
        .wwm-cookie-header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 2px solid rgba(212, 175, 127, 0.3);
        }
        
        .wwm-cookie-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 8px;
          filter: drop-shadow(0 2px 8px rgba(212, 175, 127, 0.5));
        }
        
        .wwm-cookie-header h2 {
          margin: 0;
          color: #f3e5ab;
          font-size: 20px;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        /* Intro */
        .wwm-cookie-intro {
          background: rgba(62, 47, 28, 0.6);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #d4af7f;
        }
        
        .wwm-cookie-intro p {
          margin: 0;
          line-height: 1.5;
          font-size: 14px;
          color: #f5f0e1;
        }
        
        /* Collapsible Details */
        .wwm-cookie-details {
          background: rgba(90, 67, 40, 0.4);
          border-radius: 8px;
          margin-bottom: 15px;
          border: 1px solid rgba(212, 175, 127, 0.3);
          overflow: hidden;
        }
        
        .wwm-cookie-details summary {
          padding: 12px 15px;
          cursor: pointer;
          font-weight: 700;
          color: #f3e5ab;
          font-size: 15px;
          user-select: none;
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .wwm-cookie-details summary::-webkit-details-marker {
          display: none;
        }
        
        .wwm-cookie-details summary::after {
          content: '▼';
          transition: transform 0.3s ease;
          font-size: 12px;
        }
        
        .wwm-cookie-details[open] summary::after {
          transform: rotate(180deg);
        }
        
        .wwm-cookie-details-content {
          padding: 0 15px 15px 15px;
          animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .wwm-cookie-details ul {
          margin: 10px 0;
          padding-left: 20px;
          list-style: none;
        }
        
        .wwm-cookie-details li {
          margin: 8px 0;
          padding-left: 8px;
          line-height: 1.5;
          font-size: 14px;
          position: relative;
        }
        
        .wwm-cookie-details li::before {
          content: '▸';
          position: absolute;
          left: -12px;
          color: #d4af7f;
          font-weight: bold;
        }
        
        .wwm-cookie-details strong {
          color: #ffd36b;
        }
        
        /* Note Box */
        .wwm-cookie-note {
          background: rgba(75, 46, 30, 0.6);
          padding: 12px;
          border-radius: 6px;
          margin-top: 12px;
          border: 1px solid #d4af7f;
        }
        
        .wwm-cookie-note strong {
          display: block;
          color: #ffd36b;
          margin-bottom: 6px;
          font-size: 14px;
        }
        
        .wwm-cookie-note p {
          margin: 6px 0 0 0;
          line-height: 1.5;
          font-size: 13px;
          color: #f5f0e1;
        }
        
        .wwm-cookie-note a {
          color: #ffd36b;
          font-weight: 700;
          text-decoration: underline;
        }
        
        /* Action Buttons */
        .wwm-cookie-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }
        
        .wwm-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .wwm-btn-accept {
          background: linear-gradient(145deg, #27ae60 0%, #229954 100%);
          color: white;
          border: 2px solid #1e8449;
        }
        
        .wwm-btn-accept:active {
          transform: scale(0.98);
        }
        
        .wwm-btn-decline {
          background: linear-gradient(145deg, #7f8c8d 0%, #5d6d7e 100%);
          color: white;
          border: 2px solid #5d6d7e;
        }
        
        .wwm-btn-decline:active {
          transform: scale(0.98);
        }
        
        /* Footer */
        .wwm-cookie-footer {
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid rgba(212, 175, 127, 0.3);
        }
        
        .wwm-cookie-footer small {
          color: #d4af7f;
          font-size: 11px;
          line-height: 1.4;
        }
        
        /* Desktop Optimization */
        @media (min-width: 769px) {
          .${COOKIE_CONFIG.CSS_CLASSES.BANNER} {
            max-height: 60vh;
          }
          
          .wwm-cookie-content {
            padding: 25px 30px;
          }
          
          .wwm-cookie-header h2 {
            font-size: 24px;
          }
          
          .wwm-cookie-icon {
            width: 40px;
            height: 40px;
          }
          
          .wwm-btn {
            padding: 14px 24px;
            font-size: 15px;
          }
          
          .wwm-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
          }
        }
        
        /* Small Mobile */
        @media (max-width: 400px) {
          .wwm-cookie-content {
            padding: 15px;
          }
          
          .wwm-cookie-header h2 {
            font-size: 18px;
          }
          
          .wwm-cookie-intro p,
          .wwm-cookie-details li,
          .wwm-cookie-note p {
            font-size: 13px;
          }
          
          .wwm-btn {
            padding: 10px 16px;
            font-size: 13px;
          }
        }
        
        /* Custom Scrollbar */
        .${COOKIE_CONFIG.CSS_CLASSES.BANNER}::-webkit-scrollbar {
          width: 8px;
        }
        
        .${COOKIE_CONFIG.CSS_CLASSES.BANNER}::-webkit-scrollbar-track {
          background: rgba(31, 27, 23, 0.5);
        }
        
        .${COOKIE_CONFIG.CSS_CLASSES.BANNER}::-webkit-scrollbar-thumb {
          background: #d4af7f;
          border-radius: 4px;
        }
        
      </style>
    `;
  }
};

// ============================================
// DOM MANIPULATION
// ============================================
const DOMHandler = {
  injectBannerIntoPage() {
    const styleElement = document.createElement('div');
    styleElement.innerHTML = BannerTemplate.createStyles();
    document.head.appendChild(styleElement);
    
    const bannerElement = document.createElement('div');
    bannerElement.innerHTML = BannerTemplate.createHTML();
    document.body.appendChild(bannerElement);
  },
  
  showBanner() {
    const banner = document.getElementById('wwmCookieBanner');
    const overlay = document.getElementById('wwmCookieOverlay');
    
    if (banner && overlay) {
      requestAnimationFrame(() => {
        overlay.classList.add(COOKIE_CONFIG.CSS_CLASSES.VISIBLE);
        banner.classList.add(COOKIE_CONFIG.CSS_CLASSES.VISIBLE);
      });
    }
  },
  
  hideBanner() {
    const banner = document.getElementById('wwmCookieBanner');
    const overlay = document.getElementById('wwmCookieOverlay');
    
    if (banner) banner.classList.remove(COOKIE_CONFIG.CSS_CLASSES.VISIBLE);
    if (overlay) overlay.classList.remove(COOKIE_CONFIG.CSS_CLASSES.VISIBLE);
    
    setTimeout(() => {
      if (banner) banner.remove();
      if (overlay) overlay.remove();
    }, 400);
  },
  
  attachEventListeners() {
    const acceptButton = document.getElementById('wwmAcceptCookies');
    const declineButton = document.getElementById('wwmDeclineCookies');
    
    if (acceptButton) {
      acceptButton.addEventListener('click', EventHandlers.handleAccept);
    }
    
    if (declineButton) {
      declineButton.addEventListener('click', EventHandlers.handleDecline);
    }
  }
};

// ============================================
// EVENT HANDLERS
// ============================================
const EventHandlers = {
  handleAccept() {
    CookieUtils.set(
      COOKIE_CONFIG.NAMES.CONSENT,
      COOKIE_CONFIG.VALUES.ACCEPTED,
      COOKIE_CONFIG.EXPIRY_DAYS.CONSENT
    );
    
    DOMHandler.hideBanner();
    window.dispatchEvent(new CustomEvent('wwmCookiesAccepted'));
  },
  
  handleDecline() {
    CookieUtils.set(
      COOKIE_CONFIG.NAMES.CONSENT,
      COOKIE_CONFIG.VALUES.DECLINED,
      COOKIE_CONFIG.EXPIRY_DAYS.CONSENT
    );
    
    DOMHandler.hideBanner();
    window.dispatchEvent(new CustomEvent('wwmCookiesDeclined'));
  }
};

// ============================================
// INITIALIZATION
// ============================================
const CookieConsentSystem = {
  initialize(delayMs = 0) {
    if (ConsentChecker.shouldShowBanner()) {
      setTimeout(() => {
        DOMHandler.injectBannerIntoPage();
        DOMHandler.attachEventListeners();
        
        // Show with animation after injection
        setTimeout(() => {
          DOMHandler.showBanner();
        }, 100);
      }, delayMs);
    }
  }
};

// ============================================
// PUBLIC API
// ============================================
window.WWMCookieConsent = {
  hasConsent() {
    return ConsentChecker.hasUserConsented();
  },
  
  hasDeclined() {
    return ConsentChecker.hasUserDeclined();
  },
  
  setCookie(name, value, days) {
    if (ConsentChecker.hasUserConsented()) {
      CookieUtils.set(name, value, days);
      return true;
    }
    return false;
  },
  
  getCookie(name) {
    if (ConsentChecker.hasUserConsented()) {
      return CookieUtils.get(name);
    }
    return null;
  },
  
  clearAllCookies() {
    CookieUtils.deleteAll();
  },
  
  showBanner(delayMs = 0) {
    CookieUtils.delete(COOKIE_CONFIG.NAMES.CONSENT);
    CookieConsentSystem.initialize(delayMs);
  },
  
  // Called from main.js after loading complete
  initAfterLoad(delayMs = 2000) {
    CookieConsentSystem.initialize(delayMs);
  }
};

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.WWMCookieConsent;
}