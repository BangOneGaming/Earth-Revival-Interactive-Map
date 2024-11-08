

let activeFilters = [];
let activeLocTypes = [];
let markers = [];
let jsonData = {};
let holdTimeout;
let map; // Declare map at a broader scope
let markerVisibility = {};

 

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
            const initialOpacity = loadMarkerOpacity(key) || 1.0;

            // Assign properti tambahan ke marker (dengan fallback value)
            const locType = location.loc_type || 'Unknown';
            const categoryId = location.category_id || 'Unknown';
            const nameEn = location.en_name || 'Unknown';
            const markerId = location.id || key;
            const ysId = location.ys_id || 'Unknown';
            const imageInfo = location.image_info || 'No image info available';

            // Buat marker Leaflet dengan ikon dan opacity yang ditentukan
            const marker = L.marker(latLng, {
                icon: L.icon({
                    iconUrl: iconUrl,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                opacity: initialOpacity,
            });

            // Tambahkan properti tambahan ke marker options
            marker.options.loc_type = locType;
            marker.options.category = categoryId;
            marker.options.id = markerId;
            marker.options.en_name = nameEn;
            marker.options.ys_id = ysId;
            marker.options.image_info = imageInfo;

            // Simpan marker ke array markers untuk referensi di masa depan
            markers.push(marker);

            // Setup interaksi marker
            setupMarkerInteractions(marker, location, markerId);

            // Tambahkan event click untuk animasi bounce
            marker.on('click', function () {
                console.log(`Marker ${markerId} clicked! Starting animation...`);
                
                // Membuat animatedMarker setelah marker diklik
                const animatedMarker = L.animatedMarker(marker.getLatLng(), {
                    autoStart: true,
                    interval: 300,
                });

                // Menambahkan marker animasi ke peta
                animatedMarker.addTo(map);

                // Memulai animasi
                animatedMarker.start();
            });

            // Update kategori berdasarkan kategori marker dan opacity
            updateCategoryCounts(locType, categoryId, initialOpacity);
        }
    }

    // Hitung jumlah maksimum setelah semua marker ditambahkan
    calculateMaxCounts();

    // Sembunyikan marker awal dan update tampilan kategori
    hideMarkers();
    updateCategoryDisplay();  // Pastikan tampilan kategori diupdate setelah menambahkan semua marker
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

function initMap() {
    const init_position = window.init_position || "60.871009248911655,-76.62568359375001";
    const center_position = init_position.split(",");

    // Mengatur batas peta dengan latLng yang sesuai
    const southWest = L.latLng(57, -89.4);
    const northEast = L.latLng(66, -67.40522460937501);
    const mapBounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        maxBounds: mapBounds,
        maxBoundsViscosity: 1.0, // Mencegah pengguna keluar dari batas
        zoomSnap: 0.1, // Atur langkah zoom ke 0.1
        zoomDelta: 0.1, // Atur langkah zoom saat menggunakan kontrol zoom
    }).setView([parseFloat(center_position[0]), parseFloat(center_position[1])], 6);

    // Menambahkan tile layer
    const tileLayer = L.tileLayer('statics/yuan_{z}_{x}_{y}.png', {
        tileSize: 256,
        minZoom: 6,
        maxZoom: 9,
        noWrap: true,
        bounds: mapBounds, // Set bounds untuk tile layer
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

    // Menambahkan listener untuk menangani pergeseran peta
    map.on('dragend', function() {
        const currentCenter = map.getCenter();
        const tileBounds = L.latLngBounds(southWest, northEast); // Batas tile yang dimuat
        if (!tileBounds.contains(currentCenter)) {
            map.setView(tileBounds.getCenter()); // Menarik kembali ke pusat batas tile
        }
    });

    // Pastikan untuk menambahkan layer dan pengaturan filter setelah memuat data
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
            addMarkersToMap(); // Tambahkan marker setelah mengambil data
            setupFilterListeners(); // Pastikan listener filter disiapkan
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
            categoryCounts[locType][category].max = 0; // Reset max count (optional, tergantung kebutuhan)
        }
    }

    // Hitung ulang max counts
    calculateMaxCounts(); // Menghitung kembali max counts

    // Perbarui tampilan untuk mencerminkan count yang telah direset
    // Panggil updateCategoryDisplay untuk semua locType
    for (const locType in categoryCounts) {
        updateCategoryDisplay(locType); // Memperbarui tampilan untuk setiap locType
    }
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
function updateCategoryCounts(locType, categoryId, opacity) {
    const categoryName = getCategoryName(categoryId);
    
    if (!categoryName) {
        console.log(`Unrecognized categoryId: ${categoryId}`);
        return; // Exit if categoryName is not recognized
    }

    // Ensure categoryCounts exists for locType and relevant category
    if (categoryCounts[locType] && categoryCounts[locType][categoryName]) {
        const currentCount = categoryCounts[locType][categoryName].current;

        // Increase count for marker with opacity 0.5
        if (opacity === 0.5) {
            categoryCounts[locType][categoryName].current++;
            console.log(`Current count increased to ${categoryCounts[locType][categoryName].current} for ${categoryName}`);
        } 
        // Decrease count when opacity is set to 1.0
        else if (opacity === 1.0) {
            categoryCounts[locType][categoryName].current = Math.max(0, currentCount - 1);
            console.log(`Current count decreased to ${categoryCounts[locType][categoryName].current} for ${categoryName}`);
        }
    } else {
        console.log(`Counts not found for locType: ${locType}, categoryName: ${categoryName}`);
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

let savedLat = null;
let savedLng = null;
let draggableMarker = null; // Store reference to the marker
let confirmationPopup = null; // Store reference to the popup
let labelMarker = null;
function addDraggableIcon() {
    map.closePopup();
    const icon = L.icon({
        iconUrl: 'icons/icon_default.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    draggableMarker = L.marker(map.getCenter(), {
        draggable: true,
        icon: icon,
    }).addTo(map);

    const labelIcon = L.divIcon({
        className: 'drag-marker-label',
        html: `
            <div style="
                background-color: rgba(255, 255, 255, 0.8); 
                padding: 5px; 
                border-radius: 3px; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.3); 
                display: inline-block;
                white-space: nowrap;
            ">
                Drag the marker!
            </div>`,
        iconAnchor: [48, 64]
    });

    const labelMarker = L.marker(draggableMarker.getLatLng(), { icon: labelIcon, interactive: false }).addTo(map);

    // Set a timeout to remove the labelMarker after 3 seconds
    setTimeout(() => {
        if (labelMarker) {
            map.removeLayer(labelMarker); // Remove label from the map
            labelMarker = null; // Reset label reference
        }
    }, 3000); // 3000 milliseconds = 3 seconds

    draggableMarker.on('drag', function(event) {
        labelMarker.setLatLng(event.latlng);
    });

    draggableMarker.on('dragend', function (event) {
        const position = event.target.getLatLng();
        savedLat = position.lat;
        savedLng = position.lng;

        showConfirmationPopup();
    });

    draggableMarker.on('dragstart', function () {
        hideConfirmationPopup();
    });
}



// Function to hide the marker
function hideMarkers() {
    if (draggableMarker) {
        draggableMarker.remove(); // Remove marker from map
        draggableMarker = null; // Reset marker reference
    }
}

// Function to disable all checklists on filters
function disableAllChecklists() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]'); // Adjust selector as per your checklist elements
    checkboxes.forEach(checkbox => {
        checkbox.checked = false; // Disable all checkboxes
    });
}


function showConfirmationPopup() {
    confirmationPopup = document.createElement('div');
    
    confirmationPopup.style.position = 'absolute';
    confirmationPopup.style.borderRadius = '5px';
    confirmationPopup.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    confirmationPopup.style.zIndex = '1000';
    confirmationPopup.style.background = 'none';

    function positionPopup() {
        const markerPosition = map.latLngToContainerPoint(L.latLng(savedLat, savedLng));
        confirmationPopup.style.left = `${markerPosition.x - 10}px`; 
        confirmationPopup.style.top = `${markerPosition.y - 40}px`; 
    }

    positionPopup();
    draggableMarker.on('drag', positionPopup);

    confirmationPopup.innerHTML = `
       <button id="confirmButton" style="background: none; border: none; cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="45" style="fill: rgb(40,201,55);" />
                <path d="M 38.478 64.5 c -0.01 0 -0.02 0 -0.029 0 c -1.3 -0.009 -2.533 -0.579 -3.381 -1.563 L 21.59 47.284 c -1.622 -1.883 -1.41 -4.725 0.474 -6.347 c 1.884 -1.621 4.725 -1.409 6.347 0.474 l 10.112 11.744 L 61.629 27.02 c 1.645 -1.862 4.489 -2.037 6.352 -0.391 c 1.862 1.646 2.037 4.49 0.391 6.352 l -26.521 30 C 40.995 63.947 39.767 64.5 38.478 64.5 z" style="fill: rgb(255,255,255);" />
            </svg>
        </button>
    `;

    document.body.appendChild(confirmationPopup);

    // Hide confirmation on map move or external click
    map.on('movestart', hideConfirmationPopup);
    document.addEventListener('click', onOutsideClick);

    // Event listener for confirm button
    document.getElementById('confirmButton').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent outside click event from triggering
        if (labelMarker) {
            map.removeLayer(labelMarker); // Hapus label dari map
            labelMarker = null; // Reset referensi label
        }
        console.log("Using saved latitude:", savedLat);
        console.log("Using saved longitude:", savedLng);
        
        const newEnergyCoordinates = { lat: savedLat, lng: savedLng };
        console.log("New Energy Coordinates:", newEnergyCoordinates);

        document.querySelector('.submit-marker-form').style.display = 'block';

        hideMarkers();
        hideConfirmationPopup();
    });

    // Helper function to hide popup when clicking outside of it
    function onOutsideClick(event) {
        if (!confirmationPopup.contains(event.target)) {
            hideConfirmationPopup();
        }
    }
}

