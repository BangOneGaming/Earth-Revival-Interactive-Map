/**
 * ACCESSORY MODULE (WITH LOGIN CHECK)
 * Handles accessory selection and management
 */

const AccessoryModule = {
  /**
   * Open accessory selection modal (WITH LOGIN CHECK)
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
    console.log('🎭 Opening accessory modal for slot:', slotNum);
    
    BuildListManager.currentSlot = slotNum;
    BuildListManager.currentType = 'accessory';

    const modal = document.getElementById('accessoryModal');
    
    if (!modal) {
      console.error('❌ Accessory modal not found in DOM!');
      return;
    }

    const modalBody = document.getElementById('accessoryModalBody');
    modalBody.innerHTML = '';

    const accessoryGrid = document.createElement('div');
    accessoryGrid.className = 'modal-item-grid';

    const allAccessories = new Set();
    
    if (!BuildListManager.weaponsData) {
      console.error('❌ Weapons data not loaded yet!');
      return;
    }

    Object.values(BuildListManager.weaponsData).forEach(category => {
      category.forEach(weapon => {
        weapon.sets.forEach(set => allAccessories.add(set));
      });
    });

    console.log('🎯 Found accessories:', Array.from(allAccessories));

    Array.from(allAccessories).sort().forEach(accessoryName => {
      const item = this.createItem(accessoryName);
      accessoryGrid.appendChild(item);
    });

    modalBody.appendChild(accessoryGrid);
    modal.classList.add('active');
    
    console.log('✅ Modal opened successfully');
  },

  /**
   * Create accessory item element
   */
  createItem(accessoryName) {
    const item = document.createElement('div');
    item.className = 'modal-item';

    const iconUrl = `${BuildListManager.ICON_BASE_URL}badge/${accessoryName}.webp`;

    item.innerHTML = `
      <img src="${iconUrl}" alt="${accessoryName}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <div class="modal-item-name">${accessoryName}</div>
    `;

    item.addEventListener('click', () => this.select(accessoryName));

    return item;
  },

  /**
   * Select accessory
   */
  select(accessoryName) {
    const slotNum = BuildListManager.currentSlot;
    
    BuildListManager.currentBuild.accessories[`slot${slotNum}`] = accessoryName;

    const slot = document.querySelector(`.accessory-slot[data-slot="${slotNum}"]`);
    const iconUrl = `${BuildListManager.ICON_BASE_URL}accessories/${accessoryName}.webp`;
    const badgeUrl = `${BuildListManager.ICON_BASE_URL}badge/${accessoryName}.webp`;
    
    slot.classList.add('filled');
    
    const img = slot.querySelector('.slot-placeholder');
    img.src = iconUrl;
    img.style.opacity = '1';
    img.style.filter = 'grayscale(0%) drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6))';
    img.onerror = () => { img.src = `${BuildListManager.ICON_BASE_URL}default.png`; };
    
    const badge = slot.querySelector('.slot-badge');
    badge.style.backgroundImage = `url('${badgeUrl}')`;
    badge.style.display = 'block';
    
    if (!slot.querySelector('.remove-btn')) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        this.remove(slotNum);
      };
      slot.appendChild(removeBtn);
    }

    BuildListManager.closeModal('accessoryModal');
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  },

  /**
   * Remove accessory
   */
  remove(slotNum) {
    BuildListManager.currentBuild.accessories[`slot${slotNum}`] = null;
    
    const slot = document.querySelector(`.accessory-slot[data-slot="${slotNum}"][data-type="accessory"]`);
    slot.classList.remove('filled');
    
    const img = slot.querySelector('.slot-placeholder');
    img.src = `https://tiles.bgonegaming.win/wherewindmeet/Simbol/accessories/Disc${slotNum}.webp`;
    img.style.opacity = '0.3';
    img.style.filter = 'grayscale(100%)';
    
    const badge = slot.querySelector('.slot-badge');
    badge.style.backgroundImage = '';
    badge.style.display = 'none';
    
    const removeBtn = slot.querySelector('.remove-btn');
    if (removeBtn) removeBtn.remove();
    
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  }
};

window.AccessoryModule = AccessoryModule;