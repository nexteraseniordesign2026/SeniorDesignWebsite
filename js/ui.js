/**
 * ui.js
 * Owns all DOM updates:
 *   - Detections sidebar list
 *   - Filter buttons
 *   - Selected-detection detail panel
 *   - Status bar (fleet count, today's detections, online/mock badge)
 *   - Toast notifications
 *   - Mock-data warning banner
 *
 * Depends on: State (state.js), MapModule (map.js)
 * Exposes:    window.UIModule
 */

window.UIModule = (() => {
  // ── Constants ─────────────────────────────────────────────────────────

  const RISK_CONFIG = {
    NO_VEGETATION: {
      label: "NO VEG",
      badge: "bg-green-500/20 text-green-400",
      dot: "#16a34a",
    },
    VEGETATION: {
      label: "VEG",
      badge: "bg-orange-500/20 text-orange-400",
      dot: "#ea580c",
    },
    OTHER: {
      label: "OTHER",
      badge: "bg-gray-500/20 text-gray-400",
      dot: "#6b7280",
    },
  };

  const PLACEHOLDER_IMG =
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";

  // ── Detections list ───────────────────────────────────────────────────

  function renderDetectionsList(locations) {
    const container = document.getElementById("detectionsList");
    if (!container) return;

    if (!locations || locations.length === 0) {
      container.innerHTML = _emptyState("No detections match this filter.");
      _refreshIcons();
      return;
    }

    const sorted = [...locations].sort((a, b) => {
      const da = a.fullTimestamp ? new Date(a.fullTimestamp) : new Date(0);
      const db = b.fullTimestamp ? new Date(b.fullTimestamp) : new Date(0);
      return db - da;
    });

    container.innerHTML = sorted.map((loc) => _detectionCard(loc)).join("");
    _refreshIcons();
  }

  function _detectionCard(loc) {
    const cfg = RISK_CONFIG[loc.risk] || RISK_CONFIG.OTHER;
    const dateStr = loc.fullTimestamp
      ? new Date(loc.fullTimestamp).toLocaleDateString()
      : "";

    return `
        <div class="bg-infra-700/50 p-3 rounded-lg border border-infra-600
                    hover:border-utility-500 transition-colors cursor-pointer"
             onclick="UIModule.selectDetection('${loc.captureId}')">

            <div class="flex gap-3 mb-2">
                <div class="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-infra-600">
                    <img src="${loc.image || PLACEHOLDER_IMG}" alt="Capture"
                         class="w-full h-full object-cover"
                         onerror="this.src='${PLACEHOLDER_IMG}';this.onerror=null;">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-2">
                        <div>
                            <div class="font-mono font-semibold text-utility-400 text-sm truncate">
                                ${loc.deviceName || loc.vehicleId || "Unknown"}
                            </div>
                            <div class="font-mono text-xs text-infra-400 mt-0.5 truncate">
                                ${loc.captureId || "N/A"}
                            </div>
                        </div>
                        <span class="text-xs ${cfg.badge} px-2 py-0.5 rounded font-semibold flex-shrink-0">
                            ${cfg.label}
                        </span>
                    </div>
                </div>
            </div>

            <div class="space-y-1 text-xs text-infra-300">
                <div class="flex items-center gap-2">
                    <i data-lucide="clock" class="h-3 w-3 flex-shrink-0"></i>
                    <span>${loc.timestamp || "N/A"}</span>
                    ${dateStr ? `<span class="text-infra-400 text-[10px]">(${dateStr})</span>` : ""}
                </div>
                <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="h-3 w-3 flex-shrink-0"></i>
                    <span class="font-mono">${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}</span>
                </div>
                <div class="flex items-center gap-2">
                    <i data-lucide="tag" class="h-3 w-3 flex-shrink-0"></i>
                    <span>Class: <strong>${loc.species || "Unknown"}</strong></span>
                </div>
                <div class="flex items-center gap-2">
                    <i data-lucide="trending-up" class="h-3 w-3 flex-shrink-0"></i>
                    <span>Confidence: <strong>${(loc.confidence * 100).toFixed(1)}%</strong></span>
                </div>
                ${
                  loc.clearance && loc.clearance !== "N/A"
                    ? `
                <div class="flex items-center gap-2">
                    <i data-lucide="arrow-up" class="h-3 w-3 flex-shrink-0"></i>
                    <span>Clearance: <strong>${loc.clearance}</strong></span>
                </div>`
                    : ""
                }
                ${
                  loc.gpsStatus
                    ? `
                <div class="flex items-center gap-2">
                    <i data-lucide="satellite" class="h-3 w-3 flex-shrink-0"></i>
                    <span>GPS: <strong class="${loc.gpsStatus === "fix_acquired" ? "text-green-400" : "text-orange-400"}">${loc.gpsStatus}</strong>
                    ${loc.numSatellites ? `<span class="text-infra-400">(${loc.numSatellites} sats)</span>` : ""}</span>
                </div>`
                    : ""
                }
            </div>
        </div>`;
  }

  // ── Selected detection detail panel ───────────────────────────────────

  function selectDetection(captureId) {
    State.ui.selectedCaptureId = captureId;
    const loc = State.getLocation(captureId);
    if (loc) _renderDetailPanel(loc);
    MapModule.focusMarker(captureId);
  }

  function _renderDetailPanel(loc) {
    const panel = document.getElementById("vehicleDetail");
    if (!panel) return;

    const cfg = RISK_CONFIG[loc.risk] || RISK_CONFIG.OTHER;

    panel.innerHTML = `
            <div class="flex gap-3">
                <div class="w-20 h-20 bg-infra-700 rounded overflow-hidden flex-shrink-0">
                    <img src="${loc.image || PLACEHOLDER_IMG}" alt="Vegetation"
                         class="w-full h-full object-cover"
                         onerror="this.src='${PLACEHOLDER_IMG}'">
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-mono font-bold text-white truncate">
                            ${loc.deviceName || loc.captureId}
                        </span>
                        <span class="text-xs ${cfg.badge} font-semibold ml-2 flex-shrink-0">${cfg.label}</span>
                    </div>
                    <div class="text-xs text-infra-300 space-y-1">
                        <div>Class: ${loc.species}</div>
                        <div>Confidence: ${(loc.confidence * 100).toFixed(1)}%</div>
                        <div>Location: ${loc.location}</div>
                        <div>Time: ${loc.timestamp}</div>
                        ${loc.numSatellites ? `<div>GPS Sats: ${loc.numSatellites}</div>` : ""}
                    </div>
                </div>
            </div>
            <button class="w-full mt-3 py-2 bg-utility-600 hover:bg-utility-700 rounded
                           text-xs font-medium transition-colors"
                    onclick="UIModule.toast('Work order generation is demo only.')">
                Generate Work Order
            </button>`;

    _refreshIcons();
  }

  // ── Filter buttons ────────────────────────────────────────────────────

  function setActiveFilter(filter) {
    State.setFilter(filter);

    // Update button styles
    document.querySelectorAll("[data-filter]").forEach((btn) => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle("bg-utility-600", isActive);
      btn.classList.toggle("text-white", isActive);
      btn.classList.toggle("bg-infra-700", !isActive);
      btn.classList.toggle("text-infra-300", !isActive);
    });

    renderDetectionsList(State.data.filtered);
    MapModule.placeMarkers(State.data.filtered);
  }

  // ── Status bar ────────────────────────────────────────────────────────

  function updateStatusBar() {
    const all = State.data.all;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = all.filter((loc) => {
      if (!loc.fullTimestamp) return false;
      return new Date(loc.fullTimestamp) >= today;
    }).length;

    const deviceCount = new Set(
      all.map((l) => l.deviceName || l.vehicleId || "unknown"),
    ).size;

    _setText("fleetStatus", `Fleet: ${deviceCount} Active`);
    _setText("todayDetections", `Today: ${todayCount} Detections`);

    const statusEl = document.getElementById("systemStatus");
    if (statusEl) {
      if (State.data.isUsingMock) {
        statusEl.innerHTML =
          '<span class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span> Mock Data';
      } else {
        statusEl.innerHTML =
          '<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> System Online';
      }
    }
  }

  // ── Mock data warning banner ──────────────────────────────────────────

  function showMockWarning(show, errorMessage) {
    const existingBanner = document.getElementById("mockDataWarning");
    if (existingBanner) existingBanner.remove();
    if (!show) return;

    const banner = document.createElement("div");
    banner.id = "mockDataWarning";
    banner.className =
      "fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-yellow-900 " +
      "px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-2xl";
    banner.innerHTML = `
            <i data-lucide="alert-triangle" class="h-5 w-5 flex-shrink-0"></i>
            <div class="flex-1">
                <strong>Using Mock Data</strong>
                <p class="text-sm">${errorMessage || "API endpoint unreachable"}</p>
            </div>
            <button onclick="this.closest('#mockDataWarning').remove()" aria-label="Dismiss">
                <i data-lucide="x" class="h-5 w-5"></i>
            </button>`;
    document.body.appendChild(banner);
    _refreshIcons();
  }

  // ── Loading / error states ────────────────────────────────────────────

  function showLoading() {
    const container = document.getElementById("detectionsList");
    if (container)
      container.innerHTML = `
            <div class="text-center text-infra-400 text-sm py-8">
                <i data-lucide="loader" class="h-6 w-6 mx-auto mb-2 animate-spin"></i>
                <p>Loading detections…</p>
            </div>`;
    _refreshIcons();
  }

  function showError(message) {
    const container = document.getElementById("detectionsList");
    if (container)
      container.innerHTML = `
            <div class="text-center text-red-400 text-sm py-8">
                <i data-lucide="alert-circle" class="h-6 w-6 mx-auto mb-2"></i>
                <p class="font-semibold">Error loading detections</p>
                <p class="text-xs mt-1 text-infra-400">${message}</p>
                <button onclick="AppModule.loadData()"
                        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-xs transition-colors">
                    Retry
                </button>
            </div>`;
    _refreshIcons();
  }

  // ── Toast ─────────────────────────────────────────────────────────────

  function toast(message) {
    const el = document.createElement("div");
    el.className =
      "fixed bottom-6 left-1/2 -translate-x-1/2 bg-infra-800 text-white " +
      "px-4 py-2 rounded-lg shadow-lg text-sm z-[100] border border-infra-700";
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ── Internal utilities ────────────────────────────────────────────────

  function _emptyState(message) {
    return `
            <div class="text-center text-infra-400 text-sm py-8">
                <i data-lucide="inbox" class="h-6 w-6 mx-auto mb-2"></i>
                <p>${message}</p>
            </div>`;
  }

  function _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function _refreshIcons() {
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    renderDetectionsList,
    selectDetection,
    setActiveFilter,
    updateStatusBar,
    showMockWarning,
    showLoading,
    showError,
    toast,
  };
})();
