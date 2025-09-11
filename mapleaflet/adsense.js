// 将 export 语句移除,改为全局变量
var adManager = (function() {
    // AdSense 配置常量
    const ADSENSE_CONFIG = {
        POPUP: {
            MAX_DISPLAYS: 3,
            INITIAL_DELAY: 2000,
        },
        MAP: {
            MAX_DISPLAYS: 2,
            INITIAL_DELAY: 5000,
        },
        MIN_INTERVAL: 60000,
    };

    // API 配置
    const API_CONFIG = {
        REPORT_URL: 'https://autumn-dream-8c07.square-spon.workers.dev/adsense'
    };

    // 广告展示计数器
    class AdDisplayCounter {
        constructor() {
            this.popupCount = parseInt(sessionStorage.getItem('popupAdCount') || '0');
            this.mapCount = parseInt(sessionStorage.getItem('mapAdCount') || '0');
            this.lastDisplayTime = parseInt(sessionStorage.getItem('lastAdDisplay') || '0');
        }

        incrementPopup() {
            this.popupCount++;
            this.lastDisplayTime = Date.now();
            this._saveToSession();
            return this.popupCount;
        }

        incrementMap() {
            this.mapCount++;
            this.lastDisplayTime = Date.now();
            this._saveToSession();
            return this.mapCount;
        }

        canShowPopup() {
            return this.popupCount < ADSENSE_CONFIG.POPUP.MAX_DISPLAYS &&
                   this._checkInterval();
        }

        canShowMap() {
            return this.mapCount < ADSENSE_CONFIG.MAP.MAX_DISPLAYS &&
                   this._checkInterval();
        }

        _checkInterval() {
            return Date.now() - this.lastDisplayTime >= ADSENSE_CONFIG.MIN_INTERVAL;
        }

        _saveToSession() {
            sessionStorage.setItem('popupAdCount', this.popupCount.toString());
            sessionStorage.setItem('mapAdCount', this.mapCount.toString());
            sessionStorage.setItem('lastAdDisplay', this.lastDisplayTime.toString());
        }

        reset() {
            this.popupCount = 0;
            this.mapCount = 0;
            this.lastDisplayTime = 0;
            this._saveToSession();
        }
    }

    // AdSense 管理器
    class AdSenseManager {
        constructor() {
            this.counter = new AdDisplayCounter();
            this._setupEventListeners();
        }

        async _reportOverexposure() {
            try {
                // 先获取现有数据
                const getResponse = await fetch(API_CONFIG.REPORT_URL);
                if (!getResponse.ok) {
                    throw new Error(`HTTP error! status: ${getResponse.status}`);
                }
                
                // 解析现有数据
                const existingData = await getResponse.json();
                
                // 准备新的数据
                const newReport = {
                    action: 'overexposure',
                    timestamp: Date.now(),
                    popupCount: this.counter.popupCount,
                    mapCount: this.counter.mapCount,
                    lastDisplayTime: this.counter.lastDisplayTime
                };
                
                // 合并现有数据和新数据
                const updatedData = Array.isArray(existingData) ? [...existingData, newReport] : [newReport];
                
                // 发送更新后的数据
                const putResponse = await fetch(API_CONFIG.REPORT_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });
                
                if (!putResponse.ok) {
                    throw new Error(`HTTP error! status: ${putResponse.status}`);
                }
                console.log('[AdSense] Overexposure reported successfully');
            } catch (error) {
                console.error('[AdSense] Error reporting overexposure:', error);
            }
        }

        showPopupAd() {
            if (!this.counter.canShowPopup()) {
                console.log('[AdSense] Cannot show popup ad: limit reached or interval too short');
                this._reportOverexposure();
                return;
            }

            const adPopup = document.getElementById('ad-popup');
            if (!adPopup) {
                console.error('[AdSense] Ad popup container not found');
                return;
            }

            adPopup.style.display = 'block';
            const popupAd = document.getElementById('popup-ad');
            
            if (popupAd && !popupAd.hasAttribute('data-loaded')) {
                console.log('[AdSense] Showing popup ad');
                try {
                    console.log('[AdSense] Loading new AdSense popup ad');
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    popupAd.setAttribute('data-loaded', 'true');
                    this.counter.incrementPopup();
                } catch (e) {
                    console.error('[AdSense] Error loading popup AdSense ad:', e);
                }
            }
        }

        showMapAd() {
            if (!this.counter.canShowMap()) {
                console.log('[AdSense] Cannot show map ad: limit reached');
                this._reportOverexposure();
                return;
            }

            const mapAd = document.getElementById('map-ad');
            if (!mapAd) {
                console.error('[AdSense] Map ad container not found');
                return;
            }

            if (!mapAd.hasAttribute('data-loaded')) {
                try {
                    console.log('[AdSense] Loading new AdSense map ad');
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    mapAd.setAttribute('data-loaded', 'true');
                    this.counter.incrementMap();
                } catch (e) {
                    console.error('[AdSense] Error loading map AdSense ad:', e);
                }
            }
        }

        hidePopupAd() {
            const adPopup = document.getElementById('ad-popup');
            if (adPopup) {
                adPopup.style.display = 'none';
                console.log('[AdSense] Ad popup hidden');
            }
        }

        hideMapAd() {
            const adsContainer = document.getElementById('ads-container');
            if (adsContainer) {
                adsContainer.style.display = 'none';
                console.log('[AdSense] Map ad container hidden');
            }
        }

        _setupEventListeners() {
            // 页面可见性变化监听
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.hidePopupAd();
                }
            });

            // 页面卸载时清理
            window.addEventListener('beforeunload', () => {
                this._cleanup();
            });
        }

        _cleanup() {
            console.log('[AdSense] Cleaning up ad containers');
            const adElements = document.querySelectorAll('[data-loaded="true"]');
            adElements.forEach(el => {
                el.removeAttribute('data-loaded');
            });
        }

        initializeAds() {
            // 延迟显示弹窗广告
            setTimeout(() => {
                this.showPopupAd();
            }, ADSENSE_CONFIG.POPUP.INITIAL_DELAY);

            // 延迟显示地图广告
            setTimeout(() => {
                this.showMapAd();
            }, ADSENSE_CONFIG.MAP.INITIAL_DELAY);
        }
    }

    // 返回单例实例
    return new AdSenseManager();
})(); 