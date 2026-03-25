# SeniorDesignWebsite

Website for Integrated Vehicular Vegetation Monitoring System (IVVM) Project

## File Structure

```
SeniorDesignWebsite/
├── index.html              # Main website (markup only)
├── test.html               # Unified test suite (replaces test-api/map/integration.html)
├── config.js               # API keys (gitignored - create from config.example.js)
├── config.example.js       # Example config file
├── dynamodb-service.js     # DynamoDB integration service (do not modify)
├── js/
│   ├── state.js            # Single source of truth for all app data and state
│   ├── map.js              # All Google Maps logic (init, markers, info windows)
│   ├── ui.js               # All DOM updates (sidebar, filters, detail panel, toasts)
│   └── app.js              # Entry point — wires modules together, handles boot sequence
├── DYNAMODB_SETUP.md       # DynamoDB setup guide
├── .gitignore              # Excludes config.js
└── README.md               # This file
```

### Module Overview

| File          | Responsibility                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `js/state.js` | Holds all runtime data (locations, filter state, map references). No logic — just data and simple helpers. |
| `js/map.js`   | Owns the Google Maps instance. Creates/clears markers, handles info windows, exposes `initMap` callback.   |
| `js/ui.js`    | Renders the detections list, detail panel, filter buttons, status bar, and toast notifications.            |
| `js/app.js`   | Boots the app: injects the Maps API script, loads data from DynamoDB, binds nav/tab/zoom events.           |

Scripts must load in this order: `config.js` → `dynamodb-service.js` → `state.js` → `map.js` → `ui.js` → `app.js`

---

## Google Maps API Setup

The API key is stored in `config.js`, which is **not committed to GitHub** for security.

### Local Development

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the **Maps JavaScript API**
   - Create an API key under **APIs & Services > Credentials**

2. **Create config.js:**

   ```bash
   cp config.example.js config.js
   ```

   Then edit `config.js`:

   ```javascript
   window.GOOGLE_MAPS_API_KEY = "YOUR_ACTUAL_API_KEY";
   window.DYNAMODB_API_ENDPOINT =
     "https://your-api-id.execute-api.region.amazonaws.com/stage/locations";
   ```

3. **Open `index.html`** in a browser. The map loads automatically once configured.

4. **Run tests** by opening `test.html` and clicking a suite button.

### API Key Restrictions (Recommended)

In Google Cloud Console under your API key:

- **Application restrictions:** Add `http://localhost:*` and `https://yourusername.github.io`
- **API restrictions:** Restrict to **Maps JavaScript API**

---

## GitHub Pages Deployment

### Option 1: GitHub Actions + Secrets (Recommended)

**Step 1: Add secrets**

1. Go to **Settings > Secrets and variables > Actions**
2. Add `GOOGLE_MAPS_API_KEY` and `DYNAMODB_API_ENDPOINT` as repository secrets

**Step 2: Enable GitHub Pages via Actions**

1. Go to **Settings > Pages**
2. Under "Source", select **GitHub Actions**

**Step 3: Push to trigger deployment**
The workflow will generate `config.js` automatically from your secrets.

### Option 2: Manual config.js (Simpler)

1. Remove `config.js` from `.gitignore`
2. Commit and push `config.js` with your keys
3. **Secure the key** in Google Cloud Console:
   - Set **Application restrictions** to HTTP referrers
   - Add `https://yourusername.github.io/*`
   - Restrict to **Maps JavaScript API**

---

## DynamoDB Integration

See [DYNAMODB_SETUP.md](./DYNAMODB_SETUP.md) for full setup instructions.

### Quick Setup

1. Set up an API Gateway endpoint that queries your DynamoDB table
2. Add the endpoint to `config.js`:
   ```javascript
   window.DYNAMODB_API_ENDPOINT =
     "https://your-api-id.execute-api.region.amazonaws.com/stage/locations";
   ```

The app will automatically fetch location data, render map markers by risk level, and update the sidebar. If the API is unreachable, it falls back to mock data and displays a warning banner.

---

## Features

- **Modular JS architecture** — four single-responsibility modules, no inline script logic
- **DynamoDB integration** with automatic mock-data fallback
- Interactive Google Maps with dark theme and custom risk-level markers
- Sidebar detections list with filter buttons (All / Bad Image / High / Medium / No Vegetation)
- Clickable markers with info windows; selected detection centers and bounces the marker
- Status bar showing active device count and today's detection count
- Unified `test.html` for API, map config, and integration tests
