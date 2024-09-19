let activeFilters = [];
let activeLocTypes = [];
let markers = [];
let jsonData = {}; // Tempat menyimpan data JSON
let markerVisibility = {}; // Deklarasikan variabel ini jika belum ada
let holdTimeout; // Variabel untuk menyimpan timer hold

function initMap() {
    var init_position = window.init_position || "60.871009248911655,-76.62568359375001";
    var center_postion = init_position.split(",");

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: parseFloat(center_postion[0]),
            lng: parseFloat(center_postion[1])
        },
        zoom: 6,
        streetViewControl: false,
        mapTypeControl: false,
        disableDefaultUI: true,
        backgroundColor: '#1E2026'
    });

    var myMap = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
            var normalizedCoord = getNormalizedCoord(coord, zoom);
            if (!normalizedCoord) {
                return null;
            }
            var xy_deny = {
                "zoom_4": [4, 4],
                "zoom_5": [8, 9],
                "zoom_6": [16, 19],
                "zoom_7": [32, 39],
                "zoom_8": [64, 79],
                "zoom_9": [128, 159]
            };
            if (zoom < 4 || zoom > 9) {
                return null;
            }
            var temp = xy_deny["zoom_" + zoom];
            if ((temp[0] <= normalizedCoord.x && normalizedCoord.x <= temp[1]) &&
                (temp[0] <= normalizedCoord.y && normalizedCoord.y <= temp[1])) {
                return `statics/yuan_${zoom}_${normalizedCoord.x}_${normalizedCoord.y}.png`;
            } else {
                return null;
            }
        },
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 9,
        minZoom: 6,
        name: 'Default'
    });

    map.mapTypes.set('default', myMap);
    map.setMapTypeId('default');

    google.maps.event.addListener(map, 'zoom_changed', function () {
        if (map.zoom < 6) {
            map.zoom = 6;
        }
    });

    var strictBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(66, -89.4),
        new google.maps.LatLng(57, -67.40522460937501)
    );

    google.maps.event.addListener(map, 'dragend', function () {
        if (strictBounds.contains(map.getCenter())) return;

        var c = map.getCenter(),
            x = c.lng(),
            y = c.lat(),
            maxX = strictBounds.getNorthEast().lng(),
            maxY = strictBounds.getSouthWest().lat(),
            minX = strictBounds.getSouthWest().lng(),
            minY = strictBounds.getNorthEast().lat();

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;
        if (y < minY) y = minY;
        if (y > maxY) y = maxY;

        map.setCenter(new google.maps.LatLng(y, x));
    });

    const infoWindow = new google.maps.InfoWindow();

fetch('https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps')
    .then(response => response.json())
    .then(data => {
        jsonData = data; // Simpan data JSON

        // Proses marker dari data JSON
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const location = jsonData[key];
                const latLng = {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lng)
                };
                let icon;
switch (location.category_id) {
    case '7':
        icon = 'icons/icon_train.png';
        break;
    case '2':
        icon = 'icons/icon_treasure.png';
        break;
    case '1':
        icon = 'icons/icon_teleport.png';
        break;
    case '3':
        icon = 'icons/icon_zone.png';
        break;
    case '8': // Tambahkan kategori 8 dengan ikonnya sendiri
        icon = 'icons/icon_scenery.png'; // Sesuaikan dengan ikon yang relevan
        break;
    case '9':
    case '10':
    case '11':
    case '12':
    case '13':
    case '14':
        icon = 'icons/icon_fishing.png';
        break;
    default:
        icon = 'icons/icon_scenery.png';
        break;
}

                // Tambahkan status opacity ke marker
const marker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon: icon,
    category: location.category_id,
    loc_type: location.loc_type,
    id: key, // Pastikan ID ditambahkan di sini
    draggable: false,
    opacity: loadMarkerOpacity(key) // Muat opacity dari local storage
});


