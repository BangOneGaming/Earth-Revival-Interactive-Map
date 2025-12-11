/**
 * ARMOR MODULE
 * Handles armor selection and management
 */

const ArmorModule = {
  /**
   * Open armor selection modal
   */
  openModal(slotNum) {
    console.log('🛡️ Opening armor modal for slot:', slotNum);

    BuildListManager.currentSlot = slotNum;
    BuildListManager.currentType = 'armor';

    const modal = document.getElementById('armorModal');
    if (!modal) {
      console.error('❌ Armor modal not found in DOM!');
      return;
    }

    const modalBody = document.getElementById('armorModalBody');
    modalBody.innerHTML = '';

    const armorGrid = document.createElement('div');
    armorGrid.className = 'modal-item-grid';

    if (!BuildListManager.armorSetsData) {
      console.error('❌ Armor sets data not loaded yet!');
      return;
    }

    const allArmors = Object.values(BuildListManager.armorSetsData);

    allArmors.forEach(armorObj => {
      const item = this.createItem(armorObj);
      armorGrid.appendChild(item);
    });

    modalBody.appendChild(armorGrid);
    modal.classList.add('active');

    console.log('✅ Armor modal opened successfully');
  },

  /**
   * Create armor item element
   */
createItem(armor) {
  const item = document.createElement('div');
  item.className = 'modal-item';

  // ✅ Pakai badge set image (BUKAN default.webp lagi!)
  const iconUrl = `${BuildListManager.ICON_BASE_URL}badge/${armor.set}.webp`;

  item.innerHTML = `
    <img src="${iconUrl}" alt="${armor.name}" onerror="this.src='${BuildListManager.ICON_BASE_URL}badge/default.webp'">
    <div class="modal-item-name">${armor.name}</div>
  `;

    item.addEventListener('click', () => this.select(armor));

    return item;
  },

  /**
   * Select armor
   */
  select(armorData) {
    if (!armorData) {
      console.error('❌ No armor data provided');
      return;
    }

    const slotNum = BuildListManager.currentSlot;

    BuildListManager.currentBuild.armors[`slot${slotNum}`] = armorData;

    const slot = document.querySelector(`.armor-slot[data-slot="${slotNum}"]`);
    
    if (!slot) {
      console.error(`❌ Armor slot ${slotNum} not found`);
      return;
    }
    
    // Use special_icon for armor image (Agile, Flawless, Beyond, etc)
    const iconUrl = `${BuildListManager.ICON_BASE_URL}armors/${armorData.special_icon}.webp`;
    
    // Use set name for badge (Agile Steps, Flawless Defense, etc)
    const badgeUrl = `${BuildListManager.ICON_BASE_URL}badge/${armorData.set}.webp`;

    slot.classList.add('filled');

    const img = slot.querySelector('.slot-placeholder');
    // JANGAN ganti src! Placeholder sudah ada di HTML
    // Cukup hilangkan grayscale dan buat tidak transparent
    img.style.opacity = '1';
    img.style.filter = 'grayscale(0%) drop-shadow(2px 2px 4px rgba(0,0,0,0.6))';

    const badge = slot.querySelector('.slot-badge');
    
    // Test if badge image exists
    const badgeImg = new Image();
    badgeImg.onload = () => {
      console.log(`✅ Badge found: ${badgeUrl}`);
      badge.style.backgroundImage = `url('${badgeUrl}')`;
      badge.style.display = 'block';
    };
    badgeImg.onerror = () => {
      console.warn(`⚠️ Badge NOT found: ${badgeUrl}`);
      console.log(`🔄 Trying default badge...`);
      const defaultBadgeUrl = `${BuildListManager.ICON_BASE_URL}badge/default.webp`;
      badge.style.backgroundImage = `url('${defaultBadgeUrl}')`;
      badge.style.display = 'block';
      console.log(`📌 Using default badge: ${defaultBadgeUrl}`);
    };
    badgeImg.src = badgeUrl;

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

    console.log(`✅ Armor selected: ${armorData.name} (icon: ${armorData.special_icon}, set: ${armorData.set})`);

    BuildListManager.closeModal('armorModal');
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  },

  /**
   * Remove armor
   */
  remove(slotNum) {
    BuildListManager.currentBuild.armors[`slot${slotNum}`] = null;
    
    const slot = document.querySelector(`.armor-slot[data-slot="${slotNum}"]`);
    slot.classList.remove('filled');
    
    const img = slot.querySelector('.slot-placeholder');
    const armorPlaceholders = ['Helm', 'Body', 'Bracers', 'Greaves'];
    
    // Reset to original placeholder
    img.src = `${BuildListManager.ICON_BASE_URL}accessories/${armorPlaceholders[slotNum - 1]}.webp`;
    img.style.opacity = '0.3';
    img.style.filter = 'grayscale(100%)';
    
    // Fallback for placeholder
    img.onerror = () => { 
      img.src = `${BuildListManager.ICON_BASE_URL}default.png`;
      img.onerror = null;
    };
    
    const badge = slot.querySelector('.slot-badge');
    badge.style.backgroundImage = '';
    badge.style.display = 'none';
    
    const removeBtn = slot.querySelector('.remove-btn');
    if (removeBtn) removeBtn.remove();
    
    BuildListManager.saveBuildToStorage();
    SetTrackerModule.updateAllDisplays();
  }
};

window.ArmorModule = ArmorModule;