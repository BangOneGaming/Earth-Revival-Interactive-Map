let currentUser = null;

// Endpoint untuk menyimpan/mengambil profil user
const USER_PROFILE_ENDPOINT = "https://autumn-dream-8c07.square-spon.workers.dev/userprofile";



window.handleGoogleLogin = async function (response) {
  const credential = response.credential;
  const payload = decodeJwt(credential);
  
  currentUser = {
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    token: credential
  };

  // Simpan token di localStorage supaya tetap login
  localStorage.setItem("userToken", credential);

  console.log("✅ User logged in:", currentUser);
  
  showLoadingState();
  
  const hasProfile = await checkUserProfile();
  
  if (!hasProfile) {
    showProfileForm();
  } else {
    hideLoginPopup();
    showNotification(`Welcome back, ${currentUser.gameProfile.inGameName}!`, "success");
  }
};

// Decode token helper
function decodeJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// Cek apakah user sudah punya profil
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
      if (data && data.inGameName && data.class) {
        currentUser.gameProfile = {
          inGameName: data.inGameName,
          class: data.class
        };
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Error checking user profile:", err);
    return false;
  }
}

// Tampilkan loading state
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

// Tampilkan form profil
function showProfileForm() {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.innerHTML = `
      <div style="text-align: center;">
        <h3 style="margin-bottom: 20px; color: #333;">Complete Your Profile</h3>
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
              style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;"
            />
          </div>
          
          <div style="text-align: left;">
            <label for="userClass" style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
              Class:
            </label>
            <select 
              id="userClass" 
              required
              style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; background: white;"
            >
              <option value="">-- Select Class --</option>
              <option value="Warrior">Warrior</option>
              <option value="Mage">Mage</option>
              <option value="Archer">Archer</option>
              <option value="Assassin">Assassin</option>
              <option value="Healer">Healer</option>
              <option value="Tank">Tank</option>
            </select>
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
    
    // Handle form submit
    document.getElementById("profileForm").addEventListener("submit", handleProfileSubmit);
  }
}

// Handle submit profil
async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const inGameName = document.getElementById("inGameName").value.trim();
  const userClass = document.getElementById("userClass").value;
  
  if (!inGameName || !userClass) {
    showNotification("Please fill in all fields", "error");
    return;
  }
  
  // Tampilkan loading
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  
  try {
    console.log("🔄 Sending profile to:", USER_PROFILE_ENDPOINT);
    console.log("📦 Payload:", { inGameName, class: userClass });
    console.log("🔑 Token:", currentUser.token.substring(0, 50) + "...");
    
    // Simpan profil ke server
    const res = await fetch(USER_PROFILE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.token}`
      },
      body: JSON.stringify({
        inGameName: inGameName,
        class: userClass
      })
    });
    
    console.log("📡 Response status:", res.status);
    
    // Ambil response text untuk debug
    const responseText = await res.text();
    console.log("📄 Response body:", responseText);
    
    if (!res.ok) {
      throw new Error(`Failed to save profile (${res.status}): ${responseText}`);
    }
    
    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("⚠️ Response is not JSON:", responseText);
      responseData = {};
    }
    
    console.log("✅ Profile saved successfully:", responseData);
    
    // Update currentUser
    currentUser.gameProfile = {
      inGameName: inGameName,
      class: userClass
    };
    
    // Close modal dan welcome
    hideLoginPopup();
    showNotification(`Welcome, ${inGameName}!`, "success");
    
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

document.getElementById("closeLogin").addEventListener("click", hideLoginPopup);

// Contoh trigger dari console
window.showLoginFromConsole = function() {
  console.log("Login popup triggered");
  showLoginPopup();
};

function showLoginPopup() {
  // Reset tampilan ke tombol Google
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
  
  // Render ulang tombol Google
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
  
  // Tampilkan overlay
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "flex";
  } else {
    alert("Please sign in with Google to continue editing markers.");
  }
}