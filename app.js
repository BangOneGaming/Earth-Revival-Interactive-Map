
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
    resetCategoryCounts(); // Reset category counts
    markers = []; // Reset markers array

    // Iterate through jsonData
    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const location = jsonData[key];

            // Validate lat and lng
            if (!location.lat || !location.lng) {
                console.error(`Location ${key} is missing lat/lng.`);
                continue;
            }

            // Convert lat/lng to float and prepare coordinates
            const latLng = [parseFloat(location.lat), parseFloat(location.lng)];

            // Get icon URL based on the category_id
            const iconUrl = getIconUrl(location.category_id);

            // Load marker opacity (if previously saved)
            const initialOpacity = loadMarkerOpacity(key);

            // Assign loc_type, category, name, and marker ID with fallback values
            const locType = location.loc_type || 'Unknown'; 
            const categoryId = location.category_id || 'Unknown'; 
            const nameEn = location.en_name || 'Unknown'; 
            const markerId = location.id || key; // Ensure you are using the actual ID from your data

            // Log marker details for debugging
            console.log(`Adding marker with loc_type: ${locType}, categoryId: ${categoryId}, nameEn: ${nameEn}, markerId: ${markerId}`);

            // Create the Leaflet marker with the specified icon and opacity
            const marker = L.marker(latLng, {
                icon: L.icon({
                    iconUrl: iconUrl,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                opacity: initialOpacity || 1.0, // Set opacity (default to 1.0)
            });

            // Attach additional properties to marker options for use in the report form
            marker.options.loc_type = locType;
            marker.options.category = categoryId;
            marker.options.id = markerId; // Use 'id' instead of 'markerId' for consistency
            marker.options.en_name = nameEn; // Marker name in English

            // Save marker to the markers array for future reference
            markers.push(marker);

            // Set up marker interactions, including the report button
            setupMarkerInteractions(marker, location, markerId);

            // Update the category counts based on the marker's category and opacity
            updateCategoryCounts(categoryId, initialOpacity);
        }
    }

    // Hide markers initially and update the category display
    hideMarkers();
    updateCategoryDisplay();
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
        "14": "Fishing"
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

    // Handle marker click to open popup and set up report button
    marker.on('click', () => {
        marker.openPopup(); // Open the popup
        setupReportButton(marker, key); // Set up report button
    });

    // Right-click to toggle opacity
    marker.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e); // Stop event propagation
        const currentOpacity = marker.options.opacity || 1.0; // Default opacity is 1.0
        const newOpacity = currentOpacity === 1.0 ? 0.5 : 1.0; // Toggle opacity

        marker.setOpacity(newOpacity);
        saveMarkerOpacity(key, newOpacity); // Save the new opacity
        updateCategoryCounts(location.category_id, newOpacity); // Update category counts
        updateCategoryDisplay(); // Refresh category display
    });
}

// Function to set up the report button functionality
function setupReportButton(marker, key) {
    // Attach event listener to the Report button in the popup
    const reportButton = document.querySelector('.reportButton[data-id="' + key + '"]');
    if (reportButton) {
        reportButton.addEventListener('click', () => {
            showReportForm(marker); // Call the function to show the report form
        });
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
            })
        });

        marker.addTo(map); // Add marker to the map
        activeMiniMapMarkers.push(marker); // Store the marker in the active mini-map markers array
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
           (activeFilters.includes('scenery') && category === '8');
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
