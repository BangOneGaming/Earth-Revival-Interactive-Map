
let activeFilters = [];
let activeLocTypes = [];
let markers = [];
let jsonData = {};
let holdTimeout;
let map; // Declare map at a broader scope
let markerVisibility = {};

function initMap() {
    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const mapBounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        maxBounds: mapBounds, // Batas maksimal peta
        maxBoundsViscosity: 1.0, // Mencegah pengguna keluar dari batas
    }).setView([parseFloat(center_position[0]), parseFloat(center_position[1])], 6);

    // Tambahkan tile layer
    L.tileLayer('statics/yuan_{z}_{x}_{y}.png', {
        tileSize: 256,
        minZoom: 6,
        maxZoom: 9,
        noWrap: false,
        bounds: L.latLngBounds(
            L.latLng(57, -67.40522460937501),
            L.latLng(66, -89.4)
        ),
        errorTileUrl: 'statics/error-tile.png'
    }).addTo(map).on('tileload', function(event) {
        const tile = event.tile;
        
        // Cek jika tile adalah gambar kosong
        if (tile.src.includes('data:image') || tile.naturalWidth === 0 || tile.naturalHeight === 0) {
            // Jika tile kosong, ganti dengan errorTileUrl
            tile.src = 'statics/error-tile.png';
        }
    });
    
    

    const maxOffsetPx = 300; // Jarak maksimum dari batas peta (dalam pixel)

    // Tambahkan event listener untuk memantau pergerakan peta
    map.on('move', function () {
        const bounds = map.getBounds();
        const mapPane = map.getPanes().mapPane;
        const mapSize = map.getSize();

        // Hitung jarak dari batas dalam satuan pixel
        const northEastPixel = map.latLngToContainerPoint(bounds.getNorthEast());
        const southWestPixel = map.latLngToContainerPoint(bounds.getSouthWest());

        const offsetTop = northEastPixel.y < maxOffsetPx ? maxOffsetPx - northEastPixel.y : 0;
        const offsetBottom = southWestPixel.y > (mapSize.y - maxOffsetPx) ? southWestPixel.y - (mapSize.y - maxOffsetPx) : 0;
        const offsetLeft = southWestPixel.x < maxOffsetPx ? maxOffsetPx - southWestPixel.x : 0;
        const offsetRight = northEastPixel.x > (mapSize.x - maxOffsetPx) ? northEastPixel.x - (mapSize.x - maxOffsetPx) : 0;

        // Jika pengguna mendekati atau melebihi batas, tahan mereka di batas tersebut
        if (offsetTop || offsetBottom || offsetLeft || offsetRight) {
            map.panBy([offsetLeft - offsetRight, offsetTop - offsetBottom], { animate: false });
        }
    });

    // Fetch marker data dan tambahkan marker ke peta
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            jsonData = data;
          // Tambahkan marker ke cluster
            jsonData.forEach(data => {
                const marker = L.marker([data.lat, data.lng], { icon: customIcon });
                markers.addLayer(marker);
            });

            // Tambahkan cluster ke peta
            map.addLayer(markers);

            addMarkersToMap(); 
            setupFilterListeners(); 

            // Create custom icon for marker
            const customIcon = L.icon({
                iconUrl: imageUrl,
                iconSize: [256, 256],
                iconAnchor: [128, 128]
            });

            // Tambahkan marker dengan popup
            L.marker(locPosition, { icon: customIcon }).addTo(map).bindPopup();

            // Hitung pusat peta
            const centerLatLng = map.getCenter();
         })
        .catch(error => console.error('Error fetching marker data:', error));
}



// Assuming mini_map_type is defined somewhere in your code
let miniMapMarkers = {}; // To hold your markers and overlays
function getNormalizedCoord(coord, zoom) {
    var y = coord.y;
    var x = coord.x;
    var tileRange = 1 << zoom;

    if (y < 0 || y >= tileRange || x < 0 || x >= tileRange) {
        return null;
    }

    return { x: x, y: y };
}
function initMiniMap() {
    const miniMapMarkers = {};

    for (const key in mini_map_type) {
        if (mini_map_type.hasOwnProperty(key)) {
            const info = mini_map_type[key];
            const loc_position = info.loc_position.split(",");
            const marker = L.marker([parseFloat(loc_position[0]), parseFloat(loc_position[1])], {
                icon: L.icon({
                    iconUrl: 'null',
                    iconSize: [1, 1]
                })
            }).addTo(map);

            const bounds = [
                [parseFloat(info['map_position'][0].split(",")[0]), parseFloat(info['map_position'][0].split(",")[1])],
                [parseFloat(info['map_position'][1].split(",")[0]), parseFloat(info['map_position'][1].split(",")[1])]
            ];

            const historicalOverlay = L.imageOverlay(info['type']['default']['map_url'], bounds).addTo(map);
            historicalOverlay.remove(); // Initially hide the overlay

            marker.on('click', function () {
                if (map.hasLayer(historicalOverlay)) {
                    map.removeLayer(historicalOverlay);
                } else {
                    map.addLayer(historicalOverlay);
                }
            });

            miniMapMarkers[key] = marker;
        }
    }
}


// Call initMiniMap after your main map initialization
initMap(); // Initialize your main map first
initMiniMap(); // Then initialize the mini-map markers and overlays


