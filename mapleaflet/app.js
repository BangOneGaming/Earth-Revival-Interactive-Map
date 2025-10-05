

let activeFilters = [];
let activeLocTypes = [];
let markers = [];
let jsonData = {};
let holdTimeout;
let map; // Declare map at a broader scope
let markerVisibility = {};
let activeMiniMapMarkers = []; // Array for storing active mini-map markers
let activeOverlays = [];
let activeMiniMapKey = null; // Variable for storing the active mini-map key


 

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
document.addEventListener("DOMContentLoaded", function () {
    const preloaderTexts = [
        "<span style='color: yellow;'>Upload Your Screenshot</span> and Show It on Our Map",
        "<span style='color: red;'>Report a Marker</span> If You Find a Wrong Marker",
        "<span style='color: orange;'>TIPS:</span> Share Your Marker, Let's Help Each Other",
        "<span style='color: orange;'>TIPS:</span> Use Mobile for a Better Experience",
        "For Problems or Suggestions, Contact <span style='color: orange;'><b>BangOne Gaming</b></span> on TikTok",
        "<span style='color: orange;'>TIPS:</span> Share Your Marker, Let's Help Each Other",
        "<span style='color: blue;'>Almost ready</span>, hang tight!"
    ];
    const imagesForTextThree = [
        "icons/icon_train.png",
        "icons/icon_treasure.png",
        "icons/icon_zone.png",
        "icons/icon_wood.png"
    ];

    const imagesForTextSix = [
        "icons/icon_train.png",
        "icons/icon_treasure.png",
        "icons/icon_zone.png",
        "icons/icon_wood.png"
    ];

    const textElement = document.getElementById("preloader-text");
    const dynamicImage = document.getElementById("dynamic-image");
    const loadingBar = document.getElementById("loading-bar");
    const loadingText = document.getElementById("loading-text");
    const mapElement = document.getElementById("map");

    if (!textElement || !loadingBar || !loadingText || !mapElement || !dynamicImage) {
        console.error("Elemen tidak ditemukan!");
        return;
    }
    const privacyPopup = document.getElementById("privacy-popup");
    const closePopupButton = privacyPopup.querySelector(".close-popup");

    // Show the privacy popup during the preload process
    setTimeout(() => {
        privacyPopup.style.display = "flex"; // Show the popup
    }, 3000); // Adjust the timing as needed (e.g., after 3 seconds)

    // Close the popup when the button is clicked
    closePopupButton.addEventListener("click", () => {
        privacyPopup.style.display = "none";
    });
    
    let totalProgress = 0;  // Total progress bar
    const totalMiniMapMarkers = Object.keys(mini_map_type).length; // Jumlah marker minimap
    let totalMiniMapImages = 0;
    let loadedMiniMapMarkers = 0;
    let loadedMiniMapImages = 0;
    let loadedBase64Images = 0;
    let totalBase64Images = 0;

    // Array untuk menyimpan marker minimap
    let activeMiniMapMarkers = [];
    let imageIndex = 0; // Menambahkan deklarasi imageIndex
    let imageInterval;   // Menambahkan deklarasi imageInterval

    function changeImageWithAnimation(newSrc) {
        // Hapus animasi sebelumnya dari gambar dinamis
        dynamicImage.classList.remove("bounce-in", "bounce-out");

        // Tambahkan animasi keluar (bounce out)
        dynamicImage.classList.add("bounce-out");

        // Tunggu hingga animasi keluar selesai (0.6 detik), lalu ganti gambar dan tambahkan animasi masuk
        setTimeout(() => {
            dynamicImage.src = newSrc;
            dynamicImage.classList.remove("bounce-out");
            dynamicImage.classList.add("bounce-in");

            // Jika gambar berasal dari array imagesForTextThree atau imagesForTextSix
            if (imagesForTextThree.includes(newSrc) || imagesForTextSix.includes(newSrc)) {
                dynamicImage.style.width = "60px";
                dynamicImage.style.height = "60px";
            } else {
                dynamicImage.style.width = "auto";
                dynamicImage.style.height = "auto";
            }

            // Atur opacity gambar dinamis agar terlihat setelah animasi selesai
            dynamicImage.style.opacity = 1;
        }, 600);
    }

    // Fungsi untuk mengganti gambar berdasarkan teks preloader
    function updateImageBasedOnText(text) {
        clearInterval(imageInterval); // Clear previous interval for changing images

        switch (text) {
            case preloaderTexts[0]:
                changeImageWithAnimation("icons/upload.png");
                break;
            case preloaderTexts[1]:
                changeImageWithAnimation("icons/report.png");
                break;
            case preloaderTexts[2]:
                // Bergantian gambar setiap 0.3 detik dengan animasi
                imageIndex = 0;
                imageInterval = setInterval(() => {
                    changeImageWithAnimation(imagesForTextThree[imageIndex]);
                    imageIndex = (imageIndex + 1) % imagesForTextThree.length;
                }, 300);
                break;
            case preloaderTexts[3]:
                changeImageWithAnimation("https://cdn.pixabay.com/animation/2022/11/30/19/48/19-48-34-65_512.gif");
                break;
            case preloaderTexts[4]:
                changeImageWithAnimation("icons/cheer.gif");
                break;
            case preloaderTexts[5]:
                // Bergantian gambar setiap 0.3 detik dengan animasi
                imageIndex = 0;
                imageInterval = setInterval(() => {
                    changeImageWithAnimation(imagesForTextSix[imageIndex]);
                    imageIndex = (imageIndex + 1) % imagesForTextSix.length;
                }, 300);
                break;
            default:
                changeImageWithAnimation("icons/icon_default.png");
                break;
        }
    }

    // Fungsi untuk mengubah teks preloader secara acak
    function changePreloaderText() {
        const randomIndex = Math.floor(Math.random() * (preloaderTexts.length - 1)); // Pilih acak, kecuali teks terakhir
        const selectedText = preloaderTexts[randomIndex];
        textElement.innerHTML = selectedText;
        updateImageBasedOnText(selectedText);
    }

    // Fungsi untuk menampilkan teks terakhir jika progress sudah hampir selesai
    function checkFinalText() {
        if (totalProgress >= 90) {
            textElement.innerHTML = preloaderTexts[preloaderTexts.length - 1];
            updateImageBasedOnText(preloaderTexts[preloaderTexts.length - 1]);
        }
    }

    // Mengupdate loading bar
    function updateLoadingBar() {
        loadingBar.style.width = totalProgress + "%";
        loadingText.textContent = `Loading... ${totalProgress}%`;  // Tampilkan progres dalam teks
    }

    // Pemuatan progress bar secara berkala
    const loadingProgressInterval = setInterval(() => {
        if (totalProgress < 100) {
            totalProgress += 1;  // Setiap interval, naikkan progres 1%
            updateLoadingBar();
            checkFinalText();  // Cek apakah harus menampilkan teks terakhir
        } else {
            clearInterval(loadingProgressInterval);
        }
    }, 700);

    // Ubah teks preloader secara acak setiap 3 detik
    const textChangeInterval = setInterval(changePreloaderText, 3000);


// Fungsi untuk preload base64 images
function preloadBase64Images() {
    return fetchBase64Images().then(() => {
        totalBase64Images = Object.keys(base64ImageCache).length;
        console.log('Total Base64 Images:', totalBase64Images);

        // Pastikan ada gambar untuk di-preload
        if (totalBase64Images > 0) {
            Object.values(base64ImageCache).forEach((image, index) => {
                const img = new Image();
                img.src = image;
                img.onload = () => {
                    loadedBase64Images++;
                    totalProgress = (loadedBase64Images / totalBase64Images) * 50; // 50% untuk base64 images
                    updateLoadingBar();
                };
                img.onerror = () => {
                    console.error(`Gagal memuat base64 image index ${index}`);
                };
            });
        } else {
            console.log("No base64 images to preload.");
        }
    }).catch(error => {
        console.error("Error during image preload:", error);
    });
}


    // Memuat marker minimap
function loadMiniMapMarkers() {
    let miniMapLoaded = 0;
    for (const key in mini_map_type) {
        if (mini_map_type.hasOwnProperty(key)) {
            const info = mini_map_type[key];
            
            // Periksa loc_position baik di main atau secondary
            const mainLoc = info.main ? info.main.loc_position : null;
            const secondaryLoc = info.secondary ? info.secondary.loc_position : null;
            
            // Tentukan loc_position yang valid
            const loc_position = mainLoc || secondaryLoc;
            
            if (loc_position && typeof loc_position === 'string' && loc_position.includes(',')) {
                const positionArray = loc_position.split(",");
                const marker = L.marker([parseFloat(positionArray[0]), parseFloat(positionArray[1])], {
                    icon: L.icon({
                        iconUrl: 'null',  // Menyembunyikan ikon sementara
                        iconSize: [1, 1]  // Marker kecil atau tidak terlihat
                    })
                });

                // Simpan marker di array tanpa menambahkannya ke peta
                activeMiniMapMarkers.push(marker);

                // Update progres setelah marker dimuat
                miniMapLoaded++;
                let miniMapProgress = (miniMapLoaded / totalMiniMapMarkers) * 50; // Setengah progres untuk marker
                loadedMiniMapMarkers = miniMapLoaded;  // Update jumlah marker yang dimuat
                totalProgress = miniMapProgress + (loadedMiniMapImages / totalMiniMapImages) * 50; // Gabungkan progres marker dan gambar
            } else {
                console.error('Invalid or missing loc_position for key:', key);
            }
        }
    }
}




// Memuat gambar minimap (termasuk secondary)
function loadMinimapImages() {
    for (const key in mini_map_type) {
        if (mini_map_type.hasOwnProperty(key)) {
            const mapData = mini_map_type[key];

            // Memuat gambar minimap utama
            const mainMapUrl = mapData.main.map_url;
            totalMiniMapImages++;

            const mainMinimapImage = new Image();
            mainMinimapImage.src = mainMapUrl;

            mainMinimapImage.onload = function () {
                loadedMiniMapImages++;
                let imageProgress = (loadedMiniMapImages / totalMiniMapImages) * 50;
                totalProgress = (loadedMiniMapMarkers / totalMiniMapMarkers) * 50 + imageProgress;
                updateLoadingBar();

                console.log(`Gambar minimap utama untuk ${key} berhasil dimuat.`);
            };

            mainMinimapImage.onerror = function () {
                console.error(`Gagal memuat gambar minimap utama untuk ${key}.`);
            };

            // Periksa dan muat gambar secondary jika ada
            if (Array.isArray(mapData.secondary)) {
                console.log(`Memuat gambar secondary untuk ${key}`);

                mapData.secondary.forEach((sec) => {
                    const secondaryMapUrl = sec.map_url;
                    totalMiniMapImages++;

                    const secondaryMinimapImage = new Image();
                    secondaryMinimapImage.src = secondaryMapUrl;

                    secondaryMinimapImage.onload = function () {
                        loadedMiniMapImages++;
                        let imageProgress = (loadedMiniMapImages / totalMiniMapImages) * 50;
                        totalProgress = (loadedMiniMapMarkers / totalMiniMapMarkers) * 50 + imageProgress;
                        updateLoadingBar();

                        console.log(`Gambar secondary minimap untuk ${key} - ${sec.key} berhasil dimuat.`);
                    };

                    secondaryMinimapImage.onerror = function () {
                        console.error(`Gagal memuat gambar secondary minimap untuk ${key} - ${sec.key}.`);
                    };
                });
            } else {
                console.log(`Tidak ada secondary minimap untuk ${key}`);
            }
        }
    }
}




    // Memulai pemuatan
    function initMiniMap() {
        loadMiniMapMarkers();  // Memuat marker minimap
        loadMinimapImages();   // Memuat gambar minimap
    }

    // Pastikan elemen minimap dan peta disembunyikan saat proses preload
    mapElement.classList.add('hidden');  // Sembunyikan peta saat preload

    // Memanggil preloadBase64Images terlebih dahulu
    preloadBase64Images()
        .then(() => {
            initMap(); // Initialize main map setelah base64 images selesai
            initMiniMap(); // Kemudian inisialisasi mini-map markers dan load gambar minimap
        });

    // Menyembunyikan preloader setelah loading selesai
    const hidePreloader = () => {
        loadingText.textContent = "Loading... 100%";
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none';

            // Tampilkan peta setelah preloader selesai
            setTimeout(() => {
                mapElement.classList.remove('hidden'); // Tampilkan peta dan minimap

                // Tampilkan marker setelah peta terlihat
                clearAllMarks(); 

                // Tampilkan pop-up setelah peta terlihat
                setTimeout(() => {
                    const popup = document.getElementById('patch-popup');
                    const closeBtn = document.querySelector('.popup .close');
                    popup.style.display = 'flex';

                    closeBtn.onclick = function() {
                        popup.style.display = 'none';
                    };

                    window.onclick = function(event) {
                        if (event.target === popup) {
                            popup.style.display = 'none';
                        }
                    };
                }, 1000);
            }, 0); // Delay 1 detik setelah preloader selesai
        }, 1000); // Delay 1 detik sebelum menutup preloader
    };

    // Memeriksa apakah progress bar sudah mencapai 100% sebelum menutup preloader
    const checkProgress = setInterval(() => {
        if (totalProgress >= 100) {
            clearInterval(checkProgress);
            loadingText.textContent = "Overall Progress: 100%";  // Menampilkan "Overall Progress: 100%"
            hidePreloader();
        }
    }, 100); // Memeriksa setiap 100ms hingga progress bar mencapai 100%
});