marker.addListener('click', () => {
    console.log('Marker clicked with ID:', marker.id); // Log ID marker saat klik
    const contentString = `
        <div style="position: relative; padding: 15px; font-family: Arial, sans-serif; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25); background-color: rgba(19, 39, 96, 0.613);">
            <h3 style="margin-top: 0; margin-bottom: 8px; color: #ffffff; font-size: 18px;">${location.en_name}</h3>
            <p style="font-size: 14px; color: #ffffff; margin-bottom: 8px;">${(location.desc || 'No description available.').replace(/\n/g, '<br>').replace(/<b>/g, '<b>').replace(/<\/b>/g, '</b>')}</p>
            ${(location.links_info && location.links_info !== '[]') ? `<a href="${location.links_info}" target="_blank" style="display: inline-block; padding: 8px 12px; margin-top: 8px; font-size: 14px; color: #ffffff; background-color: #007bff; border-radius: 4px; text-decoration: none;">Watch Video</a>` : ''}
            <button class="reportButton" data-id="${key}" style="position: absolute; bottom: 10px; right: 10px; background: none; border: none; color: red; font-size: 12px; cursor: pointer; z-index: 1300;">Report</button>
        </div>
    `;
    infoWindow.setContent(contentString);
    infoWindow.open(map, marker);
});

                marker.addListener('mousedown', () => {
                    holdTimeout = setTimeout(() => {
                        // Toggle opacity saat di-hold
                        marker.opacity = marker.opacity === 1 ? 0.5 : 1;
                        marker.setOpacity(marker.opacity);
                        saveMarkerOpacity(key, marker.opacity); // Simpan opacity ke local storage
                        updateCategoryCounts(); // Update counts setelah opacity berubah
                    }, 500); // Delay 500 ms untuk hold
                });

                marker.addListener('mouseup', () => {
                    clearTimeout(holdTimeout); // Hentikan timer jika mouse dilepas
                });

                marker.addListener('mouseout', () => {
                    clearTimeout(holdTimeout); // Hentikan timer jika kursor keluar dari marker
                });

                markerVisibility[marker] = true; // Menandai marker sebagai terlihat
                markers.push(marker);
            }
        }

        // Hide all markers on initial load
        markers.forEach(marker => {
            marker.setMap(null);
        });

        initMiniMap(); // Inisialisasi mini peta
        applyFilters(); // Terapkan filter setelah data dimuat
    })
    .catch(error => {
        console.error('Error fetching JSON data:', error);
    });

}

function saveMarkerOpacity(id, opacity) {
    const markerOpacities = JSON.parse(localStorage.getItem('markerOpacities')) || {};
    markerOpacities[id] = opacity;
    localStorage.setItem('markerOpacities', JSON.stringify(markerOpacities));
}

function loadMarkerOpacity(id) {
    const markerOpacities = JSON.parse(localStorage.getItem('markerOpacities')) || {};
    return markerOpacities[id] || 1; // Default opacity 1 jika tidak ada data
}

function applyFilters() {
    markers.forEach(marker => marker.setMap(null));

    markers.forEach(marker => {
        if (activeFilters.includes(marker.category)) {
            marker.setMap(map);
        }
    });

    updateCategoryCounts();
}

