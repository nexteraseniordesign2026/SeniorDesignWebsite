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

**Step 1: Add the Secret**
1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `GOOGLE_MAPS_API_KEY`
5. Value: Paste your Google Maps API key
6. Click **Add secret**

**Step 2: Enable GitHub Pages with Actions**
1. Go to **Settings** > **Pages**
2. Under "Source", select **GitHub Actions** (not "Deploy from a branch")
3. If you don't see this option, the workflow will handle it automatically

**Step 3: Trigger Deployment**
1. Make a small change and push to `main` or `master` branch
2. Go to **Actions** tab to see the workflow run
3. The workflow will create `config.js` automatically from your secret

**Troubleshooting:**
- If the workflow fails, check the Actions tab for error messages
- Ensure the secret name is exactly `GOOGLE_MAPS_API_KEY`
- Make sure GitHub Pages is enabled in repository settings

#### Option 2: Manual config.js (Simpler - Use if Option 1 doesn't work)

**Important:** This exposes your API key in the repository, but you can secure it with restrictions.

1. **Remove config.js from .gitignore temporarily:**
   - Edit `.gitignore` and comment out or remove the `config.js` line
   
2. **Create config.js in your repository:**
   ```javascript
   window.GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';
   ```

3. **Commit and push:**
   ```bash
   git add config.js
   git commit -m "Add Google Maps API config"
   git push
   ```

4. **Secure your API key in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** > **Credentials**
   - Click on your API key
   - Under **Application restrictions**, select **HTTP referrers (web sites)**
   - Add these restrictions (replace with your actual GitHub Pages URL):
     - `https://yourusername.github.io/*`
     - `https://yourusername.github.io/SeniorDesignWebsite/*` (if using subdirectory)
   - Under **API restrictions**, select **Restrict key** and choose **Maps JavaScript API**
   - Click **Save**

**Security Note:** Even though the key is in the repo, these restrictions ensure it only works on your GitHub Pages domain, preventing unauthorized use.

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