const base64ImageCache = {};
const usernameCache = {}; // Cache untuk menyimpan username

// Fungsi untuk mengambil dan memperbarui cache, baik secara global maupun terbatas
function fetchBase64Images(updatedId = null) { 
    return fetch('https://autumn-dream-8c07.square-spon.workers.dev/ER_Image')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch Base64 images from KV: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched data:', data);

            // Jika ID diperbarui, hanya perbarui cache untuk ID tersebut
            if (updatedId && data[updatedId]) {
                const item = data[updatedId];

                // Memperbarui cache hanya untuk ID yang sesuai
                if (item.image) {
                    base64ImageCache[updatedId] = item.image;
                    console.log(`Updated image for ${updatedId}: ${base64ImageCache[updatedId]}`);
                }

                if (item.username) {
                    usernameCache[updatedId] = item.username;
                    console.log(`Updated username for ${updatedId}: ${usernameCache[updatedId]}`);
                }
            } else {
                // Jika tidak ada ID yang ditentukan, perbarui seluruh cache
                for (const id in data) {
                    if (data.hasOwnProperty(id)) {
                        const item = data[id];

                        // Memperbarui seluruh cache
                        if (item.image) {
                            base64ImageCache[id] = item.image;
                            console.log(`Updated image for ${id}: ${base64ImageCache[id]}`);
                        }

                        if (item.username) {
                            usernameCache[id] = item.username;
                            console.log(`Updated username for ${id}: ${usernameCache[id]}`);
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error("Error fetching Base64 images:", error);
        });
}


const isTeleportMap = activeMiniMapKey === "hilde";

function addMarkersToMap() {
    markers = []; // Reset markers array

    for (const key in jsonData) {
        if (!jsonData.hasOwnProperty(key)) continue;

        const location = jsonData[key];

        if (!location.lat || !location.lng) {
            console.error(`Location ${key} is missing lat/lng.`);
            continue;
        }

        // --- parse index & floor secara aman dan anggap 0 sebagai "tidak ada" (null)
        const rawIndex = location.index;
        let markerIndex = (rawIndex !== undefined && rawIndex !== null && rawIndex !== '') ? parseInt(rawIndex) : null;
        if (isNaN(markerIndex) || markerIndex === 0) markerIndex = null;

        const rawFloor = location.floor || location.Floor || location.FLOOR || null;
        let markerFloor = (rawFloor !== undefined && rawFloor !== null && rawFloor !== '') ? parseInt(rawFloor) : null;
        if (isNaN(markerFloor) || markerFloor === 0) markerFloor = null;

        // === FILTER KHUSUS UNTUK HILDE ===
        if (activeMiniMapKey === 'hilde') {
            // Gunakan strict null-check untuk activeHildeSecondaryIndex
            if (activeHildeSecondaryIndex !== null) {
                // Saat teleport/overlay aktif, hanya tampilkan marker dengan index yang cocok
                // (markerIndex null = marker tanpa index → tidak tampil saat overlay aktif)
                if (markerIndex === null || markerIndex !== activeHildeSecondaryIndex) {
                    // debug
                    // console.log(`[SKIP] Not matching index. markerIndex: ${markerIndex}, active: ${activeHildeSecondaryIndex}, name: ${location.en_name}`);
                    continue;
                }

                // Jika marker punya floor (markerFloor != null), cocokkan juga
                if (markerFloor !== null && markerFloor !== activeFloorIndex) {
                    console.log(`[SKIP] Marker index ${markerIndex} floor mismatch: ${markerFloor} !== ${activeFloorIndex}`);
                    continue;
                }
            } else {
                // Saat teleport TIDAK aktif, hanya tampilkan marker tanpa index (markerIndex === null)
                if (markerIndex !== null) {
                    // marker punya index → sembunyikan saat tidak ada overlay aktif
                    // console.log(`[SKIP] Marker has index while no overlay active: ${markerIndex} - ${location.en_name}`);
                    continue;
                }
            }
        } else {
            // Untuk miniMap selain Hilde: tidak melakukan skip berdasarkan index=0 lagi,
            // karena 0 sudah diubah menjadi null. Jika ada kebijakan khusus untuk map lain,
            // ganti logika di sini sesuai kebutuhan.
            // (Jangan pakai: if (index === 0) continue; — itu yang menyebabkan skip)
        }

        // --- buat marker
        const latLng = [parseFloat(location.lat), parseFloat(location.lng)];
        const iconUrl = getIconUrl(location.category_id);
        const initialOpacity = loadMarkerOpacity(key) || 1.0;

        const marker = L.marker(latLng, {
            icon: L.icon({
                iconUrl: iconUrl,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
            opacity: initialOpacity,
        });

        marker.options.loc_type = location.loc_type || 'Unknown';
        marker.options.category = location.category_id || 'Unknown';
        marker.options.id = location.id || key;
        marker.options.en_name = location.en_name || 'Unknown';
        marker.options.ys_id = location.ys_id || 'Unknown';
        marker.options.image_info = location.image_info || base64ImageCache[key] || '';

        // Simpan hasil parsing (null atau number)
        marker.options.index = markerIndex;
        marker.options.floor = markerFloor;

        markers.push(marker);

        setupMarkerInteractions(marker, location, key);
        marker.addTo(map);

        const iconElement = marker._icon;
        if (iconElement) iconElement.classList.add('bounceIn');

        updateCategoryCounts(location.loc_type, location.category_id, initialOpacity);
    }

    calculateMaxCounts();
    hideMarkers();
    updateCategoryDisplay();
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
    const mapElement = document.getElementById("map");

    if (!mapElement) {
        console.error("Elemen #map tidak ditemukan!");
        return;
    }

    // Tampilkan elemen peta yang sebelumnya tersembunyi
    mapElement.classList.remove('hidden');

    // Mengatur batas peta
    const southWest = L.latLng(57, -89.4);
    const northEast = L.latLng(66, -67.40522460937501);
    const mapBounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        maxBounds: mapBounds,
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
    }).setView([parseFloat(center_position[0]), parseFloat(center_position[1])], 6);

    // Menambahkan tile layer
    const tileLayer = L.tileLayer('https://bangonegaming.polar-app.org/ER_Earth/statics/yuan_{z}_{x}_{y}.webp', {
        tileSize: 256,
        minZoom: 6,
        maxZoom: 11,
        noWrap: true,
        bounds: mapBounds,
        zoomFilter: function(coords, zoom) {
            if (zoom < 4 || zoom > 9) return false;
            const temp = xyDeny[`zoom_${zoom}`];
            return (temp[0] <= coords.x && coords.x <= temp[1]) &&
                   (temp[0] <= coords.y && coords.y <= temp[1]);
        },
        getTileUrl: function(coords) {
            return this.options.zoomFilter(coords, coords.z)
                ? `https://bangonegaming.polar-app.org/ER_Earth/statics/yuan_${coords.z}_${coords.x}_${coords.y}.webp`
                : '';
        }
    }).addTo(map);

    // Listener untuk pergeseran peta
    map.on('dragend', function() {
        const currentCenter = map.getCenter();
        const tileBounds = L.latLngBounds(southWest, northEast);
        if (!tileBounds.contains(currentCenter)) {
            map.setView(tileBounds.getCenter());
        }
    });

    // Tidak perlu fetchBase64Images lagi, gambar sudah di-cache
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched Data:', data);
            jsonData = data;
            addMarkersToMap(); // Tambahkan marker setelah cache terisi
            setupFilterListeners(); // Siapkan listener filter
            
        })
        .catch(error => console.error('Error during map initialization:', error));
}