function hideConfirmationPopup() {
    if (confirmationPopup) {
        document.body.removeChild(confirmationPopup);
        confirmationPopup = null;
        map.off('movestart', hideConfirmationPopup); // Remove event listener for map move
        document.removeEventListener('click', onOutsideClick); // Remove event listener for outside click
    }
}

// Close the form if clicked outside
document.addEventListener('click', function(event) {
    const formContainer = document.querySelector('.submit-marker-form');

    // Check if the form is open and the click is outside the form
    if (formContainer.style.display === 'block' && !formContainer.contains(event.target)) {
        formContainer.style.display = 'none';
    }
});
// Tampilkan tooltip dan collect tooltip setelah 10 detik dan sembunyikan setelah 15 detik (total tampil 5 detik)
document.addEventListener("DOMContentLoaded", function() {
    const tooltip = document.getElementById("tooltip");
    const collectTooltip = document.getElementById("tip-for-collect"); // Reference to the collect tooltip
    const toggleCollectButton = document.getElementById("toggle-collect"); // Reference to the toggle button

    // Show main tooltip
    setTimeout(() => {
        tooltip.style.opacity = 1; // Menampilkan tooltip

        setTimeout(() => {
            tooltip.style.opacity = 0; // Menyembunyikan tooltip setelah 5 detik
        }, 15000);
    }, 25000); // Delay 10 detik sebelum tooltip muncul

    // Show collect tooltip
    setTimeout(() => {
        collectTooltip.style.opacity = 1; // Show collect tooltip

        // Hide collect tooltip after an additional 15 seconds
        setTimeout(() => {
            collectTooltip.style.opacity = 0; // Hide collect tooltip after 15 seconds
        }, 15000); // Keep it visible for 5 seconds

    }, 10000); // Delay 10 detik sebelum collect tooltip muncul

    // Optional: Show collect tooltip on hover over the toggle button
    toggleCollectButton.addEventListener("mouseover", () => {
        collectTooltip.style.opacity = 1; // Show collect tooltip on hover
    });

    // Hide collect tooltip when the mouse leaves the toggle button
    toggleCollectButton.addEventListener("mouseout", () => {
        collectTooltip.style.opacity = 0; // Hide collect tooltip when not hovering
    });
});



// Event listener for the submit marker button
document.getElementById("submit-marker-button").addEventListener("click", function() {
    // Show the default marker icon
    hideMarkers(); // Remove any existing markers before showing the new one
    disableAllChecklists(); // Disable all checklists
    addDraggableIcon();
    clearAllMarks();
    // Set the map zoom level to 9
    map.setZoom(9);
});

// Form submission handling
document.getElementById("markerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const statusMessage = document.getElementById("statusMessage");
    statusMessage.style.display = "block";
    statusMessage.textContent = "Submitting marker...";

    setTimeout(() => {
        statusMessage.style.display = "none";
    }, 7000);

    // Capture form data
    const nameMark = document.getElementById("nameMark").value;
    const category = document.getElementById("category").value;
    const locType = document.getElementById("locType").value;
    const description = document.getElementById("description").value;
    const ysId = document.getElementById("ysId").value;

    const yCoord = document.getElementById("yCoordinates").value;
    const zCoord = document.getElementById("zCoordinates").value;

    // Capture additional inputs
    const oldWorldTreasureInput = document.getElementById("oldWorldTreasureInput").value;
    const ingredientsNameInput = document.getElementById("ingredientsNameInput").value;

    // Combine into finalDescription
    const finalDescription = `(${yCoord}, ${zCoord})\n${description.trim()}\n${oldWorldTreasureInput.trim()}\n${ingredientsNameInput.trim()}`;

    const imageFile = document.getElementById("imageUpload").files[0];
    let imageBase64 = "";
    if (imageFile) {
        imageBase64 = await convertToBase64(imageFile);
    }

    try {
        const response = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/Feedback");
        let existingData = {};
        
        if (response.ok) {
            const responseData = await response.json();
            existingData = responseData || {};
        } else {
            console.error("Failed to load existing data:", response.statusText);
        }

        // Generate new ID
        const existingIds = Object.keys(existingData).map(Number);
        const newId = (Math.max(...existingIds, 0) + 1).toString();

        // Construct the new entry
        const newEntry = {
            [newId]: {
                id: newId,
                ys_id: ysId.trim() || "0",
                name: nameMark.trim(),
                en_name: nameMark.trim(),
                category_id: category,
                lat: yCoord.toString(), // Use the captured coordinates
                lng: zCoord.toString(), // Use the captured coordinates
                redirect_params: "0",
                first_member_id: "0",
                challenge_id: "0",
                desc: finalDescription,
                links_info: "[]",
                bili_info: "[]",
                loc_type: locType,
                images_info: imageBase64 ? `[{"link": "${imageBase64}", "uid": "0", "username": "User"}]` : "[]",
            }
        };

        console.log("Data to be sent to endpoint:", JSON.stringify(newEntry, null, 2));

        const mergedData = { ...existingData, ...newEntry };

        document.querySelector('.submit-marker-form').style.display = 'none';

        statusMessage.textContent = "Thanks for submitting...";

        const submitResponse = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/Feedback", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mergedData),
        });

        if (!submitResponse.ok) {
            throw new Error('Network response was not ok: ' + submitResponse.statusText);
        }
        
        console.log('Marker submitted successfully.');

        // Reset the form fields after successful submission
        document.getElementById("markerForm").reset(); // Reset the form fields

    } catch (error) {
        console.error('Error during submission:', error);
    }
});


// Function to update category options based on selected loc_type
function updateCategoryOptions() {
    const locType = document.getElementById("locType").value;
    const categorySelect = document.getElementById("category");
    const oldWorldTreasureLabel = document.getElementById("oldWorldTreasureLabel");
    const oldWorldTreasureInput = document.getElementById("oldWorldTreasureInput");
    const ingredientsNameLabel = document.getElementById("ingredientsNameLabel");
    const ingredientsNameInput = document.getElementById("ingredientsNameInput");

    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    // Define category options based on loc_type
    let categoryOptions = [];

    switch (locType) {
        case '2':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "14", text: "Fishing", icon_url: "icons/icon_fishing.png" },
                { value: "15", text: "Stone", icon_url: "icons/icon_stone.png" },
                { value: "16", text: "Wood", icon_url: "icons/icon_wood.png" },
                { value: "17", text: "Fiber", icon_url: "icons/icon_fiber.png" },
                { value: "18", text: "Resource Chest", icon_url: "icons/icon_resource.png" },
                { value: "6", text: "Lens", icon_url: "resource_img/lens.png" },
                { value: "19", text: "Screw", icon_url: "resource_img/screw.png" },
                { value: "20", text: "Zipper", icon_url: "resource_img/zipper.png" },
                { value: "21", text: "Resin", icon_url: "resource_img/resin.png" },
                { value: "22", text: "Clay", icon_url: "resource_img/clay.png" },
                { value: "23", text: "Rare Wood Sundale Valley", icon_url: "icons/rarewood.png" },
                { value: "27", text: "Old World Treasure", icon_url: "" },
                { value: "28", text: "Ingredients", icon_url: "icons/ingredients.png" },
            ];
            break;
        case '5':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "9", text: "Fishing", icon_url: "icons/icon_fishing.png" },
                { value: "15", text: "Stone", icon_url: "icons/icon_stone.png" },
                { value: "16", text: "Wood", icon_url: "icons/icon_wood.png" },
                { value: "17", text: "Fiber", icon_url: "icons/icon_fiber.png" },
                { value: "18", text: "Resource Chest", icon_url: "icons/icon_resource.png" },
                { value: "6", text: "Rubber", icon_url: "resource_img/rubber.png" },
                { value: "19", text: "Machine Part", icon_url: "resource_img/machinepart.png" },
                { value: "20", text: "Spring", icon_url: "resource_img/spring.png" },
                { value: "21", text: "Resin", icon_url: "resource_img/resin.png" },
                { value: "22", text: "Clay", icon_url: "resource_img/clay.png" },
                { value: "24", text: "Rare Stone", icon_url: "icons/icon_rarestone.png" },
                { value: "27", text: "Old World Treasure", icon_url: "" },
                { value: "28", text: "Ingredients", icon_url: "icons/ingredients.png" },
            ];
            break;
        case '4':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "9", text: "Fishing", icon_url: "icons/icon_fishing.png" },
                { value: "15", text: "Stone", icon_url: "icons/icon_stone.png" },
                { value: "16", text: "Wood", icon_url: "icons/icon_wood.png" },
                { value: "17", text: "Fiber", icon_url: "icons/icon_fiber.png" },
                { value: "18", text: "Resource Chest", icon_url: "icons/icon_resource.png" },
                { value: "6", text: "Diode", icon_url: "resource_img/diode.png" },
                { value: "19", text: "Precision Part", icon_url: "img_resource/precisionpart.png" },
                { value: "20", text: "Electronical Component", icon_url: "img_resource/electronicalcomponent.png" },
                { value: "21", text: "Resin", icon_url: "resource_img/resin.png" },
                { value: "22", text: "Clay", icon_url: "resource_img/clay.png" },
                { value: "25", text: "Rare Wastes", icon_url: "icons/icon_rarewastes.png" },
                { value: "27", text: "Old World Treasure", icon_url: "" },
                { value: "28", text: "Ingredients", icon_url: "icons/ingredients.png" },
            ];
            break;
        case '3':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "9", text: "Fishing", icon_url: "icons/icon_fishing.png" },
                { value: "15", text: "Stone", icon_url: "icons/icon_stone.png" },
                { value: "16", text: "Wood", icon_url: "icons/icon_wood.png" },
                { value: "17", text: "Fiber", icon_url: "icons/icon_fiber.png" },
                { value: "18", text: "Resource Chest", icon_url: "icons/icon_resource.png" },
                { value: "6", text: "Industrial Hinge", icon_url: "resource_img/industrialhinge.png" },
                { value: "19", text: "Magnet Coil", icon_url: "resource_img/magnetcoil.png" },
                { value: "20", text: "Insulation Coating", icon_url: "resource_img/insulationcoating.png" },
                { value: "21", text: "Amber", icon_url: "resource_img/amber.png" },
                { value: "22", text: "Quartz", icon_url: "resource_img/quartz.png" },
                { value: "27", text: "Old World Treasure", icon_url: "" },
                { value: "28", text: "Ingredients", icon_url: "icons/ingredients.png" },
            ];
            break;
        case '6':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "9", text: "Fishing", icon_url: "icons/icon_fishing.png" },
                { value: "15", text: "Stone", icon_url: "icons/icon_stone.png" },
                { value: "16", text: "Wood", icon_url: "icons/icon_wood.png" },
                { value: "17", text: "Fiber", icon_url: "icons/icon_fiber.png" },
                { value: "18", text: "Resource Chest", icon_url: "icons/icon_resource.png" },
                { value: "6", text: "Artificial Leather", icon_url: "resource_img/artificialleather.png" },
                { value: "19", text: "Power Component", icon_url: "resource_img/powercomponent.png" },
                { value: "20", text: "Integrated Motor", icon_url: "resource_img/integratedmotor.png" },
                { value: "21", text: "Amber", icon_url: "resource_img/amber.png" },
                { value: "22", text: "Quartz", icon_url: "resource_img/quartz.png" },
                { value: "26", text: "Rare Wood 2 Kepler Harbour", icon_url: "icons/rarewood.png" },
                { value: "27", text: "Old World Treasure", icon_url: "" },
                { value: "28", text: "Ingredients", icon_url: "icons/ingredients.png" },
            ];
            break;

        default:
            break;
    }

    // Add new options to the select element
    categoryOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute("data-icon", option.icon_url); // Set icon URL as a data attribute
        categorySelect.appendChild(opt);
    });

    // Show or hide the category select based on loc_type selection
    if (locType) {
        categorySelect.classList.remove('hidden');
    } else {
        categorySelect.classList.add('hidden');
        resetExtraInputs(); // Reset extra inputs if locType is not selected
    }

    // Reset extra inputs by default
    resetExtraInputs();
}

