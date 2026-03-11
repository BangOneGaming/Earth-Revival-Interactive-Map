/**
 * marker-linker.js
 * ─────────────────────────────────────────────────────────────
 * Resolves [key:MARKER_KEY] tokens inside marker descriptions
 * into clickable links that:
 *   1. Pan/fly the map to the target marker
 *   2. Auto-enable the target's category filter if inactive
 *   3. Auto-open the target marker's popup
 *   4. Pulse-highlight the target marker briefly
 *
 * Usage in description data:
 *   "Pre-quest [key:PC_KOL_121212] to unlock this quest"
 *   "See also [key:PC_KOL_999|Merchant NPC] near the docks"
 *          ↑ optional custom label after pipe
 *
 * Integration (marker-manager.js):
 *   • In createPopupContent(), pipe formattedDesc through
 *     MarkerLinker.parseDescription(formattedDesc)
 *   • In setupEventListeners(), the delegated click handler
 *     is registered automatically on init.
 * ─────────────────────────────────────────────────────────────
 */

console.log("📦 Loading marker-linker.js...");

const MarkerLinker = (() => {

  // ── Regex: matches [key:SOME_KEY] or [key:SOME_KEY|Custom Label]
  const TOKEN_RE = /\[key:([^\]|]+)(?:\|([^\]]+))?\]/g;

  // ── CSS injected once
  const CSS = `
    .ml-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 7px 1px 5px;
      border-radius: 12px;
      background: rgba(243, 213, 155, 0.15);
      border: 1px solid rgba(243, 213, 155, 0.45);
      color: #f3d59b;
      font-size: 0.82em;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.18s, border-color 0.18s, transform 0.12s;
      vertical-align: middle;
      white-space: nowrap;
    }
    .ml-link:hover {
      background: rgba(243, 213, 155, 0.28);
      border-color: rgba(243, 213, 155, 0.8);
      transform: translateY(-1px);
    }
    .ml-link svg { flex-shrink: 0; opacity: 0.85; }
    .ml-link-unknown {
      color: #ff8a8a;
      border-color: rgba(255,138,138,0.4);
      background: rgba(255,138,138,0.08);
      cursor: not-allowed;
    }

    /* Pulse animation on the Leaflet icon wrapper */
    @keyframes ml-pulse {
      0%   { filter: drop-shadow(0 0 0px #f3d59b); }
      35%  { filter: drop-shadow(0 0 10px #f3d59b); }
      70%  { filter: drop-shadow(0 0 18px #f3d59b) brightness(1.4); }
      100% { filter: drop-shadow(0 0 0px #f3d59b); }
    }
    .ml-pulse-marker {
      animation: ml-pulse 1.2s ease-out 2;
    }
  `;

  const PIN_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`;

  const WARN_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`;

  // ── Internal: inject CSS once
  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    cssInjected = true;
  }

  // ── Internal: look up a marker by _key across all sources
  function findMarkerData(targetKey) {
    if (typeof MarkerManager === "undefined") return null;
    const all = MarkerManager.getAllMarkers();
    return all.find(m => m._key === targetKey) || null;
  }

  // ── Internal: pulse the leaflet icon element
  function pulseMarker(markerKey) {
    const leafletMarker = MarkerManager?.activeMarkers?.[markerKey];
    if (!leafletMarker) return;
    const el = leafletMarker.getElement?.();
    if (!el) return;
    el.classList.remove("ml-pulse-marker");
    // Force reflow so animation restarts
    void el.offsetWidth;
    el.classList.add("ml-pulse-marker");
    setTimeout(() => el.classList.remove("ml-pulse-marker"), 2800);
  }

  // ── Internal: ensure filter for a category is active
  function ensureCategoryActive(categoryId) {
    if (typeof MarkerManager === "undefined") return;
    const id = String(categoryId);
    if (MarkerManager.isFilterActive(id)) return; // already on

    // Tick the checkbox + update filter state
    MarkerManager.activeFilters.add(id);

    // Update UI checkbox if visible
    const cb = document.querySelector(`.filter-checkbox[data-category="${id}"]`);
    if (cb) {
      cb.checked = true;
      cb.closest(".filter-item")?.classList.add("active");
    }

    // Persist
    localStorage.setItem(
      "activeFilters",
      JSON.stringify([...MarkerManager.activeFilters])
    );

    // Refresh map markers so target appears
    MarkerManager.updateMarkersInView();

    console.log(`🔓 MarkerLinker: auto-enabled filter for category ${id}`);
  }

  // ── Internal: poll activeMarkers until targetKey appears or timeout
  // Retries every `interval`ms for up to `timeout`ms total.
  function waitForMarker(targetKey, timeout = 6000, interval = 120) {
    return new Promise((resolve) => {
      const start = Date.now();

      const check = () => {
        const lm = MarkerManager?.activeMarkers?.[targetKey];
        if (lm) {
          console.log(`[MarkerLinker] ✅ Marker ready after ${Date.now() - start}ms`);
          return resolve(lm);
        }
        if (Date.now() - start >= timeout) {
          console.warn(`[MarkerLinker] ⏱ Timeout waiting for marker: ${targetKey}`);
          return resolve(null); // give up gracefully
        }
        setTimeout(check, interval);
      };

      check();
    });
  }

  // ── Internal: navigate to a marker
  async function navigateTo(targetKey) {
    const markerData = findMarkerData(targetKey);

    if (!markerData) {
      console.warn(`[MarkerLinker] Key not found: ${targetKey}`);
      showToast(`❓ Marker "${targetKey}" tidak ditemukan`, "warn");
      return;
    }

    const lat = parseFloat(markerData.lat);
    const lng = parseFloat(markerData.lng);

    if (isNaN(lat) || isNaN(lng)) {
      showToast("⚠️ Koordinat marker tujuan tidak valid", "warn");
      return;
    }

    // 1. Ensure filter / category is active — triggers updateMarkersInView()
    ensureCategoryActive(markerData.category_id);

    // 2. Close current popup
    MarkerManager?.map?.closePopup();

    // 3. Fly to target — wait for animation to fully finish before doing anything
    await new Promise((resolve) => {
      MarkerManager.map.once("moveend", resolve);
      MarkerManager.map.flyTo([lat, lng], 5, { duration: 1.0 });
    });

    // 4. Extra buffer — beri waktu addMarkersBatch selesai render setelah moveend
    await delay(600);

    // 5. Now poll until the marker has rendered (addMarkersBatch is async/rAF)
    const leafletMarker = await waitForMarker(targetKey);

    if (leafletMarker) {
      leafletMarker.openPopup();
      pulseMarker(targetKey);
    } else {
      showToast("⚠️ Marker tujuan tidak berhasil dimuat", "warn");
    }
  }

  // ── Internal: small toast notification
  function showToast(msg, type = "info") {
    const el = document.createElement("div");
    el.className = "copy-notification";
    el.textContent = msg;
    if (type === "warn") {
      el.style.background =
        "linear-gradient(135deg,rgba(255,160,0,0.95),rgba(230,120,0,0.95))";
      el.style.borderColor = "rgba(255,180,50,0.8)";
    }
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 2200);
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════

  /**
   * Parse a description string and replace [key:...] tokens
   * with styled <span> chips that trigger navigation on click.
   *
   * @param {string} html - HTML description (may contain <br>)
   * @returns {string}    - Transformed HTML
   */
  function parseDescription(html) {
    if (!html || typeof html !== "string") return html;

    return html.replace(TOKEN_RE, (match, rawKey, rawLabel) => {
      const key = rawKey.trim();
      const markerData = findMarkerData(key);

      if (markerData) {
        // Resolve display name
        const label = rawLabel?.trim() || markerData.name || key;
        return `<span
          class="ml-link"
          data-ml-key="${key}"
          title="Go to: ${label} (${key})"
          onclick="event.stopPropagation(); MarkerLinker.navigateTo('${key}')"
        >${PIN_SVG}${label}</span>`;
      } else {
        // Key not found — show warning chip (unresolved)
        const label = rawLabel?.trim() || key;
        return `<span
          class="ml-link ml-link-unknown"
          title="Marker not found: ${key}"
        >${WARN_SVG}${label}</span>`;
      }
    });
  }

  /**
   * Call once after DOM ready — injects CSS.
   * MarkerManager.init() will call this automatically if wired up.
   */
  function init() {
    injectCSS();
    console.log("✅ MarkerLinker initialised");
  }

  return { init, parseDescription, navigateTo, pulseMarker };

})();

// ── Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => MarkerLinker.init());
} else {
  MarkerLinker.init();
}

window.MarkerLinker = MarkerLinker;
console.log("✅ MarkerLinker exported to window");