let currentTempMarker = null;
let lastMarkerId = 0; // Kamu harus load nilai ini dari data existing nanti

function createDevToolsPanel(map) {
    const mapContainer = document.getElementById('map');

    const panel = document.createElement('div');
    panel.className = 'dev-tools-panel';

    const addMarkerBtn = document.createElement('button');
    addMarkerBtn.innerHTML = 'Add Marker';
    addMarkerBtn.className = 'dev-tools-button';

    const confirmMarkerBtn = document.createElement('button');
    confirmMarkerBtn.innerHTML = 'Confirm Marker';
    confirmMarkerBtn.className = 'dev-tools-button';
    confirmMarkerBtn.style.display = 'none'; // awalnya sembunyi

    addMarkerBtn.onclick = function () {
    console.log('[AddMarker] Button clicked');

    // Cek apakah sudah ada marker aktif
    if (currentTempMarker) {
        console.log('[AddMarker] Marker already exists, skipping creation');
        alert("Please confirm or cancel the current marker first!");
        return; // Jangan lanjut buat marker baru
    }

    ensureLastMarkerIdUpToDate().then(() => {
        const teleportIcon = L.icon({
            iconUrl: 'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_default.png',
            iconSize: [50, 50],
            iconAnchor: [25, 50]
        });

        const marker = L.marker(map.getCenter(), { icon: teleportIcon, draggable: true }).addTo(map);
        currentTempMarker = marker;

        confirmMarkerBtn.style.display = 'none';
        addMarkerBtn.style.display = 'none'; // Hide Add Marker button

        console.log('[AddMarker] Marker created at:', marker.getLatLng());

        marker.on('dragstart', function () {
            console.log('[Marker] Drag started');
            confirmMarkerBtn.style.display = 'none';
        });

        marker.on('dragend', function () {
            const markerPosition = marker.getLatLng();
            map.setView(markerPosition, map.getZoom());
            confirmMarkerBtn.style.display = 'inline-block';
            console.log('[Marker] Drag ended at:', markerPosition);
            console.log('[ConfirmButton] Shown');
        });
    });
};



confirmMarkerBtn.onclick = function () {
    if (currentTempMarker) {
        console.log('[ConfirmMarker] Button clicked');
        openMarkerContributionModal(currentTempMarker, map); // <-- kasih map di sini
        confirmMarkerBtn.style.display = 'none';
    } else {
        console.log('[ConfirmMarker] No marker to confirm!');
        alert("Please add a marker first!");
    }
};


    panel.appendChild(addMarkerBtn);
    panel.appendChild(confirmMarkerBtn);

    mapContainer.appendChild(panel);
}


function createMarkerForm(marker, map) {
    const form = document.createElement('form');
    form.id = 'marker_contribution';

    lastMarkerId++;
    const latlng = marker.getLatLng();
    console.log('[CreateMarkerForm] Creating form for marker at:', latlng);

    form.innerHTML = `
        <input type="hidden" id="id" name="id" value="${lastMarkerId}" disabled>
        <input type="hidden" id="lat" name="lat" value="${latlng.lat}" disabled>
        <input type="hidden" id="lng" name="lng" value="${latlng.lng}" disabled>

        <label for="ys_id">Name (Optional):</label>
        <input type="text" id="ys_id" name="ys_id" placeholder="Enter Name/ID/Server"><br>

        <label for="category_id">Category ID:</label>
        <select id="category_id" name="category_id" required>
            <option value="0"> Please Select Category </option>
            <option value="2">Treasure Hunt</option>
            <option value="3">Limited Time Training</option>
            <option value="4">Zone Commission</option>
            <option value="5">Scenery</option>
            <option value="6">Resource Box</option>
        </select><br>

        <div id="nameContainer" style="display: none;">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" placeholder="Enter Name" required><br>
        </div>

        <div>
            <label>Coordinate (Y,Z):</label><br>
            <input type="number" id="coord_y" name="coord_y" placeholder="Enter Y" style="width: 20%;" required>
            <input type="number" id="coord_z" name="coord_z" placeholder="Enter Z" style="width: 20%;" required>
        </div><br>

        <label for="desc">Description:</label>
        <textarea id="desc" name="desc" placeholder="Enter description" required></textarea><br>

        <div style="display: flex; gap: 10px;">
            <button type="submit" id="submitMarkerBtn">Save</button>
            <button type="button" class="cancel" onclick="closeMarkerContributionModal()">Cancel</button>
        </div>
    `;

    // Input coord_y dan coord_z hanya angka
    form.querySelector('#coord_y').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9.-]/g, '');
    });
    form.querySelector('#coord_z').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9.-]/g, '');
    });

    // Event listener untuk category_id
    form.querySelector('#category_id').addEventListener('change', function() {
        const selectedValue = this.value;
        const nameContainer = form.querySelector('#nameContainer');
        const nameInput = form.querySelector('#name');

        if (selectedValue !== "0") {
            nameContainer.style.display = 'block';

            let categoryText = "";
            let categoryCount = 0;

            switch (selectedValue) {
                case "2": categoryText = "Treasure Hunt"; break;
                case "3": categoryText = "Limited Time Training"; break;
                case "4": categoryText = "Zone Commission"; break;
                case "5": categoryText = "Scenery"; break;
                case "6": categoryText = "Resource Box"; break;
                default: categoryText = ""; break;
            }

            // Hitung jumlah marker dengan category_id yang sama
            categoryCount = countMarkersInCategory(selectedValue);

            // Set default name dengan angka yang sesuai
            nameInput.value = `The Land of The Lost - ${categoryText} ${categoryCount + 1}`;
        } else {
            nameContainer.style.display = 'none';
            nameInput.value = "";
        }
    });




