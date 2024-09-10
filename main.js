let activeFilters = [];

let activeLocTypes = [];

let markers = [];



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

            const marker = new google.maps.Marker({

                position: latLng,

                map: map,

                icon: icon,

                category: location.category_id,

                loc_type: location.loc_type,

                draggable: false

            });



            marker.addListener('click', () => {

                console.log("Link info:", location.links_info); // Check the URL


const contentString = `
    <div style="padding: 15px; font-family: Arial, sans-serif; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25); background-color: rgba(19, 39, 96, 0.613);">
        <h3 style="margin-top: 0; margin-bottom: 8px; color: #ffffff; font-size: 18px;">${location.en_name}</h3>
        <p style="font-size: 14px; color: #ffffff; margin-bottom: 8px;">${location.desc || 'No description available.'}</p>
        ${(location.links_info && location.links_info !== '[]' && location.links_info.trim() !== '') ? `<a href="${location.links_info}" target="_blank" style="display: inline-block; padding: 8px 12px; margin-top: 8px; font-size: 14px; color: #ffffff; background-color: #007bff; border-radius: 4px; text-decoration: none;">Visit Link</a>` : ''}
    </div>
`;


infoWindow.setContent(contentString);
infoWindow.open(map, marker);


            });

            markers.push(marker);

        }

    }



    // Hide all markers on initial load

    markers.forEach(marker => {

        marker.setMap(null);

    });



    initMiniMap();



    // Toggle buttons for legend and filters

    document.getElementById('toggle-legend').addEventListener('click', () => {

        toggleVisibility('.filter-container');

    });



    // Add event listeners to toggle buttons

    document.getElementById('toggle-filters').addEventListener('click', () => {

        toggleVisibility('.new-filter-container'); // Ensure correct ID selector

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
