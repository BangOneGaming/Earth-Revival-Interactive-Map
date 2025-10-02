const isPreloadEnabled = true;

let map; // Global map
let markersData = {};       // Data asli dari marker
let leafletMarkers = {};    // Objek Leaflet marker
let categoryCounts = {}; // { 2: { total: 0, hidden: 0 }, ... }

if (isPreloadEnabled) {
    Promise.all([
        preloadTilesPromise(),
        fetchMarkersPromise()
    ]).then(([highZoomList, markers]) => {
        initMap();
        createDevToolsPanel(map);

        markers.forEach(markerData => {
            addMarkerToMap(markerData);
            updateFilterCounts();
            
        });


    }).catch(error => {
        console.error('=== ERROR DETAIL ===', error);
        document.getElementById('loading-text').textContent = 'Failed to load data. Please try again later.';
        document.getElementById('loader').style.display = 'none';
    });
}

function fetchMarkersPromise() {
    return fetch('https://autumn-dream-8c07.square-spon.workers.dev/thelandofthelost')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                return data;
            } else if (typeof data === 'object' && data !== null) {
                return Object.values(data);
            } else {
                throw new Error('Invalid marker data format');
            }
        });
}

function fetchMarkersAndAddToMap() {
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/thelandofthelost')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                data.forEach(markerData => {
                    addMarkerToMap(markerData);
                });
            } else if (typeof data === 'object' && data !== null) {
                Object.keys(data).forEach(key => {
                    addMarkerToMap(data[key]);
                });
            }
        })
        .catch(error => {
            console.error('[FetchMarkers] Error loading markers:', error);
        });
}

document.querySelectorAll('#filter-container input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
        filterMarkers();
    });
});

function filterMarkers(isOverlayActive = false) {
    const filteredCategoryIds = [];

    const categoryMapping = {
        'filter-treasure': 2,
        'filter-train': 3,
        'filter-zone': 4,
        'filter-scenery': 5,
        'filter-resource': 6
    };

    document.querySelectorAll('#filter-container input[type="checkbox"]').forEach((checkbox) => {
        if (checkbox.checked) {
            const categoryId = categoryMapping[checkbox.id];
            if (categoryId && !isNaN(categoryId)) {
                filteredCategoryIds.push(categoryId);
            }
        }
    });

    Object.entries(markersData).forEach(([id, markerData]) => {
        const marker = leafletMarkers[id];
        if (!marker) return;

        const categoryId = parseInt(markerData.category_id);
        const index = markerData.index;

        // Marker teleport / overlay aktif (index 1)
        if (index === 1) {
            if (isOverlayActive && (filteredCategoryIds.length === 0 || filteredCategoryIds.includes(categoryId))) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) marker.removeFrom(map);
            }
            return;
        }

        // Marker biasa (index null atau >1)
        if (!isOverlayActive) { 
            if (filteredCategoryIds.length === 0 || filteredCategoryIds.includes(categoryId)) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) marker.removeFrom(map);
            }
        } else {
            if (map.hasLayer(marker)) marker.removeFrom(map);
        }
    });
}

// Function to show image and hide the button
function showImage(id) {
    document.getElementById(`img-${id}`).style.display = 'block';
    document.getElementById(`showImageBtn-${id}`).style.display = 'none';
    const uploadBtn = document.getElementById(`uploadImageBtn-${id}`);
    if (uploadBtn) uploadBtn.style.display = 'none';
}

// Function to handle image upload (dummy)
function uploadImage(id) {
    alert('Upload functionality is not implemented yet for this marker.');
}

// Ambil overlay berdasarkan key
function getOverlay(key) {
    if (!minimapKeys[key]) return null;
    return minimapKeys[key];
}

// Toggle overlay di map
let teleportButtonOverlays = [];
let currentOverlay = null;

