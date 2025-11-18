let currentUser = null;

// Endpoint untuk menyimpan/mengambil profil user
const USER_PROFILE_ENDPOINT = "https://autumn-dream-8c07.square-spon.workers.dev/userprofile";

// Data senjata Where Winds Meet dengan variants dan gambar
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

window.handleGoogleLogin = async function (response) {
  const credential = response.credential;
  const payload = decodeJwt(credential);

  currentUser = {
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    token: credential
  };

  localStorage.setItem("userToken", credential);
  console.log("✅ User logged in:", currentUser);
  showLoadingState();

  const profileData = await checkUserProfile();

  // Cek jika profil kosong atau field tidak lengkap
  const needsProfileUpdate = !profileData || 
    !profileData.class || 
    !profileData.inGameName;

  if (needsProfileUpdate) {
    console.log("⚠️ Profile incomplete - needs completion");
    showNotification("Please complete your profile", "info");
    showProfileForm(profileData);
    return;
  }

  // Parse class (weaponVariant) untuk mendapatkan weaponType dan role
  const weaponVariant = profileData.class;
  let weaponType = null;
  let role = null;

  // Cari weaponType dan role dari weaponVariant
  for (const [wType, wData] of Object.entries(WWM_WEAPONS)) {
    if (wData.variants[weaponVariant]) {
      weaponType = wType;
      role = wData.variants[weaponVariant].role;
      break;
    }
  }

  // ✅ VALIDASI TAMBAHAN: Cek apakah weapon variant valid
  if (!weaponType || !role) {
    console.log("⚠️ Invalid weapon variant detected (old data format):", weaponVariant);
    showNotification("Please update your profile to new weapon system", "info");
    showProfileForm(profileData);
    return;
  }

  // Profile valid - update currentUser
  currentUser.gameProfile = {
    inGameName: profileData.inGameName,
    weaponType: weaponType,
    weaponVariant: weaponVariant,
    role: role
  };

  console.log("✅ Profile loaded successfully:", currentUser.gameProfile);

  hideLoginPopup();
  updateTopLoginVisibility();
  
  // Tampilkan gambar senjata untuk welcome back
  showWeaponDisplay(weaponType, weaponVariant, profileData.inGameName, role);

  // Load visited markers dari server
  if (typeof loadVisitedMarkersFromServer === 'function') {
    await loadVisitedMarkersFromServer();
  }

  // Create profile container after everything loaded
  setTimeout(() => {
    if (typeof ProfileContainer !== 'undefined') {
      ProfileContainer.create({ showTotal: true });
    }
  }, 500);
};

function decodeJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

