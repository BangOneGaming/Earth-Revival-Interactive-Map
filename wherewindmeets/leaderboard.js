// === Leaderboard Functions ===

const EXCLUDED_USER = "AshOne"; // Username yang dikecualikan

// Initialize leaderboard on page load
document.addEventListener("DOMContentLoaded", function() {
  const panel = document.getElementById("leaderboardPanel");
  
  // Auto-hide di mobile, visible di desktop
  if (window.innerWidth <= 768) {
    panel.classList.add("hidden");
  } else {
    // Desktop: load data langsung
    loadLeaderboardData();
  }
  
  // Handle window resize
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
    
    // Mark as manually opened for mobile
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("manually-opened");
      loadLeaderboardData();
    } else {
      panel.classList.remove("manually-opened");
    }
  }
}

// Load leaderboard data dari feedback
async function loadLeaderboardData() {
  const contentEl = document.getElementById("leaderboardContent");
  const totalContributorsEl = document.getElementById("totalContributors");
  const totalFeedbacksEl = document.getElementById("totalFeedbacks");
  
  if (!contentEl) return;
  
  try {
    // Show loading
    contentEl.innerHTML = '<div class="leaderboard-loading"><span>⏳ Loading contributors...</span></div>';
    
    // Fetch data dari server
    const response = await fetch(FEEDBACK_USER_ENDPOINT, {
      method: "GET"
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch leaderboard data");
    }
    
    const feedbackData = await response.json();
    
    // Hitung kontribusi per user
    const userContributions = {};
    
    Object.keys(feedbackData).forEach(key => {
      const feedback = feedbackData[key];
      const username = feedback.ys_id || "Anonymous";
      
      // Skip excluded user (AshOne)
      if (username === EXCLUDED_USER) return;
      
      if (!userContributions[username]) {
        userContributions[username] = 0;
      }
      userContributions[username]++;
    });
    
    // Convert ke array dan sort berdasarkan jumlah kontribusi
    const sortedUsers = Object.entries(userContributions)
      .sort((a, b) => b[1] - a[1]) // Sort descending
      .slice(0, 50); // Ambil top 50
    
    // Update stats
    const totalContributors = sortedUsers.length;
    const totalFeedbacks = sortedUsers.reduce((sum, [_, count]) => sum + count, 0);
    
    if (totalContributorsEl) totalContributorsEl.textContent = totalContributors;
    if (totalFeedbacksEl) totalFeedbacksEl.textContent = totalFeedbacks;
    
    // Render leaderboard
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
    
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    contentEl.innerHTML = `
      <div class="leaderboard-loading">
        <span style="color: #ff6b6b;">❌ Failed to load leaderboard</span>
      </div>
    `;
  }
}

// Helper function untuk escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-reload leaderboard setiap 5 menit jika panel terbuka
setInterval(() => {
  const panel = document.getElementById("leaderboardPanel");
  if (panel && !panel.classList.contains("hidden")) {
    loadLeaderboardData();
  }
}, 5 * 60 * 1000);

// Optional: Reload leaderboard setelah user save feedback
if (window.saveFeedbackUser) {
  const originalSaveFeedbackUser = window.saveFeedbackUser;
  window.saveFeedbackUser = async function(...args) {
    const result = await originalSaveFeedbackUser.apply(this, args);
    
    // Reload leaderboard jika panel terbuka
    const panel = document.getElementById("leaderboardPanel");
    if (panel && !panel.classList.contains("hidden")) {
      setTimeout(() => loadLeaderboardData(), 1000);
    }
    
    return result;
  };
} else {
  console.warn("⚠️ saveFeedbackUser is not defined yet, leaderboard reload wrapper skipped");
}