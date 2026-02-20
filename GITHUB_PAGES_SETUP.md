# Quick Fix for GitHub Pages - API Key Setup

If you're seeing "API Key Not Configured" on your GitHub Pages site, follow these steps:

## Quick Solution (Recommended)

### Step 1: Add GitHub Secret
1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Secrets and variables** > **Actions** (left sidebar)
4. Click **New repository secret**
5. Name: `GOOGLE_MAPS_API_KEY` (exactly this)
6. Value: Paste your Google Maps API key
7. Click **Add secret**

### Step 2: Enable GitHub Pages with Actions
1. Still in Settings, click **Pages** (left sidebar)
2. Under "Source", select **GitHub Actions** (if available)
3. If you don't see this option, that's okay - the workflow will handle it

### Step 3: Trigger the Workflow
1. Make any small change to your repository (or just push again)
2. Go to the **Actions** tab
3. You should see "Deploy to GitHub Pages" workflow running
4. Wait for it to complete (green checkmark)

The workflow will automatically create `config.js` from your secret during deployment.

## Alternative Solution (If workflow doesn't work)

If the GitHub Actions approach doesn't work, you can manually add `config.js`:

1. **Temporarily remove from .gitignore:**
   - Edit `.gitignore`
   - Comment out the line: `# config.js`

2. **Create config.js in your repo:**
   ```javascript
   window.GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';
   ```

3. **Commit and push:**
   ```bash
   git add config.js
   git commit -m "Add API config for GitHub Pages"
   git push
   ```

4. **Secure your API key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > Credentials
   - Click your API key
   - Under "Application restrictions", add:
     - `https://yourusername.github.io/*`
   - Under "API restrictions", select "Maps JavaScript API"
   - Save

## Verify It's Working

After setup, refresh your GitHub Pages site. You should see:
- ✅ The map loads with markers
- ✅ No "API Key Not Configured" message
- ✅ Interactive map with your vegetation detection points

## Troubleshooting

**Workflow fails?**
- Check the Actions tab for error messages
- Ensure the secret name is exactly `GOOGLE_MAPS_API_KEY`
- Make sure GitHub Pages is enabled

**Still seeing error?**
- Check browser console (F12) for specific error messages
- Verify your API key is valid in Google Cloud Console
- Ensure "Maps JavaScript API" is enabled for your project


