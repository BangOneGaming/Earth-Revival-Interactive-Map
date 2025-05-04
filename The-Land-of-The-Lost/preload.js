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
    const iconUrls = [
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_default.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_treasure.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_train.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_zone.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_scenery.png',
        'https://earthrevivalinteractivemaps.bangonegaming.com/icons/icon_resource.png'
    ];

    // Check image existence before loading
    async function imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn(`Error checking image existence: ${url}`);
            return false;
        }
    }

    for (let z = 6; z <= 6; z++) { // hanya zoom 6 yang diprioritaskan
        const xStart = lng2tile(bounds.lngMin, z);
        const xEnd = lng2tile(bounds.lngMax, z);
        const yStart = lat2tile(bounds.latMax, z);
        const yEnd = lat2tile(bounds.latMin, z);

        for (let x = xStart; x <= xEnd; x++) {
            for (let y = yStart; y <= yEnd; y++) {
                tileList.push({ z, x, y });
            }
        }
    }

    const allPreloadList = [...tileList.map(tile => `statics/yuan_${tile.z}_${tile.x}_${tile.y}.webp`), ...iconUrls];
    let loadedCount = 0;
    const totalTiles = allPreloadList.length;
    const loadingText = document.getElementById('loading-text');
    const failedUrls = [];
    const startTime = Date.now(); // Mencatat waktu mulai preload

    function updateLoadingText() {
        const percent = Math.floor((loadedCount / totalTiles) * 100);
        let phase = 'Starting';
        if (percent < 20) phase = 'Initializing map';
        else if (percent < 40) phase = 'Loading terrain';
        else if (percent < 60) phase = 'Loading Marker';
        else if (percent < 80) phase = 'Icon Picture Almost Done';
        else if (percent < 100) phase = 'Almost done';
        else phase = 'Ready';

        loadingText.textContent = `${phase}... ${percent}%`;

        // Log phase progress
        console.log(`${phase}... ${percent}%`);
    }

    function onLoadOrError(url, success) {
        loadedCount++;
        if (!success) {
            failedUrls.push(url);
            console.warn(`Gagal load gambar: ${url}`);
        } else {
            console.log(`Berhasil load gambar: ${url}`);
        }

        updateLoadingText();

        // Memastikan loader tidak ditutup lebih cepat dari 2 detik
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 2000) {
            setTimeout(() => {
                if (loadedCount === totalTiles) {
                    if (failedUrls.length > 0) {
                        console.warn(`Beberapa gambar gagal di-load (${failedUrls.length}):`, failedUrls);
                    }
                    console.log("Preload selesai untuk zoom 6 + icons");
                    document.getElementById('loader').style.display = 'none';
                    document.getElementById('map').style.display = 'block';
                    if (callbackAfterLowZoom) callbackAfterLowZoom();
                }
            }, 2000 - elapsedTime); // Menunggu sampai 2 detik jika waktu belum tercapai
        } else {
            if (loadedCount === totalTiles) {
                if (failedUrls.length > 0) {
                    console.warn(`Beberapa gambar gagal di-load (${failedUrls.length}):`, failedUrls);
                }
                console.log("Preload selesai untuk zoom 6 + icons");
                document.getElementById('loader').style.display = 'none';
                document.getElementById('map').style.display = 'block';
                if (callbackAfterLowZoom) callbackAfterLowZoom();
            }
        }
    }

    // Memeriksa gambar satu per satu sebelum dimuat
    async function preloadImages() {
        for (const url of allPreloadList) {
            const exists = await imageExists(url);
            if (exists) {
                const img = new Image();
                console.log(`Mulai load gambar: ${url}`);

                img.onload = () => onLoadOrError(url, true);
                img.onerror = () => onLoadOrError(url, false);
                img.src = url;
            } else {
                console.warn(`Gambar tidak ditemukan: ${url}`);
                onLoadOrError(url, false);
            }
        }
    }

    // Mulai proses preload
    console.log("Memulai preload untuk tiles dan icons...");
    preloadImages();
}




// Memanggil preload untuk zoom 6, baru load zoom lebih tinggi jika diperlukan
function preloadTilesPromise() {
    return new Promise((resolve, reject) => {
        preloadTiles(() => {
            resolve('Preload zoom 6 selesai.');
        });
    });
}