// Function to reset extra input fields and labels
function resetExtraInputs() {
    const oldWorldTreasureLabel = document.getElementById("oldWorldTreasureLabel");
    const oldWorldTreasureInput = document.getElementById("oldWorldTreasureInput");
    const ingredientsNameLabel = document.getElementById("ingredientsNameLabel");
    const ingredientsNameInput = document.getElementById("ingredientsNameInput");
    const categoryIcon = document.getElementById("categoryIcon");

    // Mengatur display ke 'none' untuk menyembunyikan elemen
    oldWorldTreasureLabel.style.display = 'none';
    oldWorldTreasureInput.style.display = 'none';
    ingredientsNameLabel.style.display = 'none';
    ingredientsNameInput.style.display = 'none';
}

// Event listener untuk perubahan kategori
document.getElementById("category").addEventListener("change", function() {
    resetExtraInputs(); // Reset to hide all

    // Get the selected option
    const selectedOption = this.options[this.selectedIndex];
    const iconUrl = selectedOption.getAttribute("data-icon");
    
    // Update the category icon
    const categoryIcon = document.getElementById("categoryIcon");
    if (iconUrl && iconUrl !== "") {
        categoryIcon.src = iconUrl; // Set the icon URL
        categoryIcon.style.display = 'inline'; // Show the icon
    } else {
        categoryIcon.style.display = 'none'; // Hide the icon if no URL
    }
    if (this.value == "27") { // Other 1
        // Tampilkan Old World Treasure
        oldWorldTreasureLabel.style.display = 'block'; // Mengatur display ke 'block'
        oldWorldTreasureInput.style.display = 'block'; // Mengatur display ke 'block'
    } else if (this.value == "28") { // Other 2
        // Tampilkan Ingredients Name
        ingredientsNameLabel.style.display = 'block'; // Mengatur display ke 'block'
        ingredientsNameInput.style.display = 'block'; // Mengatur display ke 'block'
    }
});



// Add event listener to locType dropdown to update categories
document.getElementById("locType").addEventListener("change", updateCategoryOptions);

// Call to initially hide categories when the form loads
updateCategoryOptions();

// Function to update name mark and show it
function updateNameMark() {
    const category = document.getElementById("category").value;
    const locType = document.getElementById("locType").value;

    if (category && locType) {
        const categoryName = categoryNames[category];
        const locTypeName = locTypeNames[locType];
        document.getElementById("nameMark").value = `${categoryName} - ${locTypeName}`;
        document.getElementById("nameMark").style.display = "block"; // Show the name mark input
    } else {
        document.getElementById("nameMark").style.display = "none"; // Hide if not selected
    }
}

// Add event listeners to update name mark on change
document.getElementById("category").addEventListener("change", updateNameMark);
document.getElementById("locType").addEventListener("change", updateNameMark);

// Initially hide name mark input
document.getElementById("nameMark").style.display = "none";