function addMarkersToMap() {
    markers = []; // Reset markers array setiap kali fungsi dipanggil

    // Iterasi melalui jsonData
    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const location = jsonData[key];

            // Validasi latitude dan longitude
            if (!location.lat || !location.lng) {
                console.error(`Location ${key} is missing lat/lng.`);
                continue;
            }

            // Konversi lat/lng ke float dan siapkan koordinat
            const latLng = [parseFloat(location.lat), parseFloat(location.lng)];

            // Dapatkan URL ikon berdasarkan category_id
            const iconUrl = getIconUrl(location.category_id);

            // Load opacity marker (jika sebelumnya disimpan)
            const initialOpacity = loadMarkerOpacity(key) || 1.0; // Default opacity 1.0 jika tidak ditemukan

            // Assign properti tambahan ke marker (dengan fallback value)
            const locType = location.loc_type || 'Unknown'; 
            const categoryId = location.category_id || 'Unknown'; 
            const nameEn = location.en_name || 'Unknown'; 
            const markerId = location.id || key; // Gunakan ID dari data atau fallback ke key

            // Buat marker Leaflet dengan ikon dan opacity yang ditentukan
            const marker = L.marker(latLng, {
                icon: L.icon({
                    iconUrl: iconUrl,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                opacity: initialOpacity, // Atur opacity (default 1.0)
            });

            // Tambahkan properti tambahan ke marker options
            marker.options.loc_type = locType;
            marker.options.category = categoryId;
            marker.options.id = markerId;
            marker.options.en_name = nameEn;

            // Simpan marker ke array markers untuk referensi di masa depan
            markers.push(marker);

            // Setup interaksi marker, termasuk tombol laporan
            setupMarkerInteractions(marker, location, markerId);

            // Update jumlah kategori berdasarkan kategori marker dan opacity
            updateCategoryCounts(locType, categoryId, initialOpacity);
        }
    }

    // Hitung jumlah maksimum setelah semua marker ditambahkan
    calculateMaxCounts();

    // Sembunyikan marker awal dan update tampilan kategori
    hideMarkers();
    updateCategoryDisplay(); // Pastikan tampilan kategori diupdate setelah menambahkan semua marker
}




function calculateMaxCounts() {
    const seenMarkers = new Set(); // Gunakan set untuk melacak marker yang sudah dihitung

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const location = jsonData[key];
            const locType = location.loc_type || 'Unknown';
            const categoryId = location.category_id;
            const categoryName = getCategoryName(categoryId);

            // Pastikan kategori dikenali dan marker unik
            if (categoryName && locType in categoryCounts && categoryCounts[locType][categoryName]) {
                const markerKey = `${locType}-${categoryName}-${location.lat}-${location.lng}`; // Buat key unik berdasarkan lokasi
                if (!seenMarkers.has(markerKey)) {
                    categoryCounts[locType][categoryName].max++; // Tambah max untuk marker yang unik
                    seenMarkers.add(markerKey); // Tandai marker ini sudah dihitung
                }
            } else {
                console.log(`Marker with unrecognized category or locType: ${categoryId} in locType: ${locType}`); // Log jika tidak dikenali
            }
        }
    }

    // Log hasil akhir
    console.log('Final max counts:', categoryCounts);
}





// Function untuk menyembunyikan semua marker dari peta
function hideMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker); // Remove all markers from the map
    });
}

function setupFilterListeners() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            hideMarkers(); // Hide all markers before showing filtered ones
            showMarkers(); // Show markers based on filters
            updateCategoryDisplay(); // Update counts after filtering
        });
    });
}
const categoryIcons = {
    "all": "icons/here.png",                // Ikon untuk "All"
    "treasure": "icons/icon_treasure.png",  // Ikon untuk "Treasure"
    "teleport": "icons/icon_teleport.png",  // Ikon untuk "Teleport"
    "fishing": "icons/icon_fishing.png",     // Ikon untuk "Fishing"
    "zone": "icons/icon_zone.png",           // Ikon untuk "Zone"
    "training": "icons/icon_train.png",      // Ikon untuk "Training"
    "scenery": "icons/icon_scenery.png",     // Ikon untuk "Scenery"
    "resource": "icons/icon_resource.png"
};


