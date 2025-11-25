    // Show popup after map loads
    function showPatchPopup() {
      const overlay = document.getElementById('patchOverlay');
      const hasSeenPatch = localStorage.getItem('seenPatchV4'); // Change version number for new updates
      
      if (!hasSeenPatch) {
        overlay.classList.add('active');
      }
    }

    // Close popup
    function closePatchPopup() {
      const overlay = document.getElementById('patchOverlay');
      overlay.classList.remove('active');
      localStorage.setItem('seenPatchV4', 'true'); // Mark as seen
    }

    // Close on overlay click
    document.getElementById('patchOverlay').addEventListener('click', function(e) {
      if (e.target === this) {
        closePatchPopup();
      }
    });

    // Auto-show popup when page loads (simulate map initialization)
    // In your actual code, call showPatchPopup() after map initialization
    window.addEventListener('load', function() {
      setTimeout(showPatchPopup, 2000);
    });