// Function to convert file to Base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Image preview functionality
document.getElementById('imageUpload').addEventListener('change', function() {
    const file = this.files[0];
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    imagePreviewContainer.innerHTML = "";

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.width = 100;
            imagePreviewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// Function to close the report form
function closeReportForm() {
    console.log('Closing form...');
    var formContainer = document.getElementById('reportFormContainer');
    if (formContainer) {
        formContainer.style.display = 'none'; // Hide the form
        console.log('Form hidden');
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
    // Show the report form
    var formContainer = document.getElementById('reportFormContainer');
    if (formContainer) {
        formContainer.style.display = 'block'; // Change display to block to make it visible
        console.log('Form displayed');
    } else {
        console.log('Form container not found');
    }
            document.getElementById('reportId').value = markerId; // Set marker ID in the form

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
    const num1 = document.getElementById('num1').value;
    const num2 = document.getElementById('num2').value;
    const errorDescription = document.getElementById('errorDescription').value;

    // Object mapping for loc_type and category_id
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
    "6": "Scrap",
    "7": "Training",
    "8": "Scenery",
    "9": "Fishing",
    "10": "Fishing",
    "11": "Fishing",
    "12": "Fishing",
    "13": "Fishing",
    "14": "Fishing",
    "15": "Stone",
    "16": "Wood",
    "17": "Fiber",
    "18": "Resource",
    "23": "Rare Wood 1",
    "24": "Rare Stone",
    "25": "Rare Wastes",
    "26": "Rare Wood 2"
};

    // Replace ID with name using mapping
    const categoryName = categoryMap[categoryId] || 'Unknown';
    const locTypeName = locTypeMap[locType] || 'Unknown';

    if (!num1 || !num2) {
        alert('Please fill in the number fields');
        return;
    }

    const jsonData = {
        Name: nameEn || 'Unknown', // Default value if undefined
        ID: markerId,
        latitude: lat,
        longitude: lng,
        category_id: categoryName, // Send category name
        loc_type: locTypeName, // Send loc_type name
        "Y-coordinate": num1,
        "Z-coordinate": num2,
        description: errorDescription
    };

    // Convert to JSON string for debugging
    const formattedJson = JSON.stringify(jsonData, null, 4);
    console.log('Submitting report with the following data:', formattedJson);

    // Send the report using fetch
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/marker')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(existingData => {
            console.log('Loaded existing data:', existingData);

            // Merge existing data with new data
            const mergedData = { ...existingData, [markerId]: jsonData }; // Use jsonData for merging
            console.log('Merged data:', JSON.stringify(mergedData, null, 4));

            return fetch('https://autumn-dream-8c07.square-spon.workers.dev/marker', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mergedData),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            console.log('Data successfully submitted to the endpoint.');
            showSuccessMessages(); // Call to show success messages

            // Reset the form fields
            resetReportForm();

            // Close the report form
            closeReportForm();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function showSuccessMessages() {
    const messages = [
        { text: "Thanks for it...", duration: 2000 },
        { text: "Your marker is under review.", duration: 3000 }
    ];

    // Create a message container
    const messageContainer = document.createElement('div');
    messageContainer.style.position = "fixed";
    messageContainer.style.top = "50%";  // Center vertically
    messageContainer.style.left = "50%"; // Center horizontally
    messageContainer.style.color = "white"
    messageContainer.style.transform = "translate(-50%, -50%)"; // Centering
    messageContainer.style.zIndex = "1000"; // Ensure it's on top
    messageContainer.style.textAlign = "center"; // Center the text

    // Create an image element
    const iconElement = document.createElement('img');
    iconElement.src = 'icons/bangone.png'; // Replace with the actual path to your icon
    iconElement.alt = 'Banone Icon';
    iconElement.style.width = '70px'; // Set width to 50px
    iconElement.style.height = '70px'; // Set height to 50px
    iconElement.style.display = 'block'; // Ensures the image is on its own line
    iconElement.style.marginBottom = '5px'; // Space between icon and text

    // Append the icon to the container
    messageContainer.appendChild(iconElement);

    // Function to show messages
    let index = 0;

    function displayNextMessage() {
        if (index < messages.length) {
            const messageElement = document.createElement('span');
            messageElement.innerText = messages[index].text;
            messageElement.style.display = 'block'; // Make it a block element
            messageElement.style.marginBottom = '5px'; // Space between messages

            // Append the message to the container
            messageContainer.appendChild(messageElement);

            // Remove the message after its duration
            setTimeout(() => {
                messageElement.remove();
                index++;
                displayNextMessage(); // Show the next message
            }, messages[index].duration);
        } else {
            // Remove the message container after the last message
            setTimeout(() => {
                messageContainer.remove();
            }, 1000); // Delay before removing the container
        }
    }

    // Append the message container to the body
    document.body.appendChild(messageContainer);
    displayNextMessage(); // Start showing messages
}




// Function to reset the report form
function resetReportForm() {
    document.getElementById('reportForm').reset(); // Reset the form fields
}


let markTipShown = false; // Flag to track if the mark tip has been shown

function getVideoIdFromUrl(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|watch|.+\/))|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : null;
}
function setupMarkerInteractions(marker, location, key) {
    const videoId = getVideoIdFromUrl(location.links_info);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

    const coordMatch = location.desc && location.desc.match(/\((\d+),\s*(\d+)\)/);
    const xCoord = coordMatch ? coordMatch[1] : null;
    const zCoord = coordMatch ? coordMatch[2] : null;

    let imageInfoContent = '';
    let showImageButton = '';

    if (location.images_info && location.images_info !== "0" && location.images_info !== "[]") {
        try {
            const parsedImagesInfo = JSON.parse(location.images_info);
            if (Array.isArray(parsedImagesInfo) && parsedImagesInfo.length > 0 && parsedImagesInfo[0].link) {
                const imageUrl = parsedImagesInfo[0].link.startsWith('//') ? `https:${parsedImagesInfo[0].link}` : parsedImagesInfo[0].link;
                imageInfoContent = `
                    <img src="${imageUrl}" alt="Image Info" class="popup-image-info" onclick="showFullImagePreview('${imageUrl}')" style="width: 100%; height: auto; border-radius: 4px; display: none; cursor: pointer; pointer-events: auto;">
                `;
                showImageButton = `
                    <button class="showImageButton" onclick="toggleImageVisibility(this)" style="pointer-events: auto;">
                        Show Image
                    </button>
                `;
            }
        } catch (error) {
            console.warn("Error parsing images_info JSON:", error);
        }
    } else {
        marker.on('popupopen', () => {
            fetch("https://autumn-dream-8c07.square-spon.workers.dev/ER_Image")
                .then(response => response.json())
                .then(data => {
                    const markerData = data[key];
                    if (markerData && markerData.image) {
                        const base64Image = markerData.image;
                        const username = markerData.username;

                        imageInfoContent = `
                            <div style="position: relative; width: 100%; height: auto;">
                                <img src="${base64Image}" alt="Base64 Image" class="popup-image-info" onclick="showFullImagePreview('${base64Image}')" style="width: 100%; height: auto; border-radius: 4px; cursor: pointer; pointer-events: auto;">
                                <div style="position: absolute; bottom: 1px; left: 0; width: 100%; color: white; background-color: rgba(0, 0, 0, 0.5); text-align: center; font-size: 14px;">
                                    ${username}
                                </div>
                            </div>`;
                        marker.getPopup().setContent(createPopupContent());
                    }
                })
                .catch(() => {
                    console.warn("Error fetching base64 image");
                });
        });
    }

    const showYsId = location.ys_id && location.ys_id !== "0";

    function createPopupContent() {
        return `
            <div class="leaflet-popup-content" style="z-index: 9999;">
                <h4 class="popup-title">${location.en_name}</h4>
                <p class="popup-description">
                    ${(location.desc || 'No description available.').replace(/\n/g, '<br>')}
                </p>
                ${xCoord && zCoord ? `
                    <div class="copy-buttons">
                        <button class="copyButton" onclick="copyToClipboard('${xCoord}', event)">Copy Coordinates X</button>
                        <button class="copyButton" onclick="copyToClipboard('${zCoord}', event)">Copy Coordinates Z</button>
                    </div>
                ` : ''}
                <div id="copyFeedback" class="copy-feedback" style="display: none;">
                    <img src="icons/bangone.png" alt="Feedback Icon" class="feedback-icon">
                    <span>Copied to clipboard!</span>
                </div>
                ${thumbnailUrl ? `
                    <div class="popup-thumbnail">
                        <img src="${thumbnailUrl}" alt="YouTube Thumbnail" style="width: auto; height: 200px; border-radius: 4px;">
                        <a href="${location.links_info}" target="_blank" class="popup-play-button">
                            <img src="https://img.icons8.com/material-outlined/24/ffffff/play.png" alt="Play">
                        </a>
                    </div>
                ` : ''}
${showImageButton ? `
    <button class="showImageButton" onclick="toggleImageVisibility(this, event)" style="background: rgba(10, 28, 61, 0.883); border: none; color: #028c9a; font-size: 12px; cursor: pointer; pointer-events: auto;">
        <b>Show Image</b>
    </button>
` : ''}
                ${imageInfoContent}
                ${showYsId ? `<p class="popup-ys-id">YS ID: ${location.ys_id}</p>` : ''}
                <button class="reportButton" data-id="${key}" style="background: none; border: none; color: red; font-size: 12px; cursor: pointer; pointer-events: auto;">Report</button>
                ${!imageInfoContent ? `<button class="uploadImageButton" onclick="openImageFormPopup('${key}')" style="background: none; border: none; color: #FFD700; font-size: 12px; cursor: pointer; pointer-events: auto;"><b>Upload Screenshot Location</b></button>` : ''}
            </div>
        `;
    }



    // Bind popup content to the marker
    marker.bindPopup(createPopupContent(), { offset: L.point(0, -20) });

    // Event to show equator lines and center icon when popup is opened
    marker.on('popupopen', () => {
        // Pastikan hanya elemen yang relevan yang dimodifikasi
        const newFiltersContainer = document.querySelector('.toggle-new-filters-container');
        
        if (newFiltersContainer) {
            newFiltersContainer.classList.remove('hover'); // Menonaktifkan efek hover
        } else {
            console.warn("Element '.toggle-new-filters-container' not found!");
        }

        showEquatorLines(marker); // Menampilkan garis khatulistiwa dan ikon pusat saat popup terbuka

        console.log(`Equator lines triggered for marker: ${marker.options.id}`);

        // Menaikkan Z-index marker
        marker.setZIndexOffset(1000);  // Ubah angka ini sesuai kebutuhan Anda
    });

    // Menghilangkan animasi setelah animasi selesai
    marker.on('popupclose', () => {
        const equatorLines = document.querySelectorAll('.equator-line');
        const centerIcon = document.querySelector('.center-icon');

        if (equatorLines.length > 0) {
            equatorLines.forEach(line => line.remove());
        }

        if (centerIcon) {
            centerIcon.remove();
        }

        // Menghapus kelas bounce dan mengembalikan Z-index ke nilai default
        marker.getElement().classList.remove('marker-bounce');
        marker.setZIndexOffset(0);  // Kembalikan ke nilai default
    });


    marker.on('contextmenu', (e) => {
        const currentOpacity = marker.options.opacity || 1.0;
        const newOpacity = currentOpacity === 1.0 ? 0.5 : 1.0;

        console.log(`Changing opacity for marker ${marker.options.id}: from ${currentOpacity} to ${newOpacity}`);

        if (currentOpacity === 0.5) {
            updateCategoryCounts(marker.options.loc_type, marker.options.category, newOpacity);
        } else {
            updateCategoryCounts(marker.options.loc_type, marker.options.category, newOpacity);
        }

        marker.setOpacity(newOpacity);
        saveMarkerOpacity(marker.options.id, newOpacity);
        updateCategoryDisplay(marker.options.loc_type);
    });

    marker.on('popupopen', () => {
        console.log('Popup opened for marker:', marker.options.id);
        setupReportButton(marker, key);

        if (!markTipShown) {
            setTimeout(() => {
                showMarkTip(marker);
            }, 2000);
            markTipShown = true;
        }
    });

    map.on('click', function(event) {
        if (marker.getPopup().isOpen()) {
            marker.closePopup();
            markTipShown = false;
            removeCurrentMarkTip();
        } else {
            removeCurrentMarkTip();
        }
    });
}
function showFullImagePreview(imageUrl) {
    const modal = document.createElement('div');
    modal.classList.add('image-modal');
    modal.innerHTML = `
        <div class="image-modal-content" onclick="event.stopPropagation()">
            <span class="image-modal-close" onclick="closeImagePreview(event)">&times;</span>
            <img src="${imageUrl}" alt="Full Preview Image" class="image-modal-img">
        </div>
    `;

    // Menambahkan modal ke dalam body
    document.body.appendChild(modal);

    // Menutup modal saat klik di luar konten gambar
    modal.addEventListener('click', closeImagePreview);
}

function closeImagePreview(event) {
    event.stopPropagation(); // Menghindari propagasi saat menutup modal
    const modal = document.querySelector('.image-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}


// Open the image form popup
function openImageFormPopup(markerId) {
    console.log('Creating form popup for marker:', markerId);

    const isMobile = window.innerWidth <= 768; // Deteksi perangkat mobile

    const formHtml = `
        <div id="send-image" class="popup-form">
            <form id="send-image-form" onsubmit="submitImageForm('${markerId}'); return false;">
                <h6>Upload Your Image</h6>
                <label for="username">Your In Game Name:</label>
                <input type="text" id="username" name="username" required placeholder="Enter your in game name">

                <!-- Drop Area for Drag-and-Drop and Paste Upload (Desktop Only) -->
                ${isMobile ? '' : `
                <div id="dropArea" class="drop-area">
                    <p>Drag & drop an image here, click to upload, or paste an image</p>
                    <input type="file" id="imageUpload" name="imageUpload" accept="image/*" 
                           onchange="handleImageUpload(this, '${markerId}')">
                </div>
                `}

                <!-- Mobile File Input -->
                ${isMobile ? `
                <div id="mobileUpload" class="mobile-upload">
                    <label for="imageUploadMobile" class="mobile-upload-label">Select an Image</label>
                    <input type="file" id="imageUploadMobile" name="imageUploadMobile" accept="image/*" 
                           onchange="handleImageUpload(this, '${markerId}')">
                </div>
                ` : ''}

                <div id="PreviewContainer" class="preview-container" style="display:none;"></div> <!-- Hidden Preview Container -->

                <button type="submit">Submit</button>
            </form>
        </div>
    `;

    const popupContainer = document.createElement("div");
    popupContainer.setAttribute("id", "popupContainer");
    popupContainer.innerHTML = formHtml;
    document.body.appendChild(popupContainer);

    // Desktop only: Handle drag-and-drop events
    if (!isMobile) {
        const dropArea = document.getElementById("dropArea");
        const imageUploadInput = document.getElementById("imageUpload");

        // Drag-and-drop highlight effects
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        // Handle click to trigger file input for image upload
        dropArea.addEventListener('click', () => {
            imageUploadInput.click();
        });

        // Handle image paste events
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf("image") !== -1) {
                    const blob = item.getAsFile();
                    processImageFile(blob);
                }
            }
        });
    }

    console.log('Form popup appended to body');
}