const categoryCounts = {
    "2": {  // Loc_type 2 (Sundale Valley)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "3": {  // Loc_type 3 (Ragon Snowy Peak)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "4": {  // Loc_type 4 (Edengate)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "5": {  // Loc_type 5 (Howling Gobi)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    },
    "6": {  // Loc_type 6 (Kepler Harbour)
        "treasure": { max: 0, current: 0, icon: categoryIcons.treasure },
        "resource": { max: 0, current: 0, icon: categoryIcons.resource },
        "training": { max: 0, current: 0, icon: categoryIcons.training },
        "zone": { max: 0, current: 0, icon: categoryIcons.zone },
        "fishing": { max: 0, current: 0, icon: categoryIcons.fishing },
        "scenery": { max: 0, current: 0, icon: categoryIcons.scenery }
    }
};

const fishingCategories = [9, 10, 11, 12, 13, 14]; // Combine fishing categories

function initMap() {
    const init_position = window.init_position || "60.871009248911655,-76.62568359375001";
    const center_position = init_position.split(",");

    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const mapBounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        maxBounds: mapBounds,
        maxBoundsViscosity: 1.0,
    }).setView([parseFloat(center_position[0]), parseFloat(center_position[1])], 6);

    L.tileLayer('statics/yuan_{z}_{x}_{y}.png', {
        tileSize: 256,
        minZoom: 6,
        maxZoom: 9,
        noWrap: true,
        bounds: L.latLngBounds(
            L.latLng(57, -67.40522460937501),
            L.latLng(66, -89.4)
        ),
        zoomFilter: function(coords, zoom) {
            if (zoom < 4 || zoom > 9) return false;
            const temp = xyDeny[`zoom_${zoom}`];
            return (temp[0] <= coords.x && coords.x <= temp[1]) &&
                   (temp[0] <= coords.y && coords.y <= temp[1]);
        },
        getTileUrl: function(coords) {
            return this.options.zoomFilter(coords, coords.z) 
                ? `statics/yuan_${coords.z}_${coords.x}_${coords.y}.png` 
                : '';
        }
    }).addTo(map);

    fetch('https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Fetched Data: `, data);
            jsonData = data;
            addMarkersToMap(); // Add markers after fetching data
            setupFilterListeners(); // Ensure filter listeners are set up
        })
        .catch(error => console.error('Error fetching marker data:', error));
}
// Fungsi utama untuk menampilkan atau menyembunyikan marker berdasarkan filter
function showMarkers() {
    markers.forEach(marker => {
        const locTypeMatch = activeLocTypes.length === 0 || activeLocTypes.includes(`loc_type${marker.options.loc_type}`);
        const categoryMatch = activeFilters.length === 0 || activeFilters.includes(marker.options.category.toString());

        // Tampilkan marker jika sesuai dengan loc_type dan kategori
        if (locTypeMatch && categoryMatch) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
    updateCategoryDisplay(currentLocType); // Pastikan tampilan kategori diperbarui
}


// Function to map categoryId to category name

function getCategoryName(categoryId) {
    switch (categoryId) {
        case "1": return "teleport"; // Atur nama kategori untuk ID 1
        case "2": return "treasure";
        case "3": return "zone";
        case "7": return "training";
        case "8": return "scenery";
        case "9": return "fishing"; // Tambah ID 9 ke kategori fishing
        case "10": return "fishing"; // Tambah ID 10 ke kategori fishing
        case "11": return "fishing"; // Jika ID 11 juga berhubungan dengan kategori fishing
        case "13": return "fishing"; // Jika ID 13 juga berhubungan dengan kategori fishing
        case "14": return "fishing"; // Tambah ID 14 ke kategori fishing
        case "18": return "resource";
        default:
            if (fishingCategories.includes(parseInt(categoryId))) return "fishing"; // Jika ID ada dalam fishingCategories
            console.log(`Unrecognized categoryId: ${categoryId}`);
            return null; // Return null if category is unrecognized
    }
}


// Function to reset category counts
function resetCategoryCounts() {
    console.log('Resetting category counts');

    // Reset current counts ke 0 untuk semua loc_types dan categories
    for (const locType in categoryCounts) {
        for (const category in categoryCounts[locType]) {
            categoryCounts[locType][category].current = 0; // Reset current count
            categoryCounts[locType][category].max = 0; // Reset max count
        }
    }

    // Hitung max counts setelah reset
    calculateMaxCounts(); // Hanya dipanggil sekali saat reset
}


// Function to load current count from local storage
function loadCurrentCount(locType, categoryName) {
    const savedCounts = JSON.parse(localStorage.getItem('markerCounts')) || {};
    return savedCounts[`${locType}-${categoryName}`] || 0; // Return 0 if not found
}

// Function to initialize markers
function initializeMarkers() {
    

    // Load counts untuk Current dan Max di awal
    for (const locType in categoryCounts) {
        for (const category in categoryCounts[locType]) {
            const currentCount = loadCurrentCount(locType, category) || 0; // Load current count dari localStorage
            categoryCounts[locType][category].current = currentCount; // Set current count
        }
    }

    // Load markers dari local storage dan update counts
    markers.forEach(marker => {
        const savedOpacity = loadMarkerOpacity(marker.options.id); // Load opacity dari local storage
        const opacity = savedOpacity !== null ? savedOpacity : marker.options.opacity || 1.0; // Set opacity berdasarkan nilai yang disimpan
        marker.setOpacity(opacity); // Set opacity

        // Update counts untuk marker yang dimuat
        updateCategoryCounts(marker.options.loc_type, marker.options.category, opacity, opacity === 0.5); // Update counts berdasarkan opasitas saat ini
    });

    updateCategoryDisplay(); // Refresh display setelah menginisialisasi marker
}


// Function to change marker opacity
function changeMarkerOpacity(markerId, newOpacity) {
    const marker = findMarkerById(markerId);

    if (marker) {
        const oldOpacity = marker.options.opacity; // Simpan opasitas lama
        marker.setOpacity(newOpacity); // Ubah opasitas marker
        saveMarkerOpacity(markerId, newOpacity); // Simpan opasitas baru

        console.log(`Changing opacity from ${oldOpacity} to ${newOpacity} for marker ID: ${markerId}`); // Log perubahan opacity

        // Update counts berdasarkan opasitas lama dan baru
        if (oldOpacity === 0.5 && newOpacity === 1.0) {
            // Ketika mengubah dari 0.5 ke 1.0, kurangi current count
            updateCategoryCounts(marker.options.loc_type, marker.options.category, oldOpacity, false); // Kurangi current count
            console.log(`Decreasing current count for ${marker.options.category} at locType ${marker.options.loc_type}`); // Log pengurangan
        } else if (oldOpacity === 1.0 && newOpacity === 0.5) {
            // Ketika mengubah dari 1.0 ke 0.5, tambah current count
            updateCategoryCounts(marker.options.loc_type, marker.options.category, newOpacity, true); // Tambah current count
            console.log(`Increasing current count for ${marker.options.category} at locType ${marker.options.loc_type}`); // Log penambahan
        } else if (oldOpacity === 0.5 && newOpacity === 0.5) {
            console.log(`Opacity remains 0.5 for marker ID: ${markerId}. No change to current count.`); // Log jika tidak ada perubahan
        }

        // Tambahkan log untuk melihat current count sebelum dan sesudah perubahan
        console.log(`Before update: ${categoryCounts[marker.options.loc_type][marker.options.category].current}`);
        updateCategoryDisplay(marker.options.loc_type); // Refresh tampilan
        console.log(`After update: ${categoryCounts[marker.options.loc_type][marker.options.category].current}`);
    } else {
        console.log(`Marker with ID: ${markerId} not found.`); // Log jika marker tidak ditemukan
    }
}



// Function to update category counts based on marker opacity
function updateCategoryCounts(locType, categoryId, opacity, increase = true) {
    const categoryName = getCategoryName(categoryId);
    
    if (!categoryName) {
        console.log(`Unrecognized categoryId: ${categoryId}`);
        return; // Keluar jika categoryName tidak dikenali
    }

    // Pastikan categoryCounts ada untuk locType dan category yang relevan
    if (categoryCounts[locType] && categoryCounts[locType][categoryName]) {
        const currentCount = categoryCounts[locType][categoryName].current;

        // Tambah current count untuk marker dengan opacity 0.5
        if (opacity === 0.5 && increase) {
            categoryCounts[locType][categoryName].current++; 
            console.log(`Current count increased to ${categoryCounts[locType][categoryName].current} for ${categoryName}`); // Log penambahan
        } 
        // Kurangi current count saat opacity diubah menjadi 1.0
        else if (opacity === 1.0 && !increase) {
            categoryCounts[locType][categoryName].current = Math.max(0, currentCount - 1);
            console.log(`Current count decreased to ${categoryCounts[locType][categoryName].current} for ${categoryName}`); // Log pengurangan
        }
    } else {
        console.log(`Counts not found for locType: ${locType}, categoryName: ${categoryName}`); // Log jika tidak ada kategori
    }
}

// Function to save current count to local storage
function saveCurrentCount(locType, categoryName, currentCount) {
    const savedCounts = JSON.parse(localStorage.getItem('markerCounts')) || {};
    savedCounts[`${locType}-${categoryName}`] = currentCount; // Use a composite key
    localStorage.setItem('markerCounts', JSON.stringify(savedCounts)); // Save back to local storage
}

// Function to update the display of category counts
function updateCategoryDisplay(locType) {
    if (!locType) return;

    // Loop melalui kategori di locType yang aktif dan perbarui tampilan
    for (const category in categoryCounts[locType]) {
        const element = document.querySelector(`#count-${category}-loc${locType} .count-text`);
        if (element) {
            const { max, current } = categoryCounts[locType][category];
            element.innerHTML = `${current}/${max}`; // Update hanya teks hitungan
            console.log(`Displaying ${category.charAt(0).toUpperCase() + category.slice(1)}: ${current}/${max}`); // Log pembaruan tampilan
        }
    }
}


// Initialize the markers and counts when the application starts
function main() {
    initializeMarkers(); // Initialize markers and counts
}

main(); // Call the main function to run the application

// Function to close the report form
function closeReportForm() {
    console.log('Closing form...');
    var formContainer = document.getElementById('reportFormContainer');
    if (formContainer) {
        formContainer.remove(); // Remove the form from the DOM
        console.log('Form removed from DOM');
    } else {
        console.log('Form not found');
    }
}

// Function to show the report form
function showReportForm(marker) {
    // Access custom properties from the marker object
    const markerId = marker.options.id;
    const categoryId = marker.options.category || 'Unknown';
    const nameEn = marker.options.en_name || 'Unknown';
    const locType = marker.options.loc_type || 'Unknown';

    console.log("Marker Info:", { markerId, categoryId, nameEn, locType }); // Debugging

    var formHtml = `
        <div id="reportFormContainer">
            <h3>Report Error</h3>
            <form id="reportForm">
                <label for="reportId">ID MARK:</label>
                <input type="text" id="reportId" name="reportId" value="${markerId}" readonly style="width: 15%;"><br><br>

                <label for="num1">Correct Coordinate:</label>
                <input type="number" id="num1" name="num1" min="0" step="1" required style="width: 20%; margin-right: 10px;"> 
                <input type="number" id="num2" name="num2" min="0" step="1" required style="width: 20%;"><br><br>

                <label for="errorDescription">Error Description (Name Map):</label>
                <textarea id="errorDescription" name="errorDescription" rows="4" placeholder="UID/YOUR NAME/DESCRIPTION"></textarea><br><br>

                <button type="button" id="submitReportBtn">Submit Report</button>
                <button type="button" class="cancel" id="cancelReportBtn">Cancel</button>
            </form>
        </div>
    `;

    // Insert the form into the document body
    document.body.insertAdjacentHTML('beforeend', formHtml);

    // Attach event listener for form submission
    document.getElementById('submitReportBtn').addEventListener('click', () => {
        const lat = marker.getLatLng().lat;  // Get the latitude from the marker
        const lng = marker.getLatLng().lng;  // Get the longitude from the marker
        console.log("Submitting Report:", { markerId, lat, lng, categoryId, nameEn, locType });
        submitReport(markerId, lat, lng, categoryId, nameEn, locType); // Call submit report
    });

    // Attach event listener for form cancellation
    document.getElementById('cancelReportBtn').addEventListener('click', closeReportForm);
}

function submitReport(markerId, lat, lng, categoryId, nameEn, locType) {
    var num1 = document.getElementById('num1').value;
    var num2 = document.getElementById('num2').value;
    var errorDescription = document.getElementById('errorDescription').value;

    // Objek pemeta untuk loc_type dan category_id
    const locTypeMap = {
        "2": "Sundale Valley",
        "3": "Ragon Snowy Peak",
        "4": "Edengate",
        "5": "Howling Gobi",
        "6": "Kepler Harbour"
    };

    const categoryMap = {
        "1": "Teleport",
        "2": "Treasure",
        "3": "Zone",
        "7": "Training",
        "9": "Fishing",
        "10": "Fishing",
        "11": "Fishing",
        "12": "Fishing",
        "13": "Fishing",
        "14": "Fishing", 
        "18": "resource"
    };

    // Mengganti ID dengan nama menggunakan pemeta
    const categoryName = categoryMap[categoryId] || 'Unknown';
    const locTypeName = locTypeMap[locType] || 'Unknown';

    if (!num1 || !num2) {
        alert('Please fill in the number fields');
        return;
    }

    const jsonData = {
        Name: nameEn || 'Unknown',  // Jika undefined, beri nilai default
        ID: markerId,
        latitude: lat,
        longitude: lng,
        category_id: categoryName,  // Kirim nama kategori
        loc_type: locTypeName,      // Kirim nama loc_type
        "X-coordinate": num1,
        "Y-coordinate": num2,
        description: errorDescription
    };

    // Convert to JSON string for debugging
    const formattedJson = JSON.stringify(jsonData, null, 4);
    console.log('Submitting report with the following data:', formattedJson);

    // Send the report using fetch
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/Report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: formattedJson,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        console.log('Response Text:', data);
        if (data === "JSON stored successfully") {
            closeReportForm(); // Close form if submission is successful
        } else {
            console.error('Unexpected response:', data);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Function to set up marker interactions (popup, report button, etc.)
function setupMarkerInteractions(marker, location, key) {
    // Create the content for the popup
    const contentString = `
        <div style="position: relative; padding: 15px; font-family: Arial, sans-serif; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25); background-color: rgba(19, 39, 96, 0.613);">
            <h3 style="margin-top: 0; margin-bottom: 8px; color: #ffffff; font-size: 18px;">${location.en_name}</h3>
            <p style="font-size: 14px; color: #ffffff; margin-bottom: 8px;">${(location.desc || 'No description available.').replace(/\n/g, '<br>').replace(/<b>/g, '<b>').replace(/<\/b>/g, '</b>')}</p>
            ${(location.links_info && location.links_info !== '[]') ? `<a href="${location.links_info}" target="_blank" style="display: inline-block; padding: 8px 12px; margin-top: 8px; font-size: 14px; color: #ffffff; background-color: #007bff; border-radius: 4px; text-decoration: none;">Watch Video</a>` : ''}
            <button class="reportButton" data-id="${key}" style="position: absolute; bottom: 10px; right: 10px; background: none; border: none; color: red; font-size: 12px; cursor: pointer; z-index: 1300;">Report</button>
        </div>
    `;

    // Bind the popup with an offset to position it above the marker
    marker.bindPopup(contentString, {
        offset: L.point(0, -20) // Adjust the Y offset as needed
    });
marker.on('popupopen', () => {
    console.log('Popup opened for marker:', marker.options.id);
    setupReportButton(marker, marker.options.id);
});

    // Handle marker click to open popup and set up report button
marker.on('contextmenu', (e) => {
    const currentOpacity = marker.options.opacity || 1.0; // Default opacity is 1.0
    const newOpacity = currentOpacity === 1.0 ? 0.5 : 1.0; // Toggle opacity

    // Log for debugging
    console.log(`Changing opacity for marker ${marker.options.id}: from ${currentOpacity} to ${newOpacity}`);

    // Update category counts based on the old opacity
    if (currentOpacity === 0.5) {
        // Jika marker sebelumnya transparan, kurangi current count
        updateCategoryCounts(marker.options.loc_type, marker.options.category, currentOpacity, false); // Decrease count
    } else if (currentOpacity === 1.0) {
        // Jika marker sebelumnya tidak transparan, tidak perlu melakukan apa-apa
    }

    // Set the new opacity
    marker.setOpacity(newOpacity); // Change marker opacity
    saveMarkerOpacity(marker.options.id, newOpacity); // Save the new opacity

    if (newOpacity === 0.5) {
        // Jika marker baru saja menjadi transparan, tingkatkan current count
        updateCategoryCounts(marker.options.loc_type, marker.options.category, newOpacity, true); // Increase count
    } else if (newOpacity === 1.0) {
        // Jika marker baru saja menjadi tidak transparan, kurangi current count
        updateCategoryCounts(marker.options.loc_type, marker.options.category, newOpacity, false); // Decrease count
    }

    updateCategoryDisplay(marker.options.loc_type); // Refresh category display
});


}

// Function to set up the report button functionality
function setupReportButton(marker, key) {
    // Attach event listener to the Report button in the popup
    const reportButton = document.querySelector('.reportButton[data-id="' + key + '"]');
    console.log('Checking for Report Button with key:', key);  // Debugging
    console.log('Report Button:', reportButton);  // Debugging untuk memastikan tombol ditemukan

    if (reportButton) {
        reportButton.addEventListener('click', () => {
            console.log('Report button clicked'); // Untuk memastikan tombol diklik
            showReportForm(marker);
        });
    } else {
        console.log('Report button not found');
    }
}



// Initialize the map and add markers (assuming this is called on DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    // Assume jsonData is loaded here
    addMarkersToMap(jsonData); // Call this with your actual jsonData
});

// Function to get category from marker
function getCategoryFromMarker(marker) {
    const iconUrl = marker.options.icon.options.iconUrl;

    if (iconUrl.includes('icon_treasure.png')) return 'treasure';
    if (iconUrl.includes('icon_teleport.png')) return 'teleport';
    if (iconUrl.includes('icon_fishing.png') || 
        iconUrl.includes('icon_fishing_10.png') || 
        iconUrl.includes('icon_fishing_11.png') || 
        iconUrl.includes('icon_fishing_12.png') || 
        iconUrl.includes('icon_fishing_13.png') || 
        iconUrl.includes('icon_fishing_14.png')) return 'fishing';
    if (iconUrl.includes('icon_zone.png')) return 'zone';
    if (iconUrl.includes('icon_train.png')) return 'training';
    if (iconUrl.includes('icon_scenery.png')) return 'scenery';
    if (iconUrl.includes('icon_resource.png')) return 'resource';
    
    return null; // Category not found
}

// Function to get icon URL based on category ID
function getIconUrl(categoryId) {
    switch (categoryId) {
        case "1": return "icons/icon_teleport.png"; // Teleport
        case "2": return "icons/icon_treasure.png"; // Treasure Hunt
        case "3": return "icons/icon_zone.png"; // Zone
        case "7": return "icons/icon_train.png"; // Training
        case "8": return "icons/icon_scenery.png"; // Scenery
        case "9": return "icons/icon_fishing.png"; // Fishing
        case "10":
        case "11":
        case "12":
        case "13":
        case "14": return "icons/rare_fishing.png"; // Fishing
        case "18": return "icons/icon_resource.png";
        default: return "icons/default_icon.png"; // Default icon if no match
    }
}

// Function to save marker opacity to local storage
function saveMarkerOpacity(id, opacity) {
    const storedOpacities = JSON.parse(localStorage.getItem('markerOpacities')) || {};
    storedOpacities[id] = opacity;
    localStorage.setItem('markerOpacities', JSON.stringify(storedOpacities));
}

// Function to load marker opacity from local storage
function loadMarkerOpacity(id) {
    const storedOpacities = JSON.parse(localStorage.getItem('markerOpacities')) || {};
    return storedOpacities[id] || null; // Mengembalikan null jika tidak ditemukan, bukan 1.0
}


// Function to find marker by ID
function findMarkerById(markerId) {
    return markers.find(marker => marker.options.icon.options.iconUrl.includes(markerId));
}

// Initialize map on document ready
document.addEventListener("DOMContentLoaded", () => {
    initMap();
});

// Function for popup handling
window.onload = function() {
    const popup = document.getElementById('patch-popup');
    const closeBtn = document.querySelector('.popup .close');

    popup.style.display = 'flex';

    closeBtn.onclick = () => {
        popup.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    };

    initMap();
};


// Function to filter markers based on selected categories
function filterMarkers() {
    const selectedFilters = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(cb => cb.dataset.filter);
    
    markers.forEach(marker => {
        const category = getCategoryFromMarker(marker); // Get category from marker

        // If "all" is selected, show all markers
        if (selectedFilters.includes('all') || selectedFilters.includes(category)) {
            marker.addTo(map); // Show marker
        } else {
            map.removeLayer(marker); // Hide marker
        }
    });
}

// Call setupFilterListeners after all markers are added to the map
addMarkersToMap(map);
setupFilterListeners();

// Call setupFilterListeners after all markers are added to the map
addMarkersToMap(map);
setupFilterListeners();

// Function to handle button interactions
function setupButtonInteractions() {
    // Handle Donate Button Click
    const donateBtn = document.querySelector('.donate-btn');
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            console.log('Donate button clicked');
        });
    }

    // Toggle Legend Visibility
    const toggleLegend = document.getElementById('toggle-legend');
    if (toggleLegend) {
        toggleLegend.addEventListener('click', () => {
            const legend = document.getElementById('legend');
            if (legend) {
                legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // Toggle Filters Visibility
    const toggleFilters = document.getElementById('toggle-filters');
    if (toggleFilters) {
        toggleFilters.addEventListener('click', () => {
            const filters = document.getElementById('filters');
            if (filters) {
                filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

// Function to reset the opacity of all markers
function resetMarkerOpacity() {
    console.log('Resetting marker opacity to default (1.0)'); // Check if function is invoked
    
    // Check if markers is an array and is populated
    if (!Array.isArray(markers) || markers.length === 0) {
        console.error('Markers array is empty or not defined.'); // Log if markers are not available
        return; // Exit if markers are not available
    }

    // Loop through each marker and set opacity to 1.0
    markers.forEach(marker => {
        console.log(`Resetting opacity for marker with ID: ${marker.options.id}`); // Log which marker is being reset
        marker.setOpacity(1.0); // Set opacity to default (1.0)

        // Save the change if you have a function for it
        if (typeof saveMarkerOpacity === 'function') {
            saveMarkerOpacity(marker.options.id, 1.0);
        }
    });
}


// Button setup to reset opacity
document.addEventListener('DOMContentLoaded', () => {
    const resetOpacityBtn = document.getElementById('reset-opacity');
    
    if (resetOpacityBtn) {
        resetOpacityBtn.addEventListener('click', () => {
            console.log('Reset opacity button clicked'); // This log should appear when button is clicked
            resetMarkerOpacity(); // Call the function when the button is clicked
        });
    } else {
        console.error('Reset opacity button not found'); // Log if button isn't found
    }
});
}

const toggleNewFiltersContainer = document.querySelector('.toggle-new-filters-container');
const newFilterContainer = document.querySelector('.new-filter-container');

toggleNewFiltersContainer.addEventListener('click', () => {
    newFilterContainer.style.display = 
        newFilterContainer.style.display === 'none' || newFilterContainer.style.display === '' ? 'flex' : 'none';
    
    // Make sure flex-direction is always row
    newFilterContainer.style.flexDirection = 'row'; // Ensure it's row
});



const toggleFilterContainer = document.querySelector('.toggle-legend-container');
const filterContainer = document.querySelector('.filter-container');

toggleFilterContainer.addEventListener('click', () => {
    filterContainer.style.display = 
        filterContainer.style.display === 'none' || filterContainer.style.display === '' ? 'flex' : 'none';
});

let activeMiniMapMarkers = []; // Array for storing active mini-map markers
let activeOverlays = [];
let activeMiniMapKey = null; // Variable for storing the active mini-map key



// Function to update the active filters (location types or categories)
function updateActiveFilters(filter) {
    if (filter.startsWith('loc_type')) {
        toggleLocType(filter);
    } else {
        updateCategoryFilters(filter);  // Update categories if it's not loc_type
    }
    updateMarkers(); // Update markers after filter change
}


// Function to toggle location types
function toggleLocType(filter) {
    const index = activeLocTypes.indexOf(filter);
    if (index > -1) {
        activeLocTypes.splice(index, 1); // Remove from activeLocTypes
    } else {
        activeLocTypes.push(filter); // Add to activeLocTypes
    }
    updateMiniMapOverlay(filter);  // Update mini-map overlay
}

// Function to clear all mini-map markers
function clearMiniMapMarkers() {
    activeMiniMapMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker); // Remove marker from map if it exists
        }
    });
    activeMiniMapMarkers = []; // Clear the mini-map markers array
}

// Function to add markers for the active mini-map
function addMarkersForMiniMap(miniMapKey) {
    if (!mini_map_type[miniMapKey]) {
        console.error(`No mini map type found for key: ${miniMapKey}`);
        return;
    }

    // Clear previous mini-map markers before adding new ones
    clearMiniMapMarkers();

    const relevantMarkers = mini_map_type[miniMapKey].markers || [];
    
    if (!Array.isArray(relevantMarkers)) {
        console.error('Relevant markers is not an array:', relevantMarkers);
        return;
    }

relevantMarkers.forEach(markerData => {
        const latLng = [parseFloat(markerData.lat), parseFloat(markerData.lng)];
        const marker = L.marker(latLng, {
            icon: L.icon({
                iconUrl: 'icons/here.png',
                iconSize: [50, 50]
            }),
            options: {
                category: markerData.category_id, // Pastikan ini diisi dengan benar
                loc_type: miniMapKey // Pastikan ini sesuai dengan loc_type
            }
        });

        marker.addTo(map);
        activeMiniMapMarkers.push(marker);

        // Update counts untuk marker yang ditambahkan
        updateCategoryCounts(marker.options.loc_type, marker.options.category, 0.5); // Asumsikan opasitas awal adalah 0.5
    });
}
// Event listener for filter buttons
document.querySelectorAll('.new-filter-container .filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        setTimeout(() => {
            const filterKey = button.getAttribute('data-filter');

            // Clear all previous markers and mini-map overlays
            clearAllMarks(); // Remove markers from the main map


            // Add the new filter to activeLocTypes and show markers based on the filter
            activeLocTypes.push(filterKey);
            showMarkers();

            let miniMapKey;
            switch (filterKey) {
                case 'loc_type2': miniMapKey = 'djhg'; break;
                case 'loc_type5': miniMapKey = 'jjgb'; break;
                case 'loc_type4': miniMapKey = 'ydc'; break;
                case 'loc_type3': miniMapKey = 'lgxs'; break;
                case 'loc_type6': miniMapKey = 'kplg'; break;
                default: miniMapKey = null;
            }

            if (miniMapKey && mini_map_type.hasOwnProperty(miniMapKey)) {
                // If there is an active mini-map different from the current one, clear old markers
                if (activeMiniMapKey !== miniMapKey) {
                    clearMiniMapMarkers(); // Clear old mini-map markers
                    activeMiniMapKey = miniMapKey; // Update the active mini-map key
                }

                // Clear all active overlays
                activeOverlays.forEach(overlay => overlay.remove());
                activeOverlays = [];

                // Add new overlay
                const info = mini_map_type[miniMapKey];
                const imageBounds = getImageBounds(info.map_position);
                const historicalOverlay = L.imageOverlay(info.type.default.map_url, imageBounds);
                historicalOverlay.addTo(map);
                activeOverlays.push(historicalOverlay);

                // Add new markers to the mini-map
                addMarkersForMiniMap(miniMapKey);

                // Center the map on the new bounds
                centerMapOnBounds(imageBounds);
            }

            // Hide the filter container after selecting a filter
            document.querySelector('.new-filter-container').style.display = 'none';
        }, 1000); // Delay 1 second
    });
});

