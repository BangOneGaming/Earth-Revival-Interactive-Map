function preloadTiles(callbackAfterLowZoom) {
    console.log('Mulai preloadTiles...');
    const bounds = {
        latMin: 57,
        latMax: 66,
        lngMin: -89.4,
        lngMax: -67.40522460937501
    };

    function lng2tile(lon, zoom) {
        return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    }

    function lat2tile(lat, zoom) {
        const rad = lat * Math.PI / 180;
        return Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, zoom));
    }

    const tileList = [];
    const highZoomList = [];
    const iconUrls = [
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_default.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_treasure.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_train.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_zone.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_scenery.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_resource.png'
    ];

    // Generate the tile list
    for (let z = 6; z <= 9; z++) {
        const xStart = lng2tile(bounds.lngMin, z);
        const xEnd = lng2tile(bounds.lngMax, z);
        const yStart = lat2tile(bounds.latMax, z);
        const yEnd = lat2tile(bounds.latMin, z);

        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                if (z <= 7) {
                    tileList.push({ z, x, y });
                } else {
                    highZoomList.push({ z, x, y });
                }
            }
        }
    }

    let loadedCount = 0;
    const totalTiles = tileList.length + iconUrls.length; // total including icons
    const loadingText = document.getElementById('loading-text');

    function updateLoadingText() {
        const percent = Math.floor((loadedCount / totalTiles) * 100);
        // Teks deskriptif berdasarkan persentase
        let phase = 'Starting';
        if (percent < 20) phase = 'Initializing map';
        else if (percent < 40) phase = 'Loading terrain';
        else if (percent < 60) phase = 'Loading Marker';
        else if (percent < 80) phase = 'Icon Picture Almost Done';
        else if (percent < 100) phase = 'Almost done';
        else phase = 'Ready';

        loadingText.textContent = `${phase}... ${percent}%`;
    }

    // Timeout untuk mendeteksi jika loading stuck
    const loadingTimeout = setTimeout(() => {
        console.error('Loading stuck! Something went wrong.');
        loadingText.textContent = 'Error during loading. Please try again later.';
        document.getElementById('loader').style.display = 'none';
    }, 10000); // Timeout setelah 10 detik

    // Preload tiles
    tileList.forEach(({ z, x, y }) => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loadedCount++;
            updateLoadingText();

            if (loadedCount === totalTiles) {
                clearTimeout(loadingTimeout); // Selesaikan timeout jika loading selesai
                console.log("Preload selesai untuk zoom 6 & 7");
                document.getElementById('loader').style.display = 'none';
                document.getElementById('map').style.display = 'block';
                if (callbackAfterLowZoom) callbackAfterLowZoom(highZoomList);
            }
        };

        img.src = `statics/yuan_${z}_${x}_${y}.webp`;
    });

    // Preload icons
    iconUrls.forEach(url => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loadedCount++;
            updateLoadingText();
        };
        img.src = url;
    });
}

Promise.all([
    preloadTilesPromise(),
    fetchMarkersPromise(),
    preloadIcons()
]).then(([highZoomList, markers]) => {
    initMap();
    createDevToolsPanel(map);

    markers.forEach(markerData => {
        addMarkerToMap(markerData);
    });

    // Preload tiles untuk zoom 8 & 9
    highZoomList.forEach(({ z, x, y }) => {
        const img = new Image();
        img.src = `statics/yuan_${z}_${x}_${y}.webp`;
    });
}).catch(error => {
    console.error('Error during preload or fetch:', error);
    document.getElementById('loading-text').textContent = 'Failed to load data. Please try again later.';
});
