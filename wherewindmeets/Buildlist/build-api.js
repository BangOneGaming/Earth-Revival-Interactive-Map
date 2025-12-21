/**
 * BUILD API MODULE
 * Handles all build CRUD operations and interactions (like, comment)
 * FIXED: Now includes userGameProfile for inGameName support
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
      console.log('🔐 Using sharedAuth user');
    } else if (AuthModule && AuthModule.getCurrentUser()) {
      user = AuthModule.getCurrentUser();
      console.log('🔐 Using AuthModule user');
    }
    
    if (!user) {
      throw new Error('User not logged in');
    }

    console.log('📋 User data:', {
      name: user.name,
      email: user.email,
      gameProfile: user.gameProfile
    });

    const payload = {
      buildData: buildData,
      userName: user.name,
      userEmail: user.email,
      userPicture: user.picture,
      userWeapon: user.gameProfile?.weaponVariant || 'Unknown',
      userRole: user.gameProfile?.role || 'Unknown',
      // ✅ FIXED: Include full game profile for inGameName
      userGameProfile: user.gameProfile ? {
        inGameName: user.gameProfile.inGameName || user.name,
        weaponVariant: user.gameProfile.weaponVariant || 'Unknown',
        role: user.gameProfile.role || 'Unknown'
      } : null
    };

    console.log('📤 Sending payload:', {
      userName: payload.userName,
      userEmail: payload.userEmail,
      userGameProfile: payload.userGameProfile
    });

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
      console.log('✅ Build saved to server:', result);
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
      console.log(`📦 Fetched ${result.builds?.length || 0} builds for ${email}`);
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
      console.log(`📦 Fetched ${result.builds?.length || 0} total builds`);
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
      console.log(`✅ ${action} toggled for build ${buildId}`);
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

    // Use inGameName for comments if available
    const displayName = user.gameProfile?.inGameName || user.name;

    try {
      const response = await fetch(`${this.ENDPOINT}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          buildId: buildId,
          userName: displayName, // ✅ Use inGameName
          userEmail: user.email,
          userPicture: user.picture,
          text: commentText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const result = await response.json();
      console.log('✅ Comment added to build', buildId);
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
      console.log('✅ Build deleted:', buildId);
      return result;
    } catch (error) {
      console.error('❌ Error deleting build:', error);
      throw error;
    }
  }
};

window.BuildAPIModule = BuildAPIModule;
console.log('✅ BuildAPIModule loaded with userGameProfile support');