function updateCategoryCounts() {
    const counts = {
        '1': { visible: 0, opacityHalf: 0 },
        '2': { visible: 0, opacityHalf: 0 },
        '3': { visible: 0, opacityHalf: 0 },
        '7': { visible: 0, opacityHalf: 0 },
        '8': { visible: 0, opacityHalf: 0 },
        '9': { visible: 0, opacityHalf: 0 },
        '10': { visible: 0, opacityHalf: 0 },
        '11': { visible: 0, opacityHalf: 0 },
        '12': { visible: 0, opacityHalf: 0 },
        '13': { visible: 0, opacityHalf: 0 },
        '14': { visible: 0, opacityHalf: 0 }
    };

    markers.forEach(marker => {
        if (markerVisibility[marker]) {
            const category = marker.category;
            if (counts[category]) {
                counts[category].visible++;
                if (marker.opacity === 0.5) {
                    counts[category].opacityHalf++;
                }
            } else {
                console.warn(`Category ${category} not found in counts.`);
            }
        }
    });

    const totalCounts = {
        '2': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '2').length : 0,
        '7': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '7').length : 0,
        '3': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '3').length : 0,
        '8': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '8').length : 0,
        '9': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '9').length + 
                       Object.values(jsonData).filter(loc => loc.category_id === '10').length +
                       Object.values(jsonData).filter(loc => loc.category_id === '11').length +
                       Object.values(jsonData).filter(loc => loc.category_id === '12').length +
                       Object.values(jsonData).filter(loc => loc.category_id === '13').length +
                       Object.values(jsonData).filter(loc => loc.category_id === '14').length : 0
    };

    // Update HTML dengan format count terbaru
    const treasureCount = document.getElementById('count-treasure');
    const trainingCount = document.getElementById('count-training');
    const zoneCount = document.getElementById('count-zone');
    const fishingCount = document.getElementById('count-fishing');
    const sceneryCount = document.getElementById('count-scenery');

    if (treasureCount) {
        treasureCount.innerHTML = `<img src="icons/icon_treasure.png" alt="Treasure Icon" class="count-icon"><span class="count-text">${counts['2'] ? counts['2'].opacityHalf : 0}/${totalCounts['2']}</span>`;
    } else {
        console.error('Element with ID "count-treasure" not found.');
    }

    if (trainingCount) {
        trainingCount.innerHTML = `<img src="icons/icon_train.png" alt="Training Icon" class="count-icon"><span class="count-text">${counts['7'] ? counts['7'].opacityHalf : 0}/${totalCounts['7']}</span>`;
    } else {
        console.error('Element with ID "count-training" not found.');
    }

    if (zoneCount) {
        zoneCount.innerHTML = `<img src="icons/icon_zone.png" alt="Zone Icon" class="count-icon"><span class="count-text">${counts['3'] ? counts['3'].opacityHalf : 0}/${totalCounts['3']}</span>`;
    } else {
        console.error('Element with ID "count-zone" not found.');
    }

    if (fishingCount) {
        fishingCount.innerHTML = `<img src="icons/icon_fishing.png" alt="Fishing Icon" class="count-icon"><span class="count-text">${counts['9'] ? counts['9'].opacityHalf : 0}/${totalCounts['9']}</span>`;
    } else {
        console.error('Element with ID "count-fishing" not found.');
    }
    if (sceneryCount) {
        sceneryCount.innerHTML = `<img src="icons/icon_scenery.png" alt="Scenery Icon" class="count-icon"><span class="count-text">${counts['8'] ? counts['8'].opacityHalf : 0}/${totalCounts['8']}</span>`;
    } else {
        console.error('Element with ID "count-scenery" not found.');
    }

// Panggil fungsi untuk menghitung total counts ketika data JSON dimuat
fetch('https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        jsonData = data;
        calculateTotalCounts(); // Hitung total marker berdasarkan data JSON
        initMap(); // Lanjutkan dengan inisialisasi peta
    })
    .catch(error => {
        console.error('Error fetching JSON data:', error);
    });

// Fungsi untuk menghapus filter
function removeFilter(category) {
    const index = activeFilters.indexOf(category);
    if (index > -1) {
        activeFilters.splice(index, 1);
        applyFilters();
    }
}

    // Toggle buttons for legend and filters
    document.getElementById('toggle-legend').addEventListener('click', () => {
        toggleVisibility('.filter-container');
    });

    // Add event listeners to toggle buttons
    document.getElementById('toggle-filters').addEventListener('click', () => {
        toggleVisibility('.new-filter-container'); // Ensure correct ID selector
    });
// Fungsi untuk mereset opacity marker menjadi 1.0 dan memperbarui count
function resetOpacity() {
    markers.forEach(marker => {
        if (marker.opacity === 0.5) {
            marker.opacity = 1.0; // Set opacity menjadi 1.0
            marker.setOpacity(1.0); // Pastikan untuk memperbarui tampilan marker di peta
        }
    });

    updateCategoryCounts(); // Perbarui count setelah mereset opacity
}

