const isPreloadEnabled = true;

let map; // Global map
let markersData = {}; // Sekarang bentuk object, bukan array
if (isPreloadEnabled) {
    Promise.all([
        preloadTilesPromise(),
        fetchMarkersPromise()
    ]).then(([highZoomList, markers]) => {
        initMap();
        createDevToolsPanel(map);

        markers.forEach(markerData => {
            addMarkerToMap(markerData);
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

function filterMarkers() {
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

    if (filteredCategoryIds.length === 0) {
        Object.values(markersData).forEach((markerData) => {
            const marker = markerData.marker;
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        });
    } else {
        Object.values(markersData).forEach((markerData) => {
            const marker = markerData.marker;
            const categoryId = parseInt(markerData.category_id);

            if (filteredCategoryIds.includes(categoryId)) {
                if (!map.hasLayer(marker)) {
                    marker.addTo(map);
                }
            } else {
                if (map.hasLayer(marker)) {
                    marker.removeFrom(map);
                }
            }
        });
    }
}

function addMarkerToMap(markerData) {
    const { id, ys_id, lat, lng, category_id, name, en_name, desc } = markerData;

    let iconUrl = '';
    switch (parseInt(category_id)) {
        case 2:
            iconUrl = 'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_treasure.png';
            break;
        case 3:
            iconUrl = 'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_train.png';
            break;
        case 4:
            iconUrl = 'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_zone.png';
            break;
        case 5:
            iconUrl = 'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_scenery.png';
            break;
        case 6:
            iconUrl = 'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_resource.png';
            break;
        default:
            return;
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

 const marker = L.marker([parseFloat(lat), parseFloat(lng)], {
    icon: customIcon,
    opacity: 1
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
    <div class="copy-feedback" id="copyFeedback-${id}">
        <span class="feedback-icon">&#x2714;</span> Coordinate copied!
    </div>
</div>
`);


    marker.on('contextmenu', (e) => {
        const currentOpacity = marker.options.opacity || 1.0;
        const newOpacity = currentOpacity === 1.0 ? 0.5 : 1.0;
        marker.setOpacity(newOpacity);
    });

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
        coordinateZ: coordinateZ
        
    };

    marker.addTo(map);
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

    const southWest = L.latLng(55, -92);  // Mengurangi latitude dan longitude untuk memperluas batas ke selatan dan barat
const northEast = L.latLng(68, -63);  // Meningkatkan latitude dan longitude untuk memperluas batas ke utara dan timur
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