// Function to get image bounds from map positions
function getImageBounds(mapPosition) {
    return [
        [
            parseFloat(mapPosition[0].split(",")[0]),
            parseFloat(mapPosition[0].split(",")[1])
        ],
        [
            parseFloat(mapPosition[1].split(",")[0]),
            parseFloat(mapPosition[1].split(",")[1])
        ]
    ];
}
let currentLocType = null; // Menyimpan loc_type saat ini

document.querySelectorAll('.loc-type-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const locTypeId = event.target.dataset.locType; // Ambil data locType
        onLocTypeChange(locTypeId); // Panggil fungsi untuk memperbarui tampilan
    });
});


// Event listener untuk filter tombol
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const locType = this.getAttribute('data-filter').replace('loc_type', ''); // Ambil nomor loc_type
        console.log(`Filter selected for loc_type: ${locType}`);

        // Update activeLocTypes dan tampilkan loc_type
        activeLocTypes.push(this.getAttribute('data-filter')); // Tambahkan filter ke activeLocTypes
        onLocTypeChange(locType); // Tampilkan loc_type yang baru

        // Update tampilan kategori untuk loc_type yang dipilih
        updateCategoryDisplay(locType); 
    });
});

// Fungsi untuk menampilkan loc_type
function showLocType(locType) {
    // Sembunyikan semua loc-type
    const locTypes = document.querySelectorAll('.count-container > div');
    locTypes.forEach(loc => {
        loc.style.display = 'none'; // Sembunyikan semua
    });

    // Tampilkan loc-type yang dipilih
    const locTypeElement = document.getElementById(`loc-type-${locType}`);
    if (locTypeElement) {
        locTypeElement.style.display = 'block'; // Tampilkan yang sesuai
        currentLocType = locType; // Simpan loc_type yang saat ini
    }
}

