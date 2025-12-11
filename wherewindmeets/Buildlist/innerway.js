/**
 * INNERWAY MODULE
 * Handles inner way selection and management
 */

const InnerwayModule = {
  /**
   * Open innerway selection modal
   */
  openModal(slotNum) {
    console.log('🧘 Opening innerway modal for slot:', slotNum);

    BuildListManager.currentSlot = slotNum;
    BuildListManager.currentType = 'innerway';

    const modal = document.getElementById('innerwayModal');
    const modalBody = document.getElementById('innerwayModalBody');

    modalBody.innerHTML = '';

    const innerwayGrid = document.createElement('div');
    innerwayGrid.className = 'modal-item-grid';

    Object.values(BuildListManager.innerwaysData).forEach(innerway => {
      const item = this.createItem(innerway);
      innerwayGrid.appendChild(item);
    });

    modalBody.appendChild(innerwayGrid);
    modal.classList.add('active');
  },

  /**
   * Create innerway item element
   */
  createItem(innerway) {
    const item = document.createElement('div');
    item.className = 'modal-item';

    const iconUrl = `${BuildListManager.ICON_BASE_URL}innerway/${innerway.special_icon}.webp`;

    const isSelected = BuildListManager.currentBuild.innerways.some(
      iw => iw && iw.special_icon === innerway.special_icon
    );
    
    if (isSelected) {
      item.classList.add('disabled');
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
    }

    const cleanName = innerway.name
      .replace(' - Inner Ways', '')
      .replace(/\s*\(Part\s*\d+\)/gi, '');

    item.innerHTML = `
      <img src="${iconUrl}" alt="${innerway.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <div class="modal-item-name">${cleanName}</div>
      ${isSelected ? '<div style="font-size: 10px; color: #FF6B6B; margin-top: 3px;">SELECTED</div>' : ''}
    `;

    if (!isSelected) {
      item.addEventListener('click', () => this.select(innerway));
    }

    return item;
  },

  /**
   * Select innerway
   */
  select(innerway) {
    const slotNum = BuildListManager.currentSlot;
    
    BuildListManager.currentBuild.innerways[slotNum - 1] = innerway;

    const slot = document.querySelector(`.martial-slot[data-type="innerway"][data-slot="${slotNum}"]`);
    const iconUrl = `${BuildListManager.ICON_BASE_URL}innerway/${innerway.special_icon}.webp`;

    slot.classList.add('filled');
    slot.innerHTML = `
      <img src="${iconUrl}" alt="${innerway.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}default.png'">
      <button class="remove-btn" onclick="InnerwayModule.remove(${slotNum})">×</button>
    `;

    BuildListManager.closeModal('innerwayModal');
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  },

  /**
   * Remove innerway
   */
  remove(slotNum) {
    BuildListManager.currentBuild.innerways[slotNum - 1] = null;
    
    const slot = document.querySelector(`.martial-slot[data-type="innerway"][data-slot="${slotNum}"]`);
    slot.classList.remove('filled');
    slot.innerHTML = '<div class="martial-placeholder">+</div>';
    
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  }
};

window.InnerwayModule = InnerwayModule;