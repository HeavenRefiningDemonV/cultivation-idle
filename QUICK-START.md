# 🎮 Cultivation Idle - Quick Start Guide

## Fastest Way to Play (Recommended)

### Linux/Mac:
```bash
./start-game.sh
```

### Windows:
Double-click `start-game.bat`

Then open your browser to: **http://localhost:5173/**

---

## What's Available

### ✅ Ready to Use:
- `start-game.sh` - One-click start for Linux/Mac
- `start-game.bat` - One-click start for Windows
- `build-and-serve.sh` - Build production version

### 📝 How to Use:

1. **First time:**
   ```bash
   cd /home/user/cultivation-idle
   ./start-game.sh
   ```

2. **Open browser:**
   - Go to `http://localhost:5173/`
   - Bookmark it for easy access!

3. **Stop the server:**
   - Press `Ctrl+C` in the terminal

---

## Alternative: Create Desktop App

Want a real .exe file? See `DESKTOP-APP-GUIDE.md` for instructions on:
- Electron (full desktop app, ~150MB)
- Tauri (lightweight, ~3MB)
- Nativefier (web wrapper)

**However**, the startup script is usually better because:
- ✅ No build step needed
- ✅ Updates instantly when you change code
- ✅ Works on any platform
- ✅ Can play in browser with DevTools for debugging

---

## Files Created

- `start-game.sh` - Linux/Mac startup script
- `start-game.bat` - Windows startup script
- `build-and-serve.sh` - Production build script
- `DESKTOP-APP-GUIDE.md` - Instructions for creating .exe
- `QUICK-START.md` - This file

---

## Testing the Game

Once the server is running (`http://localhost:5173/`):

1. **Test Combat:**
   - Click "Adventure" tab
   - Click "Training Forest"
   - Click again to fight an enemy
   - Enable "Auto Attack"

2. **Test Loot System:**
   - Defeat 10 enemies
   - Watch for loot drops in combat log
   - Boss becomes available after 10 kills

3. **Test Boss Mechanics:**
   - Fight the Forest Guardian boss
   - Watch for ENRAGE (50% HP)
   - Watch for HEAL (25% HP)
   - Watch for ULTIMATE (every 30s)

Enjoy! 🎮