// Panggil fungsi ini ketika loc_type diubah
function onLocTypeChange(newLocType) {
    showLocType(newLocType); // Tampilkan loc-type baru
    updateCategoryDisplay(newLocType); // Update display setelah loc-type berubah
}


// New function to add markers for the active mini-map

// Function to center the map on the given bounds
function centerMapOnBounds(imageBounds) {
    const midLat = (imageBounds[0][0] + imageBounds[1][0]) / 2;
    const midLng = (imageBounds[0][1] + imageBounds[1][1]) / 2;
    const offsetLng = 0.01; // Adjust this value as needed
    const newCenter = [midLat, midLng - offsetLng];

    // Step 1: Zoom out to level 4
    map.setView(map.getCenter(), 4, { animate: true, duration: 5 }); // 2 seconds for zoom out

    // Step 2: Wait for zoom out to complete, then move to new center
    setTimeout(() => {
        // Move to new center
        map.setView(newCenter, map.getZoom(), { animate: true, duration: 1 }); // Stay at current zoom level

        // Step 3: After moving, zoom in to level 7
        setTimeout(() => {
            map.setView(newCenter, 7, { animate: true, duration: 5 }); // 2 seconds for zoom in
            updateMarkers(); // Ensure filters are applied after markers are cleared
        }, 500); // Wait for half a second before zooming in
    }, 1000); // Wait for 2.5 seconds for the zoom out to finish
}


