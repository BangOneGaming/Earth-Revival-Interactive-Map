    // Show popup after map loads
    function showPatchPopup() {
  const overlay = document.getElementById('patchOverlay');
  const hasSeenPatch = localStorage.getItem('seenPatchV11');
  
  if (!hasSeenPatch) {
    overlay.classList.add('active');
    return true;  // ← patch note ditampilkan
  }
  return false;   // ← sudah pernah lihat, tidak tampil
}

function closePatchPopup() {
  const overlay = document.getElementById('patchOverlay');
  overlay.classList.remove('active');
  localStorage.setItem('seenPatchV11', 'true');

  // ← TipGuide setelah patch ditutup
  if (window.TipGuide) TipGuide.start();

  // ✅ Cookie consent muncul setelah patch note ditutup
  // Hanya kalau belum pernah accept/decline sebelumnya
  if (window.WWMCookieConsent && !WWMCookieConsent.hasConsent() && !WWMCookieConsent.hasDeclined()) {
    setTimeout(() => {
      WWMCookieConsent.initAfterLoad(0); // 0 = langsung muncul
    }, 500); // sedikit jeda setelah patch menutup
  }
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