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
        maxBounds: mapBounds,
        maxBoundsViscosity: 1.0,
    }).setView([parseFloat(center_position[0]), parseFloat(center_position[1])], 6);

    // Add the tile layer
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

    // Fetch marker data and add markers to the map
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            jsonData = data;
            addMarkersToMap(); 
            setupFilterListeners(); 

            // Create custom icon for the marker
            const customIcon = L.icon({
                iconUrl: imageUrl,
                iconSize: [256, 256], // Icon size
                iconAnchor: [128, 128] // Anchor point of the icon (half of the icon size)
            });

            // Add a marker with a popup
            L.marker(locPosition, { icon: customIcon }).addTo(map).bindPopup 

            // Calculate the center of the map bounds
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
    for (const key in mini_map_type) {
        if (mini_map_type.hasOwnProperty(key)) {
            const info = mini_map_type[key];

            // Parse location position for the marker
            const loc_position = info.loc_position.split(",");
            const latLng = [parseFloat(loc_position[0]), parseFloat(loc_position[1])];

            // Create the marker
            const marker = L.marker(latLng, {
                icon: L.icon({
                    iconUrl: 'icons/here.png',
                    iconSize: [50, 50]
                })
            }).addTo(map); // Add the marker to the map

            // Create the image bounds for the overlay
            const imageBounds = [
                [parseFloat(info['map_position'][0].split(",")[0]), parseFloat(info['map_position'][0].split(",")[1])],
                [parseFloat(info['map_position'][1].split(",")[0]), parseFloat(info['map_position'][1].split(",")[1])]
            ];

            // Create the overlay
            const historicalOverlay = L.imageOverlay(info['type']['default']['map_url'], imageBounds);

            // Add click listener to the marker
            marker.on('click', function () {
                if (map.hasLayer(historicalOverlay)) {
                    map.removeLayer(historicalOverlay); // Hide the overlay
                } else {
                    historicalOverlay.addTo(map); // Show the overlay
                }
            });

            // Store the marker and overlay in the miniMapMarkers object
            miniMapMarkers[key] = { marker, overlay: historicalOverlay };
        }
    }
}

// Call initMiniMap after your main map initialization
initMap(); // Initialize your main map first
initMiniMap(); // Then initialize the mini-map markers and overlays

function addMarkersToMap() {
    resetCategoryCounts();
    markers = []; // Reset markers array

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const location = jsonData[key];

            // Ambil lat dan lng
            const latLng = [parseFloat(location.lat), parseFloat(location.lng)];
            const iconUrl = getIconUrl(location.category_id);
            const initialOpacity = loadMarkerOpacity(key);

            // Ambil loc_type dan category dari location
            const locType = location.loc_type; 
            const category = location.category_id; 

            console.log(`Adding marker with loc_type: ${locType}, category: ${category}`); // Debugging log

            const marker = L.marker(latLng, {
                icon: L.icon({
                    iconUrl: iconUrl,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                opacity: initialOpacity || 1.0,
            });

            // Set options untuk marker
            marker.options.loc_type = locType;
            marker.options.category = category;

            // Simpan marker dalam array
            markers.push(marker);
            setupMarkerInteractions(marker, location, key);
            updateCategoryCounts(category, initialOpacity);
        }
    }

    // Tersembunyikan semua marker dan kemudian tampilkan berdasarkan filter
    hideMarkers();
    showMarkers(); // Tampilkan marker berdasarkan filter aktif
    updateCategoryDisplay();
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
const categoryCounts = {
    "2": { max: 0, current: 0 },  // Treasure
    "7": { max: 0, current: 0 },  // Training
    "3": { max: 0, current: 0 },  // Zone
    "9": { max: 0, current: 0 },  // Fishing (Combined)
    "8": { max: 0, current: 0 }    // Scenery
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
            resetCategoryCounts(); // Initialize category counts
            addMarkersToMap(); // Add markers after fetching data
            setupFilterListeners(); // Ensure filter listeners are set up
        })
        .catch(error => console.error('Error fetching marker data:', error));
}