// Prevent default behavior for drag-and-drop events
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Close the form popup
function closeFormPopup() {
    const popupContainer = document.getElementById("popupContainer");
    if (popupContainer) {
        document.body.removeChild(popupContainer);
        console.log('Form popup removed from body');
    }
}


function handleImageUpload(input, markerId) {
    const file = input.files[0] || input;  // Get the file, either from input or drag-and-drop
    const PreviewContainer = document.getElementById("PreviewContainer");
    const dropArea = document.getElementById("dropArea");

    if (file) {
        console.log("File selected:", file);

        // Clear previous preview
        PreviewContainer.innerHTML = '';
        console.log("Cleared previous preview");

        // Ensure the file is an image
        if (!file.type.startsWith('image/')) {
            console.log("Invalid file type:", file.type);
            alert("Please upload a valid image file.");
            return;
        }

        // Use FileReader to read and preview the image
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log("FileReader loaded the image");

            // Create an img element to show the preview
            const imgElement = document.createElement("img");
            imgElement.src = e.target.result;
            imgElement.classList.add("image-preview");

            // Append the image to the preview container
            PreviewContainer.appendChild(imgElement);
            console.log("Appended image preview to container");

            // Save the base64 image for submission
            input.setAttribute("data-base64", e.target.result);  // Ensure Base64 is saved
            console.log("Saved base64 data to input");

            // Show the preview container
            PreviewContainer.style.display = "block";
            console.log("Preview container displayed");

            // Hide drop area once an image is uploaded
            if (dropArea) {
                dropArea.style.display = "none";
                console.log("Drop area hidden");
            }
        };

        reader.onloadend = function() {
            console.log("FileReader onloadend triggered");
            // At this point the reader has finished, data-base64 should be set properly
            console.log("Base64 after reading:", input.getAttribute("data-base64"));
        };

        reader.readAsDataURL(file); // Read file as base64
        console.log("Reading file as base64 with FileReader");
    } else {
        console.log("No file selected.");
    }
}

// Function to process images dropped or pasted
function processImageFile(file) {
    const PreviewContainer = document.getElementById("PreviewContainer");
    const imageUploadInput = document.getElementById("imageUpload");

    if (file) {
        // Clear previous preview
        PreviewContainer.innerHTML = '';

        // Ensure the file is an image
        if (!file.type.startsWith('image/')) {
            alert("Please upload a valid image file.");
            return;
        }

        // Display loading indicator
        const loadingIndicator = document.createElement("div");
        loadingIndicator.classList.add('loading-indicator');
        loadingIndicator.innerText = "Loading...";
        PreviewContainer.appendChild(loadingIndicator);

        const reader = new FileReader();
        reader.onload = function(e) {
            // Clear the loading indicator once the image is loaded
            PreviewContainer.innerHTML = '';

            // Create img element to show the preview
            const imgElement = document.createElement("img");
            imgElement.src = e.target.result;
            imgElement.classList.add("image-preview");

            // Append image to preview container
            PreviewContainer.appendChild(imgElement);

            // Save base64 image to input for submission
            imageUploadInput.setAttribute("data-base64", e.target.result);

            // Show the preview container
            PreviewContainer.style.display = "block";

            // Hide drop area once an image is processed
            const dropArea = document.getElementById("dropArea");
            if (dropArea) {
                dropArea.style.display = "none"; // Hide drop area after the image is uploaded
            }
        };
        reader.readAsDataURL(file); // Read file as base64
    } else {
        console.log("No file selected.");
    }
}


// Submit form when the submit button is clicked
function submitImageForm(markerId) {
    const username = document.getElementById('username').value;
    const input = document.getElementById('imageUploadMobile') || document.getElementById('imageUpload');
    
    // Pastikan username dan file sudah ada
    if (!username || !input.files.length) {
        alert("Please complete all fields.");
        console.warn("Missing data - Username:", username, "File:", input.files.length === 0);
        return;
    }

    // Ambil file dan langsung konversi menjadi base64 tanpa menunggu pembacaan
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64String = e.target.result;  // Simpan base64 data

        // Kirimkan data ke server
        handleSubmit(markerId, username, base64String);
    };

    reader.readAsDataURL(file);  // Langsung baca file sebagai base64
}




// Handle the final submission after preview
function handleSubmit(markerId, username, base64String) {
    if (base64String && username) {
        // Display preview if base64 string is valid
        const PreviewContainer = document.getElementById("PreviewContainer");
        if (PreviewContainer && base64String) {
            const imgElement = document.createElement("img");
            imgElement.src = base64String;
            imgElement.classList.add("image-preview");
            PreviewContainer.innerHTML = ''; // Clear old preview
            PreviewContainer.appendChild(imgElement); // Add new preview
            PreviewContainer.style.display = "block"; // Ensure preview is displayed
        }

        // Fetch existing data from endpoint
        fetch("https://autumn-dream-8c07.square-spon.workers.dev/ER_Image", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(existingData => {
            // Prepare new marker data
            const newMarkerData = {
                id: markerId,
                username: username,
                image: base64String
            };
            // Tambahkan data marker baru ke data yang ada
            existingData[markerId] = newMarkerData;

            // Update data dengan mengirimkan data yang telah dimodifikasi
            return fetch("https://autumn-dream-8c07.square-spon.workers.dev/ER_Image", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(existingData)
            });
        })
        .then(response => {
            if (response.ok) {
                alert("THANKS FOR SUBMIT YOUR SCREENSHOT");
                closePopup(); // Tutup popup setelah berhasil
            } else {
                alert("Failed to upload image.");
            }
        })
        .catch(error => {
            console.error("Error uploading image:", error);
            alert("Error uploading image.");
        });
    } else {
        alert("Please complete all fields.");
        console.warn("Missing data - Username:", username, "Base64:", base64String);
    }
}


// Menangani double klik di luar form untuk menutup popup
function handleOutsideDoubleClick(event) {
    const formContainer = document.getElementById('send-image');
    const popupContainer = document.getElementById('popupContainer');
    
    // Menutup form jika double klik di luar form
    if (formContainer && !formContainer.contains(event.target) && !popupContainer.contains(event.target)) {
        closePopup();
    }
}

document.addEventListener('dblclick', handleOutsideDoubleClick);

// Fungsi untuk menutup popup
function closePopup() {
    const popupContainer = document.getElementById('popupContainer');
    if (popupContainer) {
        document.body.removeChild(popupContainer); // Hapus popup dari body
    }
}

// Fungsi untuk reset form saat map ditutup (misalnya)
function resetFormOnMapClose() {
    const formContainer = document.getElementById('send-image');
    if (formContainer) {
        formContainer.reset(); // Mereset form
        document.getElementById('username').value = document.getElementById('username').value; // Tetap mempertahankan username
    }
}