// Tambahkan event listener pada tombol reset
document.getElementById('reset-opacity').addEventListener('click', resetOpacity);

// Fungsi untuk menampilkan form laporan kesalahan
function showReportForm(marker) {
    var markerId = marker.id;
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
                <textarea id="errorDescription" name="errorDescription" rows="4" placeholder="UID/NAMEGAME/NAME MAP"></textarea><br><br>

                <button type="button" id="submitReportBtn">Submit Report</button>
                <button type="button" class="cancel" id="cancelReportBtn">Cancel</button>
            </form>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    console.log('Form shown for marker ID:', markerId);

    // Add event listeners for the buttons
    document.getElementById('submitReportBtn').addEventListener('click', () => submitReport(markerId, marker.getPosition().lat(), marker.getPosition().lng()));
    document.getElementById('cancelReportBtn').addEventListener('click', closeReportForm);
}


// Fungsi untuk menutup form laporan
function closeReportForm() {
    console.log('Closing form...');
    var formContainer = document.getElementById('reportFormContainer');
    if (formContainer) {
        formContainer.remove();
        console.log('Form removed from DOM');
    } else {
        console.log('Form not found');
    }
}

// Fungsi untuk mengirim laporan
function submitReport(markerId, lat, lng) {
    var num1 = document.getElementById('num1').value;
    var num2 = document.getElementById('num2').value;
    var errorDescription = document.getElementById('errorDescription').value;

    if (!num1 || !num2) {
        alert('Please fill in the number fields');
        return;
    }

    const jsonData = {
        ID: markerId,
        latitude: lat,
        longitude: lng,
        "X-coordinate": num1,
        "Y-coordinate": num2,
        description: errorDescription
    };

    fetch('https://autumn-dream-8c07.square-spon.workers.dev/Report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
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
            closeReportForm(); // Tutup form jika sukses
        } else {
            console.error('Unexpected response:', data);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Tambahkan event listener untuk tombol report
document.addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('reportButton')) {
        var markerId = event.target.getAttribute('data-id');
        if (!markerId) {
            console.error('Marker ID not found on report button');
            return;
        }
        // Temukan marker berdasarkan ID
        var marker = markers.find(m => m.id === markerId); // Pastikan 'id' sesuai dengan yang ditetapkan
        if (marker) {
            showReportForm(marker);
        } else {
            console.log('Marker not found for ID:', markerId);
        }
    }
});



// Array to keep track of active overlays
let activeOverlays = [];

