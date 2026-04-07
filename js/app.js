/**
 * app.js
 * Application entry point.
 * Wires State + MapModule + UIModule together.
 * Handles: boot sequence, data loading, filter/zoom event delegation.
 *
 * Depends on: state.js, map.js, ui.js, dynamodb-service.js, config.js
 * Exposes:    window.AppModule
 */

window.AppModule = (() => {
  // ── Boot ──────────────────────────────────────────────────────────────

  function init() {
    // Pull config from config.js into State
    State.config.googleMapsApiKey = window.GOOGLE_MAPS_API_KEY || "";
    State.config.dynamoDbEndpoint = window.DYNAMODB_API_ENDPOINT || "";

    _loadGoogleMapsScript();
    _bindStaticEvents();
  }

  // ── Google Maps script injection ──────────────────────────────────────

  function _loadGoogleMapsScript() {
    const key = State.config.googleMapsApiKey;

    if (!key || key === "YOUR_API_KEY_HERE") {
      _showMapKeyError();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      _showMapKeyError(
        "Failed to load Google Maps — check your API key and network.",
      );
    document.head.appendChild(script);
  }

  function _showMapKeyError(msg) {
    const container = document.getElementById("mapContainer");
    if (!container) return;
    container.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center bg-infra-900">
                <div class="text-center p-8 max-w-md">
                    <i data-lucide="alert-circle" class="h-16 w-16 text-red-500 mx-auto mb-4"></i>
                    <p class="text-red-400 text-lg font-semibold mb-2">Map Unavailable</p>
                    <p class="text-infra-300 text-sm">${msg || "Google Maps API key not configured in config.js"}</p>
                </div>
            </div>`;
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // ── Data loading ──────────────────────────────────────────────────────

  async function loadData() {
    UIModule.showLoading();

    const endpoint = State.config.dynamoDbEndpoint;

    if (typeof DynamoDBService === "undefined" || !endpoint) {
      console.warn("AppModule: DynamoDBService or endpoint not available");
      UIModule.showError("DynamoDB not configured — check config.js");
      return;
    }

    try {
      const service = new DynamoDBService(endpoint);
      const locations = await service.fetchLocations({ limit: 100 });

      State.data.isUsingMock = service.isUsingMockData();
      State.data.lastError = service.getLastError();
      State.setLocations(locations);

      UIModule.showMockWarning(State.data.isUsingMock, State.data.lastError);
      UIModule.renderDetectionsList(State.data.filtered);
      UIModule.updateStatusBar();
      MapModule.placeMarkers(State.data.all);

      console.log(
        `✅ AppModule: loaded ${locations.length} locations (mock=${State.data.isUsingMock})`,
      );
    } catch (err) {
      console.error("AppModule: loadData error", err);
      UIModule.showError(err.message);
      UIModule.showMockWarning(true, err.message);
    }
  }

  // ── Static event binding ──────────────────────────────────────────────
  // Uses event delegation where possible to avoid re-binding after DOM updates.

  function _bindStaticEvents() {
    // Filter buttons (data-filter attribute)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (btn) UIModule.setActiveFilter(btn.dataset.filter);
    });

    // Zoom buttons
    document
      .getElementById("zoomIn")
      ?.addEventListener("click", () => MapModule.zoom(1));
    document
      .getElementById("zoomOut")
      ?.addEventListener("click", () => MapModule.zoom(-1));

    // Mobile nav toggle
    document
      .getElementById("mobileMenuButton")
      ?.addEventListener("click", _toggleMobileMenu);

    // Smooth-scroll nav links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelector(anchor.getAttribute("href"))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Scrollspy + navbar shadow
    window.addEventListener("scroll", _onScroll, { passive: true });

    // Architecture tabs (keyboard + click)
    document.querySelectorAll(".tab-button").forEach((btn, i, all) => {
      btn.addEventListener("click", () => _switchTab(btn.dataset.tab));
      btn.addEventListener("keydown", (e) => _tabKeyNav(e, i, all));
    });
  }

  // ── Nav helpers ───────────────────────────────────────────────────────

  function _toggleMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    const icon = document.getElementById("menuIcon");
    const button = document.getElementById("mobileMenuButton");
    const isOpen = !menu.classList.contains("hidden");

    menu.classList.toggle("hidden", isOpen);
    button?.setAttribute("aria-expanded", String(!isOpen));
    if (icon) {
      icon.setAttribute("data-lucide", isOpen ? "menu" : "x");
      if (typeof lucide !== "undefined") lucide.createIcons();
    }
  }

  function _onScroll() {
    // Navbar shadow
    document
      .getElementById("navbar")
      ?.classList.toggle("shadow-md", window.scrollY > 50);

    // Scrollspy
    const scrollY = window.pageYOffset;
    document.querySelectorAll("section[id]").forEach((section) => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.toggle("active", link.dataset.section === section.id);
        });
      }
    });
  }

  // ── Architecture tabs ─────────────────────────────────────────────────

  function _switchTab(tabName) {
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.remove("active");
      p.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll(".tab-button").forEach((b) => {
      const active = b.dataset.tab === tabName;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", String(active));
      b.setAttribute("tabindex", active ? "0" : "-1");
    });

    const panel = document.getElementById(`panel-${tabName}`);
    if (panel) {
      panel.classList.add("active");
      panel.setAttribute("aria-hidden", "false");
    }

    const activeBtn = document.querySelector(
      `.tab-button[data-tab="${tabName}"]`,
    );
    activeBtn?.focus();
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function _tabKeyNav(e, index, all) {
    const tabs = Array.from(all);
    let next = null;
    if (e.key === "ArrowLeft")
      next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (e.key === "Home") next = tabs[0];
    if (e.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      _switchTab(next.dataset.tab);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────
  return { init, loadData };
})();

window.initMap = () => {
  MapModule.init(); // Initialize the map
  AppModule.loadData(); // Then trigger the data fetch
};

// ── Kick everything off ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") lucide.createIcons();
  AppModule.init();
});
