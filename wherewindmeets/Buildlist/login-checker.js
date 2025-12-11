/**
 * AUTHENTICATION MODULE
 * Handles user login, profile checking, and session management
 */

const AuthModule = {
  currentUser: null,
  
  USER_PROFILE_ENDPOINT: "https://autumn-dream-8c07.square-spon.workers.dev/userprofile",

  /**
   * Initialize authentication
   */
  async init() {
    console.log('🔐 Initializing Authentication...');
    
    // Check for saved token
    const savedToken = localStorage.getItem("userToken");
    if (savedToken) {
      await this.restoreSession(savedToken);
    }
    
    this.createLoginModal();
    this.initializeGoogleSDK();
    console.log('✅ Authentication ready!');
  },

  /**
   * Initialize Google SDK when it's ready
   */
  initializeGoogleSDK() {
    // Wait for Google SDK to be available
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID", // TODO: Replace with actual client ID
          callback: (response) => {
            this.handleGoogleLogin(response.credential);
          }
        });
        console.log('✅ Google SDK initialized');
      } else {
        // Retry after 100ms
        setTimeout(checkGoogle, 100);
      }
    };
    
    checkGoogle();
  },

  /**
   * Restore user session from saved token
   */
  async restoreSession(token) {
    try {
      const payload = this.decodeJwt(token);
      
      this.currentUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: token
      };

      console.log('🔄 Restoring session for:', this.currentUser.email);
      
      // Get user profile
      const profileData = await this.getUserProfile();
      
      if (profileData && profileData.inGameName) {
        this.currentUser.gameProfile = {
          inGameName: profileData.inGameName,
          weaponVariant: profileData.class,
          role: this.extractRoleFromClass(profileData.class)
        };
        
        console.log('✅ Session restored:', this.currentUser.gameProfile);
      } else {
        console.log('⚠️ Profile incomplete');
      }
      
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      localStorage.removeItem("userToken");
      this.currentUser = null;
    }
  },

  /**
   * Extract role from weapon class
   */
  extractRoleFromClass(weaponClass) {
    const roleMap = {
      'Strategic Sword': 'Melee DPS',
      'Nameless Sword': 'Melee DPS',
      'Heavenquaker Spear': 'Melee DPS',
      'Nameless Spear': 'Melee DPS',
      'Stormbreaker Spear': 'Tank',
      'Infernal Twin Blades': 'Melee DPS',
      'Thundercry Blade': 'Tank',
      'Panacea Fan': 'Healer',
      'Inkwell Fan': 'Ranged DPS',
      'Soulshade Fan': 'Support',
      'Vernal Umbrella': 'Support',
      'Soulshade Umbrella': 'Melee DPS',
      'Combat Umbrella': 'Support',
      'Mortal Rope Dart': 'Melee DPS'
    };
    
    return roleMap[weaponClass] || 'Unknown';
  },

  /**
   * Decode JWT token
   */
  decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  },

  /**
   * Get user profile from server
   */
  async getUserProfile() {
    try {
      const res = await fetch(this.USER_PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.currentUser.token}`
        }
      });
      
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    }
  },

  /**
   * Create login modal
   */
  createLoginModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('authLoginModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'authLoginModal';
    modal.className = 'auth-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="auth-modal-content">
        <button class="auth-modal-close" id="authModalClose">×</button>
        <div class="auth-modal-body">
          <h2 style="text-align: center; margin-bottom: 20px; color: #333;">Login Required</h2>
          <p style="text-align: center; margin-bottom: 25px; color: #666;">Please login to continue</p>
          <div id="authGoogleSignIn"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    document.getElementById('authModalClose').addEventListener('click', () => {
      this.hideLoginModal();
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideLoginModal();
      }
    });
  },

  /**
   * Show login modal
   */
  showLoginModal(onSuccess) {
    const modal = document.getElementById('authLoginModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Store callback
    this.loginSuccessCallback = onSuccess;
    
    // Wait for Google SDK to load
    this.renderGoogleButton();
  },

  /**
   * Render Google Sign-In button
   */
  renderGoogleButton() {
    const container = document.getElementById('authGoogleSignIn');
    if (!container) return;
    
    // Check if Google SDK is loaded
    if (typeof google !== 'undefined' && google.accounts) {
      container.innerHTML = '';
      google.accounts.id.renderButton(
        container,
        { 
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
    } else {
      // Google SDK not loaded yet, show loading and retry
      container.innerHTML = '<p style="text-align: center; color: #666;">Loading Google Sign-In...</p>';
      
      // Retry after 500ms
      setTimeout(() => {
        this.renderGoogleButton();
      }, 500);
    }
  },

  /**
   * Hide login modal
   */
  hideLoginModal() {
    const modal = document.getElementById('authLoginModal');
    if (modal) modal.style.display = 'none';
  },

  /**
   * Handle Google login callback
   */
  async handleGoogleLogin(credential) {
    try {
      const payload = this.decodeJwt(credential);
      
      this.currentUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: credential
      };
      
      localStorage.setItem("userToken", credential);
      
      // Get user profile
      const profileData = await this.getUserProfile();
      
      if (profileData && profileData.inGameName) {
        this.currentUser.gameProfile = {
          inGameName: profileData.inGameName,
          weaponVariant: profileData.class,
          role: this.extractRoleFromClass(profileData.class)
        };
      }
      
      console.log('✅ Login successful:', this.currentUser.email);
      
      this.hideLoginModal();
      
      // Call success callback if exists
      if (this.loginSuccessCallback) {
        this.loginSuccessCallback();
        this.loginSuccessCallback = null;
      }
      
      // Trigger login event
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: this.currentUser }));
      
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      alert('Login failed. Please try again.');
      return false;
    }
  },

  /**
   * Require login - show modal if not logged in
   */
  requireLogin(callback) {
    if (this.isLoggedIn()) {
      callback();
    } else {
      this.showLoginModal(callback);
    }
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null && this.currentUser.token !== null;
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  },

  /**
   * Get user token
   */
  getToken() {
    return this.currentUser ? this.currentUser.token : null;
  },

  /**
   * Logout
   */
  logout() {
    this.currentUser = null;
    localStorage.removeItem("userToken");
    console.log('👋 User logged out');
    
    // Trigger logout event
    window.dispatchEvent(new Event('userLoggedOut'));
    
    // Reload page
    window.location.reload();
  }
};

// Global callback for Google Sign-In
window.handleCredentialResponse = function(response) {
  AuthModule.handleGoogleLogin(response.credential);
};

window.AuthModule = AuthModule;
/**
 * LOGIN CHECKER FOR BUILD LIST
 * Handles login requirements and UI updates
 */

(function() {
  console.log('🔐 Login Checker initialized');

  // ========================================
  // UI UPDATE FUNCTIONS
  // ========================================

  /**
   * Update UI after successful login
   */
  function updateUIAfterLogin(user) {
    console.log('✅ Updating UI for logged in user:', user.email);

    // Hide login modal
    hideLoginModal();

    // Update top login button
    const topLoginBtn = document.getElementById('topLoginBtn');
    if (topLoginBtn) {
      topLoginBtn.style.display = 'none';
    }

    // Show user profile display
    const profileDisplay = document.getElementById('userProfileDisplay');
    if (profileDisplay) {
      profileDisplay.style.display = 'none';
      
      const avatar = document.getElementById('userAvatar');
      const displayName = document.getElementById('userDisplayName');
      const roleDisplay = document.getElementById('userRole');

      if (avatar) avatar.src = user.picture || '';
      if (displayName) displayName.textContent = user.name || 'User';
      
      if (roleDisplay) {
        if (user.gameProfile && !user.gameProfile.incomplete) {
          roleDisplay.textContent = `${user.gameProfile.weaponVariant} (${user.gameProfile.role})`;
        } else {
          roleDisplay.textContent = 'Profile Incomplete';
        }
      }
    }

    console.log('✅ UI updated successfully');
  }

  /**
   * Update UI after logout
   */
  function updateUIAfterLogout() {
    console.log('👋 Updating UI for logged out state');

    // Show login button
    const topLoginBtn = document.getElementById('topLoginBtn');
    if (topLoginBtn) {
      topLoginBtn.style.display = 'block';
    }

    // Hide profile display
    const profileDisplay = document.getElementById('userProfileDisplay');
    if (profileDisplay) {
      profileDisplay.style.display = 'none';
    }
  }

  /**
   * Show login modal
   */
  function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'flex';
      console.log('📝 Login modal shown');
    }
  }

  /**
   * Hide login modal
   */
  function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'none';
      console.log('✅ Login modal hidden');
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  /**
   * Listen for successful login from SharedAuth
   */
  window.addEventListener('sharedAuthLogin', (event) => {
    const user = event.detail;
    console.log('📨 Received login event:', user.email);
    updateUIAfterLogin(user);
  });

  /**
   * Listen for logout from SharedAuth
   */
  window.addEventListener('sharedAuthLogout', () => {
    console.log('📨 Received logout event');
    updateUIAfterLogout();
  });

  /**
   * Top login button click handler
   */
  document.addEventListener('DOMContentLoaded', () => {
    const topLoginBtn = document.getElementById('topLoginBtn');
    if (topLoginBtn) {
      topLoginBtn.addEventListener('click', () => {
        console.log('🔘 Top login button clicked');
        showLoginModal();
      });
    }

    // Close modal button
    const closeLoginBtn = document.getElementById('closeLogin');
    if (closeLoginBtn) {
      closeLoginBtn.addEventListener('click', () => {
        hideLoginModal();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.sharedAuth) {
          window.sharedAuth.logout();
          window.location.reload();
        }
      });
    }

    // Check initial login state
    checkInitialLoginState();
  });

  /**
   * Check if user is already logged in on page load
   */
  async function checkInitialLoginState() {
    if (!window.sharedAuth) {
      console.log('⏳ Waiting for SharedAuth...');
      setTimeout(checkInitialLoginState, 100);
      return;
    }

    console.log('🔍 Checking initial login state...');
    
    const isInitialized = await window.sharedAuth.init();
    
    if (isInitialized && window.sharedAuth.isLoggedIn()) {
      const user = window.sharedAuth.getUser();
      console.log('✅ User already logged in:', user.email);
      updateUIAfterLogin(user);
    } else {
      console.log('❌ User not logged in');
      updateUIAfterLogout();
    }
  }

  // ========================================
  // LOGIN REQUIREMENT FOR SLOTS
  // ========================================

  /**
   * Require login before opening slot modal
   */
  window.requireLoginForSlot = function(openModalCallback) {
    if (!window.sharedAuth || !window.sharedAuth.isLoggedIn()) {
      console.log('🔒 Login required for this action');
      
      // Show notification
      showNotification('Please login to create builds', 'info');
      
      // Show login modal
      showLoginModal();
      
      // Store callback to execute after login
      window._pendingSlotAction = openModalCallback;
      
      return false;
    }
    
    // User is logged in, proceed
    openModalCallback();
    return true;
  };

  /**
   * Execute pending slot action after login
   */
  window.addEventListener('sharedAuthLogin', () => {
    if (window._pendingSlotAction) {
      console.log('⚡ Executing pending slot action after login');
      setTimeout(() => {
        window._pendingSlotAction();
        window._pendingSlotAction = null;
      }, 500);
    }
  });

  /**
   * Show notification helper
   */
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `build-notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10001;
      padding: 15px 25px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: bold;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Add animation styles
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  console.log('✅ Login checker ready');
})();