// Fungsi untuk menghilangkan semua checkbox (uncheck)
function clearAllMarks() {
    // Uncheck semua filter checkbox
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Hapus semua marker yang ada
    activeLocTypes = []; // Kosongkan array activeLocTypes
    updateMarkers(); // Perbarui peta untuk menghilangkan semua marker
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
            updateMarkers();

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
                    if (overlay.getMap()) {
                        overlay.setMap(null);
                    }
                });
                activeOverlays = []; // Bersihkan array

                // Buat dan tampilkan overlay baru
                const info = mini_map_type[miniMapKey];
                const imageBounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(parseFloat(info['map_position'][0].split(",")[0]), parseFloat(info['map_position'][0].split(",")[1])),
                    new google.maps.LatLng(parseFloat(info['map_position'][1].split(",")[0]), parseFloat(info['map_position'][1].split(",")[1]))
                );

                const historicalOverlay = new google.maps.GroundOverlay(info['type']['default']['map_url'], imageBounds);
                historicalOverlay.setMap(map);

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
                const newCenter = {
                    lat: midLat,
                    lng: midLng - offsetLng // Geser ke kanan
                };

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
                            map.panTo(newCenter);
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
function updateCategoryCounts() {
    // Reset counts for all categories
    const counts = {
        '1': { visible: 0, opacityHalf: 0 },
        '2': { visible: 0, opacityHalf: 0 },
        '3': { visible: 0, opacityHalf: 0 },
        '7': { visible: 0, opacityHalf: 0 },
        '8': { visible: 0, opacityHalf: 0 },
        '9': { visible: 0, opacityHalf: 0 },
        '10': { visible: 0, opacityHalf: 0 },
        '11': { visible: 0, opacityHalf: 0 },
        '12': { visible: 0, opacityHalf: 0 },
        '13': { visible: 0, opacityHalf: 0 },
        '14': { visible: 0, opacityHalf: 0 }
    };

    // Get the active mini-map type
    const activeLocType = activeLocTypes[activeLocTypes.length - 1]; // The most recent active loc_type

    if (!activeLocType) {
        // If no mini-map is active, hide the counts
        hideCategoryCounts();
        return;
    }

    // Filter and count only markers that match the active mini-map
    markers.forEach(marker => {
        if (markerVisibility[marker] && marker.loc_type === activeLocType) {
            const category = marker.category;
            if (counts[category]) {
                counts[category].visible++;
                if (marker.opacity === 0.5) {
                    counts[category].opacityHalf++;
                }
            }
        }
    });

    // Calculate the total number of markers for each category in the active mini-map
    const totalCounts = {
        '2': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '2' && loc.loc_type === activeLocType).length : 0,
        '7': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '7' && loc.loc_type === activeLocType).length : 0,
        '3': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '3' && loc.loc_type === activeLocType).length : 0,
        '8': jsonData ? Object.values(jsonData).filter(loc => loc.category_id === '8' && loc.loc_type === activeLocType).length : 0,
        '9': jsonData ? Object.values(jsonData).filter(loc => ['9', '10', '11', '12', '13', '14'].includes(loc.category_id) && loc.loc_type === activeLocType).length : 0
    };

    // Update the category counts in the UI
    updateCategoryCountUI(counts, totalCounts);
}

// Function to update the UI for category counts
function updateCategoryCountUI(counts, totalCounts) {
    const treasureCount = document.getElementById('count-treasure');
    const trainingCount = document.getElementById('count-training');
    const zoneCount = document.getElementById('count-zone');
    const fishingCount = document.getElementById('count-fishing');
    const sceneryCount = document.getElementById('count-scenery');

    if (treasureCount) {
        treasureCount.innerHTML = `<img src="icons/icon_treasure.png" alt="Treasure Icon" class="count-icon"><span class="count-text">${counts['2'] ? counts['2'].opacityHalf : 0}/${totalCounts['2']}</span>`;
    }

    if (trainingCount) {
        trainingCount.innerHTML = `<img src="icons/icon_train.png" alt="Training Icon" class="count-icon"><span class="count-text">${counts['7'] ? counts['7'].opacityHalf : 0}/${totalCounts['7']}</span>`;
    }

    if (zoneCount) {
        zoneCount.innerHTML = `<img src="icons/icon_zone.png" alt="Zone Icon" class="count-icon"><span class="count-text">${counts['3'] ? counts['3'].opacityHalf : 0}/${totalCounts['3']}</span>`;
    }

    if (fishingCount) {
        fishingCount.innerHTML = `<img src="icons/icon_fishing.png" alt="Fishing Icon" class="count-icon"><span class="count-text">${counts['9'] ? counts['9'].opacityHalf : 0}/${totalCounts['9']}</span>`;
    }
        if (sceneryCount) {
        sceneryCount.innerHTML = `<img src="icons/icon_scenery.png" alt="Scenery Icon" class="count-icon"><span class="count-text">${counts['8'] ? counts['8'].opacityHalf : 0}/${totalCounts['8']}</span>`;
    }
}

// Hide category counts if no mini-map is active
function hideCategoryCounts() {
    const categoryCountElements = [
        document.getElementById('count-treasure'),
        document.getElementById('count-training'),
        document.getElementById('count-zone'),
        document.getElementById('count-fishing'),
        document.getElementById('count-scenery')
    ];

    categoryCountElements.forEach(el => {
        if (el) {
            el.style.display = 'none';
        }
    });
}