async function checkUserProfile() {
  try {
    const res = await fetch(USER_PROFILE_ENDPOINT, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${currentUser.token}`
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
    console.error("Error checking user profile:", err);
    return null;
  }
}

function showLoadingState() {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 15px; color: #666;">Loading your profile...</p>
      </div>
    `;
  }
}

function showWeaponDisplay(weaponType, weaponVariant, inGameName, role) {
  const weaponData = WWM_WEAPONS[weaponType];
  if (!weaponData) return;

  const modal = document.getElementById("loginModal");
  if (!modal) return;

  const loginContent = document.getElementById("loginContent");
  if (loginContent) {
    loginContent.style.background = "transparent";
    loginContent.style.boxShadow = "none";
    
    loginContent.innerHTML = `
      <button id="closeWeaponDisplay" style="position: absolute; top: 10px; right: 10px; font-size: 24px; background: none; border: none; cursor: pointer; color: #666; z-index: 10;">&times;</button>
      
      <div style="text-align: center; padding: 30px; background: linear-gradient(145deg, #F3E5AB 0%, #ffffff 100%); border-radius: 12px; box-shadow: 0 4px 20px rgba(243, 229, 171, 0.6);">
        <h2 style="color: #333; margin-bottom: 25px; font-size: 24px;">Welcome, ${inGameName}!</h2>
        
        <!-- Weapon Info Box dengan Background Gelap -->
        <div style="background: linear-gradient(145deg, #1a1a1a, #2d2d2d); padding: 30px; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); position: relative; overflow: hidden; min-height: 400px;">
          
          <!-- Title Image sebagai Background dengan opacity -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; opacity: 0.15; z-index: 0;">
            <img src="${weaponData.title}" alt="${weaponType} Title" 
                 style="max-width: 90%; max-height: 90%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(243, 229, 171, 0.5));" 
                 onload="console.log('✅ Title loaded:', this.src)"
                 onerror="console.error('❌ Failed to load title:', this.src); this.parentElement.style.display='none';" />
          </div>
          
          <!-- Weapon Image di depan -->
          <div style="position: relative; z-index: 1; margin-bottom: 25px;">
            <img src="${weaponData.image}" alt="${weaponType}" 
                 style="max-width: 250px; height: auto; margin: 0 auto; display: block; filter: drop-shadow(0 8px 16px rgba(243, 229, 171, 0.7));" 
                 onload="console.log('✅ Weapon image loaded:', this.src)"
                 onerror="console.error('❌ Failed to load weapon:', this.src); this.style.display='none';" />
          </div>
          
          <!-- Role & Description Info -->
          <div style="position: relative; z-index: 1; background: rgba(243, 229, 171, 0.1); border: 2px solid rgba(243, 229, 171, 0.3); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px);">
            <p style="margin: 10px 0; font-size: 17px; color: #F3E5AB;"><strong style="color: #fff;">Weapon Variant:</strong> ${weaponVariant}</p>
            <p style="margin: 10px 0; font-size: 17px; color: #F3E5AB;"><strong style="color: #fff;">Role:</strong> <span style="color: #4CAF50; font-weight: bold; text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);">${role}</span></p>
          </div>
        </div>
        
        <button onclick="closeWeaponDisplayModal()" 
                style="margin-top: 30px; padding: 14px 40px; background: linear-gradient(145deg, #4CAF50, #45a049); color: white; border: none; border-radius: 10px; font-size: 17px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4); transition: all 0.3s ease;">
          Go To Map
        </button>
      </div>
    `;

    modal.style.display = "flex";

    document.getElementById("closeWeaponDisplay")?.addEventListener("click", closeWeaponDisplayModal);
    
    const startBtn = loginContent.querySelector('button[onclick="closeWeaponDisplayModal()"]');
    if (startBtn) {
      startBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.6)';
      });
      startBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
      });
    }
  }
}

window.closeWeaponDisplayModal = function() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "none";
  }
  
  // Show profile container when closing welcome screen
  if (isLoggedIn() && currentUser?.gameProfile) {
    setTimeout(() => {
      if (typeof ProfileContainer !== 'undefined') {
        ProfileContainer.create({ showTotal: true });
      }
    }, 300);
  }
};