// Function to show markers and update the current count based on opacity
function showMarkers() {
    markers.forEach(marker => {
        const locTypeMatch = activeLocTypes.length === 0 || activeLocTypes.includes(`loc_type${marker.options.loc_type}`);
        const categoryMatch = activeFilters.length === 0 || activeFilters.includes(marker.options.category.toString());

        // Display marker if it matches loc_type and category
        if (locTypeMatch && categoryMatch) {
            marker.addTo(map);
            // Update current count based on opacity of the marker
            if (marker.options.opacity === 0.5) {
                categoryCounts[marker.options.loc_type][getCategoryName(marker.options.category)].current++;
            }
        } else {
            map.removeLayer(marker);
            // Decrease current count if opacity is 0.5
            if (marker.options.opacity === 0.5) {
                categoryCounts[marker.options.loc_type][getCategoryName(marker.options.category)].current--;
            }
        }
    });

    // Update category display after marker changes
    updateCategoryDisplay(currentLocType);
}
// Function to map categoryId to category name

function getCategoryName(categoryId) {
    switch (categoryId) {
        case "1": return "teleport"; // Atur nama kategori untuk ID 1
        case "29": return "bird"; // Atur nama kategori untuk ID 1
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


// Function to change marker opacity and update current count accordingly
function changeMarkerOpacity(markerId, newOpacity) {
    const marker = findMarkerById(markerId);

    if (marker) {
        const oldOpacity = marker.options.opacity; // Save old opacity
        marker.setOpacity(newOpacity); // Change marker opacity

        // Update counts based on old and new opacity
        if (oldOpacity === 0.5 && newOpacity === 1.0) {
            // Decrease current count for 0.5 opacity -> 1.0
            categoryCounts[marker.options.loc_type][getCategoryName(marker.options.category)].current--;
        } else if (oldOpacity === 1.0 && newOpacity === 0.5) {
            // Increase current count for 1.0 opacity -> 0.5
            categoryCounts[marker.options.loc_type][getCategoryName(marker.options.category)].current++;
        }

        // Update display
        updateCategoryDisplay(marker.options.loc_type);
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

// Function to update the category display after the current count changes
function updateCategoryDisplay(locType) {
    if (!locType) return;

    // Loop through active categories and update the display
    for (const category in categoryCounts[locType]) {
        const element = document.querySelector(`#count-${category}-loc${locType} .count-text`);
        if (element) {
            const { max, current } = categoryCounts[locType][category];
            element.innerHTML = `${current}/${max}`; // Update only the count text
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

document.getElementById("markerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const statusMessage = document.getElementById("statusMessage");
    statusMessage.style.display = "block";
    statusMessage.textContent = "Submitting marker...";

    setTimeout(() => {
        statusMessage.style.display = "none";
    }, 7000);

    // Ambil data form
    const markerIdInput = document.getElementById("markerId").value.trim();
    const nameMark = document.getElementById("nameMark").value;
    const category = document.getElementById("category").value;
    const locType = document.getElementById("locType").value;
    const description = document.getElementById("description").value;
    const ysId = document.getElementById("ysId").value;
const hildeIndex = document.getElementById("hildeIndex").value;
const hildeFloor = document.getElementById("hildeFloor").value;
    const yCoord = document.getElementById("yCoordinates").value;
    const zCoord = document.getElementById("zCoordinates").value;

    // Koordinat menggunakan savedLat dan savedLng
const lat = savedLat ? savedLat.toString() : '[]';  // Jika savedLat tidak ada, gunakan fallback []
const lng = savedLng ? savedLng.toString() : '[]';  // Jika savedLng tidak ada, gunakan fallback []


    // Ambil input tambahan
    const oldWorldTreasureInput = document.getElementById("oldWorldTreasureInput").value;
    const ingredientsNameInput = document.getElementById("ingredientsNameInput").value;

    // Kombinasi deskripsi
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

        // Gunakan ID dari input atau buat ID baru jika input kosong
        const existingIds = Object.keys(existingData).map(Number);
        const newId = markerIdInput || (Math.max(...existingIds, 0) + 1).toString();
        // Construct the new entry
const newEntry = {
    [newId]: {
        id: newId,
        ys_id: ysId.trim() || "0",
        name: nameMark.trim(),
        en_name: nameMark.trim(),
        category_id: category,
        lat: savedLat.toString(),
        lng: savedLng.toString(),
        redirect_params: "0",
        first_member_id: "0",
        challenge_id: "0",
        desc: finalDescription,
        links_info: "[]",
        bili_info: "[]",
        loc_type: locType,
        images_info: imageBase64
            ? `[{"link": "${imageBase64}", "uid": "0", "username": "User"}]`
            : "[]",

        // ✅ Tambahan untuk loc_type === 10
        index: locType === "10" ? parseInt(hildeIndex || "0") : undefined,
        floor: locType === "10" ? parseInt(hildeFloor || "0") : undefined,
    }
};
        console.log("Data yang akan dikirim ke endpoint:", JSON.stringify(newEntry, null, 2));

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

        // Reset form setelah berhasil submit
        document.getElementById("markerForm").reset();

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
                { value: "29", text: "Bird", icon_url: "" },
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
                { value: "29", text: "Bird", icon_url: "" },
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
                { value: "29", text: "Bird", icon_url: "" },
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
                { value: "29", text: "Bird", icon_url: "" },
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
                { value: "29", text: "Bird", icon_url: "" },
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
        case '7':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "29", text: "Bird", icon_url: "" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "27", text: "Old World Treasure", icon_url: "icons/default.png" },
            ];
            break;
        case '8':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "29", text: "Bird", icon_url: "" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "27", text: "Old World Treasure", icon_url: "icons/default.png" },
            ];
            break;
        case '9':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "29", text: "Bird", icon_url: "" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "27", text: "Old World Treasure", icon_url: "icons/default.png" },
            ];
            break;
        case '10':
            categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "29", text: "Bird", icon_url: "" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "27", text: "Old World Treasure", icon_url: "icons/default.png" },
            ];
            break;

 default:
    categoryOptions = [
                { value: "1", text: "Teleport", icon_url: "icons/icon_teleport.png" },
                { value: "2", text: "Treasure Hunt", icon_url: "icons/icon_treasure.png" },
                { value: "3", text: "Zone Commission", icon_url: "icons/icon_zone.png" },
                { value: "7", text: "Limited Time Training", icon_url: "icons/icon_train.png" },
                { value: "8", text: "Scenery", icon_url: "icons/icon_scenery.png" },
                { value: "27", text: "Old World Treasure", icon_url: "icons/default.png" },

    ];
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

    console.log("Category:", category);
    console.log("LocType:", locType);

    if (category && locType) {
        const categoryName = categoryNames[category];
        const locTypeName = locTypeNames[locType];

        console.log("Category Name:", categoryName);
        console.log("LocType Name:", locTypeName);

        if (categoryName && locTypeName) {
            document.getElementById("nameMark").value = `${categoryName} - ${locTypeName}`;
            document.getElementById("nameMark").style.display = "block";
        } else {
            console.error("Category Name or LocType Name is undefined.");
            document.getElementById("nameMark").style.display = "none";
        }
    } else {
        document.getElementById("nameMark").style.display = "none";
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
        "6": "Kepler Harbour", 
        "7": "Mirror World Sundale Valley", 
        "8": "Mirror World Howling Gobi", 
        "9": "Mirror World Edengate"
    };