// Function to update filter listeners
function setupFilterListeners() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const allCheckbox = document.querySelector('.filter-checkbox[data-filter="all"]');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.dataset.filter === 'all') {
                // If 'all' is checked/unchecked, update all other checkboxes
                filterCheckboxes.forEach(cb => {
                    if (cb !== allCheckbox) {
                        cb.checked = allCheckbox.checked;
                    }
                });
            } else {
                // If any other checkbox is unchecked, uncheck 'all'
                if (!checkbox.checked) {
                    allCheckbox.checked = false;
                }
                // If all other checkboxes are checked, check 'all'
                const allOthersChecked = Array.from(filterCheckboxes)
                    .filter(cb => cb !== allCheckbox)
                    .every(cb => cb.checked);
                if (allOthersChecked) {
                    allCheckbox.checked = true;
                }
            }

            // Update activeFilters based on current checkbox states
            activeFilters = Array.from(filterCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.filter);

            // Update markers visibility
            updateMarkers();
        });
    });
}

function updateMarkers() {
    markers.forEach((marker) => {
        const categoryMatch = isCategoryMatch(marker);
        const locTypeMatch = activeLocTypes.length === 0 || activeLocTypes.includes(`loc_type${marker.options.loc_type}`);

        if (locTypeMatch && categoryMatch) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
    updateCategoryDisplay();
}


// Function to clear all markers from the map
function clearAllMarks() {
    // Uncheck semua filter checkbox
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false; // Uncheck checkbox
    });

    // Kosongkan array activeLocTypes dan activeFilters
    activeLocTypes = [];
    activeFilters = [];

    // Sembunyikan semua marker di peta
    updateMarkers();
    console.log("Markers cleared, filters reset.");
}


