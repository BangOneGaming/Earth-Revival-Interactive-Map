/**
 * BUILD API MODULE
 * Handles all build CRUD operations and interactions (like, comment)
 */

const BuildAPIModule = {
  ENDPOINT: 'https://autumn-dream-8c07.square-spon.workers.dev/userbuilds',

  /**
   * Save new build or update existing
   */
  async saveBuild(buildData) {
    // Check both auth systems
    let user = null;
    if (window.sharedAuth && window.sharedAuth.isLoggedIn()) {
      user = window.sharedAuth.getUser();
    } else if (AuthModule && AuthModule.getCurrentUser()) {
      user = AuthModule.getCurrentUser();
    }
    
    if (!user) {
      throw new Error('User not logged in');
    }

    const payload = {
      buildData: buildData,
      userName: user.name,
      userEmail: user.email,
      userPicture: user.picture,
      userWeapon: user.gameProfile?.weaponVariant || 'Unknown',
      userRole: user.gameProfile?.role || 'Unknown',
      // FIXED: Include game profile for inGameName
      userGameProfile: user.gameProfile ? {
        inGameName: user.gameProfile.inGameName,
        weaponVariant: user.gameProfile.weaponVariant,
        role: user.gameProfile.role
      } : null
    };

    try {
      const response = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save build: ${error}`);
      }

      const result = await response.json();
      console.log('✅ Build saved:', result);
      return result;
    } catch (error) {
      console.error('❌ Error saving build:', error);
      throw error;
    }
  },

  /**
   * Get builds by user email
   */
  async getUserBuilds(email) {
    try {
      const response = await fetch(`${this.ENDPOINT}/${email}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user builds');
      }

      const result = await response.json();
      return result.builds || [];
    } catch (error) {
      console.error('❌ Error fetching user builds:', error);
      return [];
    }
  },

  /**
   * Get all builds from all users
   */
  async getAllBuilds() {
    try {
      const response = await fetch(`${this.ENDPOINT}/all`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch all builds');
      }

      const result = await response.json();
      return result.builds || [];
    } catch (error) {
      console.error('❌ Error fetching all builds:', error);
      return [];
    }
  },

  /**
   * Toggle like/dislike on build
   */
  async toggleLike(buildId, action) {
    // Check both auth systems
    let user = null;
    if (window.sharedAuth && window.sharedAuth.isLoggedIn()) {
      user = window.sharedAuth.getUser();
    } else if (AuthModule && AuthModule.getCurrentUser()) {
      user = AuthModule.getCurrentUser();
    }
    
    if (!user) {
      throw new Error('User not logged in');
    }

    try {
      const response = await fetch(`${this.ENDPOINT}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          buildId: buildId,
          userEmail: user.email,
          action: action // 'like' or 'dislike'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const result = await response.json();
      console.log('✅ Like toggled:', result);
      return result;
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      throw error;
    }
  },

  /**
   * Add comment to build
   */
  async addComment(buildId, commentText) {
    // Check both auth systems
    let user = null;
    if (window.sharedAuth && window.sharedAuth.isLoggedIn()) {
      user = window.sharedAuth.getUser();
    } else if (AuthModule && AuthModule.getCurrentUser()) {
      user = AuthModule.getCurrentUser();
    }
    
    if (!user) {
      throw new Error('User not logged in');
    }

    try {
      const response = await fetch(`${this.ENDPOINT}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          buildId: buildId,
          userName: user.name,
          userEmail: user.email,
          userPicture: user.picture,
          text: commentText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const result = await response.json();
      console.log('✅ Comment added:', result);
      return result;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Delete build
   */
  async deleteBuild(buildId) {
    // Check both auth systems
    let user = null;
    if (window.sharedAuth && window.sharedAuth.isLoggedIn()) {
      user = window.sharedAuth.getUser();
    } else if (AuthModule && AuthModule.getCurrentUser()) {
      user = AuthModule.getCurrentUser();
    }
    
    if (!user) {
      throw new Error('User not logged in');
    }

    try {
      const response = await fetch(`${this.ENDPOINT}/${buildId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete build');
      }

      const result = await response.json();
      console.log('✅ Build deleted:', result);
      return result;
    } catch (error) {
      console.error('❌ Error deleting build:', error);
      throw error;
    }
  }
};

window.BuildAPIModule = BuildAPIModule;
  ICON_BASE: 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/',
  currentBuild: null,
  modalElement: null,

  /**
   * Open modal with build details
   * @param {Object} build - Build data from server
   */
  open(build) {
    console.log('👁️ Opening build detail modal:', build.id);
    this.currentBuild = build;
    this.render();
  },

  /**
   * Close modal
   */
  close() {
    if (this.modalElement) {
      this.modalElement.classList.remove('active');
      setTimeout(() => {
        if (this.modalElement && this.modalElement.parentNode) {
          this.modalElement.remove();
          this.modalElement = null;
        }
      }, 300);
    }
    this.currentBuild = null;
  },

  /**
   * Render modal
   */
  render() {
    // Remove existing modal if any
    const existing = document.getElementById('buildDetailModal');
    if (existing) existing.remove();

    const build = this.currentBuild;
    const buildData = build.buildData;
    
    // Create modal element
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'buildDetailModal';
    this.modalElement.className = 'build-detail-modal';

    this.modalElement.innerHTML = `
      <div class="build-detail-overlay"></div>
      <div class="build-detail-container">
        <div class="build-detail-content">
          ${this.renderHeader(build)}
          ${this.renderDescription(buildData)}
          ${this.renderWeapons(buildData)}
          ${this.renderAccessories(buildData)}
          ${this.renderWeaponSets(buildData)}
          ${this.renderArmorSets(buildData)}
          ${this.renderInnerWays(buildData)}
          ${this.renderMysticSkills(buildData)}
          ${this.renderVideoLinks(buildData)}
          ${this.renderScreenshot(buildData)}
          ${this.renderComments(build)}
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);
    
    // Trigger animation
    setTimeout(() => this.modalElement.classList.add('active'), 10);

    // Attach event listeners
    this.attachEventListeners();
  },

  /**
   * Render header section
   */
  renderHeader(build) {
    const buildData = build.buildData;
    const title = buildData.description?.title || 'Untitled Build';
    const difficulty = buildData.description?.difficulty;
    const tags = buildData.description?.tags || [];

    // Get display name (prioritize inGameName)
    const creatorName = build.userGameProfile?.inGameName || build.userName;

    return `
      <div class="build-detail-header">
        <button class="build-detail-close" onclick="BuildDetailModal.close()">×</button>
        <h2 class="build-detail-title">${title}</h2>
        
        <div class="build-detail-creator">
          <img src="${build.userPicture}" alt="${creatorName}" class="creator-avatar">
          <div class="creator-info">
            <span class="creator-name">${creatorName}</span>
            <span class="creator-weapon">${build.userWeapon} • ${build.userRole}</span>
          </div>
        </div>

        <div class="build-detail-meta">
          ${difficulty ? `<span class="meta-difficulty difficulty-${difficulty.toLowerCase().replace(/\s+/g, '-')}">${difficulty}</span>` : ''}
          ${tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('')}
        </div>

        <div class="build-detail-actions">
          <button class="action-btn like-btn ${this.isLiked(build) ? 'active' : ''}" data-action="like">
            👍 <span>${build.likes || 0}</span>
          </button>
          <button class="action-btn dislike-btn ${this.isDisliked(build) ? 'active' : ''}" data-action="dislike">
            👎 <span>${build.dislikes || 0}</span>
          </button>
          <button class="action-btn share-btn">
            📤 Share
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Render description section
   */
  renderDescription(buildData) {
    const description = buildData.description?.description || 'No description provided';
    
    return `
      <div class="build-detail-section">
        <h3 class="section-title">📝 Description</h3>
        <div class="section-content">
          <p class="build-description-full">${description}</p>
        </div>
      </div>
    `;
  },

  /**
   * Render weapons section
   */
  renderWeapons(buildData) {
    const weapons = [];
    
    if (buildData.weapons?.slot1?.weapon) {
      weapons.push({
        weapon: buildData.weapons.slot1.weapon,
        set: buildData.weapons.slot1.selectedSet
      });
    }
    if (buildData.weapons?.slot2?.weapon) {
      weapons.push({
        weapon: buildData.weapons.slot2.weapon,
        set: buildData.weapons.slot2.selectedSet
      });
    }

    if (weapons.length === 0) {
      return `
        <div class="build-detail-section">
          <h3 class="section-title">⚔️ Weapons</h3>
          <div class="section-content">
            <p class="empty-text">No weapons selected</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="build-detail-section">
        <h3 class="section-title">⚔️ Weapons (${weapons.length})</h3>
        <div class="section-content weapons-grid">
          ${weapons.map(w => `
            <div class="weapon-item">
              <img src="${this.ICON_BASE}weapons/${w.weapon.special_icons}.webp" 
                   alt="${w.weapon.name}" 
                   class="weapon-icon"
                   onerror="this.src='${this.ICON_BASE}default.png'">
              <div class="weapon-item-info">
                <div class="weapon-item-name">${w.weapon.name}</div>
                <div class="weapon-item-meta">
                  <span class="weapon-role">${w.weapon.role}</span>
                  <span class="weapon-path">${w.weapon.path}</span>
                </div>
                <div class="weapon-set-badge">
                  <img src="${this.ICON_BASE}badge/${w.set}.webp" 
                       alt="${w.set}"
                       onerror="this.src='${this.ICON_BASE}badge/default.webp'">
                  <span>${w.set}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render accessories section
   */
  renderAccessories(buildData) {
    const accessories = [];
    
    if (buildData.accessories?.slot1) {
      accessories.push(buildData.accessories.slot1);
    }
    if (buildData.accessories?.slot2) {
      accessories.push(buildData.accessories.slot2);
    }

    if (accessories.length === 0) return '';

    return `
      <div class="build-detail-section">
        <h3 class="section-title">🎭 Accessories (${accessories.length})</h3>
        <div class="section-content accessories-grid">
          ${accessories.map(acc => `
            <div class="accessory-item">
              <img src="${this.ICON_BASE}accessories/${acc}.webp" 
                   alt="${acc}" 
                   class="accessory-icon"
                   onerror="this.src='${this.ICON_BASE}default.png'">
              <span class="accessory-name">${acc}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render weapon sets section
   */
  renderWeaponSets(buildData) {
    const setCounts = this.calculateWeaponSets(buildData);
    
    if (Object.keys(setCounts).length === 0) return '';

    return `
      <div class="build-detail-section">
        <h3 class="section-title">🎨 Weapon & Accessory Sets</h3>
        <div class="section-content sets-grid">
          ${Object.entries(setCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([setName, count]) => {
              const isActive2pc = count >= 2;
              const isActive4pc = count >= 4;
              
              return `
                <div class="set-item ${isActive2pc || isActive4pc ? 'active' : ''}">
                  <div class="set-item-header">
                    <img src="${this.ICON_BASE}badge/${setName}.webp" 
                         alt="${setName}"
                         class="set-badge"
                         onerror="this.src='${this.ICON_BASE}badge/default.webp'">
                    <div class="set-item-info">
                      <span class="set-name">${setName}</span>
                      <span class="set-count">(${count}/4)</span>
                    </div>
                  </div>
                  <div class="set-bonuses">
                    <div class="set-bonus ${isActive2pc ? 'active' : ''}">
                      <span class="bonus-label">2-Piece:</span>
                      <span class="bonus-text">Bonus effect here</span>
                    </div>
                    <div class="set-bonus ${isActive4pc ? 'active' : ''}">
                      <span class="bonus-label">4-Piece:</span>
                      <span class="bonus-text">Bonus effect here</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render armor sets section
   */
  renderArmorSets(buildData) {
    const setCounts = this.calculateArmorSets(buildData);
    
    if (Object.keys(setCounts).length === 0) return '';

    return `
      <div class="build-detail-section">
        <h3 class="section-title">🛡️ Armor Sets</h3>
        <div class="section-content sets-grid">
          ${Object.entries(setCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([setName, count]) => {
              const isActive2pc = count >= 2;
              const isActive4pc = count >= 4;
              
              return `
                <div class="set-item ${isActive2pc || isActive4pc ? 'active' : ''}">
                  <div class="set-item-header">
                    <img src="${this.ICON_BASE}badge/${setName}.webp" 
                         alt="${setName}"
                         class="set-badge"
                         onerror="this.src='${this.ICON_BASE}badge/default.webp'">
                    <div class="set-item-info">
                      <span class="set-name">${setName}</span>
                      <span class="set-count">(${count}/4)</span>
                    </div>
                  </div>
                  <div class="set-bonuses">
                    <div class="set-bonus ${isActive2pc ? 'active' : ''}">
                      <span class="bonus-label">2-Piece:</span>
                      <span class="bonus-text">Armor bonus here</span>
                    </div>
                    <div class="set-bonus ${isActive4pc ? 'active' : ''}">
                      <span class="bonus-label">4-Piece:</span>
                      <span class="bonus-text">Armor bonus here</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render inner ways section
   */
  renderInnerWays(buildData) {
    const innerways = (buildData.innerways || []).filter(iw => iw);
    
    if (innerways.length === 0) return '';

    return `
      <div class="build-detail-section">
        <h3 class="section-title">🧘 Inner Ways (${innerways.length})</h3>
        <div class="section-content innerways-grid">
          ${innerways.map(iw => {
            const details = JSON.parse(iw.details || '{}');
            const cleanName = iw.name.replace(' - Inner Ways', '');
            
            return `
              <div class="innerway-item">
                <img src="${this.ICON_BASE}innerway/${iw.special_icon}.webp" 
                     alt="${cleanName}"
                     class="innerway-icon"
                     onerror="this.src='${this.ICON_BASE}default.png'">
                <div class="innerway-info">
                  <div class="innerway-name">${cleanName}</div>
                  <div class="innerway-meta">
                    <span class="innerway-rarity">${details.rarity || ''}</span>
                    <span class="innerway-path">${details.path || ''}</span>
                  </div>
                  <div class="innerway-effect">
                    <strong>Effect:</strong> ${details.effect || 'No description'}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render mystic skills section
   */
  renderMysticSkills(buildData) {
    const mystics = (buildData.mystics || []).filter(m => m);
    
    if (mystics.length === 0) {
      return `
        <div class="build-detail-section">
          <h3 class="section-title">✨ Mystic Skills</h3>
          <div class="section-content">
            <p class="empty-text">No mystic skills selected</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="build-detail-section">
        <h3 class="section-title">✨ Mystic Skills (${mystics.length})</h3>
        <div class="section-content mystics-grid">
          ${mystics.map(m => {
            const cleanName = m.name.replace(' - Mystic Skill', '');
            
            return `
              <div class="mystic-item">
                <img src="${this.ICON_BASE}${m.special_icon}.webp" 
                     alt="${cleanName}"
                     class="mystic-icon"
                     onerror="this.src='${this.ICON_BASE}default.png'">
                <span class="mystic-name">${cleanName}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render video links section
   */
  renderVideoLinks(buildData) {
    const videoLinks = buildData.description?.videoLinks;
    
    if (!videoLinks || (!videoLinks.youtube && !videoLinks.tiktok && !videoLinks.facebook)) {
      return '';
    }

    return `
      <div class="build-detail-section">
        <h3 class="section-title">🎬 Showcase Videos</h3>
        <div class="section-content video-links">
          ${videoLinks.youtube ? `
            <a href="${videoLinks.youtube}" target="_blank" class="video-link youtube">
              ▶️ YouTube
            </a>
          ` : ''}
          ${videoLinks.tiktok ? `
            <a href="${videoLinks.tiktok}" target="_blank" class="video-link tiktok">
              🎵 TikTok
            </a>
          ` : ''}
          ${videoLinks.facebook ? `
            <a href="${videoLinks.facebook}" target="_blank" class="video-link facebook">
              👥 Facebook
            </a>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render screenshot section
   */
  renderScreenshot(buildData) {
    const screenshot = buildData.description?.screenshotPreview;
    
    if (!screenshot) return '';

    return `
      <div class="build-detail-section">
        <h3 class="section-title">📷 Screenshot</h3>
        <div class="section-content">
          <img src="${screenshot}" alt="Build Screenshot" class="build-screenshot">
        </div>
      </div>
    `;
  },

  /**
   * Render comments section
   */
  renderComments(build) {
    const comments = build.comments || [];
    
    return `
      <div class="build-detail-section">
        <h3 class="section-title">💬 Comments (${comments.length})</h3>
        <div class="section-content">
          <div class="comments-list">
            ${comments.length === 0 ? 
              '<p class="empty-text">No comments yet. Be the first to comment!</p>' :
              comments.map(comment => `
                <div class="comment-item">
                  <img src="${comment.userPicture}" alt="${comment.userName}" class="comment-avatar">
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">${comment.userName}</span>
                      <span class="comment-date">${this.formatDate(comment.createdAt)}</span>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                  </div>
                </div>
              `).join('')
            }
          </div>
          
          <div class="comment-form">
            <textarea id="commentInput" placeholder="Write a comment..." rows="3"></textarea>
            <button class="comment-submit-btn" onclick="BuildDetailModal.submitComment()">
              💬 Post Comment
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close on overlay click
    const overlay = this.modalElement.querySelector('.build-detail-overlay');
    overlay.addEventListener('click', () => this.close());

    // Like/Dislike buttons
    const likeBtn = this.modalElement.querySelector('.like-btn');
    const dislikeBtn = this.modalElement.querySelector('.dislike-btn');
    
    if (likeBtn) {
      likeBtn.addEventListener('click', () => this.handleLike('like'));
    }
    if (dislikeBtn) {
      dislikeBtn.addEventListener('click', () => this.handleLike('dislike'));
    }

    // Share button
    const shareBtn = this.modalElement.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.handleShare());
    }
  },

  /**
   * Handle like/dislike
   */
  async handleLike(action) {
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    
    if (!isLoggedIn) {
      alert('Please login to like/dislike builds');
      return;
    }

    try {
      await BuildAPIModule.toggleLike(this.currentBuild.id, action);
      
      // Refresh the build data
      // Reload modal or update counts
      alert(`✅ ${action === 'like' ? 'Liked' : 'Disliked'}!`);
      
      // Optionally reload the modal
      this.close();
    } catch (error) {
      alert(`❌ Failed to ${action}: ${error.message}`);
    }
  },

  /**
   * Handle share
   */
  handleShare() {
    const url = window.location.href + '?buildId=' + this.currentBuild.id;
    
    if (navigator.share) {
      navigator.share({
        title: this.currentBuild.buildData.description?.title || 'Check out this build!',
        text: 'Where Winds Meet Build',
        url: url
      }).catch(err => console.log('Share cancelled'));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('✅ Link copied to clipboard!');
      });
    }
  },

  /**
   * Submit comment
   */
  async submitComment() {
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    
    if (!isLoggedIn) {
      alert('Please login to comment');
      return;
    }

    const commentInput = document.getElementById('commentInput');
    const text = commentInput.value.trim();
    
    if (!text) {
      alert('Please write a comment');
      return;
    }

    try {
      await BuildAPIModule.addComment(this.currentBuild.id, text);
      alert('✅ Comment posted!');
      commentInput.value = '';
      
      // Reload modal to show new comment
      this.close();
    } catch (error) {
      alert(`❌ Failed to post comment: ${error.message}`);
    }
  },

  /**
   * Helper: Calculate weapon sets
   */
  calculateWeaponSets(buildData) {
    const sets = {};
    
    if (buildData.weapons?.slot1?.selectedSet) {
      sets[buildData.weapons.slot1.selectedSet] = (sets[buildData.weapons.slot1.selectedSet] || 0) + 1;
    }
    if (buildData.weapons?.slot2?.selectedSet) {
      sets[buildData.weapons.slot2.selectedSet] = (sets[buildData.weapons.slot2.selectedSet] || 0) + 1;
    }
    if (buildData.accessories?.slot1) {
      sets[buildData.accessories.slot1] = (sets[buildData.accessories.slot1] || 0) + 1;
    }
    if (buildData.accessories?.slot2) {
      sets[buildData.accessories.slot2] = (sets[buildData.accessories.slot2] || 0) + 1;
    }
    
    return sets;
  },

  /**
   * Helper: Calculate armor sets
   */
  calculateArmorSets(buildData) {
    const sets = {};
    
    if (buildData.armors) {
      for (let i = 1; i <= 4; i++) {
        const armor = buildData.armors[`slot${i}`];
        if (armor?.set) {
          sets[armor.set] = (sets[armor.set] || 0) + 1;
        }
      }
    }
    
    return sets;
  },

  /**
   * Helper: Check if user liked build
   */
  isLiked(build) {
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    if (!isLoggedIn) return false;
    
    const email = window.sharedAuth ? window.sharedAuth.getUser().email : AuthModule.getCurrentUser().email;
    return build.likedBy?.includes(email);
  },

  /**
   * Helper: Check if user disliked build
   */
  isDisliked(build) {
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    if (!isLoggedIn) return false;
    
    const email = window.sharedAuth ? window.sharedAuth.getUser().email : AuthModule.getCurrentUser().email;
    return build.dislikedBy?.includes(email);
  },

  /**
   * Helper: Format date
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
};

window.BuildDetailModal = BuildDetailModal;
console.log('✅ BuildDetailModal module loaded');