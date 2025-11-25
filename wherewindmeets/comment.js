// comments.js - Enhanced version with custom 429 error popup

const COMMENTS_ENDPOINT = "https://autumn-dream-8c07.square-spon.workers.dev/comments";
const MAX_COMMENT_LENGTH = 500;
let currentMarkerKey = null;

// Open comments modal
window.openCommentsModal = async function(markerKey) {
  currentMarkerKey = markerKey;
  const modal = document.getElementById('commentsModal');
  modal.style.display = 'flex';
  
  // Load comments
  await loadComments(markerKey);
  
  // Show comment form or login prompt
  renderCommentForm();
};

// Close comments modal
window.closeCommentsModal = function() {
  const modal = document.getElementById('commentsModal');
  modal.style.display = 'none';
  currentMarkerKey = null;
};

// Show 429 Error Popup
function show429ErrorPopup() {
  // Check if popup already exists
  let popup = document.getElementById('error429Popup');
  if (popup) {
    popup.remove();
  }
  
  // Create popup HTML
  const popupHTML = `
    <div id="error429Popup" class="error429-overlay">
      <div class="error429-popup">
        <button class="error429-close" onclick="close429Popup()">×</button>
        <div class="error429-content">
          <img src="sad.png" alt="Sad" class="error429-image" onerror="this.style.display='none'">
          <div class="error429-title">We're Sorry! 😔</div>
          <div class="error429-message">
            Our server is under limit.<br>
            You can comment next day.
          </div>
          <div class="error429-submessage">
            Thank you for your patience and understanding!
          </div>
          <button class="error429-ok-btn" onclick="close429Popup()">
            OK, I Understand
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.insertAdjacentHTML('beforeend', popupHTML);
  
  // Animate in
  setTimeout(() => {
    const popup = document.getElementById('error429Popup');
    if (popup) {
      popup.classList.add('show');
    }
  }, 10);
}

// Close 429 Error Popup
window.close429Popup = function() {
  const popup = document.getElementById('error429Popup');
  if (popup) {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 300);
  }
};

// Load comments from server
async function loadComments(markerKey) {
  const modalBody = document.getElementById('commentsModalBody');
  modalBody.innerHTML = '<div class="comments-loading">Loading comments...</div>';
  
  try {
    const response = await fetch(`${COMMENTS_ENDPOINT}/${markerKey}`, {
      method: 'GET'
    });
    
    // Handle 429 rate limit error
    if (response.status === 429) {
      show429ErrorPopup();
      modalBody.innerHTML = `
        <div class="comments-error">
          <div class="comments-error-icon">⚠️</div>
          <div class="comments-error-message">
            Comment system is temporarily unavailable.
          </div>
        </div>
      `;
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to load comments');
    }
    
    const data = await response.json();
    const comments = data.comments || [];
    
    if (comments.length === 0) {
      modalBody.innerHTML = '<div class="comments-empty">No comments yet. Be the first to comment!</div>';
      return;
    }
    
    // Render comments
    const commentsHTML = comments.map(comment => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">@${comment.author}</span>
          <span class="comment-time">${formatCommentTime(comment.timestamp)}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
      </div>
    `).join('');
    
    modalBody.innerHTML = commentsHTML;
    
    // Scroll to bottom
    modalBody.scrollTop = modalBody.scrollHeight;
    
  } catch (error) {
    console.error('Error loading comments:', error);
    modalBody.innerHTML = '<div class="comments-empty">Failed to load comments. Please try again.</div>';
  }
}

// Render comment form or login prompt
function renderCommentForm() {
  const footer = document.getElementById('commentsModalFooter');
  
  if (!isLoggedIn()) {
    // Show login prompt
    footer.innerHTML = `
      <div class="comments-login-prompt">
        <div class="comments-login-text">Login to join the conversation</div>
        <button class="comments-login-btn" onclick="closeCommentsModal(); showLoginPopup();">
          🔐 Login with Google
        </button>
      </div>
    `;
    return;
  }
  
  // Check if user has profile
  const userProfile = getUserProfile();
  if (!userProfile || !userProfile.inGameName) {
    footer.innerHTML = `
      <div class="comments-login-prompt">
        <div class="comments-login-text">Complete your profile to comment</div>
        <button class="comments-login-btn" onclick="closeCommentsModal(); showLoginPopup();">
          📝 Complete Profile
        </button>
      </div>
    `;
    return;
  }
  
  // Show comment form
  footer.innerHTML = `
    <form class="comment-form" onsubmit="submitComment(event)">
      <textarea 
        id="commentTextarea"
        class="comment-form-textarea" 
        placeholder="Write your comment..."
        maxlength="${MAX_COMMENT_LENGTH}"
        oninput="updateCharCount()"
        required
      ></textarea>
      <div class="comment-form-footer">
        <span class="comment-char-count" id="charCount">0 / ${MAX_COMMENT_LENGTH}</span>
        <button type="submit" class="comment-submit-btn" id="submitCommentBtn">
          💬 Post Comment
        </button>
      </div>
    </form>
  `;
}

// Update character count
window.updateCharCount = function() {
  const textarea = document.getElementById('commentTextarea');
  const charCount = document.getElementById('charCount');
  const length = textarea.value.length;
  
  charCount.textContent = `${length} / ${MAX_COMMENT_LENGTH}`;
  
  // Add warning/error class
  charCount.classList.remove('warning', 'error');
  if (length > MAX_COMMENT_LENGTH * 0.9) {
    charCount.classList.add('warning');
  }
  if (length >= MAX_COMMENT_LENGTH) {
    charCount.classList.add('error');
  }
};

// Submit comment
window.submitComment = async function(event) {
  event.preventDefault();
  
  const textarea = document.getElementById('commentTextarea');
  const submitBtn = document.getElementById('submitCommentBtn');
  const commentText = textarea.value.trim();
  
  if (!commentText) {
    showNotification('Comment cannot be empty', 'error');
    return;
  }
  
  if (commentText.length > MAX_COMMENT_LENGTH) {
    showNotification(`Comment too long (max ${MAX_COMMENT_LENGTH} characters)`, 'error');
    return;
  }
  
  // Disable form
  textarea.disabled = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting...';
  
  try {
    const token = getUserToken();
    const userProfile = getUserProfile();
    
    const response = await fetch(`${COMMENTS_ENDPOINT}/${currentMarkerKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: commentText,
        author: userProfile.inGameName
      })
    });
    
    // Handle 429 rate limit error specifically
    if (response.status === 429) {
      show429ErrorPopup();
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to post comment');
    }
    
    // Success - reload comments
    showNotification('Comment posted successfully!', 'success');
    textarea.value = '';
    updateCharCount();
    await loadComments(currentMarkerKey);
    
  } catch (error) {
    console.error('Error posting comment:', error);
    showNotification('Failed to post comment. Please try again.', 'error');
  } finally {
    // Re-enable form
    textarea.disabled = false;
    submitBtn.disabled = false;
    submitBtn.textContent = '💬 Post Comment';
  }
};

// Format comment timestamp
function formatCommentTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('commentsModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeCommentsModal();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
    const icon = document.getElementById("notificationIcon");
    const box = document.getElementById("notificationBox");

    if (icon && box) {
        icon.addEventListener("click", () => {
            box.style.display = (box.style.display === "block") ? "none" : "block";
        });

        // Klik luar popup → close
        document.addEventListener("click", (e) => {
            if (!box.contains(e.target) && e.target !== icon) {
                box.style.display = "none";
            }
        });
    }
});