function toggleOverlay(key) {
    const overlay = minimapKeys[key];
    if (!overlay) return;

    const bounds = overlay.bounds;

    if (currentOverlay) {
        map.removeLayer(currentOverlay);
        currentOverlay = null;

        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) layer.getContainer().style.filter = '';
        });

        // Tampilkan marker biasa sesuai filter
        filterMarkers(false);
        return;
    }

    currentOverlay = L.imageOverlay(overlay.main.map_url, bounds, {
        interactive: false,
        opacity: 1,
        zIndex: 1001
    }).addTo(map);

    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
    map.setView([centerLat, centerLng], 10);

    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) layer.getContainer().style.filter = 'brightness(0.3)';
    });

    filterMarkers(true);
}

// Contoh: panggil saat teleport diklik
function addTeleportButton(lat, lng) {
    const html = `
    <div class="teleport-wrapper">
        <div class="teleport-arrow"></div>
        <img src="../icons/teleport.png" class="teleport-icon" />
    </div>
    `;
    const teleportIcon = L.divIcon({
        html: html,
        className: '',
        iconSize: [40, 50],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    const marker = L.marker([lat, lng], {
        icon: teleportIcon,
        interactive: true,
        zIndexOffset: 1000
    }).addTo(map);

    marker.on('click', () => {
        toggleOverlay("greenhouse");
    });
}
function addMarkerToMap(markerData) {
    const { id, ys_id, lat, lng, category_id, name, en_name, desc, image_info } = markerData;

let iconUrl = '';
switch (parseInt(category_id)) {
    case 2: iconUrl = '../icons/icon_treasure.png'; break;
    case 3: iconUrl = '../icons/icon_train.png'; break;
    case 4: iconUrl = '../icons/icon_zone.png'; break;
    case 5: iconUrl = '../icons/icon_scenery.png'; break;
    case 6: iconUrl = '../icons/icon_resource.png'; break;
    case 99: iconUrl = '../icons/teleport.png'; break; // <-- teleport
    default: return;
}

    const customIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const rawDesc = desc ? desc.replace(/\(\s*[^,]+,\s*[^\)]+\s*\)/, '').trim() : '';
    const displayDesc = (rawDesc && rawDesc !== '0' && rawDesc !== '.') ? rawDesc : '';

    const regex = /\(([^,]+),\s*([^\)]+)\)/;
    const descMatch = desc && regex.exec(desc);
    const coordinateY = descMatch ? descMatch[1] : '';
    const coordinateZ = descMatch ? descMatch[2] : '';

    // Ambil opacity tersimpan (jika ada)
    const savedOpacities = JSON.parse(localStorage.getItem('markerOpacities') || '{}');
    const savedOpacity = savedOpacities[id] !== undefined ? savedOpacities[id] : 1;

    const marker = L.marker([parseFloat(lat), parseFloat(lng)], {
        icon: customIcon,
        opacity: savedOpacity
    }).bindPopup(`
        <div class="leaflet-popup-content" style="z-index: 9999;">
            <h4>${en_name || name}</h4>
            ${displayDesc && displayDesc !== '0' && displayDesc !== '.' ? `<p><strong>Description:</strong> <br>${displayDesc}</p>` : ''}
            <p><strong>ID:</strong> ${id}</p>
            
            ${coordinateY && coordinateZ ? `<p><strong>Coordinates:</strong> (${coordinateY}, ${coordinateZ})</p>` : ''}
            ${ys_id ? `<p><strong>Contribution By:</strong> ${ys_id}</p>` : ''}
            
            ${coordinateY && coordinateZ ? `
            <div class="copy-buttons">
                <button class="copyButton" onclick="copyCoordinate('Y', '${coordinateY}', '${id}')">Copy Y</button>
                <button class="copyButton" onclick="copyCoordinate('Z', '${coordinateZ}', '${id}')">Copy Z</button>
            </div>
            ` : ''}
            
${image_info && isValidImageURL(image_info) ? `
    <div>
        <button id="showImageBtn-${id}" class="copyButton" onclick="showImage('${id}')" style="color: blue;">Show Image</button>
        <img id="img-${id}" src="${image_info}" style="display:none; max-width: 100%; margin-top: 10px; border-radius: 8px;" />
    </div>
` : `
    <div>
        <button class="copyButton" style="color: orange;" onclick="openUploadPopup('${id}')">Upload Image</button>
    </div>
`}

            
            <div class="copy-feedback" id="copyFeedback-${id}">
                <span class="feedback-icon">&#x2714;</span> Coordinate copied!
            </div>
        </div>
    `);

    marker.on('contextmenu', (e) => {
        const currentOpacity = marker.options.opacity || 1.0;
        const newOpacity = currentOpacity === 1.0 ? 0.5 : 1.0;
        marker.setOpacity(newOpacity);
        saveMarkerOpacity(id, newOpacity); // simpan ke localStorage
        updateFilterCounts();
    });

    function saveMarkerOpacity(markerId, opacity) {
        const stored = JSON.parse(localStorage.getItem('markerOpacities') || '{}');
        stored[markerId] = opacity;
        localStorage.setItem('markerOpacities', JSON.stringify(stored));
    }

    // Function to check if the image URL is valid
    function isValidImageURL(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => reject(false);
            img.src = url;
        });
    }