function showEquatorLines(marker) {
    const latlng = marker.getLatLng();

    // Pastikan elemen garis ekuator dan ikon pusat tidak dibuat lebih dari sekali
    if (!document.querySelector('.equator-line.horizontal') && !document.querySelector('.equator-line.vertical') && !document.querySelector('.center-icon')) {
        const centerIcon = document.createElement('img');
        centerIcon.src = 'icons/marker.png';
        centerIcon.className = 'center-icon';
        centerIcon.style.width = '100px';
        centerIcon.style.height = '100px';
        centerIcon.style.position = 'absolute';
        centerIcon.style.zIndex = '500';  // Semua elemen memiliki z-index yang sama yaitu 500

        const horizontalLineLeft = document.createElement('div');
        horizontalLineLeft.className = 'equator-line horizontal left';
        horizontalLineLeft.style.zIndex = '500';  // Sama dengan z-index ikon pusat

        const horizontalLineRight = document.createElement('div');
        horizontalLineRight.className = 'equator-line horizontal right';
        horizontalLineRight.style.zIndex = '500';  // Sama dengan z-index ikon pusat

        const verticalLineTop = document.createElement('div');
        verticalLineTop.className = 'equator-line vertical top';
        verticalLineTop.style.zIndex = '500';  // Sama dengan z-index ikon pusat

        const verticalLineBottom = document.createElement('div');
        verticalLineBottom.className = 'equator-line vertical bottom';
        verticalLineBottom.style.zIndex = '500';  // Sama dengan z-index ikon pusat

        const mapContainer = marker._map.getContainer();
        mapContainer.appendChild(centerIcon);
        mapContainer.appendChild(horizontalLineLeft);
        mapContainer.appendChild(horizontalLineRight);
        mapContainer.appendChild(verticalLineTop);
        mapContainer.appendChild(verticalLineBottom);

        const map = marker._map;
        const updateEquatorLinesPosition = () => {
            const point = map.latLngToContainerPoint(latlng);

            // Posisi ikon pusat
            centerIcon.style.left = `${point.x - 50}px`;
            centerIcon.style.top = `${point.y - 67}px`;
            centerIcon.style.pointerEvents = 'none';

            // Posisi garis horizontal kiri
            horizontalLineLeft.style.position = 'absolute';
            horizontalLineLeft.style.left = '0px';
            horizontalLineLeft.style.top = `${point.y - 15 - 50 + 10 + 40}px`;
            horizontalLineLeft.style.width = `${point.x - 50}px`;
            horizontalLineLeft.style.height = '1.5px';
            horizontalLineLeft.style.backgroundColor = '#ffffff';
            horizontalLineLeft.style.opacity = 0.8;
            horizontalLineLeft.style.pointerEvents = 'none';

            // Posisi garis horizontal kanan
            horizontalLineRight.style.position = 'absolute';
            horizontalLineRight.style.left = `${point.x + 50}px`;
            horizontalLineRight.style.top = `${point.y - 15 - 50 + 10 + 40}px`;
            horizontalLineRight.style.width = `${window.innerWidth - point.x - 50}px`;
            horizontalLineRight.style.height = '1.5px';
            horizontalLineRight.style.backgroundColor = '#ffffff';
            horizontalLineRight.style.opacity = 0.8;
            horizontalLineRight.style.pointerEvents = 'none';

            // Posisi garis vertikal atas
            verticalLineTop.style.position = 'absolute';
            verticalLineTop.style.left = `${point.x}px`;
            verticalLineTop.style.top = `-${30}px`;
            verticalLineTop.style.width = '1.5px';
            verticalLineTop.style.height = `${point.y - 50}px`;
            verticalLineTop.style.backgroundColor = '#ffffff';
            verticalLineTop.style.opacity = 0;
            verticalLineTop.style.pointerEvents = 'none';

            // Posisi garis vertikal bawah
            verticalLineBottom.style.position = 'absolute';
            verticalLineBottom.style.left = `${point.x}px`;
            verticalLineBottom.style.top = `${point.y + 30}px`;
            verticalLineBottom.style.width = '1.5px';
            verticalLineBottom.style.height = `${window.innerHeight - point.y - 50}px`;
            verticalLineBottom.style.backgroundColor = '#ffffff';
            verticalLineBottom.style.opacity = 0.8;
            verticalLineBottom.style.pointerEvents = 'none';
        };

        // Posisi garis ekuator saat pertama kali dibuka
        updateEquatorLinesPosition();

        // Update posisi setiap kali peta dipindahkan atau di-zoom
        marker._map.on('move', updateEquatorLinesPosition);
        marker._map.on('zoom', updateEquatorLinesPosition);
    }
}


// Fungsi JavaScript untuk toggle visibilitas gambar dan mengubah teks tombol
function toggleImageVisibility(button, event) {
    // Prevent the event from propagating and closing the popup
    event.stopPropagation();

    const image = button.nextElementSibling; // Mendapatkan elemen gambar setelah tombol
    if (image.style.display === "none") {
        image.style.display = "block";
        button.textContent = "Hide Image";
    } else {
        image.style.display = "none";
        button.textContent = "Show Image";
    }
}

// Fungsi untuk menyalin teks ke clipboard
function copyToClipboard(text, event) {
    const button = event.target; // Get the button that was pressed
    const feedback = button.closest('.leaflet-popup-content').querySelector('#copyFeedback'); // Find the feedback element
    const isXCoord = button.innerText.includes('X'); // Check if the button text includes 'X'
    const isZCoord = button.innerText.includes('Z'); // Check if the button text includes 'Z'

    // Set dynamic feedback message based on button
    const feedbackMessage = isXCoord ? 'Coordinates X Copied' : isZCoord ? 'Coordinates Z Copied' : 'Copied to clipboard!';

    // Update feedback text
    feedback.querySelector('span').innerText = feedbackMessage; 

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            feedback.classList.add('show'); // Show feedback
            feedback.style.display = 'flex'; // Display feedback
            setTimeout(() => {
                feedback.classList.remove('show'); // Remove feedback after 2 seconds
                feedback.style.display = 'none'; // Hide feedback
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";  // Prevent scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            feedback.classList.add('show'); // Show feedback
            feedback.style.display = 'flex'; // Display feedback
            setTimeout(() => {
                feedback.classList.remove('show'); // Remove feedback after 2 seconds
                feedback.style.display = 'none'; // Hide feedback
            }, 2000);
        } catch (err) {
            console.error('Fallback: Failed to copy', err);
        }
        document.body.removeChild(textArea);
    }
}



// Function to remove the current mark tip
function removeCurrentMarkTip() {
    if (currentMarkTip) {
        currentMarkTip.remove(); // Remove the current tip if it exists
        currentMarkTip = null; // Reset the reference
    }
}

let currentMarkTip = null; // Store reference to the active mark tip

function showMarkTip(marker) {
    // Remove the existing tip if it exists
    if (currentMarkTip) {
        currentMarkTip.remove();
    }

    // Determine if the user is on a mobile device
    const isMobile = window.matchMedia("(max-width: 768px)").matches; // Adjust the width as needed for mobile detection

    // Set the message based on the device type
    const message = isMobile ? 
        'Hold Mark If You Already Take it' : // Mobile message
        'Right Click if you already Take it'; // Global (desktop) message

    // Create a divIcon for the mark tip
    currentMarkTip = L.divIcon({
        className: 'mark-tip',
        html: `
            <div style="
                background-color: rgba(255, 255, 255, 0.9);
                padding: 5px;
                border-radius: 3px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                white-space: nowrap;
                z-index: 5000; /* Ensure it is above other elements visually */
            ">
                ${message} <!-- Insert the message here -->
            </div>`,
        iconSize: 'auto', // Automatically size the container based on content
        iconAnchor: [90, 0] // Position it below the marker
    });



    // Get the position of the marker's popup
    const popupPosition = marker.getLatLng(); // Use getLatLng directly from marker
    const tipMarker = L.marker([popupPosition.lat - 0.0005, popupPosition.lng], { icon: currentMarkTip, interactive: false }).addTo(marker._map);

    // Automatically close the tip after 10 seconds
    setTimeout(() => {
        tipMarker.remove();
        currentMarkTip = null; // Reset tip
        console.log('Mark tip closed after timeout');
    }, 10000); // 10000 milliseconds = 10 seconds

    // Ensure the tip follows the marker when dragged
    marker.on('drag', function(event) {
        tipMarker.setLatLng(event.target.getLatLng()); // Update tip position on drag
    });

    // Hide the tip if another marker is clicked or the map is clicked
    map.on('click', (event) => {
        if (tipMarker) {
            tipMarker.remove(); // Remove tip on map click
            currentMarkTip = null; // Reset reference
        }
    });

    // Add a listener to close the tip if another marker is clicked
    marker.on('popupclose', () => {
        tipMarker.remove(); // Remove tip when popup closes
        currentMarkTip = null; // Reset reference
    });

    console.log('Mark tip displayed at position:', popupPosition);
}