const categoryMap = {
    "1": "Teleport",
    "29": "Bird",
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

// Periksa jika ada image_info atau base64ImageCache untuk menampilkan gambar
const base64Image = base64ImageCache[key] || ''; // Ambil base64 dari cache
const imageLink = location.image_info || base64Image; // Gunakan image_info atau base64 sebagai fallback
const username = usernameCache[key] || ''; // Ambil username dari cache

// Jika imageLink ada (baik URL atau base64), buat konten gambar dan tombol Show Image
if (imageLink) {
    imageInfoContent = `
        <div class="popup-image-container" style="position: relative; width: 100%; height: auto;">
            <img src="${imageLink}" alt="Image" class="popup-image-info" 
                 onclick="showFullImagePreview('${imageLink}')"
                 style="width: 100%; height: auto; border-radius: 4px; cursor: pointer; display: none; pointer-events: all;">
            ${username ? `
                <div class="image-username-overlay" style="
                    position: absolute;
                    display: none;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    color: #fff;
                    text-align: center;
                    padding: 3px 0;
                    font-size: 12px;
                    font-weight: bold;
                    border-bottom-left-radius: 4px;
                    border-bottom-right-radius: 4px;
                ">
                    From: ${username}
                </div>
            ` : ''}
        </div>
    `;
    showImageButton = `
        <button class="showImageButton" onclick="toggleImageVisibility(this, event)" 
                style="background: none; border: none; color: #007bff; font-size: 14px; cursor: pointer; pointer-events: auto;">
            Show Image
        </button>
    `;


    } else if (location.images_info && location.images_info !== "0" && location.images_info !== "[]") {
        // Jika images_info berisi URL gambar
        try {
            const parsedImagesInfo = JSON.parse(location.images_info);
            if (Array.isArray(parsedImagesInfo) && parsedImagesInfo.length > 0 && parsedImagesInfo[0].link) {
                const imageUrl = parsedImagesInfo[0].link.startsWith('//') ? `https:${parsedImagesInfo[0].link}` : parsedImagesInfo[0].link;
                imageInfoContent = `
                    <div class="popup-image-container" style="position: relative; width: 100%; height: auto;">
                        <img src="${imageUrl}" alt="Image Info" class="popup-image-info" 
                             onclick="showFullImagePreview('${imageUrl}')" 
                             style="width: 100%; height: auto; border-radius: 4px; display: none; cursor: pointer; pointer-events: all;">
                    </div>
                `;
                showImageButton = `
                    <button class="showImageButton" onclick="toggleImageVisibility(this, event)" 
                            style="background: none; border: none; color: #007bff; font-size: 14px; cursor: pointer; pointer-events: auto;">
                        Show Image
                    </button>
                `;
                console.log("Show Image button added for imageUrl:", imageUrl); // Log jika tombol Show Image ditambahkan
            }
        } catch (error) {
            console.warn("Error parsing images_info JSON:", error);
        }
    }

    const showYsId = location.ys_id && location.ys_id !== "0";

    // Buat konten popup untuk marker
    const createPopupContent = () => {
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
                
                ${imageInfoContent} <!-- Gambar dan tombol Show Image ditambahkan di sini -->
                ${showImageButton} <!-- Tombol Show Image ditambahkan di sini -->

                ${showYsId ? `<p class="popup-ys-id"> Contribution By: ${location.ys_id}</p>` : ''}
                <button class="reportButton" data-id="${key}" style="background: none; border: none; color: red; font-size: 12px; cursor: pointer; pointer-events: auto;">Report</button>
                ${!imageInfoContent ? `<button class="uploadImageButton" onclick="openImageFormPopup('${key}')" style="background: none; border: none; color: #FFD700; font-size: 12px; cursor: pointer; pointer-events: auto;"><b>Upload Screenshot Location</b></button>` : ''}
            </div>
        `;
    }

    // Menambahkan konten popup ke marker
    marker.bindPopup(createPopupContent(), { offset: L.point(0, -20) });




// Event to show equator lines and center icon when popup is opened
marker.on('popupopen', () => {
    // DEBUG FLOOR INFO
    console.log('[DEBUG POPUP] Marker ID:', marker.options.id);
    console.log('[DEBUG POPUP] Marker name:', marker.options.en_name);
    console.log('[DEBUG POPUP] Marker index:', marker.options.index);
    console.log('[DEBUG POPUP] Marker floor:', marker.options.floor);

    // Pastikan hanya elemen yang relevan yang dimodifikasi
    const newFiltersContainer = document.querySelector('.toggle-new-filters-container');
    if (newFiltersContainer) {
        newFiltersContainer.classList.remove('hover');
    } else {
        console.warn("Element '.toggle-new-filters-container' not found!");
    }

    showEquatorLines(marker);
    marker.setZIndexOffset(1000);

    const latlng = marker.getLatLng();
    const offsetLat = latlng.lat + 0.200;
    marker._map.setView([offsetLat, latlng.lng], marker._map.getZoom(), { animate: true });
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
            const steps = [
                {
                    element: document.querySelector('.copyButton'),
                    intro: `
                        <div>
                            Copy Coordinates and Paste in the Game
                            <br/>
                            <img src="icons/hi.png" alt="Copy Icon" style="width: 80px; height: auto;">
                        </div>`,
                    tooltipClass: 'custom-tooltip',
                    highlightClass: 'custom-highlight-copycoordinates'
                },
                {
                    element: document.querySelector('.reportButton'),
                    intro: `
                        <div>
                            Report if the Marker is Incorrect
                            <br/>
                            <img src="icons/bangone.png" alt="Report Icon" style="width: 80px; height: auto;">
                        </div>`,
                    tooltipClass: 'custom-tooltip',
                    highlightClass: 'custom-highlight'
                }
            ];

            if (document.querySelector('.showImageButton')) {
                steps.push({
                    element: document.querySelector('.showImageButton'),
                    intro: `
                        <div>
                            View Location Images
                            <br/>
                            <img src="icons/wow.png" alt="Show Image Icon" style="width: 80px; height: auto;">
                        </div>`,
                    tooltipClass: 'custom-tooltip',
                    highlightClass: 'custom-highlight'
                });
            }

            if (document.querySelector('.uploadImageButton')) {
                steps.push({
                    element: document.querySelector('.uploadImageButton'),
                    intro: `
                        <div>
                            Submit the Location with a Screenshot
                            <br/>
                            <img src="icons/sombong.png" alt="Upload Icon" style="width: 80px; height: auto;">
                        </div>`,
                    tooltipClass: 'custom-tooltip',
                    highlightClass: 'custom-highlight'
                });
            }

steps.push({
    element: marker.getElement(),
    intro: `
        <div>
            Right-click or Hold to Change Marker Opacity
            <br/>
            <img id="animatedOpacityIcon" src="icons/icon_default.png" alt="Opacity Icon" style="width: 50px; height: auto; opacity: 1; transition: opacity 0.5s ease;">
        </div>`,
    tooltipClass: 'custom-tooltip',
    highlightClass: 'custom-highlight'
});


            introJs().setOptions({
                steps: steps,
                overlayOpacity: 0.85,
                disableInteraction: true,
                exitOnOverlayClick: false,
                tooltipPosition: 'auto',
                highlightClass: 'custom-highlight',
                tooltipClass: 'custom-tooltip',
                nextLabel: 'Next',
                prevLabel: 'Prev',
                skipLabel: '❌',
                doneLabel: 'Done',
                scrollToElement: true,
                scrollPadding: 30
            }).start();

        }, 1000);

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
    // Membuat modal
    const modal = document.createElement('div');
    modal.classList.add('image-modal');

    // Menambahkan konten modal
    modal.innerHTML = `
        <div class="image-modal-content" onclick="event.stopPropagation()">
            <span class="image-modal-close" onclick="closeImagePreview(event)">&times;</span>
            <!-- Pastikan untuk menggunakan imageUrl langsung, apakah URL atau base64 -->
            <img src="${imageUrl}" alt="Full Preview Image" class="image-modal-img">
        </div>
    `;

    // Menambahkan modal ke dalam body
    document.body.appendChild(modal);

    // Menutup modal saat klik di luar gambar
    modal.addEventListener('click', closeImagePreview);
}

// Fungsi untuk menutup modal
function closeImagePreview(event) {
    event.stopPropagation();  // Mencegah event bubble
    const modal = event.target.closest('.image-modal');
    if (modal) {
        modal.remove();  // Menghapus modal dari DOM
    }
}

let existingDataCache = {}; // Inisialisasi sebagai objek kosong

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

                <div id="PreviewContainer" class="preview-container" style="display:none;"></div>

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

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        dropArea.addEventListener('click', () => {
            imageUploadInput.click();
        });

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

    // Cek cache sebelum melakukan GET request
    console.log("Checking existingDataCache:", existingDataCache);

    if (Object.keys(existingDataCache).length === 0) {
        console.log("Cache is empty, fetching data...");

        fetch("https://autumn-dream-8c07.square-spon.workers.dev/ER_Image", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            console.log("Fetch response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Fetched data:", data);
            existingDataCache = data || {}; // Pastikan data selalu objek
            console.log("Data cached successfully:", existingDataCache);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
    } else {
        console.log("Using cached data:", existingDataCache);
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
    const file = input.files[0] || input;  // Ambil file, baik dari input atau drag-and-drop
    const PreviewContainer = document.getElementById("PreviewContainer");
    const dropArea = document.getElementById("dropArea");

    if (file) {
        console.log("File selected:", file);

        // Hapus preview sebelumnya
        PreviewContainer.innerHTML = '';
        console.log("Cleared previous preview");

        // Pastikan file adalah gambar
        if (!file.type.startsWith('image/')) {
            console.log("Invalid file type:", file.type);
            alert("Please upload a valid image file.");
            return;
        }

        // Buat objek gambar untuk memuat file yang dipilih
        const img = new Image();
        const reader = new FileReader();

        reader.onload = function(e) {
            console.log("FileReader loaded the image");

            // Buat elemen gambar dari hasil FileReader
            img.src = e.target.result;
        };

        reader.readAsDataURL(file); // Baca file sebagai base64

        img.onload = function() {
            console.log("Image loaded successfully");

            // Resize gambar menggunakan canvas
            const MAX_WIDTH = 800; // Lebar maksimum
            const MAX_HEIGHT = 600; // Tinggi maksimum

            let width = img.width;
            let height = img.height;

            // Hitung dimensi baru sambil mempertahankan rasio aspek
            if (width > MAX_WIDTH) {
                height = Math.round(height * MAX_WIDTH / width);
                width = MAX_WIDTH;
            }

            if (height > MAX_HEIGHT) {
                width = Math.round(width * MAX_HEIGHT / height);
                height = MAX_HEIGHT;
            }

            // Buat canvas untuk menggambar gambar yang sudah diresize
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = width;
            canvas.height = height;

            // Gambar gambar pada canvas dengan dimensi baru
            ctx.drawImage(img, 0, 0, width, height);

            // Mengubah format gambar menjadi JPEG dan mengurangi kualitas
            const resizedImageBase64 = canvas.toDataURL('image/jpeg', 0.7); // Kualitas 70%

            // Cek ukuran file setelah kompresi
            const byteSize = resizedImageBase64.length * (3 / 4); // Menghitung ukuran dalam byte
            const maxSizeInBytes = 2 * 1024 * 1024; // Batas 2 MB

            console.log(`Original Image Size: ${(file.size / 1024).toFixed(2)} KB`);
            console.log(`Compressed Image Size: ${(byteSize / 1024).toFixed(2)} KB`);

            // Jika ukuran file terlalu besar setelah kompresi, tampilkan peringatan
            if (byteSize > maxSizeInBytes) {
                alert("Gambar terlalu besar setelah kompresi. Harap pilih gambar dengan ukuran lebih kecil.");
                return;
            }

            // Buat elemen img untuk menampilkan preview gambar yang sudah diresize
            const imgElement = document.createElement("img");
            imgElement.src = resizedImageBase64;
            imgElement.classList.add("image-preview");

            // Tambahkan gambar ke kontainer preview
            PreviewContainer.appendChild(imgElement);
            console.log("Appended resized image preview to container");

            // Simpan gambar base64 yang sudah diresize untuk pengiriman
            input.setAttribute("data-base64", resizedImageBase64);
            console.log("Saved resized base64 data to input");

            // Tampilkan kontainer preview
            PreviewContainer.style.display = "block";
            console.log("Preview container displayed");

            // Sembunyikan drop area setelah gambar diunggah
            if (dropArea) {
                dropArea.style.display = "none";
                console.log("Drop area hidden");
            }
        };

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



function handleSubmit(markerId, username, base64String) {
    if (base64String && username) {
        const submittingMessage = document.createElement("div");
        submittingMessage.id = "submittingMessage";
        submittingMessage.innerHTML = `
            <h4>Submitting...</h4>
            <p>It may take a While</p>
            <p>Please be patient...</p>
        `;
        submittingMessage.style.position = "fixed";
        submittingMessage.style.top = "50%";
        submittingMessage.style.left = "50%";
        submittingMessage.style.transform = "translate(-50%, -50%)";
        submittingMessage.style.padding = "20px";
        submittingMessage.style.backgroundColor = "rgba(19, 39, 96, 0.613)";
        submittingMessage.style.border = "2px solid #889dcb";
        submittingMessage.style.color = "#fff";
        submittingMessage.style.fontSize = "18px";
        submittingMessage.style.textAlign = "center";
        submittingMessage.style.borderRadius = "10px";
        submittingMessage.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
        submittingMessage.style.zIndex = "10000";

        document.body.appendChild(submittingMessage);
        closePopup();

        const PreviewContainer = document.getElementById("PreviewContainer");
        if (PreviewContainer && base64String) {
            const imgElement = document.createElement("img");
            imgElement.src = base64String;
            imgElement.classList.add("image-preview");
            PreviewContainer.innerHTML = '';
            PreviewContainer.appendChild(imgElement);
            PreviewContainer.style.display = "block";
        }

        const existingData = existingDataCache || {};

        const newMarkerData = {
            id: markerId,
            username: username,
            image: base64String
        };

        existingData[markerId] = newMarkerData;

        fetch("https://autumn-dream-8c07.square-spon.workers.dev/ER_Image", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(existingData)
        })
        .then(response => {
            if (response.ok) {
                existingDataCache = existingData; // Perbarui cache setelah PUT request berhasil
                updateMarkerInfo(markerId);
                alert("THANKS FOR SUBMITTING YOUR SCREENSHOT");
            } else {
                alert("Failed to upload image.");
                console.error("Failed response:", response);
            }
        })
        .catch(error => {
            console.error("Error uploading image:", error);
            alert("Error uploading image. Try Again Later");
        })
        .finally(() => {
            const submittingMessage = document.getElementById("submittingMessage");
            if (submittingMessage) {
                submittingMessage.remove();
            }
        });
    } else {
        alert("Please complete all fields.");
        console.warn("Missing data - Username:", username, "Base64:", base64String);
    }
}


// Fungsi untuk mendapatkan marker berdasarkan ID
function getMarkerById(markerId) {
    // Menggunakan array markers yang sudah ada
    return markers.find(marker => marker.options.id === markerId);
}



function updateMarkerInfo(markerId) {
    // Pertama, perbarui cache base64 untuk ID yang sesuai
    fetchBase64Images(markerId) // Mengupdate cache hanya untuk marker yang sedang diperbarui
        .then(() => {
            // Setelah cache diperbarui, lanjutkan dengan pemrosesan marker
            fetch(`https://autumn-dream-8c07.square-spon.workers.dev/earthrevivalinteractivemaps`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(data => {
                const markerData = data[markerId];
                if (markerData) {
                    // Ambil data yang diperlukan
                    const { en_name, desc, links_info, ys_id, images_info } = markerData;

                    // Cari marker di peta berdasarkan ID
                    const marker = getMarkerById(markerId);
                    if (marker) {
                        // Periksa jika ada image_info atau base64ImageCache untuk menampilkan gambar
                        const base64Image = base64ImageCache[markerId] || ''; // Ambil base64 dari cache
                        const imageLink = images_info && images_info.length > 0 ? images_info[0].link.replace(/\\/g, '') : base64Image; // Gunakan image_info atau base64 sebagai fallback

                        // Jika imageLink ada, buat konten gambar dan tombol Show Image
                        let imageInfoContent = '';
                        let showImageButton = '';
                        if (imageLink) {
                            imageInfoContent = `
                                <div class="popup-image-container" style="position: relative; width: 100%; height: auto;">
                                    <img src="${imageLink}" alt="Image" class="popup-image-info" 
                                         onclick="showFullImagePreview('${imageLink}')"
                                         style="width: 100%; height: auto; border-radius: 4px; cursor: pointer; display: block; pointer-events: all;">
                                </div>
                            `;
                            showImageButton = `
                                <button class="showImageButton" onclick="toggleImageVisibility(this, event)" 
                                        style="background: none; border: none; color: #007bff; font-size: 14px; cursor: pointer; pointer-events: auto;">
                                    Hide Image
                                </button>
                            `;
                        }

                        // Buat konten popup untuk marker
                        const createPopupContent = () => {
                            return `
                                <div class="leaflet-popup-content" style="z-index: 9999;">
                                    <h4 class="popup-title">${en_name}</h4>
                                    <p class="popup-description">
                                        ${(desc || 'No description available.').replace(/\n/g, '<br>')}
                                    </p>

                                    ${links_info && links_info !== '[]' ? `
                                        <p><strong>Links:</strong> <a href="${links_info}" target="_blank">${links_info}</a></p>
                                    ` : ''}

                                    ${imageInfoContent} <!-- Gambar dan tombol Show Image ditambahkan di sini -->
                                    ${showImageButton} <!-- Tombol Show Image ditambahkan di sini -->

                                    ${ys_id && ys_id !== "0" ? `<p class="popup-ys-id">YS ID: ${ys_id}</p>` : ''}

                                    <button class="reportButton" data-id="${markerId}" style="background: none; border: none; color: red; font-size: 12px; cursor: pointer; pointer-events: auto;">
                                        Report
                                    </button>
                                </div>
                            `;
                        };

                        // Update konten popup dengan informasi terbaru
                        marker.setPopupContent(createPopupContent());

                        // Refresh marker dengan menutup dan membuka popup untuk update
                        marker.closePopup(); // Tutup popup jika sudah terbuka
                        marker.openPopup();  // Buka popup kembali untuk memperbarui informasi yang ditampilkan
                    } else {
                        console.warn(`Marker dengan ID ${markerId} tidak ditemukan di peta.`);
                    }
                } else {
                    console.warn(`Data tidak ditemukan untuk marker ID ${markerId} di /earthrevivalinteractivemaps.`);
                }
            })
            .catch(error => {
                console.error("Error memperbarui informasi marker:", error);
                alert("Gagal memperbarui informasi marker.");
            });
        });
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
        centerIcon.style.zIndex = '500';

        const horizontalLineLeft = document.createElement('div');
        horizontalLineLeft.className = 'equator-line horizontal left';
        horizontalLineLeft.style.zIndex = '500';

        const horizontalLineRight = document.createElement('div');
        horizontalLineRight.className = 'equator-line horizontal right';
        horizontalLineRight.style.zIndex = '500';

        const verticalLineTop = document.createElement('div');
        verticalLineTop.className = 'equator-line vertical top';
        verticalLineTop.style.zIndex = '500';

        const verticalLineBottom = document.createElement('div');
        verticalLineBottom.className = 'equator-line vertical bottom';
        verticalLineBottom.style.zIndex = '500';

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
            horizontalLineLeft.style.height = '1px';
            horizontalLineLeft.style.backgroundColor = '#ffffff';

            // Posisi garis horizontal kanan
            horizontalLineRight.style.position = 'absolute';
            horizontalLineRight.style.left = `${point.x + 50}px`;
            horizontalLineRight.style.top = `${point.y - 15 - 50 + 10 + 40}px`;
            horizontalLineRight.style.width = `${window.innerWidth - point.x - 50}px`;
            horizontalLineRight.style.height = '1px';
            horizontalLineRight.style.backgroundColor = '#ffffff';

            // Posisi garis vertikal atas
            verticalLineTop.style.position = 'absolute';
            verticalLineTop.style.left = `${point.x}px`;
            verticalLineTop.style.top = `-${30}px`;
            verticalLineTop.style.width = '1px';
            verticalLineTop.style.height = `${point.y - 50}px`;
            verticalLineTop.style.backgroundColor = '#ffffff';

            // Posisi garis vertikal bawah
            verticalLineBottom.style.position = 'absolute';
            verticalLineBottom.style.left = `${point.x}px`;
            verticalLineBottom.style.top = `${point.y + 30}px`;
            verticalLineBottom.style.width = '1px';
            verticalLineBottom.style.height = `${window.innerHeight - point.y - 50}px`;
            verticalLineBottom.style.backgroundColor = '#ffffff';
        };

        // Posisi garis ekuator saat pertama kali dibuka
        updateEquatorLinesPosition();

        // Update posisi setiap kali peta dipindahkan atau di-zoom
        marker._map.on('move', updateEquatorLinesPosition);
        marker._map.on('zoom', updateEquatorLinesPosition);
    }
}


