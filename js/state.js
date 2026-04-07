/**
 * state.js
 * Single source of truth for all application data and state.
 * No logic here — just data structures and a simple update helper.
 */

window.State = {
  // ── Map ───────────────────────────────────────────────────────────────
  map: {
    instance: null, // google.maps.Map
    markers: {}, // captureId → google.maps.Marker
    infoWindows: {}, // captureId → google.maps.InfoWindow
    isReady: false,
  },

  // ── Data ──────────────────────────────────────────────────────────────
  data: {
    all: [], // full list of locations from DynamoDB/mock
    filtered: [], // currently displayed subset
    lookup: {}, // captureId → location object (fast access)
    isUsingMock: false,
    lastError: null,
  },

  // ── UI ────────────────────────────────────────────────────────────────
  ui: {
    selectedCaptureId: null,
    activeFilter: "ALL", // 'ALL' | 'NO_VEGETATION' | 'VEGETATION' | 'OTHER'
  },

  // ── Config ────────────────────────────────────────────────────────────
  // Read-only after init — sourced from config.js
  config: {
    googleMapsApiKey: "",
    dynamoDbEndpoint: "",
  },

  // ─────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────

  /** Replace the full location dataset and rebuild the lookup index. */
  setLocations(locations) {
    this.data.all = locations;
    this.data.lookup = {};
    locations.forEach((loc) => {
      this.data.lookup[loc.captureId] = loc;
    });
    this._applyFilter();
  },

  /** Re-compute data.filtered from data.all + ui.activeFilter. */
  _applyFilter() {
    const filter = this.ui.activeFilter;
    this.data.filtered =
      filter === "ALL"
        ? [...this.data.all]
        : this.data.all.filter((loc) => loc.risk === filter);
  },

  /** Change the active filter and recompute data.filtered. */
  setFilter(filter) {
    this.ui.activeFilter = filter;
    this._applyFilter();
  },

  /** Look up a location by captureId. Returns null if not found. */
  getLocation(captureId) {
    return this.data.lookup[captureId] || null;
  },
};