// Show category counts when a mini-map is active
function showCategoryCounts() {
    const categoryCountElements = [
        document.getElementById('count-treasure'),
        document.getElementById('count-training'),
        document.getElementById('count-zone'),
        document.getElementById('count-fishing'), 
        document.getElementById('count-scenery')
    ];

    categoryCountElements.forEach(el => {
        if (el) {
            el.style.display = 'block';
        }
    });
}

// Call this when a new mini-map is activated
function onMiniMapActivated() {
    showCategoryCounts(); // Ensure counts are visible
    updateCategoryCounts(); // Update counts based on the active mini-map
}


    // Container Hidden When Preload
    window.addEventListener('load', function() {
        document.querySelector('.filter-container').style.display = 'flex';
        document.querySelector('.new-filter-container').style.display = 'flex';
        document.querySelector('.toggle-filter').style.display = 'flex'; // Jika elemen ini menggunakan flexbox
        document.getElementById('logo').style.display = 'block';
    });
    

    document.querySelectorAll('.filter-container input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateActiveFilters(checkbox.getAttribute('data-filter'));
            updateMarkers();
        });
    });

    // Preloader logic
    window.addEventListener("load", function () {
        const preloader = document.getElementById("preloader");
        preloader.style.display = "none";

        showLoadingAnimation('Loading...');
    });

    function toggleVisibility(selector) {
        const element = document.querySelector(selector);
        console.log(element.style.display);
        if (element.style.display != 'none' ) {
            element.style.display = 'none'; // or 'block' depending on layout needs
        } else {
            element.style.display = 'flex';
        }
    }
    

    function showLoadingAnimation(text) {
        const loadingMessage = document.getElementById('loading');
        const mapElement = document.getElementById('map');
        loadingMessage.innerHTML = "0";
        loadingMessage.style.opacity = 1;

        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                loadingMessage.innerHTML += text[index];
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    loadingMessage.style.opacity = 0;
                    mapElement.style.display = 'block';
                }, 500);
            }
        }, 2000);
    }
}

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
            markers.forEach(marker => marker.setMap(null));
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

function updateMarkers() {
    markers.forEach((marker) => {
        const categoryMatch = activeFilters.includes('all') ||
            (activeFilters.includes('treasure') && marker.category === '2') ||
            (activeFilters.includes('teleport') && marker.category === '1') ||
            (activeFilters.includes('fishing') && ['9', '10', '11', '12', '13', '14'].includes(marker.category)) ||
            (activeFilters.includes('zone') && marker.category === '3') ||
            (activeFilters.includes('training') && marker.category === '7');
  

        const locTypeMatch = activeLocTypes.length === 0 || activeLocTypes.includes(`loc_type${marker.loc_type}`);

        if (categoryMatch && locTypeMatch) {
            marker.setMap(map);
            // Removed bounce animation and delay code
        } else {
            marker.setMap(null);
        }
    });
}

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
            const marker = new google.maps.Marker({
                position: {
                    lat: parseFloat(loc_position[0]),
                    lng: parseFloat(loc_position[1])
                },
                map: map,
                icon: {
                    url: "icons/here1.png",
                    scaledSize: new google.maps.Size(50, 50)
                }
            });

            const imageBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(parseFloat(info['map_position'][0].split(",")[0]), parseFloat(info['map_position'][0].split(",")[1])),
                new google.maps.LatLng(parseFloat(info['map_position'][1].split(",")[0]), parseFloat(info['map_position'][1].split(",")[1]))
            );

            const historicalOverlay = new google.maps.GroundOverlay(info['type']['default']['map_url'], imageBounds);

            marker.addListener('click', function () {
                if (historicalOverlay.getMap()) {
                    historicalOverlay.setMap(null);
                } else {
                    historicalOverlay.setMap(map);
                }
            });

            miniMapMarkers[key] = marker;
        }
    }
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
  