// Fungsi JavaScript untuk toggle visibilitas gambar dan username overlay
function toggleImageVisibility(button, event) {
    const imageContainer = button.previousElementSibling;
    const imageElement = imageContainer.querySelector('img');
    const usernameOverlay = imageContainer.querySelector('.image-username-overlay');

    if (imageElement) {
        const currentDisplay = imageElement.style.display;
        if (currentDisplay === 'none') {
            // Tampilkan gambar dan username overlay
            imageElement.style.display = 'block';
            if (usernameOverlay) {
                usernameOverlay.style.display = 'block';
            }
            button.textContent = 'Hide Image'; // Ganti teks tombol
        } else {
            // Sembunyikan gambar dan username overlay
            imageElement.style.display = 'none';
            if (usernameOverlay) {
                usernameOverlay.style.display = 'none';
            }
            button.textContent = 'Show Image'; // Ganti teks tombol
        }
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
   
    // Assume jsonData is loaded here
    addMarkersToMap(jsonData); // Call this with your actual jsonData
});

// Function to get category from marker
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
    if (iconUrl.includes('icon_scrap.png')) return 'scrap';
    if (iconUrl.includes('icon_stone.png')) return 'material';
    if (iconUrl.includes('icon_wood.png')) return 'material';
    if (iconUrl.includes('icon_fiber.png')) return 'material';

    return 'default'; // Gunakan kategori default
}