// Function to check if the marker's category matches the active filters
function isCategoryMatch(marker) {
    if (activeFilters.includes('all')) return true;
    const category = marker.options.category;
    return (activeFilters.includes('treasure') && category === '2') ||
           (activeFilters.includes('teleport') && category === '1') ||
           (activeFilters.includes('fishing') && ['9', '10', '11', '12', '13', '14'].includes(category)) ||
           (activeFilters.includes('zone') && category === '3') ||
           (activeFilters.includes('training') && category === '7') ||
           (activeFilters.includes('scenery') && category === '8') ||
           (activeFilters.includes('resource') && category === '18');
}
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.new-filter-container .filter-btn');

    function checkVisibility() {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const container = document.querySelector('.new-filter-container');
        const buttons = document.querySelectorAll('.new-filter-container .filter-btn');

        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Calculate center positions
            const buttonCenterX = rect.left + rect.width / 2;
            const containerCenterX = containerRect.left + containerRect.width / 2;

            const isVisible = (
                rect.top < viewportHeight &&
                rect.bottom > 0 &&
                rect.left < viewportWidth &&
                rect.right > 0
            );

            if (isVisible && Math.abs(containerCenterX - buttonCenterX) < rect.width / 2) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

function centerOnHover() {
    const container = document.querySelector('.new-filter-container');
    
    container.addEventListener('mouseover', (event) => {
        if (event.target.classList.contains('filter-btn')) {
            const button = event.target;
            const rect = button.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Menghitung posisi tengah viewport
            const viewportCenterX = window.innerWidth / 2;

            // Menghitung scroll position untuk memusatkan tombol yang dihover
            const buttonCenterX = rect.left + rect.width / 2;
            const offset = buttonCenterX - viewportCenterX;

            // Gulirkan kontainer
            container.scrollTo({
                left: container.scrollLeft + offset,
                behavior: 'smooth'
            });

            // Menambahkan kelas 'hover' pada tombol yang dihover
            button.classList.add('hover');
        }
    });

    container.addEventListener('mouseout', (event) => {
        if (event.target.classList.contains('filter-btn')) {
            // Menghapus kelas 'hover' saat mouse keluar dari tombol
            event.target.classList.remove('hover');
        }
    });
}

// Run on page load and on scroll
checkVisibility();
window.addEventListener('scroll', checkVisibility);
window.addEventListener('resize', checkVisibility);
centerOnHover();

// Run on page load and on scroll
checkVisibility();
window.addEventListener('scroll', checkVisibility);
window.addEventListener('resize', checkVisibility);
centerOnHover();
});

