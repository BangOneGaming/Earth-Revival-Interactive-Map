/**
 * MYSTIC MODULE
 * Handles mystic skill selection and management
 */

const MysticModule = {
  /**
   * Open mystic skill selection modal
   */
  openModal(slotNum) {
    console.log('✨ Opening mystic modal for slot:', slotNum);

    BuildListManager.currentSlot = slotNum;
    BuildListManager.currentType = 'mystic';

    const modal = document.getElementById('mysticModal');
    const modalBody = document.getElementById('mysticModalBody');

    modalBody.innerHTML = '';

    const mysticGrid = document.createElement('div');
    mysticGrid.className = 'modal-item-grid';

    Object.values(BuildListManager.mysticsData).forEach(mystic => {
      const item = this.createItem(mystic);
      mysticGrid.appendChild(item);
    });

    modalBody.appendChild(mysticGrid);
    modal.classList.add('active');
  },

  /**
   * Create mystic item element
   */
  createItem(mystic) {
    const item = document.createElement('div');
    item.className = 'modal-item';

    const iconUrl = `${BuildListManager.ICON_BASE_URL}${mystic.special_icon}.webp`;

    const isSelected = BuildListManager.currentBuild.mystics.some(
      m => m && m.special_icon === mystic.special_icon
    );
    
    if (isSelected) {
      item.classList.add('disabled');
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
    }

    const cleanName = mystic.name
      .replace(' - Mystic Skill', '')
      .replace(/\s*\(Part\s*\d+\)/gi, '');

    item.innerHTML = `
      <img src="${iconUrl}" alt="${mystic.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <div class="modal-item-name">${cleanName}</div>
      ${isSelected ? '<div style="font-size: 10px; color: #FF6B6B; margin-top: 3px;">SELECTED</div>' : ''}
    `;

    if (!isSelected) {
      item.addEventListener('click', () => this.select(mystic));
    }

    return item;
  },

  /**
   * Select mystic skill
   */
  select(mystic) {
    const slotNum = BuildListManager.currentSlot;
    
    BuildListManager.currentBuild.mystics[slotNum - 1] = mystic;

    const slot = document.querySelector(`.martial-slot[data-type="mystic"][data-slot="${slotNum}"]`);
    const iconUrl = `${BuildListManager.ICON_BASE_URL}${mystic.special_icon}.webp`;

    slot.classList.add('filled');
    slot.innerHTML = `
      <img src="${iconUrl}" alt="${mystic.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <button class="remove-btn" onclick="MysticModule.remove(${slotNum})">×</button>
    `;

    BuildListManager.closeModal('mysticModal');
    BuildListManager.saveBuildToStorage();
  },

  /**
   * Remove mystic skill
   */
  remove(slotNum) {
    BuildListManager.currentBuild.mystics[slotNum - 1] = null;
    
    const slot = document.querySelector(`.martial-slot[data-type="mystic"][data-slot="${slotNum}"]`);
    slot.classList.remove('filled');
    slot.innerHTML = '<div class="martial-placeholder">+</div>';
    
    BuildListManager.saveBuildToStorage();
  }
};

window.MysticModule = MysticModule;