// Function to get icon URL based on category ID
function getIconUrl(categoryId) {
    const iconMap = {
        "1": "icons/icon_teleport.png", // Teleport
        "2": "icons/icon_treasure.png", // Old World Treasure
        "3": "icons/icon_zone.png", // Zone
        "6": "icons/icon_scrap.png", // Scrap
        "7": "icons/icon_train.png", // Training
        "8": "icons/icon_scenery.png", // Scenery
        "9": "icons/rare_fishing.png", // Rare Fishing
        "10": "icons/rare_fishing.png", // Rare Fishing
        "11": "icons/rare_fishing.png", // Rare Fishing
        "12": "icons/rare_fishing.png", // Rare Fishing
        "13": "icons/rare_fishing.png", // Rare Fishing
        "14": "icons/rare_fishing.png", // Rare Fishing
        "15": "icons/icon_stone.png", // Stone
        "16": "icons/icon_wood.png", // Wood
        "17": "icons/icon_fiber.png", // Fiber
        "18": "icons/icon_resource.png", // Resource
        "19": "icons/icon_scrap.png", // Scrap
        "20": "icons/icon_scrap.png", // Scrap
        "23": "icons/icon_rarewood.png", // Rare Item
        "24": "icons/icon_rarestone.png", // Rare Stone
        "25": "icons/icon_rarewastes.png", // Rare Wastes
        "26": "icons/icon_rarewood.png" // Rare Wood
    };

    // Gunakan icon default jika categoryId tidak ditemukan
    return iconMap[categoryId] || "icons/icon_default.png";
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

    clearMiniMapMarkers();

    const relevantMarkers = mini_map_type[miniMapKey].markers || [];

    if (!Array.isArray(relevantMarkers)) {
        console.error('Relevant markers is not an array:', relevantMarkers);
        return;
    }

    relevantMarkers.forEach(markerData => {
        // Jika loc_type10 dan map hilde, skip marker yang punya properti 'index'
        if (
            miniMapKey === "hilde" &&
            activeLocTypes.includes('loc_type10') &&
            'index' in markerData
        ) {
            console.log(`SKIP marker with index at lat: ${markerData.lat}, lng: ${markerData.lng}, index: ${markerData.index}`);
            return;
        }

        const latLng = [parseFloat(markerData.lat), parseFloat(markerData.lng)];
        const marker = L.marker(latLng, {
            icon: L.icon({
                iconUrl: 'icons/here.png',
                iconSize: [50, 50]
            }),
            options: {
                category: markerData.category_id,
                loc_type: miniMapKey
            }
        });

        marker.addTo(map);
        activeMiniMapMarkers.push(marker);

        updateCategoryCounts(marker.options.loc_type, marker.options.category, 0.5);
    });
}



// MiniMap Config
const miniMapConfig = {
    'loc_type2': { miniMapKey: 'djhg', name: 'Sundale Valley', zoomLevel: 7 },
    'loc_type5': { miniMapKey: 'jjgb', name: 'Howling Gobi', zoomLevel: 7 },
    'loc_type4': { miniMapKey: 'ydc', name: 'Edengate', zoomLevel: 7 },
    'loc_type3': { miniMapKey: 'lgxs', name: 'Ragon Snowy Peak', zoomLevel: 7 },
    'loc_type6': { miniMapKey: 'kplg', name: 'Kepler Harbour', zoomLevel: 7 },
    'loc_type7': { miniMapKey: 'sundale', name: 'Sundale Haven', zoomLevel: 9 },
    'loc_type8': { miniMapKey: 'howlingoasis', name: 'Howling Oasis', zoomLevel: 9 },
    'loc_type9': { miniMapKey: 'edengate', name: 'Edengate Starlit Avenue', zoomLevel: 9 },
    'loc_type10': { miniMapKey: 'hilde', name: 'Hilde', zoomLevel: 7 } // Baru ditambahkan
};


