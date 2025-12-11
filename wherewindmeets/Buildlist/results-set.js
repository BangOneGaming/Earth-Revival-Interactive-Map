/**
 * SET TRACKER MODULE
 * Tracks and displays active weapon/accessory, armor sets, and inner ways
 */

const SetTrackerModule = {
  weaponSetsData: null,

  /**
   * Initialize set tracker
   */
  async init() {
    console.log('🎯 Initializing Set Tracker...');
    await this.loadWeaponSetsData();
    this.createSetDisplayContainers();
    console.log('✅ Set Tracker ready!');
  },

  /**
   * Load weapon sets data
   */
  async loadWeaponSetsData() {
    try {
      const response = await fetch('https://autumn-dream-8c07.square-spon.workers.dev/weaponsetslist');
      this.weaponSetsData = await response.json();
      console.log('✅ Weapon sets data loaded');
    } catch (error) {
      console.error('❌ Failed to load weapon sets data:', error);
    }
  },

  /**
   * Create display containers for set bonuses
   */
  createSetDisplayContainers() {
    const bodyElement = document.body;
    
    // Create wrapper untuk set displays (DILUAR .build-container)
    const setDisplayWrapper = document.createElement('div');
    setDisplayWrapper.id = 'setDisplayWrapper';
    setDisplayWrapper.className = 'set-display-wrapper';
    setDisplayWrapper.style.display = 'none'; // Hidden by default
    
    // Create weapon/accessory sets display
    const weaponSetsDisplay = document.createElement('div');
    weaponSetsDisplay.id = 'weaponSetsDisplay';
    weaponSetsDisplay.className = 'set-display-container';
    weaponSetsDisplay.innerHTML = `
      <h3 class="set-display-title">
        <img src="${BuildListManager.ICON_BASE_URL}jutsu.webp" class="set-title-icon" alt="Weapon Sets">
        Weapon & Accessory Sets
      </h3>
      <div id="weaponSetsContent" class="set-display-content"></div>
    `;

    // Create armor sets display
    const armorSetsDisplay = document.createElement('div');
    armorSetsDisplay.id = 'armorSetsDisplay';
    armorSetsDisplay.className = 'set-display-container';
    armorSetsDisplay.innerHTML = `
      <h3 class="set-display-title">
        <img src="${BuildListManager.ICON_BASE_URL}accessories/Body.webp" class="set-title-icon" alt="Armor Sets">
        Armor Sets
      </h3>
      <div id="armorSetsContent" class="set-display-content"></div>
    `;

    // Create inner ways display
    const innerwaysDisplay = document.createElement('div');
    innerwaysDisplay.id = 'innerwaysDisplay';
    innerwaysDisplay.className = 'set-display-container set-display-full';
    innerwaysDisplay.innerHTML = `
      <h3 class="set-display-title">
        <img src="${BuildListManager.ICON_BASE_URL}badge/default.webp" class="set-title-icon" alt="Inner Ways">
        Active Inner Ways
      </h3>
      <div id="innerwaysContent" class="set-display-content"></div>
    `;

    setDisplayWrapper.appendChild(weaponSetsDisplay);
    setDisplayWrapper.appendChild(armorSetsDisplay);
    setDisplayWrapper.appendChild(innerwaysDisplay);
    
    bodyElement.appendChild(setDisplayWrapper);
  },

  /**
   * Calculate active weapon/accessory sets
   */
  calculateWeaponSets() {
    const sets = {};
    
    if (BuildListManager.currentBuild.weapons.slot1?.selectedSet) {
      const set = BuildListManager.currentBuild.weapons.slot1.selectedSet;
      sets[set] = (sets[set] || 0) + 1;
    }
    if (BuildListManager.currentBuild.weapons.slot2?.selectedSet) {
      const set = BuildListManager.currentBuild.weapons.slot2.selectedSet;
      sets[set] = (sets[set] || 0) + 1;
    }
    
    if (BuildListManager.currentBuild.accessories.slot1) {
      const set = BuildListManager.currentBuild.accessories.slot1;
      sets[set] = (sets[set] || 0) + 1;
    }
    if (BuildListManager.currentBuild.accessories.slot2) {
      const set = BuildListManager.currentBuild.accessories.slot2;
      sets[set] = (sets[set] || 0) + 1;
    }

    return sets;
  },

  /**
   * Calculate active armor sets
   */
  calculateArmorSets() {
    const sets = {};
    
    for (let i = 1; i <= 4; i++) {
      const armor = BuildListManager.currentBuild.armors[`slot${i}`];
      if (armor && armor.set) {
        sets[armor.set] = (sets[armor.set] || 0) + 1;
      }
    }

    return sets;
  },

  /**
   * Get active inner ways
   */
  getActiveInnerways() {
    return BuildListManager.currentBuild.innerways.filter(iw => iw !== null);
  },

  /**
   * Check if there's any active content
   */
  hasActiveContent() {
    const weaponSets = Object.keys(this.calculateWeaponSets()).length > 0;
    const armorSets = Object.keys(this.calculateArmorSets()).length > 0;
    const innerways = this.getActiveInnerways().length > 0;
    return weaponSets || armorSets || innerways;
  },

  /**
   * Update weapon/accessory sets display
   */
  updateWeaponSetsDisplay() {
    const sets = this.calculateWeaponSets();
    const content = document.getElementById('weaponSetsContent');
    
    if (Object.keys(sets).length === 0) {
      content.innerHTML = '';
      return;
    }

    let html = '';
    const sortedSets = Object.entries(sets).sort((a, b) => b[1] - a[1]);
    
    sortedSets.forEach(([setName, count]) => {
      const setData = this.weaponSetsData?.[setName];
      const isActive2pc = count >= 2;
      const isActive4pc = count >= 4;
      
      const badgeUrl = `${BuildListManager.ICON_BASE_URL}badge/${setName}.webp`;
      
      html += `
        <div class="set-item ${isActive2pc || isActive4pc ? 'active' : ''}">
          <div class="set-item-header">
            <img src="${badgeUrl}" class="set-item-icon" alt="${setName}" onerror="this.src='${BuildListManager.ICON_BASE_URL}badge/default.webp'">
            <div class="set-item-title">
              <span class="set-name">${setName}</span>
              <span class="set-count">(${count}/4)</span>
            </div>
          </div>
          <div class="set-item-bonuses">
            <div class="set-bonus ${isActive2pc ? 'bonus-active' : 'bonus-inactive'}">
              <span class="bonus-label">2-Piece:</span>
              <span class="bonus-text">${setData?.['2pc'] || 'Unknown'}</span>
            </div>
            <div class="set-bonus ${isActive4pc ? 'bonus-active' : 'bonus-inactive'}">
              <span class="bonus-label">4-Piece:</span>
              <span class="bonus-text">${setData?.['4pc'] || 'Unknown'}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    content.innerHTML = html;
  },

  /**
   * Update armor sets display
   */
  updateArmorSetsDisplay() {
    const sets = this.calculateArmorSets();
    const content = document.getElementById('armorSetsContent');
    
    if (Object.keys(sets).length === 0) {
      content.innerHTML = '';
      return;
    }

    let html = '';
    const sortedSets = Object.entries(sets).sort((a, b) => b[1] - a[1]);
    
    sortedSets.forEach(([setName, count]) => {
      const setData = BuildListManager.armorSetsData?.[setName];
      const isActive2pc = count >= 2;
      const isActive4pc = count >= 4;
      
      const badgeUrl = `${BuildListManager.ICON_BASE_URL}badge/${setName}.webp`;
      
      html += `
        <div class="set-item ${isActive2pc || isActive4pc ? 'active' : ''}">
          <div class="set-item-header">
            <img src="${badgeUrl}" class="set-item-icon" alt="${setName}" onerror="this.src='${BuildListManager.ICON_BASE_URL}badge/default.webp'">
            <div class="set-item-title">
              <span class="set-name">${setName}</span>
              <span class="set-count">(${count}/4)</span>
            </div>
          </div>
          <div class="set-item-bonuses">
            <div class="set-bonus ${isActive2pc ? 'bonus-active' : 'bonus-inactive'}">
              <span class="bonus-label">2-Piece:</span>
              <span class="bonus-text">${setData?.set_effect?.['2_piece'] || 'Unknown'}</span>
            </div>
            <div class="set-bonus ${isActive4pc ? 'bonus-active' : 'bonus-inactive'}">
              <span class="bonus-label">4-Piece:</span>
              <span class="bonus-text">${setData?.set_effect?.['4_piece'] || 'Unknown'}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    content.innerHTML = html;
  },

  /**
   * Update inner ways display
   */
  updateInnerwaysDisplay() {
    const innerways = this.getActiveInnerways();
    const content = document.getElementById('innerwaysContent');
    
    if (innerways.length === 0) {
      content.innerHTML = '';
      return;
    }

    let html = '<div class="innerway-grid">';
    
    innerways.forEach(innerway => {
      const details = JSON.parse(innerway.details || '{}');
      const breakthrough = JSON.parse(innerway.breakthrough || '[]');
      const iconUrl = `${BuildListManager.ICON_BASE_URL}innerway/${innerway.special_icon}.webp`;
      
      const cleanName = innerway.name.replace(' - Inner Ways', '');
      
      // Generate breakthrough popup content
      let breakthroughHTML = '<div class="breakthrough-table"><table>';
      breakthroughHTML += '<tr><th>Tier</th><th>Bonus</th></tr>';
      breakthrough.forEach(bt => {
        breakthroughHTML += `<tr><td>Tier ${bt.tier}</td><td>${bt.bonus}</td></tr>`;
      });
      breakthroughHTML += '</table></div>';
      
      html += `
        <div class="innerway-item">
          <div class="innerway-header">
            <img src="${iconUrl}" class="innerway-icon" alt="${cleanName}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
            <div class="innerway-info">
              <div class="innerway-name">${cleanName}</div>
              <div class="innerway-meta">
                <span class="innerway-rarity">${details.rarity || ''}</span>
                <span class="innerway-path">${details.path || ''}</span>
              </div>
            </div>
          </div>
          <div class="innerway-effect">
            <span class="effect-label">Effect:</span>
            <span class="effect-text">${details.effect || 'No effect description'}</span>
          </div>
          <div class="innerway-breakthrough-trigger">
            <button class="breakthrough-btn">View Breakthrough</button>
            <div class="breakthrough-popup" style="display: none;">
              ${breakthroughHTML}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    
    // Attach hover events for breakthrough popups
    this.attachBreakthroughEvents();
  },

  /**
   * Attach breakthrough popup events
   */
  attachBreakthroughEvents() {
    document.querySelectorAll('.innerway-breakthrough-trigger').forEach(trigger => {
      trigger.addEventListener('mouseenter', (e) => {
        const popup = trigger.querySelector('.breakthrough-popup');
        popup.style.display = 'block';
      });
      
      trigger.addEventListener('mouseleave', (e) => {
        const popup = trigger.querySelector('.breakthrough-popup');
        popup.style.display = 'none';
      });
    });
  },

  /**
   * Update all set displays
   */
  updateAllDisplays() {
    this.updateWeaponSetsDisplay();
    this.updateArmorSetsDisplay();
    this.updateInnerwaysDisplay();
    
    // Show/hide individual containers based on content
    const weaponSets = Object.keys(this.calculateWeaponSets()).length > 0;
    const armorSets = Object.keys(this.calculateArmorSets()).length > 0;
    const innerways = this.getActiveInnerways().length > 0;
    
    document.getElementById('weaponSetsDisplay').style.display = weaponSets ? 'block' : 'none';
    document.getElementById('armorSetsDisplay').style.display = armorSets ? 'block' : 'none';
    document.getElementById('innerwaysDisplay').style.display = innerways ? 'block' : 'none';
    
    // Show/hide wrapper only if at least one has content
    const wrapper = document.getElementById('setDisplayWrapper');
    if (this.hasActiveContent()) {
      wrapper.style.display = 'grid';
    } else {
      wrapper.style.display = 'none';
    }
  }
};

window.SetTrackerModule = SetTrackerModule;