function addMarkersToMap() {
    resetCategoryCounts();
    markers = []; // Reset markers array

    console.log('jsonData:', jsonData); // Cek apakah data ada dan terstruktur dengan benar

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const location = jsonData[key];

            // Pastikan bahwa properti 'loc_type' dan 'category_id' ada
            if (typeof location.loc_type === 'undefined' || typeof location.category_id === 'undefined') {
                console.warn(`Data tidak lengkap untuk key ${key}:`, location);
                continue; // Lewati jika data tidak lengkap
            }

            // Ambil lat dan lng
            const latLng = [parseFloat(location.lat), parseFloat(location.lng)];
            const iconUrl = getIconUrl(location.category_id);
            const initialOpacity = loadMarkerOpacity(key);

            // Ambil loc_type dan category dari location
            const locType = location.loc_type; 
            const category = location.category_id; 

            console.log(`Adding marker with loc_type: ${locType}, category: ${category}`); // Debugging log

            const marker = L.marker(latLng, {
                icon: L.icon({
                    iconUrl: iconUrl,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                opacity: initialOpacity || 1.0,
            });

            // Set options untuk marker
            marker.options.loc_type = locType;
            marker.options.category = category;

            // Simpan marker dalam array
            markers.push(marker);
            setupMarkerInteractions(marker, location, key);
            updateCategoryCounts(category, initialOpacity);
        }
    }

    hideMarkers();
    showMarkers(); // Tampilkan marker berdasarkan filter aktif
    updateCategoryDisplay();
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
            map.removeLayer(marker); // Hapus marker jika tidak sesuai
        }
    });
}



function hideMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker); // Remove all markers from the map
    });
}



function resetCategoryCounts() {
    for (const category in categoryCounts) {
        categoryCounts[category].current = 0; // Reset current count
        categoryCounts[category].max = 0; // Reset max count
    }

    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const location = jsonData[key];
            let categoryId = location.category_id;

            // Combine fishing categories into category 9
            if (fishingCategories.includes(categoryId)) {
                categoryId = 9;
            }

            if (categoryCounts[categoryId]) {
                categoryCounts[categoryId].max++; // Increase max count for each category
            }
        }
    }

    // Recalculate current counts based on opacity
    markers.forEach(marker => {
        if (marker.options.opacity === 0.5) {
            updateCategoryCounts(marker.category_id, 0.5); // Update counts for opacity 0.5
        }
    });
}

function updateCategoryCounts(categoryId, opacity) {
    // Combine fishing categories into category 9
    if (fishingCategories.includes(categoryId)) {
        categoryId = 9;
    }

    if (categoryCounts[categoryId]) {
        if (opacity === 0.5) {
            categoryCounts[categoryId].current++; // Increase current count if opacity is 0.5
        } else if (opacity === 1) {
            categoryCounts[categoryId].current = Math.max(0, categoryCounts[categoryId].current - 1); // Decrease count, minimum 0
        }
    }
}

function changeMarkerOpacity(markerId, newOpacity) {
    const marker = findMarkerById(markerId);

    if (marker) {
        marker.setOpacity(newOpacity); // Change marker opacity
        updateCategoryCounts(marker.category_id, newOpacity); // Update category counts
        updateCategoryDisplay(); // Refresh category display
    }
}