// Store start times for each minimap
// Store start times for each minimap
let startTime = null;
let timeSpent = 0;

// Function to track events using Google Analytics
function trackEvent(category, label, value) {
    gtag('event', 'filter_clicked', {
        'event_category': category,
        'event_label': label,
        'value': value
    });
    console.log('Event tracked:', { category, label, value });
}

// Function to track page view and duration
function trackPageView(miniMapInfo) {
    // Calculate and send the time spent on the previous minimap
    if (startTime !== null) {
        timeSpent = Math.floor((new Date() - startTime) / 1000); // Duration in seconds
        console.log(`User spent ${timeSpent} seconds on ${miniMapInfo.name}`);
        
        // Send event to Google Analytics
        gtag('event', 'page_view', {
            'page_title': miniMapInfo.name,
            'page_location': window.location.href,
            'page_path': `/minimap/${miniMapInfo.miniMapKey}`,
            'duration': timeSpent
        });
    }

    // Start the timer for the new minimap
    startTime = new Date();
    console.log('Page view tracked:', {
        title: miniMapInfo.name,
        location: window.location.href,
        path: `/minimap/${miniMapInfo.miniMapKey}`
    });
}
let secondaryOverlayGroup = [];
let showSecondary = false;
let teleportButtonOverlays = [];
let activeHildeSecondaryIndex = null; // Simpan index yang sedang ditampilkan
let mainOverlayHilde = null; // Referensi overlay utama Hilde

function updateMiniMap(filterKey) {
  const { miniMapKey, zoomLevel = 7 } = miniMapConfig[filterKey] || {};
  if (!miniMapKey || !mini_map_type.hasOwnProperty(miniMapKey)) return;

  if (activeMiniMapKey !== miniMapKey) {
    clearMiniMapMarkers();
    activeMiniMapKey = miniMapKey;
  }

  // Reset jika bukan Hilde
  if (miniMapKey !== "hilde") {
    secondaryOverlayGroup.forEach(o => o.remove());
    secondaryOverlayGroup = [];
    teleportButtonOverlays.forEach(o => o.remove());
    teleportButtonOverlays = [];
    activeHildeSecondaryIndex = null;
    mainOverlayHilde = null;
  }

  // Bersihkan overlay lama
  activeOverlays.forEach(overlay => overlay.remove());
  activeOverlays = [];
  secondaryOverlayGroup = [];

  const info = mini_map_type[miniMapKey];

  // Tambahkan main overlay
  if (info.main) {
    const imageBoundsMain = getImageBounds(info.main.map_position);
    const mainOverlay = L.imageOverlay(info.main.map_url, imageBoundsMain).addTo(map);

    // Pastikan brightness 100% jika tidak ada secondary
    if (miniMapKey === "hilde") {
      mainOverlay.getElement().style.filter = 'brightness(100%)';
      mainOverlayHilde = mainOverlay;
    } else if (info.secondary) {
      mainOverlay.getElement().style.filter = 'brightness(50%)'; // Jika memiliki secondary
    } else {
      mainOverlay.getElement().style.filter = 'brightness(100%)'; // Jika tidak ada secondary
    }

    activeOverlays.push(mainOverlay);
    centerMapOnBounds(imageBoundsMain);
  }

  // Tambahkan secondary (selain Hilde)
  if (miniMapKey !== "hilde" && info.secondary) {
    const secondaryList = Array.isArray(info.secondary) ? info.secondary : [info.secondary];
    secondaryList.forEach(sec => {
      if (!sec.map_position) return;

      const imageBoundsSecondary = getImageBounds(sec.map_position);
      const secondaryOverlay = L.imageOverlay(sec.map_url, imageBoundsSecondary).addTo(map);

      const element = secondaryOverlay.getElement();
      if (element) {
        element.style.filter = 'drop-shadow(0 0 6px white)';
        element.style.zIndex = 300;
      }

      activeOverlays.push(secondaryOverlay);
      secondaryOverlayGroup.push(secondaryOverlay);
    });
  }

  // Teleport khusus Hilde
  if (miniMapKey === "hilde") {
    addTeleportButtons();
  }

  addMarkersForMiniMap(miniMapKey);
  console.log('MiniMap updated:', { main: info.main, secondary: info.secondary, zoomLevel });
}
let activeFloorIndex = 1;

let activeDropdownMarker = null; // Variabel untuk menyimpan marker dropdown yang aktif

function showHildeMap(index) {
  console.log(`showHildeMap terpanggil dengan index ${index}`);

  // Jika klik index yang sama, toggle OFF
  if (activeHildeSecondaryIndex === index) {
    secondaryOverlayGroup.forEach(o => o.remove());
    secondaryOverlayGroup = [];
    activeHildeSecondaryIndex = null;

    if (mainOverlayHilde?.getElement()) {
      mainOverlayHilde.getElement().style.filter = 'brightness(100%)';
    }

    // Hapus dropdown jika ada
    if (activeDropdownMarker) {
      map.removeLayer(activeDropdownMarker);
      activeDropdownMarker = null;
    }

    removeDropdown();
    updateMarkers();
    return;
  }

  if (mainOverlayHilde?.getElement()) {
    mainOverlayHilde.getElement().style.filter = 'brightness(50%)';
  }

  secondaryOverlayGroup.forEach(o => o.remove());
  secondaryOverlayGroup = [];

  const hilde = mini_map_type["hilde"];
  const selectedSecondary = hilde.secondary[index - 1];
  if (!selectedSecondary || !selectedSecondary.map_position) return;

  const bounds = getImageBounds(selectedSecondary.map_position);
  const overlay = L.imageOverlay(selectedSecondary.map_url, bounds).addTo(map);
  const element = overlay.getElement();
  if (element) {
    element.style.filter = 'drop-shadow(0 0 6px white)';
    element.style.zIndex = 300;
  }

  secondaryOverlayGroup.push(overlay);
  activeHildeSecondaryIndex = index;

  // Cari info teleport (posisi marker tombol teleport)
  const teleportInfo = mini_map_type.hilde.teleportButtons.find(t => t.index === index);
  if (teleportInfo) {
    map.setView([teleportInfo.lat, teleportInfo.lng], 10);
    // Langsung tampilkan Floor 1 (index ke-0)
    showFloorOnSecondary(index, 0);
  }

  // Tampilkan dropdown hanya jika ada floors dan teleportInfo
  if (selectedSecondary.floors && selectedSecondary.floors.length > 1 && teleportInfo) {
    console.log(`Menampilkan ikon dropdown chfloor.webp untuk index ${index}`);

    // Hapus dropdown jika ada
    if (activeDropdownMarker) {
      map.removeLayer(activeDropdownMarker);
    }

    const dropdownMarker = L.marker([teleportInfo.lat - 0.0070, teleportInfo.lng + 0.0030], { // Atur posisi sesuai kebutuhan
      icon: L.divIcon({
        className: 'custom-dropdown-icon',
        html: `
          <div class="floor-button-wrapper" style="position: relative;">
            <img src="icons/chfloor.webp" class="floor-icon" style="width: 25px; height: 25px; cursor: pointer;" />
            <div class="floor-popup" style="display: none; position: absolute; top: 45px; left: 0; background: rgba(19, 39, 96, 0.613); border-radius: 10px; border: 2px solid #889dcb; padding: 7px; z-index: 9999; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; gap: 4px;">
          </div>
        `,
        iconSize: [40, 40], // Sesuaikan ukuran gambar ikon dropdown
        iconAnchor: [0, 0], // Pastikan anchor berada tepat di posisi marker
      })
    }).addTo(map);

    activeDropdownMarker = dropdownMarker; // Menyimpan marker aktif

    const dropdownElement = dropdownMarker.getElement();
    const wrapper = dropdownElement.querySelector('.floor-button-wrapper');
    const icon = wrapper.querySelector('.floor-icon');
    const popup = wrapper.querySelector('.floor-popup');

    icon.addEventListener('click', () => {
      if (popup.style.display === 'block') {
        popup.style.display = 'none';
        return;
      }

      // Kosongkan dan isi ulang popup
      popup.innerHTML = '';
      selectedSecondary.floors.forEach((f, i) => {
        const btn = document.createElement('div');
        btn.textContent = f.name || `FLOOR ${i + 1}`;
        btn.style.cssText = 'cursor:pointer; padding:3px 10px; margin:2px 0; background: rgba(10, 28, 61, 0.883); border-radius:3px; color: white; font-size: 10px; font-family: "Arial", sans-serif;';

        btn.addEventListener('click', () => {
          showFloorOnSecondary(index, i);
          popup.style.display = 'none';
        });
        popup.appendChild(btn);
      });

      popup.style.display = 'block';
    });
  }

  updateMarkers();
}



function removeDropdown() {
  teleportButtonOverlays = teleportButtonOverlays.filter(el => {
    if (el instanceof HTMLElement && el.classList.contains('dropdown-icon-wrapper')) {
      el.remove();
      return false;
    }
    return true;
  });
  console.log("Dropdown removed");
}


