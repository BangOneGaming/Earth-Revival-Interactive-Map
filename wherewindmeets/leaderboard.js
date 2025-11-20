// === Leaderboard Functions (Cache TTL) ===

const EXCLUDED_USER = "AshOne";
let cachedLeaderboardData = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 menit cache

// Initialize leaderboard on page load
document.addEventListener("DOMContentLoaded", function() {
  const panel = document.getElementById("leaderboardPanel");
  
  if (window.innerWidth <= 768) {
    panel.classList.add("hidden");
  } else {
    loadLeaderboardData();
  }
  
  window.addEventListener("resize", function() {
    if (window.innerWidth <= 768) {
      if (!panel.classList.contains("manually-opened")) {
        panel.classList.add("hidden");
      }
    } else {
      panel.classList.remove("hidden");
      panel.classList.remove("manually-opened");
    }
  });
});

// Toggle leaderboard panel
function toggleLeaderboard() {
  const panel = document.getElementById("leaderboardPanel");
  if (panel) {
    panel.classList.toggle("hidden");
    
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("manually-opened");
      loadLeaderboardData();
    } else {
      panel.classList.remove("manually-opened");
    }
  }
}

// Render leaderboard dari cache
function renderLeaderboard(sortedUsers) {
  const contentEl = document.getElementById("leaderboardContent");
  const totalContributorsEl = document.getElementById("totalContributors");
  const totalFeedbacksEl = document.getElementById("totalFeedbacks");
  
  if (!contentEl) return;
  
  const totalContributors = sortedUsers.length;
  const totalFeedbacks = sortedUsers.reduce((sum, [_, count]) => sum + count, 0);
  
  if (totalContributorsEl) totalContributorsEl.textContent = totalContributors;
  if (totalFeedbacksEl) totalFeedbacksEl.textContent = totalFeedbacks;
  
  if (sortedUsers.length === 0) {
    contentEl.innerHTML = `
      <div class="leaderboard-loading">
        <span>No contributors yet</span>
      </div>
    `;
    return;
  }
  
  let html = '';
  sortedUsers.forEach(([username, count], index) => {
    const rank = index + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    
    html += `
      <div class="leaderboard-item">
        <div class="leaderboard-rank">${rankEmoji}</div>
        <div class="leaderboard-user">
          <div class="leaderboard-username">${escapeHtml(username)}</div>
          <div class="leaderboard-contribution">${count} contribution${count > 1 ? 's' : ''}</div>
        </div>
        <div class="leaderboard-count">${count}</div>
      </div>
    `;
  });
  
  contentEl.innerHTML = html;
}

// Load leaderboard data dengan Cache TTL
async function loadLeaderboardData(forceRefresh = false) {
  const contentEl = document.getElementById("leaderboardContent");
  
  if (!contentEl) return;
  
  const now = Date.now();
  const cacheAge = now - lastFetchTime;
  
  // Gunakan cache jika masih valid dan tidak force refresh
  if (!forceRefresh && cachedLeaderboardData && cacheAge < CACHE_TTL) {
    const remainingTime = Math.round((CACHE_TTL - cacheAge) / 1000);
    console.log(`📊 Leaderboard: Using cache, refresh in ${remainingTime}s`);
    renderLeaderboard(cachedLeaderboardData);
    return;
  }
  
  try {
    // Tampilkan loading hanya jika belum ada cache
    if (!cachedLeaderboardData) {
      contentEl.innerHTML = '<div class="leaderboard-loading"><span>⏳ Loading contributors...</span></div>';
    }
    
    console.log("📊 Leaderboard: Fetching fresh data...");
    const response = await fetch(FEEDBACK_USER_ENDPOINT, { method: "GET" });
    
    if (!response.ok) {
      throw new Error("Failed to fetch leaderboard data");
    }
    
    const feedbackData = await response.json();
    
    // Update waktu fetch terakhir
    lastFetchTime = Date.now();
    
    // Proses data kontribusi
    const userContributions = {};
    
    Object.keys(feedbackData).forEach(key => {
      const feedback = feedbackData[key];
      const username = feedback.ys_id || "Anonymous";
      
      if (username === EXCLUDED_USER) return;
      
      if (!userContributions[username]) {
        userContributions[username] = 0;
      }
      userContributions[username]++;
    });
    
    const sortedUsers = Object.entries(userContributions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    
    // Simpan ke cache
    cachedLeaderboardData = sortedUsers;
    
    // Render
    renderLeaderboard(sortedUsers);
    
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    
    // Fallback ke cache jika ada
    if (cachedLeaderboardData && cachedLeaderboardData.length > 0) {
      console.log("📊 Leaderboard: Error occurred, using cached data");
      renderLeaderboard(cachedLeaderboardData);
      return;
    }
    
    contentEl.innerHTML = `
      <div class="leaderboard-loading">
        <span style="color: #ff6b6b;">❌ Failed to load leaderboard</span>
      </div>
    `;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-check setiap 5 menit (tapi hanya fetch jika cache expired)
setInterval(() => {
  const panel = document.getElementById("leaderboardPanel");
  if (panel && !panel.classList.contains("hidden")) {
    loadLeaderboardData(); // Akan skip jika cache masih valid
  }
}, 5 * 60 * 1000);

// Reload setelah user save feedback (force refresh)
if (window.saveFeedbackUser) {
  const originalSaveFeedbackUser = window.saveFeedbackUser;
  window.saveFeedbackUser = async function(...args) {
    const result = await originalSaveFeedbackUser.apply(this, args);
    
    const panel = document.getElementById("leaderboardPanel");
    if (panel && !panel.classList.contains("hidden")) {
      setTimeout(() => loadLeaderboardData(true), 1000);
    }
    
    return result;
  };
} else {
  console.warn("⚠️ saveFeedbackUser not defined, leaderboard reload wrapper skipped");
}