    // Show popup after map loads
    function showPatchPopup() {
  const overlay = document.getElementById('patchOverlay');
  const hasSeenPatch = localStorage.getItem('seenPatchV10');
  
  if (!hasSeenPatch) {
    overlay.classList.add('active');
    return true;  // ← patch note ditampilkan
  }
  return false;   // ← sudah pernah lihat, tidak tampil
}

function closePatchPopup() {
  const overlay = document.getElementById('patchOverlay');
  overlay.classList.remove('active');
  localStorage.setItem('seenPatchV10', 'true');
  
  // ← Start tip guide setelah patch note ditutup
  if (window.TipGuide) TipGuide.start();
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