// Display the pop-up when the page loads
window.onload = function() {
    const popup = document.getElementById('patch-popup');
    const closeBtn = document.querySelector('.popup .close');

    // Show the pop-up
    popup.style.display = 'flex';

    // Hide the pop-up when the close button is clicked
    closeBtn.onclick = function() {
        popup.style.display = 'none';
    };

    // Hide the pop-up when clicking outside the content
    window.onclick = function(event) {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    };
};

// Optional: Handle scroll for filter-checkbox-btn
const container = document.querySelector('.new-filter-container');
const items = document.querySelectorAll('.new-filter-container .filter-checkbox-btn');

container.addEventListener('scroll', () => {
    const containerRect = container.getBoundingClientRect();
    
    items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;

        if (Math.abs(containerCenter - itemCenter) < itemRect.width / 2) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
});

// Handle scroll for new filter container with animation
function handleScroll() {
    const container = document.querySelector('.new-filter-container');
    const rect = container.getBoundingClientRect();
    
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        container.classList.add('slide-in');
        container.classList.remove('slide-out');
    } else {
        container.classList.add('slide-out');
        container.classList.remove('slide-in');
    }
}

// Add event listener for scroll
window.addEventListener('scroll', handleScroll);

// Run function on page load and after toggling
handleScroll();


document.getElementById('zoomBtn').addEventListener('click', function() {
    var fullscreenImage = document.getElementById('fullscreen-image');
    fullscreenImage.style.display = 'flex';
    
    // Display fullscreen image
    fullscreenImage.innerHTML = '<img src="icons/space.png" alt="Space Image" />';
    
    // Start zoom out and slide to the right animation
    setTimeout(function() {
        fullscreenImage.querySelector('img').style.transform = 'scale(1) translateX(-25%)'; // Image ends 20% to the right
    }, 10); // Slight delay for transition to work
    
    // After 2 seconds, redirect to link
    setTimeout(function() {
        window.location.href = 'https://bangonegaming.com/pegasus/index.html';
    }, 2000); // Redirect after 2 seconds
});

document.getElementById("hildeBtn").onclick = function () {
    window.location.href = "https://bangonegaming.com/hilde/index.html";
};

document.addEventListener("DOMContentLoaded", function() {
    // Daftar teks untuk preloader
    const preloaderTexts = [
        "TIPS:\nTry Hold Marker to Mark it",
        "TIPS: You Can Report Error Marker",
        "If There Are Any Problems And Suggestions Contact Bangone On Tiktok",
        "Fetching location data...",
        "Almost ready, hang tight!"
    ];

    // Mendapatkan elemen DOM
    const textElement = document.getElementById("preloader-text");
    const loadingBar = document.getElementById("loading-bar");
    const loadingText = document.getElementById("loading-text");

    // Cek apakah elemen ditemukan sebelum mengaksesnya
    if (!textElement || !loadingBar || !loadingText) {
        console.error("Elemen tidak ditemukan!");
        return; // Keluar dari fungsi jika elemen tidak ditemukan
    }

    let index = 0;
    let percentage = 0;

    // Fungsi untuk mengubah teks preloader
    function changePreloaderText() {
        index = (index + 1) % preloaderTexts.length;
        textElement.textContent = preloaderTexts[index];
    }

    // Fungsi untuk memperbarui loading bar
    function updateLoadingBar() {
        percentage += 10; // Menambah persentase setiap interval
        if (percentage <= 100) {
            loadingBar.style.width = percentage + "%";
            loadingText.textContent = "Loading... " + percentage + "%";
        } else {
            clearInterval(loadingInterval); // Hentikan interval setelah mencapai 100%
        }
    }

    // Simulasi loading progress
    const loadingProgressInterval = setInterval(() => {
        if (percentage < 100) {
            updateLoadingBar();
        } else {
            clearInterval(loadingProgressInterval);
        }
    }, 700); // Update setiap 500ms

    // Mengubah teks setiap 2 detik
    setInterval(changePreloaderText, 3000);

    // Otomatis menutup preloader setelah 5 detik
    setTimeout(() => {
        loadingText.textContent = "Loading... 100%"; // Tampilkan 100% untuk saat terakhir
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none'; // Sembunyikan preloader
        }, 5000); // Tunggu 1 detik sebelum menyembunyikan
    }, 7000); // Total 5 detik delay untuk menutup otomatis
});