function updateCategoryDisplay() {
    for (const categoryId in categoryCounts) {
        if (categoryCounts.hasOwnProperty(categoryId)) {
            const element = document.getElementById(`count-${categoryId === "2" ? "treasure" : categoryId === "7" ? "training" : categoryId === "3" ? "zone" : categoryId === "9" ? "fishing" : "scenery"}`);
            if (element) {
                const { max, current } = categoryCounts[categoryId];
                element.innerHTML = `${element.innerHTML.split(':')[0]}: ${current}/${max}`; // Format: Category: current/max
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    // Assume jsonData is loaded here
    addMarkersToMap(jsonData); // Call this with your actual jsonData
});
// Function to set up marker interactions
// Function to set up marker interactions
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

    // Open the popup when the marker is clicked
    marker.on('click', () => {
        marker.openPopup(); // Open the popup
    });

    // Right-click to toggle opacity
    marker.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e); // Stop event propagation
        const currentOpacity = marker.options.opacity;
        const newOpacity = currentOpacity === 1.0 ? 0.5 : 1.0; // Toggle opacity

        marker.setOpacity(newOpacity);
        saveMarkerOpacity(key, newOpacity); // Save the new opacity
        updateCategoryCounts(location.category_id, newOpacity); // Update category counts
        updateCategoryDisplay(); // Refresh category display
    });
}




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
        case "9": // Fishing category group
        case "10":
        case "11":
        case "12":
        case "13":
        case "14": return "icons/icon_fishing.png"; // Fishing
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
    return storedOpacities[id] || 1.0; // Default opacity is 1.0
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
    donateBtn.addEventListener('click', () => {
        console.log('Donate button clicked');
    });

    // Toggle Legend Visibility
    const toggleLegend = document.getElementById('toggle-legend');
    toggleLegend.addEventListener('click', () => {
        const legend = document.getElementById('legend'); // Assuming you have a legend element
        if (legend) {
            legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Toggle Filters Visibility
    const toggleFilters = document.getElementById('toggle-filters');
    toggleFilters.addEventListener('click', () => {
        const filters = document.getElementById('filters'); // Assuming you have a filters element
        if (filters) {
            filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Reset Opacity Functionality
    const resetOpacityBtn = document.getElementById('reset-opacity');
    resetOpacityBtn.addEventListener('click', () => {
        console.log('Reset opacity button clicked');
        resetMarkerOpacity();
    });
}

// Function to reset marker opacity
function resetMarkerOpacity() {
    console.log('Marker opacity reset to default');
    markers.forEach(marker => {
        marker.setOpacity(1.0); // Set default opacity
        saveMarkerOpacity(marker.options.icon.options.iconUrl, 1.0); // Save default opacity
    });
}



// Example of toggle containers (for new filters and legend)
const toggleNewFiltersContainer = document.querySelector('.toggle-new-filters-container');
const newFilterContainer = document.querySelector('.new-filter-container');

toggleNewFiltersContainer.addEventListener('click', () => {
    newFilterContainer.style.display = 
        newFilterContainer.style.display === 'none' || newFilterContainer.style.display === '' ? 'block' : 'none';
});

const toggleFilterContainer = document.querySelector('.toggle-legend-container');
const filterContainer = document.querySelector('.filter-container');

toggleFilterContainer.addEventListener('click', () => {
    filterContainer.style.display = 
        filterContainer.style.display === 'none' || filterContainer.style.display === '' ? 'flex' : 'none';
});

let activeOverlays = [];
let activeMiniMapKey = null; // Variable to store the currently active mini-map key



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

// Event listener untuk tombol filter
document.querySelectorAll('.new-filter-container .filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Menambahkan delay 1 detik sebelum fungsi dijalankan
        setTimeout(() => {
            const filterKey = button.getAttribute('data-filter');

            // Hapus semua marker dan uncheck semua checkbox
            clearAllMarks();

            // Tambahkan filter baru ke activeLocTypes
            activeLocTypes.push(filterKey);
            
            // Update markers berdasarkan filter yang baru
            showMarkers();

            // Tentukan miniMapKey berdasarkan filterKey
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
                // Hapus semua overlay aktif
                activeOverlays.forEach(overlay => {
                    overlay.remove(); // Hapus dari peta
                });
                activeOverlays = []; // Bersihkan array

                // Buat dan tampilkan overlay baru
                const info = mini_map_type[miniMapKey];
                const imageBounds = [[
                    parseFloat(info['map_position'][0].split(",")[0]), 
                    parseFloat(info['map_position'][0].split(",")[1])
                ], [
                    parseFloat(info['map_position'][1].split(",")[0]), 
                    parseFloat(info['map_position'][1].split(",")[1])
                ]];

                const historicalOverlay = L.imageOverlay(info['type']['default']['map_url'], imageBounds);
                historicalOverlay.addTo(map);

                // Tambahkan overlay baru ke daftar aktif
                activeOverlays.push(historicalOverlay);

                // Hitung pusat untuk zooming
                const mapPosition = info.map_position;
                const position1 = mapPosition[0].split(",");
                const position2 = mapPosition[1].split(",");

                // Hitung titik tengah dari dua koordinat
                const midLat = (parseFloat(position1[0]) + parseFloat(position2[0])) / 2;
                const midLng = (parseFloat(position1[1]) + parseFloat(position2[1])) / 2;

                // Opsi: Geser pusat ke kanan
                const offsetLng = 0.01; // Sesuaikan nilai ini
                const newCenter = [midLat, midLng - offsetLng]; // Geser ke kanan

                // Lakukan zoom out lalu zoom in ke pusat baru
                function smoothZoomOutAndIn() {
                    const currentZoom = map.getZoom();
                    let zoomOut = currentZoom;
                    const zoomOutInterval = setInterval(() => {
                        if (zoomOut > 4) {
                            zoomOut -= 1;
                            map.setZoom(zoomOut);
                        } else {
                            clearInterval(zoomOutInterval);
                            // Setelah zoom out, pan ke pusat baru
                            map.setView(newCenter);
                            setTimeout(() => {
                                // Zoom in ke level akhir
                                map.setZoom(7); // Sesuaikan level zoom ini
                            }, 500); // Sesuaikan durasi timeout jika diperlukan
                        }
                    }, 100); // Sesuaikan interval
                }

                smoothZoomOutAndIn(); // Panggil fungsi zoom
            }

            // Sembunyikan container filter setelah memilih filter
            document.querySelector('.new-filter-container').style.display = 'none';
        }, 1000); // Delay 1 detik
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


// New function to add markers for the active mini-map
function addMarkersForMiniMap(miniMapKey) {
    if (!mini_map_type[miniMapKey]) {
        console.error(`No mini map type found for key: ${miniMapKey}`);
        return;
    }
    
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
            })
        });

        marker.addTo(map);
        markers.push(marker); // Store it in the markers array
    });
}


