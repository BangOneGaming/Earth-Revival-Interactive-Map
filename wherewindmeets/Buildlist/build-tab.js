/**
 * BUILD TABS MODULE
 * Handles tab navigation: Create Build, My Builds, All Builds, Profile
 */

const BuildTabsModule = {
  currentTab: 'createBuild',
  ICON_BASE: 'https://tiles.bgonegaming.win/wherewindmeet/Simbol/',

  /**
   * Initialize tabs
   */
  init() {
    console.log('📑 Initializing Build Tabs...');
    this.wrapExistingContent();
    this.createTabsContainer();
    this.attachEventListeners();
    console.log('✅ Build Tabs ready!');
  },

  /**
   * Wrap existing build form content
   */
  wrapExistingContent() {
    const buildHeader = document.querySelector('.build-header');
    const buildContainer = document.querySelector('.build-container');
    
    const createBuildWrapper = document.createElement('div');
    createBuildWrapper.id = 'createBuildContent';
    createBuildWrapper.className = 'tab-content-wrapper active';
    
    buildHeader.parentNode.insertBefore(createBuildWrapper, buildHeader);
    createBuildWrapper.appendChild(buildHeader);
    createBuildWrapper.appendChild(buildContainer);
    
    setTimeout(() => {
      const descContainer = document.getElementById('buildDescriptionContainer');
      const setDisplayWrapper = document.querySelector('.set-display-wrapper');
      
      if (descContainer) {
        createBuildWrapper.appendChild(descContainer);
      }
      
      if (setDisplayWrapper) {
        createBuildWrapper.appendChild(setDisplayWrapper);
      }
    }, 100);
  },

  /**
   * Create tabs navigation and panels
   */
  createTabsContainer() {
    const createBuildWrapper = document.getElementById('createBuildContent');
    
    const tabsNav = document.createElement('div');
    tabsNav.className = 'build-tabs-navigation';
    tabsNav.innerHTML = `
      <button class="build-tab-btn active" data-tab="createBuild">🛠️ Create Build</button>
      <button class="build-tab-btn" data-tab="myBuilds">📋 My Builds</button>
      <button class="build-tab-btn" data-tab="allBuilds">🌍 All Builds</button>
      <button class="build-tab-btn" data-tab="profile">👤 Profile</button>
    `;
    
    createBuildWrapper.parentNode.insertBefore(tabsNav, createBuildWrapper);
    
    const tabsHTML = `
      <div id="myBuildsContent" class="tab-content-wrapper">
        <div class="tab-panel-header">
          <h2>📋 My Builds</h2>
          <p class="tab-panel-desc">Manage your created builds</p>
        </div>
        <div id="myBuildsGrid" class="builds-grid"></div>
      </div>
      
      <div id="allBuildsContent" class="tab-content-wrapper">
        <div class="tab-panel-header">
          <h2>🌍 All Builds</h2>
          <p class="tab-panel-desc">Browse builds from the community</p>
        </div>
        <div id="allBuildsGrid" class="builds-grid"></div>
      </div>
      
      <div id="profileContent" class="tab-content-wrapper">
        <div class="tab-panel-header">
          <h2>👤 Profile</h2>
          <p class="tab-panel-desc">Your account information</p>
        </div>
        <div id="profileInfo" class="profile-content"></div>
      </div>
    `;
    
    createBuildWrapper.insertAdjacentHTML('afterend', tabsHTML);
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.querySelectorAll('.build-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    window.addEventListener('sharedAuthLogin', () => {
      if (this.currentTab !== 'createBuild') {
        this.refreshCurrentTab();
      }
    });

    window.addEventListener('sharedAuthLogout', () => {
      if (this.currentTab !== 'createBuild') {
        this.refreshCurrentTab();
      }
    });

    window.addEventListener('buildSaved', () => {
      if (this.currentTab === 'myBuilds') {
        this.loadMyBuilds();
      }
    });
  },

  /**
   * Switch tab
   */
  switchTab(tabName) {
    this.currentTab = tabName;
    
    document.querySelectorAll('.build-tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });
    
    document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
      wrapper.classList.remove('active');
    });
    
    const contentMap = {
      'createBuild': 'createBuildContent',
      'myBuilds': 'myBuildsContent',
      'allBuilds': 'allBuildsContent',
      'profile': 'profileContent'
    };
    
    const targetContent = document.getElementById(contentMap[tabName]);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    if (tabName !== 'createBuild') {
      this.loadTabContent(tabName);
    }
  },

  /**
   * Load content for specific tab
   */
  async loadTabContent(tabName) {
    switch(tabName) {
      case 'myBuilds':
        await this.loadMyBuilds();
        break;
      case 'allBuilds':
        await this.loadAllBuilds();
        break;
      case 'profile':
        await this.loadProfile();
        break;
    }
  },

  /**
   * Load My Builds
   */
  async loadMyBuilds() {
    const container = document.getElementById('myBuildsGrid');
    
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    
    if (!isLoggedIn) {
      container.innerHTML = `
        <div class="empty-state">
          <p>🔒 Please login to see your builds</p>
          <button class="primary-btn" onclick="document.getElementById('loginModal').style.display='flex'">Login with Google</button>
        </div>
      `;
      return;
    }

    container.innerHTML = '<div class="loading-state">⏳ Loading your builds...</div>';

    try {
      const user = window.sharedAuth ? window.sharedAuth.getUser() : AuthModule.getCurrentUser();
      const builds = await BuildAPIModule.getUserBuilds(user.email);
      
      if (builds.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>📭 You haven't created any builds yet</p>
            <p class="hint">Switch to "Create Build" tab to make your first build!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      builds.forEach(build => {
        const card = this.createBuildCard(build, true);
        container.appendChild(card);
      });
    } catch (error) {
      console.error('❌ Error loading builds:', error);
      container.innerHTML = `<div class="error-state">❌ Failed to load builds: ${error.message}</div>`;
    }
  },

  /**
   * Load All Builds
   */
  async loadAllBuilds() {
    const container = document.getElementById('allBuildsGrid');
    container.innerHTML = '<div class="loading-state">⏳ Loading all builds...</div>';

    try {
      const builds = await BuildAPIModule.getAllBuilds();
      
      if (builds.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>📭 No builds available yet</p>
            <p class="hint">Be the first to create a build!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      builds.forEach(build => {
        const card = this.createBuildCard(build, false);
        container.appendChild(card);
      });
    } catch (error) {
      container.innerHTML = `<div class="error-state">❌ Failed to load builds: ${error.message}</div>`;
    }
  },

  /**
   * Load Profile
   */
  async loadProfile() {
    const container = document.getElementById('profileInfo');
    
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    
    if (!isLoggedIn) {
      container.innerHTML = `
        <div class="empty-state">
          <p>🔒 Please login to see your profile</p>
          <button class="primary-btn" onclick="document.getElementById('loginModal').style.display='flex'">Login with Google</button>
        </div>
      `;
      return;
    }

    container.innerHTML = '<div class="loading-state">⏳ Loading profile...</div>';

    try {
      const user = window.sharedAuth ? window.sharedAuth.getUser() : AuthModule.getCurrentUser();
      const builds = await BuildAPIModule.getUserBuilds(user.email);
      
      const totalLikes = builds.reduce((sum, build) => sum + (build.likes || 0), 0);
      const totalDislikes = builds.reduce((sum, build) => sum + (build.dislikes || 0), 0);
      const totalComments = builds.reduce((sum, build) => sum + (build.comments?.length || 0), 0);
      
      // Determine display name: Use inGameName if available, fallback to Google name
      const displayName = user.gameProfile?.inGameName || user.name;
      const hasGameProfile = user.gameProfile && user.gameProfile.inGameName;
      
      container.innerHTML = `
        <div class="profile-card">
          <div class="profile-header">
            <img src="${user.picture}" alt="${displayName}" class="profile-picture">
            <div class="profile-info">
              <h3>${displayName}</h3>
              ${hasGameProfile ? `<p class="profile-ingame-label">🎮 In-Game Name</p>` : ''}
              <p class="profile-email">${user.email}</p>
              ${user.gameProfile ? `
                <div class="profile-game-info">
                  <span class="profile-weapon">⚔️ ${user.gameProfile.weaponVariant || 'Unknown'}</span>
                  <span class="profile-role">🎭 ${user.gameProfile.role || 'Unknown'}</span>
                </div>
              ` : `
                <div class="profile-incomplete">
                  <p style="color: #FFD700; font-size: 13px; margin-top: 10px;">⚠️ Game profile not set</p>
                  <a href="../index.html" style="color: #4CAF50; font-size: 12px; text-decoration: underline;">Set up your profile</a>
                </div>
              `}
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">${builds.length}</span>
              <span class="stat-label">Builds Created</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${totalLikes}</span>
              <span class="stat-label">Total Likes</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${totalDislikes}</span>
              <span class="stat-label">Total Dislikes</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${totalComments}</span>
              <span class="stat-label">Total Comments</span>
            </div>
          </div>
          
          <div class="profile-actions">
            <button class="logout-btn" onclick="window.sharedAuth ? window.sharedAuth.logout() : AuthModule.logout()">🚪 Logout</button>
          </div>
        </div>
      `;
    } catch (error) {
      container.innerHTML = `<div class="error-state">❌ Failed to load profile: ${error.message}</div>`;
    }
  },

  /**
   * Extract build info for card display
   */
  extractBuildInfo(buildData) {
    const info = {
      title: 'Untitled Build',
      description: 'No description',
      weapons: [],
      weaponSets: [],
      armorSets: [],
      accessories: [],
      innerways: [],
      mystics: []
    };

    // Extract weapons
    if (buildData.weapons) {
      if (buildData.weapons.slot1?.weapon) {
        const w = buildData.weapons.slot1.weapon;
        info.weapons.push({
          name: w.name,
          icon: `${this.ICON_BASE}weapons/${w.special_icons}.webp`
        });
      }
      if (buildData.weapons.slot2?.weapon) {
        const w = buildData.weapons.slot2.weapon;
        info.weapons.push({
          name: w.name,
          icon: `${this.ICON_BASE}weapons/${w.special_icons}.webp`
        });
      }
    }

    // Calculate weapon/accessory sets
    const weaponSetCounts = {};
    if (buildData.weapons?.slot1?.selectedSet) {
      weaponSetCounts[buildData.weapons.slot1.selectedSet] = 
        (weaponSetCounts[buildData.weapons.slot1.selectedSet] || 0) + 1;
    }
    if (buildData.weapons?.slot2?.selectedSet) {
      weaponSetCounts[buildData.weapons.slot2.selectedSet] = 
        (weaponSetCounts[buildData.weapons.slot2.selectedSet] || 0) + 1;
    }
    if (buildData.accessories?.slot1) {
      weaponSetCounts[buildData.accessories.slot1] = 
        (weaponSetCounts[buildData.accessories.slot1] || 0) + 1;
    }
    if (buildData.accessories?.slot2) {
      weaponSetCounts[buildData.accessories.slot2] = 
        (weaponSetCounts[buildData.accessories.slot2] || 0) + 1;
    }

    info.weaponSets = Object.entries(weaponSetCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        badge: `${this.ICON_BASE}badge/${name}.webp`
      }));

    // Calculate armor sets
    const armorSetCounts = {};
    if (buildData.armors) {
      for (let i = 1; i <= 4; i++) {
        const armor = buildData.armors[`slot${i}`];
        if (armor?.set) {
          armorSetCounts[armor.set] = (armorSetCounts[armor.set] || 0) + 1;
        }
      }
    }

    info.armorSets = Object.entries(armorSetCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        badge: `${this.ICON_BASE}badge/${name}.webp`
      }));

    // Extract inner ways
    if (buildData.innerways) {
      info.innerways = buildData.innerways
        .filter(iw => iw)
        .map(iw => ({
          name: iw.name.replace(' - Inner Ways', ''),
          icon: `${this.ICON_BASE}innerway/${iw.special_icon}.webp`
        }));
    }

    // Extract mystics
    if (buildData.mystics) {
      info.mystics = buildData.mystics
        .filter(m => m)
        .map(m => ({
          name: m.name.replace(' - Mystic Skill', ''),
          icon: `${this.ICON_BASE}${m.special_icon}.webp`
        }));
    }

    // Generate auto title/description if not provided
    if (!buildData.description?.title && info.weapons.length > 0) {
      info.title = info.weapons.map(w => w.name).join(' + ') + ' Build';
    }
    if (!buildData.description?.description) {
      const parts = [];
      if (info.weaponSets.length > 0) {
        parts.push(`${info.weaponSets[0].name} set`);
      }
      if (info.armorSets.length > 0) {
        parts.push(`${info.armorSets[0].name} armor`);
      }
      if (info.innerways.length > 0) {
        parts.push(`${info.innerways.length} inner ways`);
      }
      info.description = parts.join(', ') || 'Custom build configuration';
    }

    return info;
  },

  /**
   * Create build card
   */
  createBuildCard(build, isOwner) {
    const card = document.createElement('div');
    card.className = 'build-card';
    
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    const currentUserEmail = isLoggedIn ? 
      (window.sharedAuth ? window.sharedAuth.getUser().email : AuthModule.getCurrentUser().email) : null;
    
    const isLiked = isLoggedIn && build.likedBy?.includes(currentUserEmail);
    const isDisliked = isLoggedIn && build.dislikedBy?.includes(currentUserEmail);
    
    // Extract build info
    const buildInfo = this.extractBuildInfo(build.buildData);
    
    card.innerHTML = `
      <div class="build-card-header">
        <img src="${build.userPicture}" alt="${build.userName}" class="build-user-pic">
        <div class="build-user-info">
          <span class="build-user-name">${build.userName}</span>
          <span class="build-user-weapon">${build.userWeapon} • ${build.userRole}</span>
        </div>
        ${isOwner ? `<button class="delete-build-btn" data-id="${build.id}">🗑️</button>` : ''}
      </div>
      
      <div class="build-card-body">
        <h4 class="build-title-card">${build.buildData.description?.title || buildInfo.title}</h4>
        <p class="build-description">${(build.buildData.description?.description || buildInfo.description).substring(0, 100)}...</p>
        
        <div class="build-tags">
          ${build.buildData.description?.difficulty ? 
            `<span class="build-tag difficulty-${build.buildData.description.difficulty.toLowerCase().replace(/\s+/g, '-')}">${build.buildData.description.difficulty}</span>` 
            : ''}
          ${build.buildData.description?.tags?.slice(0, 3).map(tag => 
            `<span class="build-tag">${tag}</span>`
          ).join('') || ''}
        </div>

        <!-- Visual Equipment Summary -->
<div class="build-equipment-summary">

  <!-- Weapons -->
  ${buildInfo.weapons.length > 0 ? `
    <div class="equipment-row">
      <img src="${BuildListManager.ICON_BASE_URL}jutsu.webp" class="equipment-label-icon" alt="Weapon Type">
      <div class="equipment-icons">
        ${buildInfo.weapons.map(w => `
          <img src="${w.icon}" alt="${w.name}" class="equipment-icon" title="${w.name}" 
               onerror="this.src='${this.ICON_BASE}default.png'">
        `).join('')}
      </div>
    </div>
  ` : ''}

  <!-- Weapon/Accessory Sets -->
  ${buildInfo.weaponSets.length > 0 ? `
    <div class="equipment-row">
      <img src="${BuildListManager.ICON_BASE_URL}batutele.webp" class="equipment-label-icon" alt="Weapon & Accessories Sets">
      <div class="equipment-icons">
        ${buildInfo.weaponSets.map(set => `
          <div class="set-badge-mini" title="${set.name} (${set.count}/4)">
            <img src="${set.badge}" alt="${set.name}" class="equipment-icon" 
                 onerror="this.src='${this.ICON_BASE}badge/default.webp'">
            <span class="set-count-mini">${set.count}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  <!-- Armor Sets -->
  ${buildInfo.armorSets.length > 0 ? `
    <div class="equipment-row">
      <img src="${BuildListManager.ICON_BASE_URL}accessories/Body.webp" class="equipment-label-icon" alt="Armor Sets">
      <div class="equipment-icons">
        ${buildInfo.armorSets.map(set => `
          <div class="set-badge-mini" title="${set.name} (${set.count}/4)">
            <img src="${set.badge}" alt="${set.name}" class="equipment-icon" 
                 onerror="this.src='${this.ICON_BASE}badge/default.webp'">
            <span class="set-count-mini">${set.count}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  <!-- Innerways -->
  ${buildInfo.innerways.length > 0 ? `
    <div class="equipment-row">
      <img src="${BuildListManager.ICON_BASE_URL}innerway.webp" class="equipment-label-icon" alt="Innerway">
      <div class="equipment-icons">
        ${buildInfo.innerways.slice(0, 4).map(iw => `
          <img src="${iw.icon}" alt="${iw.name}" class="equipment-icon-small" 
               title="${iw.name}" onerror="this.src='${this.ICON_BASE}default.png'">
        `).join('')}
      </div>
    </div>
  ` : ''}

  <!-- Mystic Skills -->
  ${buildInfo.mystics.length > 0 ? `
    <div class="equipment-row">
      <img src="${BuildListManager.ICON_BASE_URL}tehnik.webp" class="equipment-label-icon" alt="Mystic Skill">
      <div class="equipment-icons">
        ${buildInfo.mystics.slice(0, 4).map(m => `
          <img src="${m.icon}" alt="${m.name}" class="equipment-icon-small" 
               title="${m.name}" onerror="this.src='${this.ICON_BASE}default.png'">
        `).join('')}
        ${buildInfo.mystics.length > 4 ? `<span class="more-count">+${buildInfo.mystics.length - 4}</span>` : ''}
      </div>
    </div>
  ` : ''}

</div>
      </div>
      
      <div class="build-card-footer">
        <button class="like-btn ${isLiked ? 'active' : ''}" data-id="${build.id}" data-action="like">
          👍 ${build.likes || 0}
        </button>
        <button class="like-btn ${isDisliked ? 'active' : ''}" data-id="${build.id}" data-action="dislike">
          👎 ${build.dislikes || 0}
        </button>
        <button class="comment-btn" data-id="${build.id}">
          💬 ${build.comments?.length || 0}
        </button>
        <button class="view-build-btn" data-id="${build.id}">👁️ View</button>
      </div>
    `;
    
    this.attachCardListeners(card, build);
    
    return card;
  },

  /**
   * Attach card event listeners
   */
  attachCardListeners(card, build) {
    card.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleLike(build.id, action);
      });
    });
    
    const commentBtn = card.querySelector('.comment-btn');
    commentBtn.addEventListener('click', () => {
      this.showCommentModal(build);
    });
    
    const viewBtn = card.querySelector('.view-build-btn');
    viewBtn.addEventListener('click', () => {
      this.showBuildDetailModal(build);
    });
    
    const deleteBtn = card.querySelector('.delete-build-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.handleDelete(build.id);
      });
    }
  },

  /**
   * Handle like/dislike
   */
  async handleLike(buildId, action) {
    const isLoggedIn = (window.sharedAuth && window.sharedAuth.isLoggedIn()) || 
                       (AuthModule && AuthModule.isLoggedIn());
    
    if (!isLoggedIn) {
      document.getElementById('loginModal').style.display = 'flex';
      return;
    }
    
    try {
      await BuildAPIModule.toggleLike(buildId, action);
      this.refreshCurrentTab();
    } catch (error) {
      alert(`❌ Failed to ${action}: ${error.message}`);
    }
  },

  /**
   * Handle delete
   */
  async handleDelete(buildId) {
    if (!confirm('⚠️ Are you sure you want to delete this build?')) return;
    
    try {
      await BuildAPIModule.deleteBuild(buildId);
      this.refreshCurrentTab();
      alert('✅ Build deleted successfully');
    } catch (error) {
      alert(`❌ Failed to delete: ${error.message}`);
    }
  },

  /**
   * Show comment modal
   */
  showCommentModal(build) {
    console.log('💬 Show comment modal for build:', build.id);
    alert('💬 Comment feature coming soon!');
  },

  /**
   * Show build detail modal
   */
  showBuildDetailModal(build) {
    console.log('👁️ Show build detail for:', build.id);
    alert('👁️ Build detail view coming soon!');
  },

  /**
   * Refresh current tab
   */
  refreshCurrentTab() {
    if (this.currentTab !== 'createBuild') {
      this.loadTabContent(this.currentTab);
    }
  }
};

window.BuildTabsModule = BuildTabsModule;