function setupReportButton(marker, key) {
    const reportButton = document.querySelector(`.reportButton[data-id="${key}"]`);
    if (reportButton) {
        reportButton.addEventListener('click', () => {
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
    if (iconUrl.includes('icon_scrap.png')) return 'scrap'; // Scrap
    if (iconUrl.includes('icon_stone.png')) return 'material'; // Wood
    if (iconUrl.includes('icon_wood.png')) return 'material'; // Stone
    if (iconUrl.includes('icon_fiber.png')) return 'material'; // Fiber
    
    return null; // Category not found
}


// Function to get icon URL based on category ID
function getIconUrl(categoryId) {
    switch (categoryId) {
        case "1": return "icons/icon_teleport.png"; // Teleport
        case "2": return "icons/icon_treasure.png"; // Old World Treasure
        case "3": return "icons/icon_zone.png"; // Zone
        case "6":
        case "19":
        case "20": return "icons/icon_scrap.png"; // Scrap for all three categories
        case "7": return "icons/icon_train.png"; // Training
        case "8": return "icons/icon_scenery.png"; // Scenery
        case "9":
        case "10":
        case "11":
        case "12":
        case "13":
        case "14": return "icons/rare_fishing.png"; // Rare Fishing
        case "15": return "icons/icon_stone.png"; // Stone
        case "16": return "icons/icon_wood.png"; // Wood
        case "17": return "icons/icon_fiber.png"; // Fiber
        case "18": return "icons/icon_resource.png"; // Resource
        case "23": return "icons/icon_rarewood.png"; // Rare Item
        case "24": return "icons/icon_rarestone.png"; // Rare Stone
        case "25": return "icons/icon_rarewastes.png"; // Rare Wastes
        case "26": return "icons/icon_rarewood.png"; // Rare Wood
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


// Function to handle button interactions
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
}

document.addEventListener('DOMContentLoaded', () => {
    const resetOpacityBtn = document.getElementById('reset-opacity');
    const modal = document.getElementById('confirm-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    if (resetOpacityBtn && modal && confirmYes && confirmNo) {
        resetOpacityBtn.addEventListener('click', () => {
            // Check if there are any markers with opacity 0.5
            const hasTransparentMarkers = markers.some(marker => marker.options.opacity === 0.5);
            if (!hasTransparentMarkers) {
                alert("No markers are currently transparent.");
                return; // Exit if no transparent markers
            }
            modal.style.display = 'block'; // Show the modal if there are transparent markers
        });

        // Handle confirmation
        confirmYes.onclick = function() {
            resetMarkerOpacity(); // Call the reset function upon confirmation
            modal.style.display = 'none'; // Hide modal after confirmation
        };

        // Handle cancellation
        confirmNo.onclick = function() {
            modal.style.display = 'none'; // Hide modal if user cancels
            console.log("Opacity reset canceled."); // Log the cancellation
        };

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none'; // Hide modal if user clicks outside
            }
        };
    }

    // Function to reset the opacity of all markers
    function resetMarkerOpacity() {
        if (!Array.isArray(markers) || markers.length === 0) {
            console.warn("No markers to reset opacity for.");
            return;
        }

        // Reset opacity of all markers
        markers.forEach(marker => {
            marker.setOpacity(1.0); // Set opacity to fully opaque
            if (typeof saveMarkerOpacity === 'function') {
                saveMarkerOpacity(marker.options.id, 1.0); // Save the updated opacity if function exists
            }
        });

        // Reset category counts for all loc_types
        resetCategoryCounts();
    }

    setupButtonInteractions(); // Ensure other button interactions are set up
});


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


// Select the toggle-count-container element
const toggleContainer = document.querySelector('.toggle-count-container');

// Add click event listener to toggle the 'hover' class
toggleContainer.addEventListener('click', function() {
    toggleContainer.classList.toggle('hover');
});

// Select all elements with the 'collect-toggle' class
document.querySelectorAll('.collect-toggle').forEach(item => {
    item.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from bubbling up to the document
        item.classList.toggle('hover-active'); // Toggle the "hover-active" class on click
    });
});
// Select both toggle containers and add the toggle effect
document.querySelectorAll('.toggle-legend-container, .toggle-new-filters-container').forEach(button => {
    button.addEventListener('click', () => {
    map.closePopup();
        // Toggle the "hover" class on click to keep or remove the effect
        button.classList.toggle('hover');
    });
});




let locTypesVisible = true; // Flag to track visibility

function toggleLocTypes() {
    const countContainer = document.querySelector('.count-container');
    locTypesVisible = !locTypesVisible; // Toggle the visibility flag

    // Show or hide the container based on the flag
    if (locTypesVisible) {
        countContainer.style.display = 'block'; // Show the container
    } else {
        countContainer.style.display = 'none'; // Hide the container
    }
}

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

    // Sembunyikan semua filter di collect-container
    const allCheckboxFilters = document.querySelectorAll('.checkbox-filters');
    allCheckboxFilters.forEach(filter => {
        filter.style.display = 'none'; // Sembunyikan semua filter
    });

    // Perbarui label dan checkbox berdasarkan loc_type yang dipilih
    updateMaterialLabelsAndCheckboxes(locType); // Panggil fungsi untuk memperbarui label dan checkbox
}
// Function to show the overlay
function showOverlay() {
    document.getElementById('trakteerOverlay').style.display = 'block';
}

// Function to hide the overlay
document.getElementById('closeOverlayBtn').addEventListener('click', function() {
    document.getElementById('trakteerOverlay').style.display = 'none';
});

// Example call to show the overlay (you can call this when needed)
showOverlay(); // Call this function whenever you need to display the overlay

// Ambil elemen collect-container dan tombol toggle
const collectContainer = document.getElementById('collect-container');
const toggleCollectButton = document.getElementById('toggle-collect');

// Fungsi untuk menutup collect-container
function closeCollectContainer() {
    collectContainer.style.right = '-250px'; // Hide the sidebar

    // Remove 'hover-active' class from all collect-toggle elements
    document.querySelectorAll('.collect-toggle').forEach(item => {
        item.classList.remove('hover-active'); // Disable hover effect
    });
}

// Fungsi untuk toggle collect-container
toggleCollectButton.addEventListener('click', function() {
    const isVisible = collectContainer.style.right === '0px';

    if (isVisible) {
        closeCollectContainer(); // Panggil fungsi untuk menutup
    } else {
        collectContainer.style.right = '0px'; // Tampilkan sidebar
    }
});

// Event listener untuk mendeteksi klik di luar collect-container
document.addEventListener('click', function(event) {
    // Cek apakah klik terjadi di luar collect-container dan tombol toggle
    if (!collectContainer.contains(event.target) && !toggleCollectButton.contains(event.target)) {
        closeCollectContainer(); // Tutup collect-container jika klik di luar
    }
});

// Tambahkan event listener untuk tombol toggle pada setiap item
const toggleButtons = document.querySelectorAll('.collect-item button');
toggleButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        // Toggle logika untuk menampilkan atau menyembunyikan elemen checkbox filters
        const filters = button.nextElementSibling; // Ambil elemen setelah tombol
        if (filters.style.display === 'none' || filters.style.display === '') {
            filters.style.display = 'block'; // Tampilkan filters
        } else {
            filters.style.display = 'none'; // Sembunyikan filters
        }
        event.stopPropagation(); // Hentikan event bubbling untuk mencegah penutupan
    });
});

// Additional logic for handling scroll if needed
collectContainer.addEventListener('scroll', function() {
    const maxScrollTop = collectContainer.scrollHeight - collectContainer.clientHeight;
    if (collectContainer.scrollTop >= maxScrollTop) {
        collectContainer.scrollTop = maxScrollTop; // Keep at the bottom
    }
});


// Toggle untuk Material group (Wood, Stone, Fiber)
document.getElementById('toggle-material').addEventListener('click', function() {
    var materialGroup = document.getElementById('material-group');
    var arrow = this.querySelector('.arrow');

    if (materialGroup.style.display === 'none' || materialGroup.style.display === '') {
        materialGroup.style.display = 'block'; // Tampilkan grup
        arrow.textContent = 'v'; // Arahkan panah ke bawah
    } else {
        materialGroup.style.display = 'none'; // Sembunyikan grup
        arrow.textContent = '<'; // Arahkan panah ke kiri
    }
});

// Fungsi untuk toggle setiap material (Wood, Stone, Fiber, Scrap, Ingredients, Old World Treasure)
function setupMaterialToggles() {
    const toggles = [
        { id: 'toggle-wood', filter: 'wood', elementId: 'wood-filters' },
        { id: 'toggle-stone', filter: 'stone', elementId: 'stone-filters' },
        { id: 'toggle-fiber', filter: 'fiber', elementId: 'fiber-filters' },
        { id: 'toggle-scrap', filter: 'scrap', elementId: 'scrap-filters' },
        { id: 'toggle-ingredients', filter: 'ingredients', elementId: 'ingredients-filters' },
        { id: 'toggle-oldworld', filter: 'oldworld', elementId: 'oldworld-filters' }
    ];

    toggles.forEach(toggle => {
        document.getElementById(toggle.id).addEventListener('click', function() {
            const filtersElement = document.getElementById(toggle.elementId);
            const arrow = this.querySelector('.arrow');

            // Toggle display
            if (filtersElement.style.display === 'none' || filtersElement.style.display === '') {
                filtersElement.style.display = 'block'; // Tampilkan filter
                arrow.textContent = 'v'; // Arahkan panah ke bawah
            } else {
                filtersElement.style.display = 'none'; // Sembunyikan filter
                arrow.textContent = '<'; // Arahkan panah ke kiri
            }

            // Update markers jika diperlukan
            updateMarkers(); // Perbarui marker setelah perubahan filter
        });
    });
}

// Inisialisasi toggle
setupMaterialToggles();



