// shared-auth.js
// Module untuk share authentication state antar halaman

const AUTH_CONFIG = {
  CLIENT_ID: "712617149675-2rufcnh8bdq0oo35812no2cgivm81pqp.apps.googleusercontent.com",
  USER_PROFILE_ENDPOINT: "https://autumn-dream-8c07.square-spon.workers.dev/userprofile",
  STORAGE_KEY: "userToken"
};

const WWM_WEAPONS = {
  "Sword": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/sword.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_sword.png",
    variants: {
      "Nameless Sword": { role: "Melee DPS", description: "Balanced sword combat" },
      "Strategic Sword": { role: "Melee DPS", description: "Bleed and DOT specialist" }
    }
  },
  "Spear": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/spear.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_spear.png",
    variants: {
      "Nameless Spear": { role: "Melee DPS", description: "Standard spear techniques" },
      "Heavenquaker Spear": { role: "Melee DPS", description: "Offensive spear variant" },
      "Stormbreaker Spear": { role: "Tank", description: "Defensive spear variant" }
    }
  },
  "Twin Blades": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/twin_blades.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_twin_blades.png",
    variants: {
      "Infernal Twin Blades": { role: "Melee DPS", description: "Fast dual-wielding attacks" }
    }
  },
  "Mo Blade": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/glaive.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_glaive.png",
    variants: {
      "Thundercry Blade": { role: "Tank", description: "Heavy defensive blade" }
    }
  },
  "Fan": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/fan.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_fan.png",
    variants: {
      "Panacea Fan": { role: "Healer", description: "Healing and support specialist" },
      "Inkwell Fan": { role: "Ranged DPS", description: "Ranged magical attacks" },
      "Soulshade Fan": { role: "Support", description: "Crowd control and utility" }
    }
  },
  "Umbrella": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/umbrella.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_umbrella.png",
    variants: {
      "Vernal Umbrella": { role: "Support", description: "Support and healing hybrid" },
      "Soulshade Umbrella": { role: "Melee DPS", description: "Offensive umbrella techniques" },
      "Combat Umbrella": { role: "Support", description: "Defensive support style" }
    }
  },
  "Rope Dart": {
    image: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/rope_dart.png",
    title: "https://ik.imagekit.io/k3lv5clxs/wherewindmeet/Simbol/weapon/tittle_rope_dart.png",
    variants: {
      "Mortal Rope Dart": { role: "Melee DPS", description: "Mid-range utility fighter" }
    }
  }
};

class SharedAuth {
  constructor() {
    this.currentUser = null;
    this.callbacks = [];
    this.loginInProgress = false;
  }

  // Decode JWT token
  decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  // Get user profile from server
  async getUserProfile(token) {
    try {
      const res = await fetch(AUTH_CONFIG.USER_PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.inGameName) {
          return data;
        }
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }

  // Parse weapon data from profile
  parseWeaponData(profileData) {
    const weaponVariant = profileData.class;
    let weaponType = null;
    let role = null;

    for (const [wType, wData] of Object.entries(WWM_WEAPONS)) {
      if (wData.variants[weaponVariant]) {
        weaponType = wType;
        role = wData.variants[weaponVariant].role;
        break;
      }
    }

    return { weaponType, weaponVariant, role };
  }

  // Initialize from localStorage
  async init() {
    const savedToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    
    if (!savedToken) {
      console.log("❌ No saved token found");
      return false;
    }

    try {
      const payload = this.decodeJwt(savedToken);
      
      this.currentUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: savedToken
      };

      console.log("🔄 Loading profile for:", this.currentUser.name);
      
      const profileData = await this.getUserProfile(savedToken);
      
      if (!profileData || !profileData.class || !profileData.inGameName) {
        console.log("⚠️ Profile incomplete");
        this.currentUser.gameProfile = {
          incomplete: true
        };
        return true;
      }

      const { weaponType, weaponVariant, role } = this.parseWeaponData(profileData);

      if (!weaponType || !role) {
        console.log("⚠️ Invalid weapon data");
        this.currentUser.gameProfile = {
          incomplete: true
        };
        return true;
      }

      this.currentUser.gameProfile = {
        inGameName: profileData.inGameName,
        weaponType: weaponType,
        weaponVariant: weaponVariant,
        role: role
      };

      console.log("✅ Profile loaded:", this.currentUser.gameProfile);
      this.notifyCallbacks();
      return true;

    } catch (err) {
      console.error("❌ Error initializing auth:", err);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
      return false;
    }
  }

  // Handle Google Login - CRITICAL: Must be async
  async handleGoogleLogin(credential) {
    if (this.loginInProgress) {
      console.log("⏳ Login already in progress...");
      return;
    }

    this.loginInProgress = true;
    console.log("🔐 Processing Google login...");

    try {
      const payload = this.decodeJwt(credential);
      
      this.currentUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: credential
      };

      localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, credential);
      console.log("✅ Token saved for:", this.currentUser.email);

      // Get user profile
      const profileData = await this.getUserProfile(credential);
      
      if (!profileData || !profileData.class || !profileData.inGameName) {
        console.log("⚠️ Profile incomplete - needs setup");
        this.currentUser.gameProfile = {
          incomplete: true
        };
      } else {
        const { weaponType, weaponVariant, role } = this.parseWeaponData(profileData);

        if (!weaponType || !role) {
          console.log("⚠️ Invalid weapon data");
          this.currentUser.gameProfile = {
            incomplete: true
          };
        } else {
          this.currentUser.gameProfile = {
            inGameName: profileData.inGameName,
            weaponType: weaponType,
            weaponVariant: weaponVariant,
            role: role
          };
          console.log("✅ Full profile loaded:", this.currentUser.gameProfile);
        }
      }

      this.notifyCallbacks();
      
      // Trigger custom event for other modules
      window.dispatchEvent(new CustomEvent('sharedAuthLogin', { 
        detail: this.currentUser 
      }));

      return true;

    } catch (err) {
      console.error("❌ Login failed:", err);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
      this.currentUser = null;
      return false;
    } finally {
      this.loginInProgress = false;
    }
  }

  // Register callback for auth state changes
  onAuthChange(callback) {
    this.callbacks.push(callback);
  }

  // Notify all callbacks
  notifyCallbacks() {
    this.callbacks.forEach(cb => cb(this.currentUser));
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getUser() {
    return this.currentUser;
  }

  // Get user token
  getToken() {
    return this.currentUser ? this.currentUser.token : null;
  }

  // Get user profile
  getProfile() {
    return this.currentUser ? this.currentUser.gameProfile : null;
  }

  // Logout
  logout() {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
    this.currentUser = null;
    this.notifyCallbacks();
    console.log("✅ User logged out");
    
    // Trigger logout event
    window.dispatchEvent(new Event('sharedAuthLogout'));
  }

  // Redirect to login page
  redirectToLogin() {
    window.location.href = '/wherewindmeets/';
  }
}

// Create global instance
window.sharedAuth = new SharedAuth();
window.WWM_WEAPONS = WWM_WEAPONS;

// ✅ CRITICAL: Define global callback for Google Sign-In
window.handleGoogleLogin = function(response) {
  console.log("📞 Global handleGoogleLogin called");
  
  if (response && response.credential) {
    window.sharedAuth.handleGoogleLogin(response.credential);
  } else {
    console.error("❌ Invalid Google response:", response);
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedAuth;
}

console.log("✅ Shared Auth loaded - handleGoogleLogin is ready");