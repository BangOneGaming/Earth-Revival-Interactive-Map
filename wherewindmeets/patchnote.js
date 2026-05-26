function showPatchPopup() {
  const overlay = document.getElementById('patchOverlay');
  const hasSeenPatch = localStorage.getItem('seenPatchV13');
  if (!hasSeenPatch) {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
    return true;
  }
  return false;
}

function closePatchPopup() {
  const overlay = document.getElementById('patchOverlay');
  overlay.classList.remove('active');
  localStorage.setItem('seenPatchV13', 'true');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300);
  if (window.TipGuide) TipGuide.start();
  if (window.WWMCookieConsent && !WWMCookieConsent.hasConsent() && !WWMCookieConsent.hasDeclined()) {
    setTimeout(() => {
      WWMCookieConsent.initAfterLoad(0);
    }, 500);
  }
}

// Close on X button
document.getElementById('patchClose').addEventListener('click', closePatchPopup);

// Close on overlay background click
document.getElementById('patchOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    closePatchPopup();
  }
});

// Auto-show after map loads
window.addEventListener('load', function() {
  setTimeout(showPatchPopup, 2000);
});