/**
 * Settings Module - Enhanced Version with Hidden Marker Feature
 * Modular system for user settings with reset visited markers and hidden marker features
 * 
 * Dependencies:
 * - login.js (for isLoggedIn, getUserToken)
 * - penanda.js (for MarkerManager)
 * - Existing loadVisitedMarkersFromServer() function
 * 
 * @author Where Wind Meet Map
 * @version 1.2.0 - Added Hidden Marker feature
 */

const SettingsManager = (function() {
  'use strict';

  // ==========================================
  // PRIVATE VARIABLES
  // ==========================================
  
  let container = null;
  let isOpen = false;
  let lastResetTime = 0;
  const RESET_COOLDOWN = 30000; // 30 detik cooldown

  const CONFIG = {
    containerId: 'settingsContainer',
    buttonId: 'settingsButton',
    hiddenMarkerKey: 'hideVisitedMarkers' // localStorage key
  };

  // ==========================================
  // PRIVATE METHODS - UI CREATION
  // ==========================================

  /**
   * Create settings button
   * @returns {HTMLElement}
   */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = CONFIG.buttonId;
    btn.className = 'settings-btn';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m-5-7h6m6 0h6m-11 5.196l4.243 4.243m0-8.486l4.243-4.243m-8.486 0L7.757 17.757"></path>
      </svg>
      <span>Settings</span>
    `;
    btn.title = 'Open Settings';
    
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggle();
    });

    return btn;
  }

  /**
   * Create settings container
   * @returns {HTMLElement}
   */
  function createContainer() {
    const div = document.createElement('div');
    div.id = CONFIG.containerId;
    div.className = 'settings-container';

    // Header
    const header = document.createElement('div');
    header.className = 'settings-header';
    header.innerHTML = `
      <h3>Settings</h3>
      <button class="settings-close-btn" title="Close">×</button>
    `;

    // Content
    const content = document.createElement('div');
    content.className = 'settings-content';

    // Hidden Marker Section (NEW!)
    const hiddenMarkerSection = createHiddenMarkerSection();
    content.appendChild(hiddenMarkerSection);

    // Reset Section
    const resetSection = createResetSection();
    content.appendChild(resetSection);

    div.appendChild(header);
    div.appendChild(content);

    // Event listeners
    div.querySelector('.settings-close-btn').addEventListener('click', close);
    
    // Close when clicking outside
    div.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    return div;
  }

  /**
   * Create hidden marker section (NEW!)
   * @returns {HTMLElement}
   */
  function createHiddenMarkerSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';

    const isHidden = localStorage.getItem(CONFIG.hiddenMarkerKey) === 'true';

    section.innerHTML = `
      <div class="settings-section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <h4>Hide Visited Markers</h4>
      </div>
      <p class="settings-description">
        When enabled, visited markers will be completely hidden from the map instead of being dimmed.
      </p>
      <label class="settings-toggle">
        <input type="checkbox" id="hideVisitedCheckbox" ${isHidden ? 'checked' : ''}>
        <span class="settings-toggle-slider"></span>
        <span class="settings-toggle-label">${isHidden ? 'Enabled' : 'Disabled'}</span>
      </label>
    `;

    const checkbox = section.querySelector('#hideVisitedCheckbox');
    checkbox.addEventListener('change', handleHiddenMarkerToggle);

    return section;
  }

  /**
   * Create reset visited markers section
   * @returns {HTMLElement}
   */
  function createResetSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';

    section.innerHTML = `
      <div class="settings-section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
          <path d="M3 21v-5h5"></path>
        </svg>
        <h4>Reset Visited Markers</h4>
      </div>
      <p class="settings-description">
        This will clear all visited marker data and reset all markers to unvisited state. 
        This action cannot be undone.
      </p>
      <button class="settings-reset-btn" id="resetVisitedBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
        Reset All Visited Markers
      </button>
      <div class="settings-cooldown-info" id="resetCooldownInfo" style="display: none;"></div>
    `;

    const resetBtn = section.querySelector('#resetVisitedBtn');
    resetBtn.addEventListener('click', handleResetClick);

    return section;
  }

  /**
   * Create confirmation modal
   * @returns {HTMLElement}
   */
  function createConfirmationModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal-overlay';
    modal.innerHTML = `
      <div class="settings-modal">
        <div class="settings-modal-icon">⚠️</div>
        <h3>Confirm Reset</h3>
        <p>Are you sure you want to reset all visited markers?</p>
        <p class="settings-modal-warning">This will clear <strong id="visitedCount">0</strong> visited markers and cannot be undone.</p>
        <div class="settings-modal-actions">
          <button class="settings-modal-btn settings-modal-cancel">Cancel</button>
          <button class="settings-modal-btn settings-modal-confirm">Reset All</button>
        </div>
      </div>
    `;

    // Get visited count
    const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
    const visitedCount = Object.values(visitedMarkers).filter(v => v === true).length;
    modal.querySelector('#visitedCount').textContent = visitedCount;

    // Event listeners
    const cancelBtn = modal.querySelector('.settings-modal-cancel');
    const confirmBtn = modal.querySelector('.settings-modal-confirm');

    cancelBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
    });

    confirmBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
      performReset();
    });

    // Close on overlay click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    return modal;
  }

  // ==========================================
  // PRIVATE METHODS - HIDDEN MARKER LOGIC
  // ==========================================

  /**
   * Handle hidden marker toggle (NEW!)
   * @param {Event} e - Change event
   */
  function handleHiddenMarkerToggle(e) {
    const isEnabled = e.target.checked;
    
    // Save to localStorage
    localStorage.setItem(CONFIG.hiddenMarkerKey, isEnabled.toString());
    
    // Update label
    const label = e.target.parentElement.querySelector('.settings-toggle-label');
    if (label) {
      label.textContent = isEnabled ? 'Enabled' : 'Disabled';
    }
    
    // Apply to all visited markers immediately
    applyHiddenMarkerSetting();
    
    // Show notification
    showNotification(
      isEnabled 
        ? 'Visited markers will now be hidden' 
        : 'Visited markers will now be dimmed',
      'success'
    );
    
    console.log(`🔄 Hidden marker setting: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Apply hidden marker setting to all visited markers (NEW!)
   */
  function applyHiddenMarkerSetting() {
    const isHidden = localStorage.getItem(CONFIG.hiddenMarkerKey) === 'true';
    const visitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
    
    if (!window.MarkerManager || !window.MarkerManager.activeMarkers) {
      console.warn('⚠️ MarkerManager not available');
      return;
    }
    
    let updatedCount = 0;
    
    Object.entries(visitedMarkers).forEach(([key, isVisited]) => {
      const marker = window.MarkerManager.activeMarkers[key];
      if (!marker) return;
      
      if (isVisited) {
        if (isHidden) {
          // Hide completely
          marker.remove();
          updatedCount++;
        } else {
          // Restore to map if not already added, then set opacity
          if (!marker._map) {
            marker.addTo(window.MarkerManager.map);
          }
          marker.setOpacity(0.5);
          updatedCount++;
        }
      } else {
        // Unvisited markers should always be visible
        if (!marker._map) {
          marker.addTo(window.MarkerManager.map);
        }
        marker.setOpacity(1.0);
      }
    });
    
    console.log(`✅ Updated ${updatedCount} markers (hidden: ${isHidden})`);
  }

  // ==========================================
  // PRIVATE METHODS - RESET LOGIC
  // ==========================================

  /**
   * Handle reset button click
   */
  function handleResetClick() {
    // Check cooldown
    const now = Date.now();
    const timeSinceLastReset = now - lastResetTime;

    if (timeSinceLastReset < RESET_COOLDOWN) {
      const remainingSeconds = Math.ceil((RESET_COOLDOWN - timeSinceLastReset) / 1000);
      showCooldownMessage(remainingSeconds);
      return;
    }

    // Show confirmation modal
    const modal = createConfirmationModal();
    document.body.appendChild(modal);
  }

  /**
   * Show cooldown message
   * @param {number} seconds - Remaining seconds
   */
  function showCooldownMessage(seconds) {
    const cooldownInfo = document.getElementById('resetCooldownInfo');
    if (!cooldownInfo) return;

    cooldownInfo.textContent = `Please wait ${seconds} seconds before resetting again.`;
    cooldownInfo.style.display = 'block';

    setTimeout(() => {
      cooldownInfo.style.display = 'none';
    }, 3000);
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success/error)
   */
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `settings-notification ${type}`;
    notification.textContent = message;
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

  /**
   * Perform reset operation
   */
  async function performReset() {
    console.log('🔄 RESET STEP 0: Starting complete reset...');

    try {
      // Get all current visited markers
      const oldVisitedMarkers = JSON.parse(localStorage.getItem('visitedMarkers') || '{}');
      const allKeys = Object.keys(oldVisitedMarkers);
      console.log(`   📋 Found ${allKeys.length} markers to reset`);

      if (allKeys.length === 0) {
        console.log('ℹ️ No markers to reset (already empty)');
        showNotification('No visited markers to reset!', 'success');
        setTimeout(close, 500);
        return;
      }

      // Clear localStorage
      localStorage.setItem('visitedMarkers', '{}');
      console.log('   ✅ localStorage cleared to {}');

      // Update ALL markers on map
      if (!window.MarkerManager || !window.MarkerManager.activeMarkers) {
        console.error('   ❌ MarkerManager is null/undefined!');
      } else {
        const allMarkerData = window.MarkerManager.getAllMarkers 
          ? window.MarkerManager.getAllMarkers() 
          : [];
        
        let resetCount = 0;
        
        Object.entries(window.MarkerManager.activeMarkers).forEach(([key, marker]) => {
          if (!marker) return;
          
          try {
            // Restore to map if hidden
            if (!marker._map) {
              marker.addTo(window.MarkerManager.map);
            }
            
            // Update opacity to 1.0 (normal/bright)
            if (marker.setOpacity) {
              marker.setOpacity(1.0);
            }
            
            // Refresh popup content (remove visited badge)
            if (marker.getPopup && window.MarkerManager.createPopupContent) {
              const markerData = allMarkerData.find(m => m._key === key);
              if (markerData) {
                const newContent = window.MarkerManager.createPopupContent(markerData);
                marker.getPopup().setContent(newContent);
              }
            }
            
            resetCount++;
          } catch (e) {
            console.error(`   ❌ Error resetting marker ${key}:`, e);
          }
        });
        
        console.log(`   ✅ Reset ${resetCount} markers (restored + opacity + popup)`);
      }

      // Update profile container
      if (window.ProfileContainer && window.ProfileContainer.update) {
        window.ProfileContainer.update(false);
        console.log('   ✅ Profile updated');
        
        setTimeout(() => {
          if (window.SettingsManager) {
            console.log('   🔄 Re-initializing settings button...');
            window.SettingsManager.init();
            console.log('   ✅ Settings button re-initialized');
          }
        }, 150);
      }

      // Sync to server
      if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        const token = typeof getUserToken === 'function' ? getUserToken() : null;
        
        if (token && allKeys.length > 0) {
          console.log(`🔄 RESET STEP 6: Syncing to server (${allKeys.length} markers)...`);
          
          try {
            const response = await fetch(
              'https://autumn-dream-8c07.square-spon.workers.dev/visitedmarker/batch',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  markers: allKeys.map(markerKey => ({
                    markerKey: markerKey,
                    visited: false
                  }))
                })
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log('   ✅ Server reset successful:', data);
              showNotification('All visited markers have been reset successfully!', 'success');
            } else {
              console.error('   ❌ Server reset failed:', response.status);
              showNotification('Local reset successful, but server sync failed.', 'error');
            }
          } catch (err) {
            console.error('   ❌ Server reset error:', err);
            showNotification('Local reset successful, but server sync failed.', 'error');
          }
        }
      } else {
        showNotification('All visited markers have been reset locally!', 'success');
      }

      lastResetTime = Date.now();
      
      setTimeout(() => {
        close();
        console.log('✅ RESET COMPLETE!');
      }, 1500);

    } catch (err) {
      console.error('❌ RESET ERROR:', err);
      showNotification('Failed to reset visited markers. Please try again.', 'error');
    }
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Initialize settings (attach button to profile)
   */
  function init() {
    // Only for logged in users
    if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
      return;
    }

    // Check if profile container exists
    const profileContainer = document.getElementById('profileContainer');
    if (!profileContainer) {
      console.warn('⚠️ Profile container not found, settings cannot be initialized');
      return;
    }

    // Remove existing button if any
    const existingBtn = document.getElementById(CONFIG.buttonId);
    if (existingBtn) {
      existingBtn.remove();
    }

    // Create and append button
    const btn = createButton();
    
    // Insert button AFTER Show More button (at the bottom)
    const showMoreBtn = profileContainer.querySelector('.profile-show-more-btn');
    const statsSection = profileContainer.querySelector('.profile-stats-section');
    
    if (showMoreBtn) {
      showMoreBtn.parentNode.insertBefore(btn, showMoreBtn.nextSibling);
    } else if (statsSection) {
      const statsWrapper = statsSection.parentElement;
      if (statsWrapper && statsWrapper.nextSibling) {
        statsWrapper.parentNode.insertBefore(btn, statsWrapper.nextSibling);
      } else if (statsWrapper) {
        statsWrapper.parentNode.appendChild(btn);
      }
    } else {
      const profileContent = profileContainer.querySelector('.profile-content');
      if (profileContent) {
        profileContent.appendChild(btn);
      }
    }

    console.log('✅ Settings button initialized');

    // Remove old event listener if exists
    document.removeEventListener('click', globalClickHandler);
    
    // Add global click handler
    document.addEventListener('click', globalClickHandler);
  }
  
  /**
   * Global click handler
   */
  function globalClickHandler(e) {
    if (!isOpen || !container) return;
    
    const settingsBtn = document.getElementById(CONFIG.buttonId);
    
    if (settingsBtn && 
        !container.contains(e.target) && 
        e.target !== settingsBtn && 
        !settingsBtn.contains(e.target)) {
      close();
    }
  }

  /**
   * Toggle settings container
   */
  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  /**
   * Open settings container
   */
  function open() {
    if (isOpen) return;

    if (container) {
      container.remove();
    }

    container = createContainer();
    document.body.appendChild(container);

    const btn = document.getElementById(CONFIG.buttonId);
    if (btn) {
      const btnRect = btn.getBoundingClientRect();
      container.style.top = `${btnRect.bottom + 8}px`;
      container.style.left = `${btnRect.left}px`;
    }

    setTimeout(() => {
      container.classList.add('show');
    }, 10);

    isOpen = true;
    console.log('⚙️ Settings opened');
  }

  /**
   * Close settings container
   */
  function close() {
    if (!isOpen || !container) return;

    container.classList.remove('show');
    
    setTimeout(() => {
      if (container && container.parentNode) {
        container.remove();
        container = null;
      }
    }, 300);

    isOpen = false;
    console.log('⚙️ Settings closed');
  }

  /**
   * Remove settings completely
   */
  function destroy() {
    close();
    
    const btn = document.getElementById(CONFIG.buttonId);
    if (btn) {
      btn.remove();
    }

    console.log('❌ Settings destroyed');
  }

  /**
   * Check if settings is open
   * @returns {boolean}
   */
  function isSettingsOpen() {
    return isOpen;
  }

  /**
   * Get hidden marker setting (NEW!)
   * @returns {boolean}
   */
  function isHiddenMarkerEnabled() {
    return localStorage.getItem(CONFIG.hiddenMarkerKey) === 'true';
  }

  /**
   * Apply hidden marker setting (PUBLIC - NEW!)
   * Can be called from outside after markers are loaded
   */
  function applyHiddenMarkerSettingPublic() {
    applyHiddenMarkerSetting();
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  return {
    init,
    toggle,
    open,
    close,
    destroy,
    isOpen: isSettingsOpen,
    isHiddenMarkerEnabled, // NEW!
    applyHiddenMarkerSetting: applyHiddenMarkerSettingPublic // NEW!
  };

})();

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.SettingsManager = SettingsManager;

console.log('✅ SettingsManager module loaded (Enhanced v1.2.0 with Hidden Marker)');