// Function to center the map on the given bounds
function centerMapOnBounds(imageBounds) {
    const midLat = (imageBounds[0][0] + imageBounds[1][0]) / 2;
    const midLng = (imageBounds[0][1] + imageBounds[1][1]) / 2;
    const offsetLng = 0.01; // Adjust this value as needed
    const newCenter = [midLat, midLng - offsetLng];

    // Zoom out and then zoom in to the new center
    map.setView(newCenter, 4); // Zoom out to level 4
    setTimeout(() => {
        map.setView(newCenter, 7); // Zoom in to the desired level
        updateMarkers(); // Ensure filters are applied after markers are cleared
    }, 500); // Adjust the timeout duration if necessary
}

// Fungsi untuk menghilangkan semua checkbox (uncheck)
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

// Function to update filter listeners
function setupFilterListeners() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Update activeFilters based on checkbox
            if (checkbox.checked) {
                activeFilters.push(checkbox.dataset.filter);
            } else {
                activeFilters = activeFilters.filter(filter => filter !== checkbox.dataset.filter);
            }
            updateMarkers(); // Refresh markers after changing filters
        });
    });
}

function updateMarkers() {
    clearAllMarks(); // Hapus marker yang ada untuk menghindari duplikasi

    markers.forEach((marker) => {
        const categoryMatch = isCategoryMatch(marker);
        const locTypeMatch = activeLocTypes.length === 0 || activeLocTypes.includes(`loc_type${marker.options.loc_type}`);

        // Hanya tambahkan marker ke peta jika loc_type dan kategori cocok
        if (locTypeMatch && categoryMatch) {
            marker.addTo(map); // Tampilkan marker
            console.log(`Menambahkan marker dengan kategori: ${marker.options.category}`);
        }
    });
}


// Function to clear all markers from the map
function clearAllMarks() {
    markers.forEach(marker => map.removeLayer(marker)); // Remove markers from the map
}

