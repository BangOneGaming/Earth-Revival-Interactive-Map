/**
 * WEAPON MODULE (WITH LOGIN CHECK)
 * Handles weapon selection and set management
 */

const WeaponModule = {
  /**
   * Open weapon selection modal (WITH LOGIN CHECK)
   */
  openModal(slotNum) {
    // ✅ CHECK LOGIN FIRST
    if (!window.requireLoginForSlot) {
      console.error('❌ requireLoginForSlot not available');
      return;
    }

    const proceed = window.requireLoginForSlot(() => {
      this._openModalInternal(slotNum);
    });

    if (!proceed) {
      console.log('🔒 Waiting for login...');
    }
  },

  /**
   * Internal modal opening (after login check)
   */
  _openModalInternal(slotNum) {
    console.log('⚔️ Opening weapon modal for slot:', slotNum);

    BuildListManager.currentSlot = slotNum;
    BuildListManager.currentType = 'weapon';

    const modal = document.getElementById('weaponModal');
    const modalBody = document.getElementById('weaponModalBody');

    modalBody.innerHTML = '';

    const categories = ['Swords', 'Dual Blades', 'Spears', 'Mo Blades', 'Rope Darts', 'Umbrellas', 'Fans'];
    
    categories.forEach(category => {
      const weapons = BuildListManager.weaponsData[category];
      if (!weapons || weapons.length === 0) return;

      const categorySection = document.createElement('div');
      categorySection.style.marginBottom = '30px';

      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category;
      categoryTitle.className = 'weapon-category-title';
      categorySection.appendChild(categoryTitle);

      const weaponGrid = document.createElement('div');
      weaponGrid.className = 'modal-item-grid';

      weapons.forEach(weapon => {
        const weaponItem = this.createItem(weapon);
        weaponGrid.appendChild(weaponItem);
      });

      categorySection.appendChild(weaponGrid);
      modalBody.appendChild(categorySection);
    });

    modal.classList.add('active');
  },

  /**
   * Create weapon item element
   */
  createItem(weapon) {
    const item = document.createElement('div');
    item.className = 'modal-item';

    const iconUrl = `${BuildListManager.ICON_BASE_URL}weapons/${weapon.special_icons}.webp`;

    const isSelected = Object.values(BuildListManager.currentBuild.weapons).some(
      w => w && w.weapon && w.weapon.special_icons === weapon.special_icons
    );
    
    if (isSelected) {
      item.classList.add('disabled');
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
    }

    item.innerHTML = `
      <img src="${iconUrl}" alt="${weapon.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <div class="modal-item-name">${weapon.name}</div>
      <div style="font-size: 12px; color: #DAA520; margin-top: 5px;">${weapon.role}</div>
      <div style="font-size: 11px; color: #888; margin-top: 3px;">${weapon.path}</div>
      ${isSelected ? '<div style="font-size: 10px; color: #FF6B6B; margin-top: 3px;">SELECTED</div>' : ''}
    `;

    if (!isSelected) {
      item.addEventListener('click', () => this.select(weapon));
    }

    return item;
  },

  /**
   * Select weapon - opens sets modal
   */
  select(weapon) {
    console.log('⚔️ Selecting weapon:', weapon.name);
    
    BuildListManager.tempWeapon = weapon;
    BuildListManager.closeModal('weaponModal');
    this.openSetsModal(weapon);
  },

  /**
   * Open sets selection modal
   */
  openSetsModal(weapon) {
    console.log('🎨 Opening sets modal for weapon:', weapon.name);
    
    const modal = document.getElementById('setsModal');
    const modalBody = document.getElementById('setsModalBody');

    if (!modal || !modalBody) {
      console.error('❌ Sets modal not found in DOM!');
      return;
    }

    modalBody.innerHTML = '';

    const setsGrid = document.createElement('div');
    setsGrid.className = 'modal-item-grid';

    weapon.sets.forEach(setName => {
      const setItem = this.createSetItem(setName);
      setsGrid.appendChild(setItem);
    });

    modalBody.appendChild(setsGrid);
    modal.classList.add('active');
    
    console.log('✅ Sets modal opened with', weapon.sets.length, 'sets');
  },

  /**
   * Create set item element
   */
  createSetItem(setName) {
    const item = document.createElement('div');
    item.className = 'modal-item';

    const iconUrl = `${BuildListManager.ICON_BASE_URL}badge/${setName}.webp`;

    item.innerHTML = `
      <img src="${iconUrl}" alt="${setName}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <div class="modal-item-name">${setName}</div>
    `;

    item.addEventListener('click', () => {
      this.selectWithSet(BuildListManager.tempWeapon, setName);
    });

    return item;
  },

  /**
   * Final selection with set
   */
  selectWithSet(weapon, selectedSet) {
    console.log('✅ Final selection - Weapon:', weapon.name, 'Set:', selectedSet);
    
    const slotNum = BuildListManager.currentSlot;
    
    BuildListManager.currentBuild.weapons[`slot${slotNum}`] = {
      weapon: weapon,
      selectedSet: selectedSet
    };

    const slotContainer = document.getElementById(`weaponSlot${slotNum}`);
    const iconUrl = `${BuildListManager.ICON_BASE_URL}weapons/${weapon.special_icons}.webp`;
    const setBadgeUrl = `${BuildListManager.ICON_BASE_URL}badge/${selectedSet}.webp`;

    slotContainer.innerHTML = `
      <img src="${iconUrl}" alt="${weapon.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <div class="weapon-badge" style="position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; background: url('${setBadgeUrl}') center/contain no-repeat; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));"></div>
    `;

    const pathBadgeUrl = `${BuildListManager.ICON_BASE_URL}badge/${weapon.path}.webp`;
    
    document.querySelector(`#weaponInfo${slotNum} .weapon-name`).textContent = weapon.name;
    document.querySelector(`#weaponInfo${slotNum} .weapon-role`).textContent = weapon.role;
    document.querySelector(`#weaponInfo${slotNum} .weapon-path`).innerHTML = 
      `<img src="${pathBadgeUrl}" style="width:20px; height:20px; vertical-align:middle; margin-right:5px;" onerror="this.style.display='none'">${weapon.path}`;

    console.log('✅ Weapon with set selected successfully');
    
    BuildListManager.closeModal('setsModal');
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  }
};

window.WeaponModule = WeaponModule;