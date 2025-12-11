/**
 * BUILD DESCRIPTION MODULE
 * Handles build description, difficulty, tags, screenshot, and video links
 */

const BuildDescriptionModule = {
  descriptionData: {
    title: '',
    description: '',
    difficulty: '',
    tags: [],
    screenshot: null,
    screenshotPreview: null,
    videoLinks: {
      youtube: '',
      tiktok: '',
      facebook: ''
    }
  },

  difficultyLevels: [
    'Easy',
    'Flexible',
    'Normal',
    'Moderate',
    'Complex',
    'Requires Practice',
    'Advanced'
  ],

  availableTags: [
    'Tank',
    'Heal',
    'Melee DPS',
    'Ranged DPS',
    'PVP',
    'PVE',
    'Explore',
    'Boss Fight',
    'Solo',
    'Group',
    'Beginner Friendly',
    'Other'
  ],

  /**
   * Initialize build description
   */
  init() {
    console.log('📝 Initializing Build Description...');
    this.createDescriptionContainer();
    this.attachEventListeners();
    this.loadSavedDescription();
    console.log('✅ Build Description ready!');
  },

  /**
   * Create description container
   */
  createDescriptionContainer() {
    const buildContainer = document.querySelector('.build-container');
    if (!buildContainer) {
      console.error('❌ Build container not found');
      return;
    }
    
    const descContainer = document.createElement('div');
    descContainer.id = 'buildDescriptionContainer';
    descContainer.className = 'build-description-container';
    
    descContainer.innerHTML = `
      <h3 class="description-title">
        <img src="${BuildListManager.ICON_BASE_URL}knoweverything.webp" class="description-title-icon" alt="Description">
        Build Description & Details
      </h3>
      
      <div class="description-content">
        
        <!-- Build Title -->
        <div class="description-field">
          <label class="field-label">Build Title *</label>
          <input 
            type="text" 
            id="buildTitle" 
            class="description-input" 
            placeholder="Give your build a catchy name..."
            maxlength="100"
          />
          <p class="field-hint">e.g., "Immortal Tank Build", "One-Shot Assassin", "Support Healer"</p>
        </div>

        <!-- Description Text Area -->
        <div class="description-field">
          <label class="field-label">Build Description *</label>
          <textarea 
            id="buildDescriptionText" 
            class="description-textarea" 
            placeholder="Describe your build strategy, playstyle, combos, and tips..."
            rows="6"
          ></textarea>
          <p class="field-hint">Explain how to play this build, key combos, and when to use it</p>
        </div>

        <!-- Difficulty & Tags Row -->
        <div class="description-row">
          
          <!-- Difficulty Selector -->
          <div class="description-field">
            <label class="field-label">Difficulty *</label>
            <select id="buildDifficulty" class="description-select">
              <option value="">Select Difficulty</option>
              ${this.difficultyLevels.map(level => `<option value="${level}">${level}</option>`).join('')}
            </select>
          </div>

          <!-- Tags Selector -->
          <div class="description-field description-field-wide">
            <label class="field-label">Tags (Select multiple) *</label>
            <div class="tags-container" id="tagsContainer">
              ${this.availableTags.map(tag => `
                <label class="tag-checkbox">
                  <input type="checkbox" value="${tag}" class="tag-input">
                  <span class="tag-label">${tag}</span>
                </label>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Screenshot Upload -->
        <div class="description-field">
          <label class="field-label">Screenshot (Optional)</label>
          <div class="screenshot-upload-area">
            <input type="file" id="screenshotInput" accept="image/*" style="display: none;">
            <button class="screenshot-upload-btn" id="screenshotUploadBtn">
              📷 Upload Screenshot
            </button>
            <div id="screenshotPreview" class="screenshot-preview" style="display: none;">
              <img id="screenshotPreviewImg" src="" alt="Screenshot">
              <button class="screenshot-remove-btn" id="screenshotRemoveBtn">×</button>
            </div>
            <p class="field-hint">Show stats screen or build showcase</p>
          </div>
        </div>

        <!-- Video Links -->
        <div class="description-field">
          <label class="field-label">Showcase Video Link (Optional)</label>
          <div class="video-links-container">
            <div class="video-link-item">
              <span class="video-icon">▶️ YouTube</span>
              <input type="url" id="youtubeLink" class="video-input" placeholder="https://youtube.com/watch?v=...">
            </div>
            <div class="video-link-item">
              <span class="video-icon">🎵 TikTok</span>
              <input type="url" id="tiktokLink" class="video-input" placeholder="https://tiktok.com/@user/video/...">
            </div>
            <div class="video-link-item">
              <span class="video-icon">👥 Facebook</span>
              <input type="url" id="facebookLink" class="video-input" placeholder="https://facebook.com/watch?v=...">
            </div>
          </div>
        </div>

      </div>
    `;
    
    // Insert after build-container
    buildContainer.parentNode.insertBefore(descContainer, buildContainer.nextSibling);
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Build title
    const titleInput = document.getElementById('buildTitle');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.descriptionData.title = e.target.value;
        this.saveDescription();
      });
    }

    // Description text
    const descText = document.getElementById('buildDescriptionText');
    if (descText) {
      descText.addEventListener('input', (e) => {
        this.descriptionData.description = e.target.value;
        this.saveDescription();
      });
    }

    // Difficulty selector
    const difficulty = document.getElementById('buildDifficulty');
    if (difficulty) {
      difficulty.addEventListener('change', (e) => {
        this.descriptionData.difficulty = e.target.value;
        this.saveDescription();
      });
    }

    // Tags checkboxes
    document.querySelectorAll('.tag-input').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateTags();
        this.saveDescription();
      });
    });

    // Screenshot upload
    const uploadBtn = document.getElementById('screenshotUploadBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        document.getElementById('screenshotInput').click();
      });
    }

    const screenshotInput = document.getElementById('screenshotInput');
    if (screenshotInput) {
      screenshotInput.addEventListener('change', (e) => {
        this.handleScreenshotUpload(e);
      });
    }

    const removeBtn = document.getElementById('screenshotRemoveBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.removeScreenshot();
      });
    }

    // Video links
    ['youtubeLink', 'tiktokLink', 'facebookLink'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', (e) => {
          const platform = id.replace('Link', '');
          this.descriptionData.videoLinks[platform] = e.target.value;
          this.saveDescription();
        });
      }
    });
  },

  /**
   * Update tags from checkboxes
   */
  updateTags() {
    const selectedTags = Array.from(document.querySelectorAll('.tag-input:checked'))
      .map(checkbox => checkbox.value);
    this.descriptionData.tags = selectedTags;
  },

  /**
   * Handle screenshot upload
   */
  handleScreenshotUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ File size too large. Maximum 5MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.descriptionData.screenshot = file.name;
      this.descriptionData.screenshotPreview = e.target.result;
      
      // Show preview
      const preview = document.getElementById('screenshotPreview');
      const img = document.getElementById('screenshotPreviewImg');
      if (preview && img) {
        img.src = e.target.result;
        preview.style.display = 'block';
      }
      
      this.saveDescription();
    };
    reader.readAsDataURL(file);
  },

  /**
   * Remove screenshot
   */
  removeScreenshot() {
    this.descriptionData.screenshot = null;
    this.descriptionData.screenshotPreview = null;
    
    const preview = document.getElementById('screenshotPreview');
    const input = document.getElementById('screenshotInput');
    
    if (preview) preview.style.display = 'none';
    if (input) input.value = '';
    
    this.saveDescription();
  },

  /**
   * Save description to localStorage
   */
  saveDescription() {
    localStorage.setItem('whereWindsMeetBuildDescription', JSON.stringify(this.descriptionData));
  },

  /**
   * Load saved description
   */
  loadSavedDescription() {
    const saved = localStorage.getItem('whereWindsMeetBuildDescription');
    if (!saved) return;

    try {
      this.descriptionData = JSON.parse(saved);
      
      // Restore title
      const titleInput = document.getElementById('buildTitle');
      if (titleInput && this.descriptionData.title) {
        titleInput.value = this.descriptionData.title;
      }
      
      // Restore description text
      const descText = document.getElementById('buildDescriptionText');
      if (descText && this.descriptionData.description) {
        descText.value = this.descriptionData.description;
      }
      
      // Restore difficulty
      const difficulty = document.getElementById('buildDifficulty');
      if (difficulty && this.descriptionData.difficulty) {
        difficulty.value = this.descriptionData.difficulty;
      }
      
      // Restore tags
      if (this.descriptionData.tags) {
        this.descriptionData.tags.forEach(tag => {
          const checkbox = document.querySelector(`.tag-input[value="${tag}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
      
      // Restore screenshot preview
      if (this.descriptionData.screenshotPreview) {
        const preview = document.getElementById('screenshotPreview');
        const img = document.getElementById('screenshotPreviewImg');
        if (preview && img) {
          img.src = this.descriptionData.screenshotPreview;
          preview.style.display = 'block';
        }
      }
      
      // Restore video links
      if (this.descriptionData.videoLinks) {
        Object.entries(this.descriptionData.videoLinks).forEach(([platform, link]) => {
          const input = document.getElementById(`${platform}Link`);
          if (input && link) input.value = link;
        });
      }
      
      console.log('✅ Build description loaded from storage');
    } catch (error) {
      console.error('❌ Failed to load description:', error);
    }
  },

  /**
   * Validate description data
   */
  validateDescription() {
    const errors = [];
    
    if (!this.descriptionData.title || this.descriptionData.title.trim() === '') {
      errors.push('Build title is required');
    }
    
    if (!this.descriptionData.description || this.descriptionData.description.trim() === '') {
      errors.push('Build description is required');
    }
    
    if (!this.descriptionData.difficulty) {
      errors.push('Difficulty level is required');
    }
    
    if (this.descriptionData.tags.length === 0) {
      errors.push('At least one tag is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Get description data for export
   */
  getDescriptionData() {
    return this.descriptionData;
  },

  /**
   * Clear all description data
   */
  clearDescription() {
    this.descriptionData = {
      title: '',
      description: '',
      difficulty: '',
      tags: [],
      screenshot: null,
      screenshotPreview: null,
      videoLinks: {
        youtube: '',
        tiktok: '',
        facebook: ''
      }
    };
    
    // Clear UI
    const titleInput = document.getElementById('buildTitle');
    const descText = document.getElementById('buildDescriptionText');
    const difficulty = document.getElementById('buildDifficulty');
    
    if (titleInput) titleInput.value = '';
    if (descText) descText.value = '';
    if (difficulty) difficulty.value = '';
    
    document.querySelectorAll('.tag-input').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    this.removeScreenshot();
    
    ['youtubeLink', 'tiktokLink', 'facebookLink'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    
    this.saveDescription();
  }
};

window.BuildDescriptionModule = BuildDescriptionModule;