markersData[id] = {
    id: id,
    ys_id: ys_id,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    category_id: category_id,
    name: name,
    en_name: en_name || name,
    desc: desc || 'No description',
    coordinateY: coordinateY,
    coordinateZ: coordinateZ,
    index: markerData.index !== undefined ? parseInt(markerData.index) : null,
    image_info: image_info || null
};

leafletMarkers[id] = marker;

const catId = parseInt(category_id);
if (!categoryCounts[catId]) categoryCounts[catId] = { total: 0, hidden: 0 };
categoryCounts[catId].total++;

// Tampilkan marker hanya jika bukan index 1
if (markerData.index !== 1) {
    marker.addTo(map);
}
}
function copyCoordinate(type, coordinate, markerId) {
    navigator.clipboard.writeText(coordinate).then(() => {
        const feedback = document.getElementById(`copyFeedback-${markerId}`);
        if (feedback) {
            feedback.classList.add('show');
            setTimeout(() => {
                feedback.classList.remove('show');
            }, 2000);
        }
    });
}



// Inisialisasi peta
function initMap() {
    const init_position = [60.871009248911655, -76.62568359375001];

    const southWest = L.latLng(55, -92);
    const northEast = L.latLng(68, -63);
    const mapBounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        minZoom: 6.3,
        maxZoom: 9,
        maxBounds: mapBounds,
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
        zoomControl: false
    }).setView(init_position, 6);

    const tileLayer = L.tileLayer('https://bangonegaming.polar-app.org/ER_Mars/statics/yuan_{z}_{x}_{y}.webp', {
        tileSize: 256,
        minZoom: 6,
        maxZoom: 9,
        noWrap: true,
        bounds: mapBounds
    });

    tileLayer.addTo(map);
    map.scrollWheelZoom.enable();

    tileLayer.on('tileerror', function (event) {
        const tile = event.tile;
        tile.src = createBlackTile(tile.width, tile.height);
    });

    function createBlackTile(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        return canvas.toDataURL('image/png');
    }

    const blackPane = map.createPane('blackBackground');
    blackPane.style.zIndex = 0;

    L.rectangle(mapBounds.pad(3), {
        pane: 'blackBackground',
        color: 'black',
        weight: 0,
        fillOpacity: 1
    }).addTo(map);

    // ✅ Tambahkan teleport hanya setelah map siap
    map.whenReady(() => {
        console.log('📍 Map siap, menambahkan teleport marker');
        addTeleportButton(59.130562941820834, -68.70301399018001);
    });

    // Zoom slider
    const zoomControl = L.DomUtil.create('div', 'leaflet-bar zoom-slider-container');
    const zoomSlider = L.DomUtil.create('input', 'zoom-slider', zoomControl);
    zoomSlider.type = 'range';
    zoomSlider.min = map.getMinZoom();
    zoomSlider.max = map.getMaxZoom();
    zoomSlider.step = 0.1;
    zoomSlider.value = map.getZoom();
    zoomSlider.style.transform = 'rotate(-90deg)';
    zoomSlider.style.transformOrigin = 'center';
    zoomSlider.style.cursor = 'pointer';

    zoomSlider.addEventListener('input', (e) => {
        map.setZoom(parseFloat(e.target.value));
    });

    let zoomUpdateFrame;
    const updateSlider = () => {
        if (zoomUpdateFrame) cancelAnimationFrame(zoomUpdateFrame);
        zoomUpdateFrame = requestAnimationFrame(() => {
            zoomSlider.value = map.getZoom();
        });
    };

    map.on('zoomend', updateSlider);
    map.on('moveend', updateSlider);
    map.on('zoomlevelschange', updateSlider);

    L.DomEvent.disableClickPropagation(zoomControl);
    map.getContainer().appendChild(zoomControl);
}