// Function to check if the marker's category matches the active filters
function isCategoryMatch(marker) {
    return activeFilters.includes('all') ||
        (activeFilters.includes('treasure') && marker.options.category === '2') ||
        (activeFilters.includes('teleport') && marker.options.category === '1') ||
        (activeFilters.includes('fishing') && ['9', '10', '11', '12', '13', '14'].includes(marker.options.category)) ||
        (activeFilters.includes('zone') && marker.options.category === '3') ||
        (activeFilters.includes('training') && marker.options.category === '7');
}
    document.addEventListener('DOMContentLoaded', () => {
        const buttons = document.querySelectorAll('.new-filter-container .filter-btn');
function updateActiveFilters(filter) {
    if (filter.startsWith('loc_type')) {
        const index = activeLocTypes.indexOf(filter);
        if (index > -1) {
            activeLocTypes.splice(index, 1);
        } else {
            activeLocTypes.push(filter);
        }
    } else {
        updateCatagoryFilters(filter);
    }
    updateMarkers(); // Update markers after filter change
}

function updateCatagoryFilters(filter) {
    const allCheckbox = document.querySelector('.filter-checkbox[data-filter="all"]');
    const otherCheckboxes = Array.from(document.querySelectorAll('.filter-checkbox'))
        .filter(checkbox => checkbox.getAttribute('data-filter') !== 'all');

    if (filter === 'all') {
        if (allCheckbox.checked) {
            // "all" is checked, check all other checkboxes
            otherCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
                const otherFilter = checkbox.getAttribute('data-filter');
                if (!activeFilters.includes(otherFilter)) {
                    activeFilters.push(otherFilter);
                }
            });
        } else {
            // "all" is unchecked, uncheck all other checkboxes
            activeFilters = [];
            activeLocTypes = [];
            markers.forEach(marker => map.removeLayer(marker));
            otherCheckboxes.forEach(checkbox => checkbox.checked = false);
        }
    } else {
        const index = activeFilters.indexOf(filter);
        if (index > -1) {
            activeFilters.splice(index, 1);
        } else {
            activeFilters.push(filter);
        }

        // Uncheck "all" if any other filter is checked
        if (activeFilters.length > 0) {
            allCheckbox.checked = false;
        } else if (activeFilters.length === 0) {
            // If no other filters are active, re-enable "all"
            allCheckbox.checked = true;
        }
    }
}

    
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

                // Calculate scroll position to center the hovered button
                const scrollLeft = button.offsetLeft - (containerRect.width / 2) + (button.offsetWidth / 2);

                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Run on page load and on scroll
    checkVisibility();
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    centerOnHover();
});




// Optional: If you still need to handle scroll for filter-checkbox-btn
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
// Contoh JavaScript untuk menambahkan kelas animasi saat elemen muncul atau menghilang
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

// Tambahkan event listener untuk scroll
window.addEventListener('scroll', handleScroll);
// Jalankan fungsi saat halaman dimuat
handleScroll();

document.getElementById('zoomBtn').addEventListener('click', function() {
    var fullscreenImage = document.getElementById('fullscreen-image');
    fullscreenImage.style.display = 'flex';
    
    // Menampilkan gambar fullscreen
    fullscreenImage.innerHTML = '<img src="icons/space.png" alt="Space Image" />';
    
    // Memulai animasi zoom out dan geser ke kanan
    setTimeout(function() {
        fullscreenImage.querySelector('img').style.transform = 'scale(1) translateX(-25%)'; // Gambar berakhir 20% ke kanan
    }, 10); // Sedikit delay agar transisi berjalan
    
    // Setelah 2 detik, redirect ke link
    setTimeout(function() {
        window.location.href = 'https://bangonegaming.com/pegasus/index.html';
    }, 2000); // Redirect setelah 2 detik
});
document.getElementById("hildeBtn").onclick = function () {
    window.location.href = "https://bangonegaming.com/hilde/index.html";
  };
const closeBtn = document.getElementById('closeOverlayBtn');
  const overlay = document.getElementById('trakteerOverlay');

  // Menambahkan event listener untuk tombol close
  closeBtn.addEventListener('click', function() {
    // Sembunyikan overlay ketika tombol close diklik
    overlay.style.display = 'none';
  });
  
