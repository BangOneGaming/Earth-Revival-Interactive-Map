/**
 * MAIN BUILD LIST MANAGER
 * Core system for Where Winds Meet build management
 */

const ICON_BASE_URL = "https://tiles.bgonegaming.win/wherewindmeet/Simbol/";

const BuildListManager = {
  // Data storage
  weaponsData: null,
  innerwaysData: null,
  mysticsData: null,
  armorSetsData: null,

  // Build state
  currentBuild: {
    weapons: { slot1: null, slot2: null },
    accessories: { slot1: null, slot2: null },
    armors: { slot1: null, slot2: null, slot3: null, slot4: null },
    innerways: [],
    mystics: []
  },

  // Modal state
  currentSlot: null,
  currentType: null,
  tempWeapon: null,

  // API Endpoints
  ENDPOINTS: {
    armorsets: 'https://autumn-dream-8c07.square-spon.workers.dev/armorsetslist',
    weapons: 'https://autumn-dream-8c07.square-spon.workers.dev/weaponbuildlist',
    innerways: 'https://autumn-dream-8c07.square-spon.workers.dev/innerwayslist',
    mystics: 'https://autumn-dream-8c07.square-spon.workers.dev/mysticlist'
  },

  ICON_BASE_URL: ICON_BASE_URL,

  /**
   * Initialize the build system
   */
  async init() {
    console.log('🚀 Initializing Build List Creator...');
    
    await this.loadData();
    await SetTrackerModule.init();
    await AuthModule.init();
    BuildDescriptionModule.init();
    BuildTabsModule.init();
    this.attachEventListeners();
    this.loadSavedBuild();
    SetTrackerModule.updateAllDisplays();

    console.log('✅ Build List Creator ready!');
  },

  /**
   * Load all data from APIs
   */
  async loadData() {
    try {
      const [weaponsRes, innerwaysRes, mysticsRes, armorSetsRes] = await Promise.all([
        fetch(this.ENDPOINTS.weapons),
        fetch(this.ENDPOINTS.innerways),
        fetch(this.ENDPOINTS.mystics),
        fetch(this.ENDPOINTS.armorsets)
      ]);

      this.weaponsData = await weaponsRes.json();
      this.innerwaysData = await innerwaysRes.json();
      this.mysticsData = await mysticsRes.json();
      this.armorSetsData = await armorSetsRes.json();

      console.log('✅ All data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    }
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Weapon slots
    document.getElementById('weaponSlot1').addEventListener('click', () => {
      WeaponModule.openModal(1);
    });
    document.getElementById('weaponSlot2').addEventListener('click', () => {
      WeaponModule.openModal(2);
    });

    // Accessory slots
    document.querySelectorAll('.accessory-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-btn')) {
          const slotNum = parseInt(slot.dataset.slot);
          AccessoryModule.openModal(slotNum);
        }
      });
    });

    // Armor slots
    document.querySelectorAll('.armor-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-btn')) {
          const slotNum = parseInt(slot.dataset.slot);
          ArmorModule.openModal(slotNum);
        }
      });
    });

    // Inner way slots
    document.querySelectorAll('.martial-slot[data-type="innerway"]').forEach(slot => {
      slot.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-btn')) {
          const slotNum = parseInt(slot.dataset.slot);
          InnerwayModule.openModal(slotNum);
        }
      });
    });

    // Mystic skill slots
    document.querySelectorAll('.martial-slot[data-type="mystic"]').forEach(slot => {
      slot.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-btn')) {
          const slotNum = parseInt(slot.dataset.slot);
          MysticModule.openModal(slotNum);
        }
      });
    });

    // Modal close buttons
    this.attachModalCloseListeners();

    // Save build button - FIXED: Upload to server instead of download
    document.getElementById('saveBuildBtn').addEventListener('click', () => {
      this.saveBuild();
    });
  },

  /**
   * Attach modal close listeners
   */
  attachModalCloseListeners() {
    const modals = [
      'weaponModal', 'setsModal', 'accessoryModal', 
      'armorModal', 'innerwayModal', 'mysticModal'
    ];

    modals.forEach(modalId => {
      const closeBtn = document.getElementById(`close${modalId.charAt(0).toUpperCase() + modalId.slice(1).replace('Modal', '')}Modal`);
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modalId));
      }

      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModal(modalId);
        });
      }
    });
  },

  /**
   * Close modal
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  /**
   * Save build to localStorage
   */
  saveBuildToStorage() {
    localStorage.setItem('whereWindsMeetBuild', JSON.stringify(this.currentBuild));
    SetTrackerModule.updateAllDisplays();
  },

  /**
   * Load saved build from localStorage
   */
  loadSavedBuild() {
    const saved = localStorage.getItem('whereWindsMeetBuild');
    if (!saved) return;

    try {
      this.currentBuild = JSON.parse(saved);
      
      // Restore weapons
      if (this.currentBuild.weapons.slot1) {
        const saved1 = this.currentBuild.weapons.slot1;
        if (saved1.weapon && saved1.selectedSet) {
          this.currentSlot = 1;
          WeaponModule.selectWithSet(saved1.weapon, saved1.selectedSet);
        }
      }
      if (this.currentBuild.weapons.slot2) {
        const saved2 = this.currentBuild.weapons.slot2;
        if (saved2.weapon && saved2.selectedSet) {
          this.currentSlot = 2;
          WeaponModule.selectWithSet(saved2.weapon, saved2.selectedSet);
        }
      }

      // Restore accessories
      if (this.currentBuild.accessories.slot1) {
        this.currentSlot = 1;
        AccessoryModule.select(this.currentBuild.accessories.slot1);
      }
      if (this.currentBuild.accessories.slot2) {
        this.currentSlot = 2;
        AccessoryModule.select(this.currentBuild.accessories.slot2);
      }

      // Restore armors
      if (this.currentBuild.armors) {
        for (let i = 1; i <= 4; i++) {
          if (this.currentBuild.armors[`slot${i}`]) {
            this.currentSlot = i;
            ArmorModule.select(this.currentBuild.armors[`slot${i}`]);
          }
        }
      }

      // Restore innerways
      this.currentBuild.innerways.forEach((innerway, index) => {
        if (innerway) {
          this.currentSlot = index + 1;
          InnerwayModule.select(innerway);
        }
      });

      // Restore mystics
      this.currentBuild.mystics.forEach((mystic, index) => {
        if (mystic) {
          this.currentSlot = index + 1;
          MysticModule.select(mystic);
        }
      });

      console.log('✅ Build loaded from storage');
    } catch (error) {
      console.error('❌ Failed to load saved build:', error);
    }
  },

  /**
   * Save and upload build to server
   * FIXED: Now uploads to server via BuildAPIModule instead of downloading JSON
   */
  async saveBuild() {
    console.log('🔄 Starting build save process...');
    
    try {
      // FIXED: Use sharedAuth instead of AuthModule
      let user = null;
      
      // Check which auth system is available
      if (window.sharedAuth && window.sharedAuth.isLoggedIn()) {
        user = window.sharedAuth.getUser();
        console.log('✅ User from sharedAuth:', user);
      } else if (AuthModule && AuthModule.getCurrentUser()) {
        user = AuthModule.getCurrentUser();
        console.log('✅ User from AuthModule:', user);
      }
      
      console.log('👤 Final user:', user ? `${user.name} (${user.email})` : 'Not logged in');
      
      if (!user) {
        console.warn('⚠️ User not logged in - aborting save');
        alert('⚠️ Please login first to save your build!');
        
        // Open login modal (prioritize the active system)
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
          loginModal.style.display = 'flex';
          console.log('📝 Login modal opened');
        }
        return;
      }

      // Validate build has at least one weapon
      if (!this.currentBuild.weapons.slot1 && !this.currentBuild.weapons.slot2) {
        console.warn('⚠️ No weapons selected - aborting save');
        alert('⚠️ Please select at least one weapon before saving!');
        return;
      }

      // Get save button
      const btn = document.getElementById('saveBuildBtn');
      const originalText = btn.textContent;
      
      // Show loading state
      btn.textContent = '💾 Saving...';
      btn.disabled = true;
      console.log('⏳ Button disabled, showing loading state');

      // Prepare build data with timestamp and description
      const buildData = {
        ...this.currentBuild,
        savedAt: new Date().toISOString(),
        description: BuildDescriptionModule.getDescriptionData()
      };
      
      console.log('📦 Build data prepared:', buildData);
      console.log('📝 Description included:', buildData.description);

      // Save to localStorage (for backup)
      this.saveBuildToStorage();
      console.log('💾 Build saved to localStorage as backup');

      // Upload to server via BuildAPIModule
      console.log('🚀 Sending build to server...');
      console.log('📤 Request payload:', {
        user: user.email,
        weaponsCount: Object.values(buildData.weapons).filter(Boolean).length,
        accessoriesCount: Object.values(buildData.accessories).filter(Boolean).length,
        armorsCount: Object.values(buildData.armors).filter(Boolean).length,
        innerwaysCount: buildData.innerways.length,
        mysticsCount: buildData.mystics.length
      });
      
      const result = await BuildAPIModule.saveBuild(buildData);
      
      console.log('✅ ========== SERVER RESPONSE ==========');
      console.log('✅ Full response:', result);
      console.log('✅ Build ID:', result.build?.id || result.buildId || result.id);
      console.log('✅ Status:', result.message || result.status);
      console.log('✅ Created At:', result.build?.createdAt || result.createdAt);
      console.log('✅ Updated At:', result.build?.updatedAt || result.updatedAt);
      console.log('✅ ======================================');
      
      // Trigger event for tab refresh
      window.dispatchEvent(new CustomEvent('buildSaved', { 
        detail: { buildId: result.build?.id, build: result.build } 
      }));
      
      // Show success
      alert('✅ Build saved successfully to server!');
      btn.textContent = '✓ Saved!';
      console.log('✅ UI updated - save successful');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        console.log('🔄 Button reset to original state');
      }, 2000);

    } catch (error) {
      console.error('❌ ========== SAVE FAILED ==========');
      console.error('❌ Error type:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ ===================================');
      
      // Show error message
      alert('❌ Failed to save build: ' + error.message);
      
      // Reset button
      const btn = document.getElementById('saveBuildBtn');
      btn.textContent = '💾 Save Build';
      btn.disabled = false;
      console.log('🔄 Button reset after error');
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BuildListManager.init());
} else {
  BuildListManager.init();
}

window.BuildListManager = BuildListManager;