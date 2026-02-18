# SeniorDesignWebsite
Website for Integrated Vehicular Vegetation Monitoring System (IVVM) Project

## Google Maps API Setup

This project uses Google Maps API to display an interactive map with vegetation detection markers. The API key is stored in a separate `config.js` file that is **not committed to GitHub** for security.

### Local Development Setup

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Maps JavaScript API"
   - Create credentials (API Key)
   - Copy your API key

2. **Create config.js:**
   - Copy `config.example.js` to `config.js`
   - Replace `YOUR_API_KEY_HERE` with your actual Google Maps API key:
   ```javascript
   window.GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_API_KEY';
   ```

3. **API Restrictions (Recommended):**
   - In Google Cloud Console, go to "APIs & Services" > "Credentials"
   - Click on your API key
   - Under "Application restrictions", add:
     - `http://localhost:*` (for local development)
     - `https://yourusername.github.io` (for GitHub Pages)
   - Under "API restrictions", restrict to "Maps JavaScript API"

### GitHub Pages Deployment

For GitHub Pages, you have two options:

#### Option 1: Use GitHub Secrets with GitHub Actions (Recommended - Secure)
1. Go to your repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `GOOGLE_MAPS_API_KEY`
4. Value: Your Google Maps API key
5. Click "Add secret"
6. The included `.github/workflows/deploy.yml` will automatically inject the key during deployment
7. Push to main/master branch to trigger deployment

#### Option 2: Manual config.js (Simpler but less secure)
1. After enabling GitHub Pages, manually create `config.js` in the repository
2. Add your API key:
   ```javascript
   window.GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';
   ```
3. Commit and push (the API key will be visible in the repo)
4. Set API restrictions in Google Cloud Console to only allow your GitHub Pages domain:
   - `https://yourusername.github.io/*`
   - `https://yourusername.github.io/SeniorDesignWebsite/*` (if using a subdirectory)

**Security Note:** Even if the API key is visible in the repo, restrict it in Google Cloud Console to only work on your GitHub Pages domain. This prevents unauthorized use.

## Features

- Interactive Google Maps integration with dark theme
- Real-time vegetation detection markers (High/Medium/Low risk)
- Clickable markers with detailed information windows
- Vehicle selection from sidebar centers map on selected location
- Custom styled markers with color coding by risk level
- Clean map view showing only essential geographic information (no POI)

## Usage

1. Create `config.js` from `config.example.js` with your API key
2. Open `index.html` in a web browser
3. The map will automatically load once configured

## File Structure

```
SeniorDesignWebsite/
├── index.html              # Main website file
├── config.js              # API key (gitignored - create from example)
├── config.example.js      # Example config file
├── .gitignore             # Excludes config.js
└── README.md              # This file
```