form.onsubmit = function (e) {
    e.preventDefault();

    // Reset border
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => input.style.border = '');

    let isValid = true;

    // Cek input required
    const requiredFields = ['coord_y', 'coord_z', 'desc', 'name', 'category_id'];
    requiredFields.forEach(id => {
        const field = form.querySelector(`#${id}`);
        const value = field.value.trim();

        if (!value || (id === 'category_id' && value === '0')) {
            field.style.border = '2px solid red';
            isValid = false;
        }
    });

    if (!isValid) {
        console.warn('[Validation] Please fill all required fields correctly.');
        return;
    }

    const coordY = form.coord_y.value.trim();
    const coordZ = form.coord_z.value.trim();
    const descText = form.desc.value.trim();
    const latlng = marker.getLatLng();
    const finalDesc = `(${coordY},${coordZ}) ${descText}`;
    const enName = form.name.value || "";

    const newData = {
        id: lastMarkerId.toString(),
        ys_id: form.ys_id.value || "",
        name: form.name.value,
        en_name: enName,
        category_id: form.category_id.value,
        lat: latlng.lat.toString(),
        lng: latlng.lng.toString(),
        redirect_params: "0",
        first_member_id: "0",
        challenge_id: "0",
        desc: finalDesc,
        links_info: "[]",
        bili_info: "[]",
        loc_type: "11"
    };

    console.log('[SaveMarker] Generated Marker JSON:', JSON.stringify(newData, null, 2));

    fetchExistingData().then(existingData => {
        const mergedData = mergeData(existingData, newData);
        sendDataToServer(mergedData);
        
        // Remove the temporary marker from the map
        if (currentTempMarker) {
            map.removeLayer(currentTempMarker);
            currentTempMarker = null;
        }

        // Close the modal and show the add marker button again
        closeMarkerContributionModal();
        showAddMarkerButton();
        clearMarkersFromMap();

        setTimeout(() => {
            fetchMarkersAndAddToMap();
        }, 1000); // 1000 ms = 1 detik
    }).catch((error) => {
        console.error('Error:', error);
        closeMarkerContributionModal();
    });
};


        // Fungsi untuk menghitung jumlah marker di kategori yang sama
    function countMarkersInCategory(categoryId) {
        return Object.values(markersData).filter(marker => marker.category_id === categoryId).length;
    }

    return form;
}


function showAddMarkerButton() {
    const addMarkerBtn = document.querySelector('.dev-tools-panel .dev-tools-button');
    if (addMarkerBtn) {
        addMarkerBtn.style.display = 'inline-block';
    }
}

function ensureLastMarkerIdUpToDate() {
    return fetchExistingData().then(existingData => {
        if (!existingData || Object.keys(existingData).length === 0) {
            lastMarkerId = 0;
        } else {
            const ids = Object.keys(existingData).map(id => parseInt(id, 10));
            lastMarkerId = Math.max(...ids);
        }
        console.log('[Sync] lastMarkerId updated to:', lastMarkerId);
    });
}

// Ambil data yang sudah ada
function fetchExistingData() {
    // Gantilah dengan kode untuk mengambil data dari server atau cache
    return new Promise((resolve) => {
        // Misalnya menggunakan data lokal (markersData)
        resolve(markersData || {});  // Pastikan data yang dikembalikan adalah objek
    });
}


// Gabungkan data yang ada dengan data baru
function mergeData(existingData, newData) {
    // Pastikan existingData adalah objek
    existingData = existingData || {}; // defaultkan ke objek kosong jika undefined atau null
    existingData[newData.id] = newData;  // Menambahkan atau memperbarui data yang ada dengan ID baru
    return existingData;
}


// Kirim data gabungan ke server
function sendDataToServer(mergedData) {
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/thelandofthelost', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergedData),
    })
    .then(response => response.text()) // <- ini fix nya
    .then(data => {
        console.log('Success:', data);
        alert('Data successfully saved!');
    })
    .catch((error) => {
        console.error('Error sending data:', error);
        alert('Failed to save data.');
    });
}





function openMarkerContributionModal(marker) {
    console.log('[Modal] Opening marker contribution modal');

    const modal = document.getElementById('markerContributionModal');

    const content = document.getElementById('markerContributionContent');

    const existingForm = document.getElementById('marker_contribution');
    if (existingForm) {
        existingForm.remove();
    }

    const form = createMarkerForm(marker, map); // <-- tambahkan `map` di sini
    content.appendChild(form);

    modal.style.display = 'flex';
}


function closeMarkerContributionModal() {
    
    console.log('[Modal] Closing marker contribution modal');
    const modal = document.getElementById('markerContributionModal');
    modal.style.display = 'none';
}

// Close modal saat klik tombol ×
document.getElementById('closeMarkerContribution').onclick =
 function() {
    console.log('[Modal] Close button clicked');
    closeMarkerContributionModal();
};
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}