function showProfileForm(existingProfile = null) {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    const weaponTypeOptions = Object.keys(WWM_WEAPONS)
      .map(weapon => `<option value="${weapon}">${weapon}</option>`)
      .join('');

    const defaultName = existingProfile?.inGameName || '';

    loginOverlay.innerHTML = `
      <div style="text-align: center; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin-bottom: 20px; color: #333;">Complete Your Profile</h3>
        ${existingProfile?.class ? '<p style="color: #4CAF50; margin-bottom: 15px; font-size: 14px;">✨ Update to new weapon system</p>' : ''}
        <form id="profileForm" style="display: flex; flex-direction: column; gap: 15px;">
          <div style="text-align: left;">
            <label for="inGameName" style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
              In-Game Name:
            </label>
            <input 
              type="text" 
              id="inGameName" 
              required 
              placeholder="Enter your IGN"
              value="${defaultName}"
              style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;"
            />
          </div>
          
          <div style="text-align: left;">
            <label for="weaponType" style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
              Weapon Type:
            </label>
            <select 
              id="weaponType" 
              required
              style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; background: white;"
            >
              <option value="">-- Select Weapon Type --</option>
              ${weaponTypeOptions}
            </select>
          </div>

          <div id="variantContainer" style="text-align: left; display: none;">
            <label for="weaponVariant" style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
              Weapon Variant:
            </label>
            <select 
              id="weaponVariant" 
              required
              style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; background: white;"
            >
              <option value="">-- Select Variant --</option>
            </select>
          </div>

          <!-- Weapon Preview Box -->
          <div id="weaponPreview" style="display: none; background: linear-gradient(145deg, #1a1a1a, #2d2d2d); padding: 20px; border-radius: 10px; margin-top: 10px; position: relative; min-height: 200px; overflow: hidden;">
            <!-- Title sebagai background -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; opacity: 0.2; z-index: 0;">
              <img id="previewTitle" src="" alt="Weapon Title" 
                   style="max-width: 80%; max-height: 80%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(243, 229, 171, 0.3));" />
            </div>
            
            <!-- Weapon image di kanan -->
            <div style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); z-index: 1;">
              <img id="previewImage" src="" alt="Weapon" 
                   style="max-width: 100px; height: auto; filter: drop-shadow(0 4px 8px rgba(243, 229, 171, 0.6));" />
            </div>
            
            <!-- Info di kiri -->
            <div style="position: relative; z-index: 2; text-align: left; max-width: 60%; padding-right: 120px;">
              <p style="margin: 8px 0; font-size: 14px; color: #F3E5AB;"><strong style="color: #fff;">Variant:</strong> <span id="previewVariant"></span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #F3E5AB;"><strong style="color: #fff;">Role:</strong> <span id="previewRole" style="color: #4CAF50; font-weight: bold;"></span></p>
              <p style="margin: 8px 0; font-size: 13px; color: #ccc; line-height: 1.4;"><span id="previewDesc"></span></p>
            </div>
          </div>
          
          <button 
            type="submit"
            style="padding: 12px; background: linear-gradient(145deg, #4CAF50, #45a049); color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
          >
            Save Profile
          </button>
        </form>
      </div>
    `;
    
    document.getElementById("weaponType").addEventListener("change", (e) => {
      const weaponType = e.target.value;
      const variantContainer = document.getElementById("variantContainer");
      const variantSelect = document.getElementById("weaponVariant");
      const previewBox = document.getElementById("weaponPreview");
      
      if (weaponType && WWM_WEAPONS[weaponType]) {
        const variants = WWM_WEAPONS[weaponType].variants;
        
        variantSelect.innerHTML = '<option value="">-- Select Variant --</option>' +
          Object.keys(variants).map(variant => 
            `<option value="${variant}">${variant}</option>`
          ).join('');
        
        variantContainer.style.display = "block";
        previewBox.style.display = "none";
        variantSelect.value = "";
      } else {
        variantContainer.style.display = "none";
        previewBox.style.display = "none";
      }
    });
    
    document.getElementById("weaponVariant").addEventListener("change", (e) => {
      const weaponType = document.getElementById("weaponType").value;
      const variant = e.target.value;
      const previewBox = document.getElementById("weaponPreview");
      
      if (weaponType && variant && WWM_WEAPONS[weaponType]?.variants[variant]) {
        const weaponData = WWM_WEAPONS[weaponType];
        const variantData = weaponData.variants[variant];
        
        document.getElementById("previewTitle").src = weaponData.title;
        document.getElementById("previewImage").src = weaponData.image;
        document.getElementById("previewVariant").textContent = variant;
        document.getElementById("previewRole").textContent = variantData.role;
        document.getElementById("previewDesc").textContent = variantData.description;
        
        previewBox.style.display = "block";
      } else {
        previewBox.style.display = "none";
      }
    });
    
    document.getElementById("profileForm").addEventListener("submit", handleProfileSubmit);
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const inGameName = document.getElementById("inGameName").value.trim();
  const weaponType = document.getElementById("weaponType").value;
  const weaponVariant = document.getElementById("weaponVariant").value;
  
  if (!inGameName || !weaponType || !weaponVariant) {
    showNotification("Please fill in all fields", "error");
    return;
  }
  
  const weaponData = WWM_WEAPONS[weaponType]?.variants[weaponVariant];
  if (!weaponData) {
    showNotification("Invalid weapon selection", "error");
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  
  try {
    const payload = {
      inGameName: inGameName,
      class: weaponVariant
    };
    
    console.log("🔄 Sending profile to:", USER_PROFILE_ENDPOINT);
    console.log("📦 Payload:", payload);
    
    const res = await fetch(USER_PROFILE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await res.text();
    
    if (!res.ok) {
      throw new Error(`Failed to save profile (${res.status}): ${responseText}`);
    }
    
    console.log("✅ Profile saved successfully");
    
    currentUser.gameProfile = {
      inGameName: inGameName,
      weaponType: weaponType,
      weaponVariant: weaponVariant,
      role: weaponData.role
    };
    
    updateTopLoginVisibility();
    showWeaponDisplay(weaponType, weaponVariant, inGameName, weaponData.role);
    
    // Create profile container after saving
    setTimeout(() => {
      if (typeof ProfileContainer !== 'undefined') {
        ProfileContainer.create({ showTotal: true });
      }
    }, 500);
    
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    showNotification(`Failed to save profile: ${err.message}`, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Profile";
  }
}

window.isLoggedIn = function() {
  return currentUser !== null;
};

window.getUserToken = function() {
  return currentUser ? currentUser.token : null;
};

window.getUserProfile = function() {
  return currentUser ? currentUser.gameProfile : null;
};

window.requireLogin = function(callback) {
  if (!isLoggedIn()) {
    showLoginPopup();
  } else {
    callback();
  }
};

function hideLoginPopup() {
  document.getElementById("loginModal").style.display = "none";
}

document.getElementById("closeLogin")?.addEventListener("click", hideLoginPopup);

window.showLoginFromConsole = function() {
  showLoginPopup();
};

document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("topLoginBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      showLoginPopup();
    });
  }

  const savedToken = localStorage.getItem("userToken");
  if (savedToken) {
    try {
      const payload = decodeJwt(savedToken);
      currentUser = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        token: savedToken
      };

      console.log("🔄 Found saved login, checking profile...");
      const profileData = await checkUserProfile();

      // Cek jika profil kosong atau field tidak lengkap
      const needsProfileUpdate = !profileData || 
        !profileData.class || 
        !profileData.inGameName;

      if (needsProfileUpdate) {
        console.log("⚠️ Profile incomplete - needs completion");
        showLoginPopup();
        showNotification("Please complete your profile", "info");
        showProfileForm(profileData);
      } else {
        // Parse class untuk mendapatkan weaponType dan role
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

        // ✅ VALIDASI TAMBAHAN: Cek apakah weapon variant valid
        if (!weaponType || !role) {
          console.log("⚠️ Invalid weapon variant detected (old data format):", weaponVariant);
          showLoginPopup();
          showNotification("Please update your profile to new weapon system", "info");
          showProfileForm(profileData);
        } else {
          // Profile valid
          currentUser.gameProfile = {
            inGameName: profileData.inGameName,
            weaponType: weaponType,
            weaponVariant: weaponVariant,
            role: role
          };
          console.log("✅ Profile loaded successfully:", currentUser.gameProfile);
        }
      }
    } catch (err) {
      console.error("❌ Error loading saved session:", err);
      localStorage.removeItem("userToken");
    }
  }

  updateTopLoginVisibility();
  
  // Show profile container if user is logged in
  if (isLoggedIn() && currentUser?.gameProfile) {
    setTimeout(() => {
      if (typeof ProfileContainer !== 'undefined') {
        ProfileContainer.create({ showTotal: true });
      }
    }, 1000);
  }
});

function showLoginPopup() {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.innerHTML = `
      <div class="g_id_signin"
           data-type="standard"
           data-size="large"
           data-theme="outline"
           data-text="sign_in_with"
           data-shape="rectangular"
           data-logo_alignment="left">
      </div>
    `;
  }
  
  if (window.google && window.google.accounts) {
    window.google.accounts.id.renderButton(
      loginOverlay.querySelector('.g_id_signin'),
      { 
        type: 'standard',
        size: 'large',
        theme: 'outline',
        text: 'sign_in_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
  }
  
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function updateTopLoginVisibility() {
  const btn = document.getElementById("topLoginBtn");
  if (!btn) return;

  if (isLoggedIn()) {
    btn.style.display = "none";
  } else {
    btn.style.display = "block";
  }
}

window.WWM_WEAPONS = WWM_WEAPONS;