function updateMaterialLabelsAndCheckboxes(locType) {
    const materials = materialsByLocType[locType] || {};
    
    console.log('Updated materials for locType', locType, materials); // Log untuk memeriksa data

    // Kosongkan checkbox yang ada sebelumnya
    const ingredientsFilters = document.getElementById('ingredients-filters');
    const woodFilters = document.getElementById('wood-filters');
    const stoneFilters = document.getElementById('stone-filters');
    const fiberFilters = document.getElementById('fiber-filters');
    const scrapFilters = document.getElementById('scrap-filters');
    const rareFilters = document.getElementById('rare-filters'); 
    const oldWorldFilters = document.getElementById('oldworld-filters');

    // Kosongkan HTML filter
    ingredientsFilters.innerHTML = '';
    woodFilters.innerHTML = '';
    stoneFilters.innerHTML = '';
    fiberFilters.innerHTML = '';
    scrapFilters.innerHTML = '';
    rareFilters.innerHTML = ''; 
    oldWorldFilters.innerHTML = '';

    // Menampilkan checkbox untuk wood
    if (materials.wood) {
        materials.wood.forEach(item => {
            woodFilters.innerHTML += `<label><input type="checkbox" class="material-checkbox" data-filter="${item.filter || 'wood'}"> <img src="${item.icon}" alt="${item.name} icon" class="material-icon"> ${item.name}</label>`;
        });
    }

    // Menampilkan checkbox untuk stone
    if (materials.stone) {
        materials.stone.forEach(item => {
            stoneFilters.innerHTML += `<label><input type="checkbox" class="material-checkbox" data-filter="${item.filter || 'stone'}"> <img src="${item.icon}" alt="${item.name} icon" class="material-icon"> ${item.name}</label>`;
        });
    }

    // Menampilkan checkbox untuk fiber
    if (materials.fiber) {
        materials.fiber.forEach(item => {
            fiberFilters.innerHTML += `<label><input type="checkbox" class="material-checkbox" data-filter="${item.filter || 'fiber'}"> <img src="${item.icon}" alt="${item.name} icon" class="material-icon"> ${item.name}</label>`;
        });
    }

    // Menampilkan checkbox untuk scrap
    if (materials.scrap) {
        materials.scrap.forEach(item => {
            scrapFilters.innerHTML += `<label><input type="checkbox" class="material-checkbox" data-filter="${item.filter || 'scrap'}"> <img src="${item.icon}" alt="${item.name} icon" class="material-icon"> ${item.name}</label>`;
        });
    }

    // Menampilkan checkbox untuk rare
    if (materials.rare) { 
        materials.rare.forEach(item => {
            rareFilters.innerHTML += `<label><input type="checkbox" class="material-checkbox" data-filter="${item.filter || 'rare'}"> <img src="${item.icon}" alt="${item.name} icon" class="material-icon"> ${item.name}</label>`;
        });
    }

    // Menampilkan checkbox untuk ingredients
    if (materials.ingredients) {
        materials.ingredients.forEach(item => {
            ingredientsFilters.innerHTML += `<label><input type="checkbox" class="material-checkbox" data-filter="${item.filter || 'ingredients'}"> <img src="${item.icon}" alt="${item.name} icon" class="material-icon"> ${item.name}</label>`;
        });
    }

    // Menampilkan checkbox untuk old world treasure
    if (materials.oldWorldTreasure) {
        oldWorldFilters.innerHTML += `<label><input type="checkbox" data-filter="oldworld"> ${materials.oldWorldTreasure}</label>`;
    }

    // Sembunyikan filters pada awalnya
    ingredientsFilters.style.display = 'none';
    woodFilters.style.display = 'none';
    stoneFilters.style.display = 'none';
    fiberFilters.style.display = 'none';
    scrapFilters.style.display = 'none';
    rareFilters.style.display = 'none'; 
    oldWorldFilters.style.display = 'none';

    // Tampilkan filters jika ada isinya
    if (ingredientsFilters.innerHTML) {
        ingredientsFilters.style.display = 'block';
    }
    if (woodFilters.innerHTML) {
        woodFilters.style.display = 'block';
    }
    if (stoneFilters.innerHTML) {
        stoneFilters.style.display = 'block';
    }
    if (fiberFilters.innerHTML) {
        fiberFilters.style.display = 'block';
    }
    if (scrapFilters.innerHTML) {
        scrapFilters.style.display = 'block';
    }
    if (rareFilters.innerHTML) { 
        rareFilters.style.display = 'block';
    }
    if (oldWorldFilters.innerHTML) {
        oldWorldFilters.style.display = 'block';
    }

    setupMaterialFilterListeners(); // Setup listeners untuk checkbox
}

function updateMainTitle(locType) {
    const mainTitleElement = document.getElementById('main-title');
    const mainTitle = materialsByLocType[locType]?.mainTitle || 'Collectible Materials';
    mainTitleElement.textContent = mainTitle;
}
document.querySelectorAll('.loc-type-selector').forEach(selector => {
    selector.addEventListener('change', (event) => {
        const selectedLocType = event.target.value; // Ambil loc_type yang dipilih
        updateMainTitle(selectedLocType); // Memperbarui judul
        // Panggil fungsi lain yang diperlukan
    });
});

// Function to toggle filters
function toggleFilters(buttonId, filtersId) {
    const button = document.getElementById(buttonId);
    const filters = document.getElementById(filtersId);

    // Toggle display of filters
    if (filters.style.display === 'none') {
        filters.style.display = 'block'; // Show filters
        button.querySelector('.arrow').textContent = 'v'; // Change arrow to down
        button.parentElement.classList.add('active'); // Add active class
    } else {
        filters.style.display = 'none'; // Hide filters
        button.querySelector('.arrow').textContent = '<'; // Change arrow back to left
        button.parentElement.classList.remove('active'); // Remove active class
    }
}



// Call this function whenever the loc_type changes
function onLocTypeChange(newLocType) {
    showLocType(newLocType); // Tampilkan loc-type baru
    updateMaterialLabelsAndCheckboxes(newLocType); // Memperbarui material labels dan checkboxes
    updateMainTitle(newLocType); // Memperbarui judul utama
    updateCategoryDisplay(newLocType); // Update display setelah loc-type berubah
}


// Function to center the map on the given bounds
function centerMapOnBounds(imageBounds) {
    // Close any open popups at the very start
    map.closePopup();
 
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

    // Ensure the filter container hover effect is disabled when the marker is active and popup is open
    map.on('popupopen', function () {
        const newFiltersContainer = document.querySelector('.toggle-new-filters-container');
        if (newFiltersContainer) {
            newFiltersContainer.classList.remove('hover'); // Disable hover effect
        }
    });
}



// Fungsi untuk mengatur listener pada checkbox material
function setupMaterialFilterListeners() {
    const materialCheckboxes = document.querySelectorAll('.material-checkbox');
    
    materialCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateMaterialFilters(); // ONLY trigger when checkbox changes
        });
    });
}

// Function to update material filters based on the checkboxes
function updateMaterialFilters() {
    const materialCheckboxes = document.querySelectorAll('.material-checkbox');
    activeFilters = []; // Kosongkan dulu daftar activeFilters

    materialCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            activeFilters.push(checkbox.dataset.filter); // Tambahkan ke filter aktif
        }
    });

    updateMarkers(); // Panggil fungsi untuk memperbarui marker di peta
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
       (activeFilters.includes('scrap') && category === '6') ||
       (activeFilters.includes('training') && category === '7') ||
       (activeFilters.includes('scenery') && category === '8') ||
       (activeFilters.includes('fiber') && category === '17') ||
       (activeFilters.includes('resin') && ['21', '16', '18'].includes(category)) ||
       (activeFilters.includes('clay') && ['22', '15', '18'].includes(category)) ||
       (activeFilters.includes('wood') && category === '16') ||
       (activeFilters.includes('stone') && category === '15') ||
       (activeFilters.includes('resource') && category === '18') ||
       (activeFilters.includes('scrap2') && category === '19') ||
       (activeFilters.includes('scrap3') && category === '20') ||
       (activeFilters.includes('rarewood1') && category === '23') ||
       (activeFilters.includes('rarestone') && category === '24') ||
       (activeFilters.includes('rarewastes') && category === '25') ||
       (activeFilters.includes('rarewood2') && category === '26');
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


// Mengambil elemen yang diperlukan
const materialGroup = document.getElementById('material-group');
const checkboxFilters = document.querySelectorAll('.checkbox-filters');


// Fungsi untuk menambah class no-scroll pada body
function preventScroll() {
    document.body.classList.add('no-scroll');
}

// Fungsi untuk menghapus class no-scroll dari body
function allowScroll() {
    document.body.classList.remove('no-scroll');
}

// Menambahkan event listener pada materialGroup dan collectContainer
materialGroup.addEventListener('mouseenter', preventScroll);
materialGroup.addEventListener('mouseleave', allowScroll);

collectContainer.addEventListener('mouseenter', preventScroll);
collectContainer.addEventListener('mouseleave', allowScroll);

// Menambahkan event listener pada setiap checkbox filter
checkboxFilters.forEach(filter => {
    filter.addEventListener('mouseenter', preventScroll);
    filter.addEventListener('mouseleave', allowScroll);
});



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
        "TIPS: Give Us Your Marker, Let Help Each Other",
        "TIPS: Use Mobile To Better Experience",
        "If There Are Any Problems And Suggestions Contact BangOne Gaming On Tiktok",
        "TIPS: Give Us Your Marker, Let Help Each Other",
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
    }, 700); // Update setiap 700ms

    // Mengubah teks setiap 3 detik
    setInterval(changePreloaderText, 3000);

    // Otomatis menutup preloader setelah loading selesai
    setTimeout(() => {
        loadingText.textContent = "Loading... 100%"; // Tampilkan 100% untuk saat terakhir
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none'; // Sembunyikan preloader

            // Tambahkan delay 2 detik sebelum menampilkan popup
            setTimeout(() => {
                // Tampilkan pop-up setelah preloader selesai
                const popup = document.getElementById('patch-popup');
                const closeBtn = document.querySelector('.popup .close');
                popup.style.display = 'flex'; // Popup ditampilkan setelah 2 detik

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
            }, 900); // Tunda 2 detik setelah preloader selesai sebelum menampilkan pop-up
        }, 3000); // Tunggu 3 detik sebelum menyembunyikan preloader dan memulai delay 2 detik
    }, 10000); // Total 10 detik delay untuk menutup otomatis
});
