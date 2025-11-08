# Creating a Desktop App (.exe)

## Option 1: Electron (Full Desktop App)

### Install Electron Builder
```bash
npm install --save-dev electron electron-builder
npm install --save-dev concurrently wait-on
```

### Create electron.js (main process)
Create a file `electron.js` in the project root:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/icon.png')
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### Update package.json
Add these scripts to your `package.json`:

```json
{
  "main": "electron.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  },
  "build": {
    "appId": "com.cultivation.idle",
    "productName": "Cultivation Idle",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron.js"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "public/icon.png"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "public/icon.png"
    },
    "linux": {
      "target": ["AppImage"],
      "icon": "public/icon.png"
    }
  }
}
```

### Build the .exe
```bash
npm run electron:build:win
```

The .exe will be in the `release/` folder.

---

## Option 2: Tauri (Lightweight Alternative)

Tauri creates smaller executables (~3MB vs Electron's ~150MB).

### Install Tauri
```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
```

### Build
```bash
npm run tauri build
```

---

## Option 3: Web App Wrapper (Simplest)

Use `nativefier` to wrap the web app:

```bash
npm install -g nativefier
npm run build
npx serve -s dist -p 3000 &
nativefier --name "Cultivation Idle" http://localhost:3000
```

---

## Recommended: Keep it as a Web App

**Advantages:**
- No installation required
- Auto-updates when you pull new code
- Cross-platform (works on any device with a browser)
- Smaller size
- Easier to distribute (just share the code)

**Just use the startup scripts:**
- `./start-game.sh` (Linux/Mac)
- `start-game.bat` (Windows)

Then bookmark `http://localhost:5173/` in your browser!