function addTeleportButtons() {
  const buttons = mini_map_type.hilde.teleportButtons;
  if (!buttons) return;

  teleportButtonOverlays.forEach(marker => map.removeLayer(marker));
  teleportButtonOverlays = [];

  buttons.forEach(({ index, lat, lng }) => {
    const html = `
      <div class="teleport-wrapper">
        <div class="teleport-indicator"></div>
        <img src="icons/teleport.png" class="teleport-icon" />
      </div>
    `;

    const icon = L.divIcon({
      html,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([lat, lng], {
      icon,
      interactive: true
    }).addTo(map);

    marker.on('click', () => {
      console.log(`Teleport clicked: index ${index}`);
      showHildeMap(index); // Menampilkan secondary dan dropdown lantai
    });

    teleportButtonOverlays.push(marker);
  });
}

function showFloorOnSecondary(index, floorIndex) {
  const hilde = mini_map_type["hilde"];
  const secondary = hilde.secondary.find(s => s.index === index);
  if (!secondary || !secondary.floors || !secondary.floors[floorIndex]) return;

  const selectedFloor = secondary.floors[floorIndex];
  const bounds = getImageBounds(selectedFloor.map_position);

  // Hapus secondary overlay sebelumnya
  secondaryOverlayGroup.forEach(o => o.remove());
  secondaryOverlayGroup = [];

  // Tambahkan overlay baru
  const overlay = L.imageOverlay(selectedFloor.map_url, bounds).addTo(map);
  const element = overlay.getElement();
  if (element) {
    element.style.filter = 'drop-shadow(0 0 6px white)';
    element.style.zIndex = 300;
  }

  secondaryOverlayGroup.push(overlay);

  // ✅ Floor aktif ditetapkan di sini
  activeFloorIndex = floorIndex + 1;

  updateMarkers();
}

// Track time spent before user leaves the page
window.addEventListener('beforeunload', () => {
    if (startTime !== null) {
        timeSpent = Math.floor((new Date() - startTime) / 1000);
        console.log(`User spent ${timeSpent} seconds before leaving the page.`);
        gtag('event', 'page_exit', {
            'page_title': document.title,
            'page_location': window.location.href,
            'duration': timeSpent
        });
    }
});

// Event listener for filter buttons
document.querySelectorAll('.new-filter-container .filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        const filterKey = button.getAttribute('data-filter');
        const locationName = button.innerText.trim();

        // Track filter click event
        trackEvent('Minimap Interaction', locationName, filterKey);

        // Track page view and duration for the selected minimap
        const miniMapInfo = miniMapConfig[filterKey];
        if (miniMapInfo) trackPageView(miniMapInfo);

        // Update minimap
        setTimeout(() => {
            clearAllMarks();
            activeLocTypes.push(filterKey);
            showMarkers();
            updateMiniMap(filterKey);

            // Hide the filter container
            document.querySelector('.new-filter-container').style.display = 'none';
        }, 1000);
    });
});


function getImageBounds(mapPosition) {
    if (!mapPosition || !Array.isArray(mapPosition) || mapPosition.length !== 2) {
        console.error("Invalid map position:", mapPosition);
        return [[0, 0], [0, 0]]; // Nilai default jika map_position tidak valid
    }
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
// Pilih kedua elemen toggle dan tambahkan efek toggle
document.querySelectorAll('.toggle-legend-container, .toggle-new-filters-container').forEach(button => {
    button.addEventListener('click', () => {
        // Toggle kelas "hover" untuk efek klik
        button.classList.toggle('hover');

        // Cek apakah popup saat ini terbuka, lalu tutup jika terbuka
        if (map && map.hasLayer(map._popup)) {
            map.closePopup();
        }
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
function centerMapOnBounds(imageBounds, zoomLevel = 7) {
    // Close any open popups at the very start
    map.closePopup();
 
    const midLat = (imageBounds[0][0] + imageBounds[1][0]) / 2;
    const midLng = (imageBounds[0][1] + imageBounds[1][1]) / 2;
    const offsetLng = 0.01; // Adjust this value as needed
    const newCenter = [midLat, midLng - offsetLng];

    // Step 1: Zoom out to level 4
    map.setView(map.getCenter(), 4, { animate: true, duration: 2 });

    // Disable hover effect during zoom out
    const newFiltersContainer = document.querySelector('.toggle-new-filters-container');
    if (newFiltersContainer) {
        newFiltersContainer.classList.add('no-hover'); // Disable hover effect
    }

    // Step 2: Wait for zoom out to complete, then move to new center
    setTimeout(() => {
        // Move to new center
        map.setView(newCenter, map.getZoom(), { animate: true, duration: 1 });

        // Step 3: After moving, zoom in to specified level
        setTimeout(() => {
            map.setView(newCenter, zoomLevel, { animate: true, duration: 1 });
            updateMarkers(); // Ensure filters are applied after markers are cleared
        }, 500); // Wait for half a second before zooming in
    }, 1000); // Wait for 2 seconds for the zoom out to finish
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
                // Jika checkbox 'all' diubah, perbarui semua checkbox lainnya
                filterCheckboxes.forEach(cb => {
                    if (cb !== allCheckbox) {
                        cb.checked = allCheckbox.checked;
                    }
                });
            } else {
                // Jika checkbox lain tidak dicentang, hapus centang dari 'all'
                if (!checkbox.checked) {
                    allCheckbox.checked = false;
                }
                // Jika semua checkbox lain dicentang, centang 'all'
                const allOthersChecked = Array.from(filterCheckboxes)
                    .filter(cb => cb !== allCheckbox)
                    .every(cb => cb.checked);
                if (allOthersChecked) {
                    allCheckbox.checked = true;
                }
            }

            // Menutup popup jika ada yang terbuka
            markers.forEach(marker => {
                if (marker.isPopupOpen()) {
                    marker.closePopup();
                }
            });

            // Memperbarui activeFilters berdasarkan status checkbox saat ini
            activeFilters = Array.from(filterCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.filter);

            // Memperbarui visibilitas marker
            updateMarkers();
        });
    });
}
let activeHildeFloor = null; // null artinya tidak ada floor yang aktif

function updateMarkers() {
    markers.forEach((marker) => {
        const categoryMatch = isCategoryMatch(marker);
        const locTypeMatch = activeLocTypes.length === 0 || activeLocTypes.includes(`loc_type${marker.options.loc_type}`);

        let indexMatch = false;

        if (activeMiniMapKey === 'hilde') {
            const markerIndex = marker.options.index ?? null;
            const markerFloor = marker.options.floor ?? null;

            if (activeHildeSecondaryIndex !== null) {
                // Hanya tampilkan marker dengan index yang cocok
                if (markerIndex === activeHildeSecondaryIndex) {
                    // Jika marker punya floor, cocokkan juga
                    if (markerFloor !== null) {
                        indexMatch = markerFloor === activeFloorIndex;
                    } else {
                        indexMatch = true; // kalau floor null, tetap tampil
                    }
                }
            } else {
                // Belum ada teleport yang diklik → tampilkan hanya marker tanpa index
                indexMatch = markerIndex === null;
            }
        } else {
            // Untuk peta selain Hilde → semua marker lolos
            indexMatch = true;
        }

        if (locTypeMatch && categoryMatch && indexMatch) {
            marker.addTo(map);

            console.log(`[SHOW] Marker index: ${marker.options.index ?? "null"}, floor: ${marker.options.floor ?? "null"}, name: ${marker.options.en_name}`);
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

    // Cek kategori yang sesuai dengan filter
    if (
        (activeFilters.includes('treasure') && category === '2') ||
        (activeFilters.includes('teleport') && category === '1') ||
        (activeFilters.includes('bird') && category === '29') ||
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
        (activeFilters.includes('rarewood2') && category === '26')
    ) {
        return true;
    }

    // Jika tidak ada kecocokan, gunakan default icon
    return activeFilters.includes('all'); // Tetap tampilkan jika mode 'all' aktif
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


document.addEventListener('DOMContentLoaded', () => {
    if (!window.adManager) {
        console.error('[AdSense] AdSenseManager is not initialized.');
        return;
    }

    // Tampilkan iklan map setelah inisialisasi halaman
    window.adManager.showMapAd();

    // Menutup map ad
    const closeMapBtn = document.querySelector('.close-btn');
    if (closeMapBtn) {
        closeMapBtn.addEventListener('click', () => {
            window.adManager.hideMapAd();
        });
    }
});
// Ambil elemen peta dan tombol fullscreen
const mapContainer = document.getElementById('mapContainer');
const fullscreenButton = document.getElementById('fullscreenButton');

// Fungsi untuk memasukkan peta ke fullscreen
function enterFullscreen() {
    if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
    } else if (mapContainer.mozRequestFullScreen) { // Firefox
        mapContainer.mozRequestFullScreen();
    } else if (mapContainer.webkitRequestFullscreen) { // Chrome, Safari, Opera
        mapContainer.webkitRequestFullscreen();
    } else if (mapContainer.msRequestFullscreen) { // IE/Edge
        mapContainer.msRequestFullscreen();
    }
}

// Fungsi untuk keluar dari fullscreen
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }
}

// Event listener untuk tombol fullscreen
fullscreenButton.addEventListener('click', () => {
    // Cek jika sudah dalam mode fullscreen
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        // Jika sudah fullscreen, keluar dari fullscreen
        exitFullscreen();
    } else {
        // Masuk fullscreen
        enterFullscreen();
    }
});