// Clear semua marker dari peta
function clearMarkersFromMap() {
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    markersData = {}; // Kosongkan object markersData
}

//toggle Filter container 
  const toggleBtn = document.getElementById('toggle-filter-btn');
  const filterContainer = document.getElementById('filter-container');

  toggleBtn.addEventListener('click', () => {
      if (filterContainer.style.display === 'none') {
          filterContainer.style.display = 'flex';
      } else {
          filterContainer.style.display = 'none';
      }
  });
  // Tangkap semua checkbox filter
document.querySelectorAll('#filter-container input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        // Panggil filterMarkers, overlay aktif atau tidak
        filterMarkers(!!currentOverlay);
    });
});
//Count container 
function updateFilterCounts() {
    // Reset semua count
    Object.keys(categoryCounts).forEach(catId => {
        categoryCounts[catId].hidden = 0;
        categoryCounts[catId].total = 0;
    });

    Object.entries(markersData).forEach(([id, markerData]) => {
        const marker = leafletMarkers[id];
        const catId = parseInt(markerData.category_id);

        if (marker) {
            categoryCounts[catId].total++;
            // Jika opacity 1, dianggap "hidden"
            if (marker.options.opacity === 1) {
                categoryCounts[catId].hidden++;
            }
        }
    });

    // Update tampilan counter di UI
    document.querySelectorAll('.filter-count').forEach(span => {
        const catId = span.getAttribute('data-category');
        const counts = categoryCounts[catId];
        if (counts) {
            const visible = counts.total - counts.hidden;
            span.textContent = `${visible}/${counts.total}`;
        }
    });
}


function updateCategoryCounts() {
    const counts = {
        2: { active: 0, total: 0 }, // Treasure
        3: { active: 0, total: 0 }, // Train
        4: { active: 0, total: 0 }, // Zone
        5: { active: 0, total: 0 }, // Scenery
        6: { active: 0, total: 0 }, // Resource
    };

    allMarkers.forEach(marker => {
        const cat = marker.category_id;
        if (counts[cat]) {
            counts[cat].total++;
            if (map.hasLayer(marker.leafletMarker)) {
                counts[cat].active++;
            }
        }
    });

    document.querySelectorAll('.filter-count').forEach(span => {
        const category = parseInt(span.dataset.category);
        if (counts[category]) {
            span.textContent = `${counts[category].active}/${counts[category].total}`;
        }
    });
}



let currentUploadId = null;

function openUploadPopup(id) {
    currentUploadId = id;
    document.getElementById('uploadTitle').textContent = 'Upload Image for ID: ' + id;
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadPopup() {
    document.getElementById('uploadModal').style.display = 'none';
    currentUploadId = null;
}

async function submitUpload() {
    const fileInput = document.getElementById('uploadInput');
    if (!fileInput.files[0] || !currentUploadId) return;

    const file = fileInput.files[0];
    const fileName = `${currentUploadId}.webp`;
    const uploadUrl = `https://bangonegaming.polar-app.org/ER_Earth/photos/${fileName}`;

    const formData = new FormData();
    formData.append('file', file, fileName);

    try {
        await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        const imageUrl = uploadUrl;
        // Update marker data
        markersData[currentUploadId] = markersData[currentUploadId] || {};
        markersData[currentUploadId].image_info = imageUrl;

        // Kirim ke endpoint eksternal
        await fetch('https://autumn-dream-8c07.square-spon.workers.dev/thelandofthelost', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(markersData)
        });

        alert('Upload successful!');
        closeUploadPopup();
    } catch (e) {
        alert('Upload failed: ' + e.message);
    }
}
