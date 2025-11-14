const FEEDBACK_USER_ENDPOINT = "https://autumn-dream-8c07.square-spon.workers.dev/userfeedback";

async function saveFeedbackUser(key, updateData) {
  try {
    if (!isLoggedIn()) {
      showLoginPopup();
      return;
    }

    const token = getUserToken();
    if (!token) throw new Error("No Google token found.");

    const userProfile = getUserProfile();
    if (!userProfile || !userProfile.inGameName) {
      showNotification("⚠️ Please complete your profile first", "error");
      showLoginPopup();
      return;
    }

    // 1️⃣ Ambil data lama dari server
    const existingRes = await fetch(FEEDBACK_USER_ENDPOINT, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`
      }
    });

    let existingData = {};
    if (existingRes.ok) {
      existingData = await existingRes.json();
    }

    // 2️⃣ Ambil data lama marker ini (bukan semua)
    const oldMarkerData = existingData[key] || {};

    // 3️⃣ Merge manual agar tidak overwrite data yang kosong
    const finalMerged = {
      x: updateData.x !== undefined ? updateData.x : oldMarkerData.x || "",
      y: updateData.y !== undefined ? updateData.y : oldMarkerData.y || "",
      desc: updateData.desc !== undefined ? updateData.desc : oldMarkerData.desc || "",
      ys_id: userProfile.inGameName
    };

    const payload = {
      [key]: finalMerged
    };

    // 4️⃣ Kirim ke server
    const res = await fetch(FEEDBACK_USER_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error("Failed saving feedback user");
    }

    showNotification("✓ Saved to feedbackuser!", "success");

  } catch (err) {
    console.error("❌ Error saving feedback user:", err);
    showNotification("Failed to save to feedbackuser", "error");
  }
}

// Fungsi untuk save edit dari console
window.saveEditFromConsole = async function(markerKey, type) {
  const marker = MarkerManager.activeMarkers[markerKey];
  if (!marker) return console.warn("Marker not found:", markerKey);

  const markerData = MarkerManager.getAllMarkers().find(m => m._key === markerKey);
  if (!markerData) return console.warn("Marker data not found:", markerKey);

  const markerEdits = JSON.parse(localStorage.getItem("markerEdits") || "{}");
  if (!markerEdits[markerKey]) markerEdits[markerKey] = {};

  let updateData = {};
  if (type === "coords") {
    const xInput = document.getElementById(`editX_${markerKey}`);
    const yInput = document.getElementById(`editY_${markerKey}`);
    if (!xInput || !yInput) return console.warn("Coordinate inputs not found");
    const x = xInput.value.trim();
    const y = yInput.value.trim();
    if (x && isNaN(parseFloat(x))) return console.warn("X coordinate must be numeric");
    if (y && isNaN(parseFloat(y))) return console.warn("Y coordinate must be numeric");
    updateData = { x, y };
  } else if (type === "desc") {
    const descInput = document.getElementById(`editDesc_${markerKey}`);
    if (!descInput) return console.warn("Description input not found");
    updateData = { desc: descInput.value.trim() };
  }

  markerEdits[markerKey] = { ...markerEdits[markerKey], ...updateData };
  localStorage.setItem("markerEdits", JSON.stringify(markerEdits));

  const mergedData = { ...markerData, ...markerEdits[markerKey] };
  marker.getPopup().setContent(MarkerManager.createPopupContent(mergedData));

  try {
    showNotification("⏳ Saving to server...", "info");
    await saveFeedbackUser(markerKey, markerEdits[markerKey]);
    showNotification("✅ Synced with server!", "success");
  } catch (err) {
    console.error("❌ Failed to sync with server:", err);
    showNotification("⚠️ Saved locally, but failed to sync", "error");
  }
};

// Alias supaya saveEdit() terdefinisi
window.saveEdit = window.saveEditFromConsole;

// Sinkronisasi feedback ke marker tanpa overwrite lat/lng
function syncFeedbackToMarkers(markers, feedbackData) {
  Object.keys(feedbackData).forEach(key => {
    const feedback = feedbackData[key];
    const marker = markers[key];
    if (marker) {
      marker.x = feedback.x || "";
      marker.y = feedback.y || "";
      marker.desc = feedback.desc || marker.desc || "";
      // ✅ Tambahkan ys_id jika ada
      if (feedback.ys_id) {
        marker.ys_id = feedback.ys_id;
      }
    }
  });
  return markers;
}