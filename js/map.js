/**
 * map.js
 * Owns everything Google Maps related:
 *   - Map initialisation (called by the Maps API callback)
 *   - Creating / clearing markers
 *   - Centering and zooming
 *   - Info-window management
 *
 * Depends on: State (state.js), UIModule (ui.js)
 * Exposes:    window.MapModule  +  window.initMap (Maps API callback)
 */

window.MapModule = (() => {
  // ── Private helpers ───────────────────────────────────────────────────

  const DARK_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#475569" }],
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [{ color: "#94a3b8" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#cbd5e1" }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#0f172a" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#334155" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#94a3b8" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#475569" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#cbd5e1" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0c4a6e" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#64748b" }],
    },
  ];

  function buildInfoWindowContent(loc) {
    const placeholderImg =
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";
    return `
            <div style="font-family:'Inter',sans-serif;min-width:220px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <h3 style="margin:0;font-weight:600;font-size:14px;color:#0f172a;">${loc.deviceName || loc.captureId}</h3>
                    <span style="background:${loc.bgColor}20;color:${loc.bgColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${loc.risk}</span>
                </div>
                <div style="width:100%;max-width:200px;height:120px;overflow:hidden;border-radius:6px;margin-bottom:8px;background:#f1f5f9;">
                    <img src="${loc.image || placeholderImg}" alt="Capture"
                         style="width:100%;height:100%;object-fit:cover;"
                         onerror="this.src='${placeholderImg}';this.onerror=null;">
                </div>
                <div style="font-size:12px;color:#475569;line-height:1.6;">
                    <div><strong>Location:</strong> ${loc.location}</div>
                    <div><strong>Class:</strong> ${loc.species}</div>
                    <div><strong>Confidence:</strong> ${(loc.confidence * 100).toFixed(1)}%</div>
                    <div><strong>Time:</strong> ${loc.timestamp}</div>
                </div>
            </div>`;
  }

  function markerIcon(bgColor) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: bgColor || "#dc2626",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    };
  }

  function closeAllInfoWindows() {
    Object.values(State.map.infoWindows).forEach((iw) => iw && iw.close());
  }

  // ── Public API ────────────────────────────────────────────────────────

  function init() {
    const container = document.getElementById("mapContainer");
    if (!container) {
      console.error("MapModule: #mapContainer not found");
      return;
    }

    // Clear any loading placeholder HTML but preserve overlay elements
    container.innerHTML = "";
    container.style.cssText = "min-height:600px;width:100%;position:relative;";

    State.map.instance = new google.maps.Map(container, {
      center: { lat: 38.922, lng: -83.123 }, // recentred once data loads
      zoom: 12,
      styles: DARK_STYLE,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    State.map.isReady = true;
    console.log("✅ MapModule: map initialised");

    // Load data once tiles are ready
    google.maps.event.addListenerOnce(State.map.instance, "tilesloaded", () => {
      AppModule.loadData();
    });
  }

  function clearMarkers() {
    Object.values(State.map.markers).forEach((m) => m && m.setMap(null));
    Object.values(State.map.infoWindows).forEach((iw) => iw && iw.close());
    State.map.markers = {};
    State.map.infoWindows = {};
  }

  function placeMarkers(locations) {
    clearMarkers();
    const mapInstance = State.map.instance;

    locations.forEach((loc) => {
      if (!loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return;

      const marker = new google.maps.Marker({
        position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
        map: mapInstance,
        title: `${loc.deviceName || loc.captureId} — ${loc.risk}`,
        icon: markerIcon(loc.bgColor),
        animation: google.maps.Animation.DROP,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: buildInfoWindowContent(loc),
      });

      marker.addListener("click", () => {
        closeAllInfoWindows();
        infoWindow.open(mapInstance, marker);
        UIModule.selectDetection(loc.captureId);
      });

      State.map.markers[loc.captureId] = marker;
      State.map.infoWindows[loc.captureId] = infoWindow;
    });

    fitBounds(locations);
    console.log(
      `✅ MapModule: placed ${Object.keys(State.map.markers).length} markers`,
    );
  }

  function fitBounds(locations) {
    const bounds = new google.maps.LatLngBounds();
    locations.forEach((loc) => {
      if (loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng)) {
        bounds.extend({ lat: loc.lat, lng: loc.lng });
      }
    });
    if (!bounds.isEmpty()) State.map.instance.fitBounds(bounds);
  }

  function focusMarker(captureId) {
    const loc = State.getLocation(captureId);
    const marker = State.map.markers[captureId];
    const mapInstance = State.map.instance;
    if (!loc || !mapInstance) return;

    mapInstance.setCenter({
      lat: parseFloat(loc.lat),
      lng: parseFloat(loc.lng),
    });
    mapInstance.setZoom(16);

    closeAllInfoWindows();
    if (marker && State.map.infoWindows[captureId]) {
      State.map.infoWindows[captureId].open(mapInstance, marker);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 2000);
    }
  }

  function zoom(delta) {
    const m = State.map.instance;
    if (m) m.setZoom(m.getZoom() + delta);
  }

  return { init, placeMarkers, focusMarker, zoom };
})();

// ── Google Maps API callback ───────────────────────────────────────────────
// Must be on window — referenced in the <script src="...&callback=initMap">
window.initMap = function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", MapModule.init);
  } else {
    MapModule.init();
  }
};
