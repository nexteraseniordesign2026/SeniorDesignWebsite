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
    /** `YYYY-MM-DD` or null — calendar date in America/New_York */
    dateStart: null,
    dateEnd: null,
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

  /** Calendar date string YYYY-MM-DD for instant in Eastern Time. */
  _captureDateET(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  },

  _passesDateFilter(loc) {
    const start = this.ui.dateStart;
    const end = this.ui.dateEnd;
    if (!start && !end) return true;
    const ymd = this._captureDateET(loc.fullTimestamp);
    if (!ymd) return false;
    if (start && ymd < start) return false;
    if (end && ymd > end) return false;
    return true;
  },

  /** Re-compute data.filtered from data.all + class filter + date range. */
  _applyFilter() {
    let rows = this.data.all.filter((loc) => this._passesDateFilter(loc));
    const filter = this.ui.activeFilter;
    if (filter !== "ALL") {
      rows = rows.filter((loc) => loc.risk === filter);
    }
    this.data.filtered = rows;
  },

  /** Replace the full location dataset and rebuild the lookup index. */
  setLocations(locations) {
    this.data.all = locations;
    this.data.lookup = {};
    locations.forEach((loc) => {
      this.data.lookup[loc.captureId] = loc;
    });
    this._applyFilter();
  },

  /** Change the active class filter and recompute data.filtered. */
  setFilter(filter) {
    this.ui.activeFilter = filter;
    this._applyFilter();
  },

  /** Set inclusive date range (`YYYY-MM-DD` strings or null) and refilter. */
  setDateRange(start, end) {
    this.ui.dateStart = start || null;
    this.ui.dateEnd = end || null;
    this._applyFilter();
  },

  /** Look up a location by captureId. Returns null if not found. */
  getLocation(captureId) {
    return this.data.lookup[captureId] || null;
  },
};
